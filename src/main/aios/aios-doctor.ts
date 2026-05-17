import { existsSync } from "fs";
import { execFile } from "child_process";
import { isAiOsInstalled, getAiOsPaths } from "./aios-paths";
import { getAiOsEnvConfig } from "./aios-config";
import { isPortAvailable } from "./aios-port-check";
import { checkServiceHealth } from "./aios-health";

export type DoctorCheckStatus = "pass" | "warning" | "error" | "skipped";

export interface DoctorCheckResult {
  name: string;
  status: DoctorCheckStatus;
  message: string;
  detail?: string;
}

export interface AiOsDoctorReport {
  timestamp: string;
  checks: DoctorCheckResult[];
  overallStatus: DoctorCheckStatus;
}

async function checkNodeInstalled(): Promise<DoctorCheckResult> {
  return new Promise((resolve) => {
    execFile("node", ["--version"], { timeout: 5000 }, (err, stdout) => {
      if (err) {
        resolve({ name: "Node.js", status: "error", message: "Node.js not found", detail: err.message });
      } else {
        const version = stdout.trim();
        const major = parseInt(version.replace("v", ""), 10);
        if (major < 18) {
          resolve({ name: "Node.js", status: "warning", message: `Node.js ${version} found (18+ recommended)` });
        } else {
          resolve({ name: "Node.js", status: "pass", message: `Node.js ${version}` });
        }
      }
    });
  });
}

async function checkPnpmInstalled(): Promise<DoctorCheckResult> {
  return new Promise((resolve) => {
    const cmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    execFile(cmd, ["--version"], { timeout: 5000, shell: true }, (err, stdout) => {
      if (err) {
        resolve({ name: "pnpm", status: "error", message: "pnpm not found", detail: err.message });
      } else {
        resolve({ name: "pnpm", status: "pass", message: `pnpm ${stdout.trim()}` });
      }
    });
  });
}

async function checkAiOsSourceInstalled(): Promise<DoctorCheckResult> {
  if (!isAiOsInstalled()) {
    return { name: "AI-OS Source", status: "error", message: "ai-os-full source not found" };
  }
  const paths = getAiOsPaths();
  const hasBackend = existsSync(paths.backendDir);
  const hasFrontend = existsSync(paths.frontendDir);
  if (!hasBackend || !hasFrontend) {
    return { name: "AI-OS Source", status: "warning", message: "Source found but backend/frontend dirs missing", detail: `backend: ${hasBackend}, frontend: ${hasFrontend}` };
  }
  return { name: "AI-OS Source", status: "pass", message: `Installed at ${paths.aiosRoot}` };
}

async function checkPortAvailability(): Promise<DoctorCheckResult> {
  const config = getAiOsEnvConfig();
  const ports = [config.backendPort, config.frontendPort];
  const conflicts: number[] = [];

  for (const port of ports) {
    if (!(await isPortAvailable(port))) {
      conflicts.push(port);
    }
  }

  if (conflicts.length > 0) {
    return { name: "Port Availability", status: "warning", message: `Ports in use: ${conflicts.join(", ")}`, detail: "These ports may be occupied by running services or other applications" };
  }
  return { name: "Port Availability", status: "pass", message: `Ports ${ports.join(", ")} available` };
}

async function checkPostgresConnection(): Promise<DoctorCheckResult> {
  const config = getAiOsEnvConfig();
  if (!config.databaseUrl) {
    return { name: "PostgreSQL", status: "warning", message: "DATABASE_URL not configured" };
  }

  try {
    const url = new URL(config.databaseUrl);
    const host = url.hostname;
    const port = parseInt(url.port || "5432", 10);
    const available = !(await isPortAvailable(port, host));
    if (available) {
      return { name: "PostgreSQL", status: "pass", message: `PostgreSQL reachable at ${host}:${port}` };
    }
    return { name: "PostgreSQL", status: "error", message: `PostgreSQL not reachable at ${host}:${port}` };
  } catch {
    return { name: "PostgreSQL", status: "error", message: "Invalid DATABASE_URL format" };
  }
}

async function checkGatewayHealth(): Promise<DoctorCheckResult> {
  const config = getAiOsEnvConfig();
  const healthy = await checkServiceHealth(`${config.hermesGatewayUrl}/health`);
  if (healthy) {
    return { name: "Hermes Gateway", status: "pass", message: "Gateway is healthy" };
  }
  return { name: "Hermes Gateway", status: "warning", message: "Gateway not reachable" };
}

export async function runAiOsDoctor(): Promise<AiOsDoctorReport> {
  const checks = await Promise.all([
    checkNodeInstalled(),
    checkPnpmInstalled(),
    checkAiOsSourceInstalled(),
    checkPortAvailability(),
    checkPostgresConnection(),
    checkGatewayHealth(),
  ]);

  let overallStatus: DoctorCheckStatus = "pass";
  for (const check of checks) {
    if (check.status === "error") { overallStatus = "error"; break; }
    if (check.status === "warning") overallStatus = "warning";
  }

  return {
    timestamp: new Date().toISOString(),
    checks,
    overallStatus,
  };
}
