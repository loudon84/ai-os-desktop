import { mkdirSync, appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import type { InstallStage } from "../../shared/enterprise/enterprise-constants";
import type { EnterpriseErrorCode } from "../../shared/enterprise/enterprise-constants";
import { getHermesBasePath } from "./deployment-config";

const SENSITIVE_PATTERNS = /token|password|secret|key|auth|credential|api_key|apikey/i;

function maskSensitive(message: string): string {
  return message.replace(
    /(["']?(?:token|password|secret|key|auth|credential|api_key|apikey)["']?\s*[:=]\s*["']?)([^"'\s,}]+)/gi,
    "$1***",
  );
}

export interface InstallLogger {
  info(stage: InstallStage, message: string): void;
  warn(stage: InstallStage, message: string): void;
  error(stage: InstallStage, message: string, errorCode?: EnterpriseErrorCode): void;
  close(): void;
}

export function createInstallLogger(logDir?: string): InstallLogger {
  const dir = logDir || join(getHermesBasePath(), "logs");
  mkdirSync(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = join(dir, `install-${timestamp}.log`);

  function writeLine(level: "info" | "warn" | "error", stage: InstallStage, message: string, errorCode?: EnterpriseErrorCode): void {
    const safeMessage = maskSensitive(message);
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      stage,
      level,
      message: safeMessage,
      ...(errorCode && { errorCode }),
    });
    appendFileSync(logPath, entry + "\n", "utf-8");
  }

  return {
    info(stage, message) { writeLine("info", stage, message); },
    warn(stage, message) { writeLine("warn", stage, message); },
    error(stage, message, errorCode) { writeLine("error", stage, message, errorCode); },
    close() { /* no-op for append mode */ },
  };
}
