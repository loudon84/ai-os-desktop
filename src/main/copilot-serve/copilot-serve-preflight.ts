import { existsSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import {
  getCopilotServePaths,
  getCopilotServePort,
  resolveCopilotServeDeployScript,
  resolveCopilotServeRoot,
  resolveCopilotServeRuntimeDir,
} from "./copilot-serve-paths";
import type {
  CopilotServePreflightResult,
  PreflightCheckItem,
} from "../../shared/copilot-serve/copilot-serve-contract";
import { isPortAvailable } from "../aios/aios-port-check";
import { checkCopilotServeHealth } from "./copilot-serve-health";
import { getCopilotServeManagedPid } from "./copilot-serve-runtime-state";

export type { CopilotServePreflightResult };

function runCommand(cmd: string, args: string[]): { ok: boolean; output: string } {
  try {
    const output = execFileSync(cmd, args, {
      encoding: "utf-8",
      timeout: 8000,
      windowsHide: true,
    }).trim();
    return { ok: true, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, output: message };
  }
}

function findListeningPidWindows(port: number): number | null {
  try {
    const out = execFileSync("netstat", ["-ano"], {
      encoding: "utf-8",
      timeout: 8000,
      windowsHide: true,
    });
    const portToken = `:${port}`;
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes(portToken) || !line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = Number.parseInt(parts[parts.length - 1] ?? "", 10);
      if (Number.isFinite(pid)) return pid;
    }
  } catch {
    /* netstat unavailable */
  }
  return null;
}

async function checkCopilotServePort(): Promise<PreflightCheckItem> {
  const port = getCopilotServePort();
  const available = await isPortAvailable(port);
  if (available) {
    return {
      id: "port8765",
      label: `Port ${port}`,
      status: "pass",
      detail: "available",
    };
  }

  const managedPid = getCopilotServeManagedPid();
  const occupantPid = process.platform === "win32" ? findListeningPidWindows(port) : null;
  if (managedPid && occupantPid === managedPid) {
    return {
      id: "port8765",
      label: `Port ${port}`,
      status: "pass",
      detail: `in use by copilot-serve pid ${managedPid}`,
    };
  }

  return {
    id: "port8765",
    label: `Port ${port}`,
    status: "fail",
    detail: occupantPid ? `occupied by pid ${occupantPid}` : "occupied",
  };
}

function checkTool(id: string, label: string, cmd: string, args: string[]): PreflightCheckItem {
  const result = runCommand(cmd, args);
  return {
    id,
    label,
    status: result.ok ? "pass" : "fail",
    detail: result.ok ? result.output || null : result.output,
  };
}

export async function runCopilotServePreflight(): Promise<CopilotServePreflightResult> {
  const checks: PreflightCheckItem[] = [];
  const serveRoot = resolveCopilotServeRoot();
  const runtimeDir = resolveCopilotServeRuntimeDir();
  const paths = getCopilotServePaths();

  checks.push(checkTool("git", "Git", "git", ["--version"]));

  const py312 =
    process.platform === "win32"
      ? checkTool("python312", "Python 3.12", "py", ["-3.12", "--version"])
      : checkTool("python312", "Python 3.12", "python3.12", ["--version"]);
  checks.push(py312);

  checks.push(checkTool("uv", "uv", "uv", ["--version"]));

  checks.push(await checkCopilotServePort());

  const hasPyproject = serveRoot ? existsSync(join(serveRoot, "pyproject.toml")) : false;
  checks.push({
    id: "pyproject",
    label: "pyproject.toml",
    status: hasPyproject ? "pass" : "fail",
    detail: serveRoot ?? runtimeDir,
  });

  const venvPython =
    serveRoot && process.platform === "win32"
      ? join(serveRoot, ".venv", "Scripts", "python.exe")
      : serveRoot
        ? join(serveRoot, ".venv", "bin", "python")
        : "";
  const hasVenv = venvPython ? existsSync(venvPython) : false;
  checks.push({
    id: "venv",
    label: ".venv Python",
    status: hasVenv ? "pass" : "fail",
    detail: hasVenv ? venvPython : null,
  });

  const envPath = serveRoot ? join(serveRoot, ".env") : "";
  checks.push({
    id: "env",
    label: ".env",
    status: envPath && existsSync(envPath) ? "pass" : serveRoot ? "warn" : "fail",
    detail: envPath || null,
  });

  const sqlitePath = paths?.sqlitePath ?? "";
  checks.push({
    id: "sqlite",
    label: "SQLite",
    status: sqlitePath && existsSync(sqlitePath) ? "pass" : "warn",
    detail: sqlitePath || null,
  });

  const deployScript = resolveCopilotServeDeployScript();
  checks.push({
    id: "deployScript",
    label: "deploy-copilot-serve.ps1",
    status: deployScript ? "pass" : "warn",
    detail: deployScript,
  });

  if (paths) {
    const healthUrl = `http://127.0.0.1:${paths.port}/api/v1/health`;
    const healthy = await checkCopilotServeHealth(healthUrl);
    checks.push({
      id: "health",
      label: "/api/v1/health",
      status: healthy ? "pass" : "warn",
      detail: healthUrl,
    });
  } else {
    checks.push({
      id: "health",
      label: "/api/v1/health",
      status: "skip",
      detail: "copilot-serve not running",
    });
  }

  const blocking = checks.filter((c) => c.status === "fail");
  const installed = hasPyproject && hasVenv;
  const ready = installed && blocking.length === 0;

  return {
    ready,
    installed,
    serveRoot,
    checks,
  };
}
