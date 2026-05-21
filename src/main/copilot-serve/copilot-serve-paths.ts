import { existsSync } from "fs";
import { join } from "path";
import { HERMES_HOME } from "../installer";

const DEFAULT_PORT = 8765;

export interface CopilotServePaths {
  serveRoot: string;
  sqlitePath: string;
  logPath: string;
  port: number;
}

export function getCopilotServePort(): number {
  const raw = process.env.COPILOT_SERVE_PORT;
  if (!raw) return DEFAULT_PORT;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

export function resolveCopilotServeRoot(): string | null {
  const fromEnv = process.env.COPILOT_SERVE_ROOT?.trim();
  if (fromEnv && existsSync(join(fromEnv, "pyproject.toml"))) {
    return fromEnv;
  }

  const candidates = [
    join(process.cwd(), "copilot-serve"),
    join(process.cwd(), "..", "copilot-serve"),
    join(__dirname, "..", "..", "..", "..", "copilot-serve"),
    join(__dirname, "..", "..", "..", "copilot-serve"),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "pyproject.toml"))) {
      return candidate;
    }
  }

  return null;
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
  };
}
