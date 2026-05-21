import { randomUUID } from "crypto";
import { ChildProcess, spawn } from "child_process";
import { mkdirSync } from "fs";
import { dirname } from "path";
import type {
  CopilotServeConnection,
  CopilotServeProcessStatus,
  CopilotServeStatus,
} from "../../shared/copilot-serve/copilot-serve-contract";
import { checkCopilotServeHealth } from "./copilot-serve-health";
import { appendCopilotServeLog, readCopilotServeLogs } from "./copilot-serve-logs";
import { getCopilotServePaths } from "./copilot-serve-paths";

let child: ChildProcess | null = null;
let desktopToken = "";
let lastError: string | null = null;
let processStatus: CopilotServeProcessStatus = "stopped";

function resolvePythonExecutable(): string {
  return process.env.COPILOT_SERVE_PYTHON?.trim() || "python";
}

function buildStatus(paths: NonNullable<ReturnType<typeof getCopilotServePaths>>): CopilotServeStatus {
  return {
    status: processStatus,
    pid: child?.pid ?? null,
    port: paths.port,
    baseUrl: `http://127.0.0.1:${paths.port}`,
    lastError,
    logPath: paths.logPath,
  };
}

export function getCopilotServeConnection(): CopilotServeConnection | null {
  const paths = getCopilotServePaths();
  if (!paths || !desktopToken) return null;
  return {
    baseUrl: `http://127.0.0.1:${paths.port}`,
    port: paths.port,
    token: desktopToken,
  };
}

export function getCopilotServeStatus(): CopilotServeStatus {
  const paths = getCopilotServePaths();
  if (!paths) {
    return {
      status: "error",
      pid: null,
      port: 8765,
      baseUrl: "http://127.0.0.1:8765",
      lastError: "copilot-serve root not found (set COPILOT_SERVE_ROOT)",
      logPath: "",
    };
  }
  return buildStatus(paths);
}

export async function startCopilotServeProcess(): Promise<CopilotServeStatus> {
  const paths = getCopilotServePaths();
  if (!paths) {
    processStatus = "error";
    lastError = "copilot-serve root not found";
    return getCopilotServeStatus();
  }

  if (child && !child.killed) {
    const healthy = await checkCopilotServeHealth(`${buildStatus(paths).baseUrl}/api/v1/health`);
    if (healthy) {
      processStatus = "running";
      return buildStatus(paths);
    }
  }

  processStatus = "starting";
  lastError = null;
  desktopToken = process.env.COPILOT_DESKTOP_TOKEN?.trim() || randomUUID();
  mkdirSync(dirname(paths.sqlitePath), { recursive: true });
  mkdirSync(dirname(paths.logPath), { recursive: true });

  const python = resolvePythonExecutable();
  const args = [
    "-m",
    "uvicorn",
    "main:app",
    "--app-dir",
    "src",
    "--host",
    "127.0.0.1",
    "--port",
    String(paths.port),
  ];

  child = spawn(python, args, {
    cwd: paths.serveRoot,
    env: {
      ...process.env,
      SQLITE_PATH: paths.sqlitePath,
      COPILOT_DESKTOP_TOKEN: desktopToken,
      COPILOT_REQUIRE_TOKEN: "true",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  child.stdout?.on("data", (chunk: Buffer) => {
    appendCopilotServeLog(chunk.toString().trimEnd());
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    appendCopilotServeLog(chunk.toString().trimEnd());
  });
  child.on("error", (err) => {
    lastError = err.message;
    processStatus = "error";
  });
  child.on("exit", (code) => {
    if (processStatus !== "stopped") {
      processStatus = code === 0 ? "stopped" : "error";
      if (code !== 0) {
        lastError = `copilot-serve exited with code ${code ?? "unknown"}`;
      }
    }
    child = null;
  });

  const healthUrl = `${buildStatus(paths).baseUrl}/api/v1/health`;
  for (let i = 0; i < 40; i += 1) {
    if (await checkCopilotServeHealth(healthUrl)) {
      processStatus = "running";
      return buildStatus(paths);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  processStatus = "degraded";
  lastError = "health check timed out";
  return buildStatus(paths);
}

export function stopCopilotServeProcess(): CopilotServeStatus {
  if (child && !child.killed) {
    if (process.platform === "win32" && child.pid) {
      try {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true });
      } catch {
        child.kill("SIGTERM");
      }
    } else {
      child.kill("SIGTERM");
    }
  }
  child = null;
  processStatus = "stopped";
  return getCopilotServeStatus();
}

export async function restartCopilotServeProcess(): Promise<CopilotServeStatus> {
  stopCopilotServeProcess();
  return startCopilotServeProcess();
}

export function getCopilotServeLogs(options?: { tailLines?: number }): string {
  return readCopilotServeLogs(options);
}
