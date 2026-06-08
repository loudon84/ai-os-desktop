import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { dirname } from "path";
import { app } from "electron";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "api_key",
  "secret",
  "authorization",
  "cookie",
  "accessToken",
  "refreshToken",
] as const;

export type McpSkillGatewayLogLevel = "info" | "warn" | "error";

export interface McpSkillGatewayLogEntry {
  time: string;
  level: McpSkillGatewayLogLevel;
  method?: string;
  jsonrpcId?: string | number | null;
  remoteStatus?: number;
  durationMs?: number;
  errorCode?: string | number;
  message?: string;
}

function logFilePath(): string {
  return joinLogsDir("mcp-skill-gateway-proxy.log");
}

function joinLogsDir(filename: string): string {
  return `${app.getPath("userData")}/logs/${filename}`;
}

function ensureLogDir(): void {
  const dir = dirname(logFilePath());
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function redactSensitiveText(input: string): string {
  let out = input;
  for (const key of SENSITIVE_KEYS) {
    const re = new RegExp(`("${key}"\\s*:\\s*")[^"]*(")`, "gi");
    out = out.replace(re, `$1[REDACTED]$2`);
    const bearerRe = /Bearer\s+[A-Za-z0-9._-]+/gi;
    out = out.replace(bearerRe, "Bearer [REDACTED]");
  }
  return out;
}

export function writeMcpSkillGatewayLog(entry: McpSkillGatewayLogEntry): void {
  ensureLogDir();
  const line = JSON.stringify({
    ...entry,
    message: entry.message ? redactSensitiveText(entry.message) : undefined,
  });
  appendFileSync(logFilePath(), `${line}\n`, "utf-8");
}

export function readMcpSkillGatewayLogs(lines = 200): string {
  const path = logFilePath();
  if (!existsSync(path)) return "";
  const content = readFileSync(path, "utf-8");
  const all = content.trim().split("\n").filter(Boolean);
  return all.slice(-Math.max(1, lines)).join("\n");
}
