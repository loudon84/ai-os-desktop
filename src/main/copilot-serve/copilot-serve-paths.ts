import { existsSync } from "fs";
import { dirname, join } from "path";
import { app } from "electron";
import { HERMES_HOME } from "../installer";
import { readRuntimeConfig } from "../enterprise/desktop-runtime-config";
import { resolveInstallLocation } from "../enterprise/windows/install-location-resolver";

const DEFAULT_PORT = 8765;

export interface CopilotServePaths {
  serveRoot: string;
  sqlitePath: string;
  logPath: string;
  port: number;
  deployScriptPath: string | null;
}

function isValidServeRoot(dir: string): boolean {
  return existsSync(join(dir, "pyproject.toml"));
}

export function getCopilotServePort(): number {
  const config = readRuntimeConfig();
  if (config?.copilotServePort && config.copilotServePort > 0) {
    return config.copilotServePort;
  }
  const raw = process.env.COPILOT_SERVE_PORT;
  if (!raw) return DEFAULT_PORT;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

export function resolveCopilotServeDeployScript(): string | null {
  const config = readRuntimeConfig();
  if (config?.copilotServeDeployScript && existsSync(config.copilotServeDeployScript)) {
    return config.copilotServeDeployScript;
  }

  const loc = resolveInstallLocation();
  const candidate = join(loc.runtimeRoot, "deploy-copilot-serve.ps1");
  if (existsSync(candidate)) return candidate;

  return null;
}

export function resolveCopilotServeRoot(): string | null {
  const fromEnv = process.env.COPILOT_SERVE_ROOT?.trim();
  if (fromEnv && isValidServeRoot(fromEnv)) {
    return fromEnv;
  }

  const config = readRuntimeConfig();
  if (config?.copilotServeDir && isValidServeRoot(config.copilotServeDir)) {
    return config.copilotServeDir;
  }

  try {
    const loc = resolveInstallLocation();
    const fromRuntime = join(loc.runtimeRoot, "copilot-serve");
    if (isValidServeRoot(fromRuntime)) {
      return fromRuntime;
    }

    const exeDir = dirname(app.getPath("exe"));
    const fromExe = join(exeDir, "runtime", "copilot-serve");
    if (isValidServeRoot(fromExe)) {
      return fromExe;
    }

    const fromResources = join(exeDir, "resources", "runtime", "copilot-serve");
    if (isValidServeRoot(fromResources)) {
      return fromResources;
    }
  } catch {
    /* app not ready or non-Windows */
  }

  const devCandidates = [
    join(process.cwd(), "copilot-serve"),
    join(process.cwd(), "..", "copilot-serve"),
    join(__dirname, "..", "..", "..", "..", "copilot-serve"),
    join(__dirname, "..", "..", "..", "copilot-serve"),
  ];

  for (const candidate of devCandidates) {
    if (isValidServeRoot(candidate)) {
      return candidate;
    }
  }

  return null;
}

/** Installed layout exists but repo/venv may not be deployed yet */
export function resolveCopilotServeRuntimeDir(): string | null {
  const root = resolveCopilotServeRoot();
  if (root) return root;

  const config = readRuntimeConfig();
  if (config?.copilotServeDir) return config.copilotServeDir;

  try {
    const loc = resolveInstallLocation();
    return join(loc.runtimeRoot, "copilot-serve");
  } catch {
    return null;
  }
}

/** Refresh in-process env after deploy (User-level env vars are not visible until restart). */
export function applyCopilotServeEnvFromDisk(serveRoot: string, port?: number): void {
  process.env.COPILOT_SERVE_ROOT = serveRoot;
  const venvCandidates =
    process.platform === "win32"
      ? [join(serveRoot, ".venv", "Scripts", "python.exe")]
      : [join(serveRoot, ".venv", "bin", "python"), join(serveRoot, ".venv", "bin", "python3")];
  for (const candidate of venvCandidates) {
    if (existsSync(candidate)) {
      process.env.COPILOT_SERVE_PYTHON = candidate;
      break;
    }
  }
  const resolvedPort = port ?? getCopilotServePort();
  process.env.COPILOT_SERVE_PORT = String(resolvedPort);
}

export function getCopilotServePaths(): CopilotServePaths | null {
  const serveRoot = resolveCopilotServeRoot();
  if (!serveRoot) return null;

  const desktopDir = join(HERMES_HOME, "desktop");
  return {
    serveRoot,
    sqlitePath: join(desktopDir, "sqlite.db"),
    logPath: join(desktopDir, "copilot-serve.log"),
    port: getCopilotServePort(),
    deployScriptPath: resolveCopilotServeDeployScript(),
  };
}
