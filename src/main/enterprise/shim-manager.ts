import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveInstallLocation } from "./windows/install-location-resolver";

const CRLF = "\r\n";

function writeCmdFile(filePath: string, content: string): void {
  const dir = join(filePath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, content, "utf-8");
}

export function createDesktopShim(binDir: string, installDir: string): void {
  const exeName = "smc-ai-copilot.exe";
  const content = `@echo off${CRLF}"${join(installDir, exeName)}" %*${CRLF}`;
  writeCmdFile(join(binDir, "smc-copilot.cmd"), content);
  writeCmdFile(join(binDir, "hermes-desktop.cmd"), content);
}

export function createPlaceholderHermesShim(binDir: string): void {
  const content = `@echo off${CRLF}echo Hermes Agent is not yet installed. Please launch SMC Copilot to complete setup.${CRLF}`;
  writeCmdFile(join(binDir, "hermes.cmd"), content);
}

export function updateHermesShim(binDir: string, agentDir: string): void {
  const hermesExe = join(agentDir, "venv", "Scripts", "hermes.exe");
  const content = `@echo off${CRLF}set HERMES_HOME=%USERPROFILE%\\.hermes${CRLF}"${hermesExe}" %*${CRLF}`;
  writeCmdFile(join(binDir, "hermes.cmd"), content);
}

export function ensureShims(): void {
  const loc = resolveInstallLocation();

  if (!existsSync(loc.binDir)) {
    mkdirSync(loc.binDir, { recursive: true });
  }

  createDesktopShim(loc.binDir, loc.installDir);

  if (existsSync(join(loc.agentDir, "venv", "Scripts", "hermes.exe"))) {
    updateHermesShim(loc.binDir, loc.agentDir);
  } else {
    createPlaceholderHermesShim(loc.binDir);
  }
}
