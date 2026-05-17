import { randomUUID } from "crypto";
import { BrowserWindow } from "electron";
import { isAiOsInstalled, getAiOsPaths } from "./aios-paths";
import { writeAiOsEnvFile, getAiOsEnvConfig } from "./aios-config";
import { spawnBackend, spawnFrontend, runDbMigrate, killProcess, killAllProcesses, getProcess } from "./aios-process";
import { checkServiceHealth, waitForHealth } from "./aios-health";
import {
  upsertRuntimeService,
  updateRuntimeServiceStatus,
  getRuntimeService,
  listRuntimeServices,
  insertRuntimeServiceEvent,
} from "../profile-runtime-db";
import type {
  AiOsRuntimeSnapshot,
  AiOsServiceId,
  AiOsRuntimeStatus,
  RuntimeServiceRecord,
  RuntimeServiceStatus,
} from "../../shared/aios/aios-contract";

const SUPERVISION_INTERVAL_MS = 15_000;
let supervisionTimer: NodeJS.Timeout | null = null;

function emitStatusChange(win: BrowserWindow | null, serviceId: AiOsServiceId, prev: RuntimeServiceStatus, next: RuntimeServiceStatus, reason?: string): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send("aios:runtime-changed", {
      serviceId,
      previousStatus: prev,
      newStatus: next,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}

function logEvent(serviceId: string, eventType: string, message: string, level: "info" | "warn" | "error" = "info"): void {
  insertRuntimeServiceEvent({
    id: randomUUID(),
    service_id: serviceId,
    event_type: eventType,
    level,
    message,
    payload_json: null,
  });
}

function setStatus(serviceId: AiOsServiceId, status: RuntimeServiceStatus, extra?: Parameters<typeof updateRuntimeServiceStatus>[2]): void {
  updateRuntimeServiceStatus(serviceId, status, extra);
}

function computeOverallStatus(services: { status: RuntimeServiceStatus }[]): RuntimeServiceStatus {
  if (services.length === 0) return "not_installed";
  if (services.every((s) => s.status === "running")) return "running";
  if (services.some((s) => s.status === "error")) return "error";
  if (services.some((s) => s.status === "starting")) return "starting";
  if (services.some((s) => s.status === "stopping")) return "stopping";
  if (services.every((s) => s.status === "stopped")) return "stopped";
  return "degraded";
}

export function initAiOsServices(): void {
  const config = getAiOsEnvConfig();

  const seed: Array<{ id: AiOsServiceId; type: string; name: string; port: number | null; url: string | null }> = [
    { id: "hermes-gateway", type: "hermes-gateway", name: "Hermes Gateway", port: 8642, url: "http://127.0.0.1:8642" },
    { id: "aios-backend", type: "aios-backend", name: "AI-OS Backend", port: config.backendPort, url: `http://127.0.0.1:${config.backendPort}` },
    { id: "aios-frontend", type: "aios-frontend", name: "AI-OS Frontend", port: config.frontendPort, url: `http://127.0.0.1:${config.frontendPort}` },
  ];

  for (const s of seed) {
    const existing = getRuntimeService(s.id);
    if (!existing) {
      upsertRuntimeService({
        service_id: s.id,
        service_type: s.type,
        display_name: s.name,
        status: "stopped",
        pid: null,
        port: s.port,
        url: s.url,
        install_path: null,
        started_at: null,
        stopped_at: null,
        last_health_at: null,
        last_error: null,
        restart_count: 0,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

export function getAiOsRuntimeStatus(): AiOsRuntimeStatus {
  const services = listRuntimeServices();
  return {
    services,
    overall: computeOverallStatus(services),
  };
}

const SNAPSHOT_SERVICE_DEFS: Array<{
  id: AiOsServiceId;
  displayName: string;
  port: number;
  baseUrl: string;
  healthUrl: string;
}> = [
  {
    id: "hermes-gateway",
    displayName: "Hermes Gateway",
    port: 8642,
    baseUrl: "http://127.0.0.1:8642",
    healthUrl: "http://127.0.0.1:8642/health",
  },
  {
    id: "aios-backend",
    displayName: "AI-OS Backend",
    port: 8000,
    baseUrl: "http://127.0.0.1:8000",
    healthUrl: "http://127.0.0.1:8000/health",
  },
  {
    id: "aios-frontend",
    displayName: "AI-OS Frontend",
    port: 3000,
    baseUrl: "http://127.0.0.1:3000",
    healthUrl: "http://127.0.0.1:3000/zh",
  },
];

const WEB_APP_URL = "http://127.0.0.1:3000/zh";

function resolveSnapshotServiceStatus(
  healthy: boolean,
  dbRecord: ReturnType<typeof getRuntimeService>,
): RuntimeServiceStatus {
  if (healthy) return "running";
  if (dbRecord?.status === "error") return "error";
  return "stopped";
}

/** Live health probe — never returns an empty services list. */
export async function getAiOsRuntimeSnapshot(): Promise<AiOsRuntimeSnapshot> {
  const now = new Date().toISOString();

  const services: RuntimeServiceRecord[] = await Promise.all(
    SNAPSHOT_SERVICE_DEFS.map(async (def) => {
      const dbRecord = getRuntimeService(def.id);
      const healthy = await checkServiceHealth(def.healthUrl);
      const status = resolveSnapshotServiceStatus(healthy, dbRecord);

      return {
        service_id: def.id,
        service_type: def.id,
        display_name: def.displayName,
        status,
        pid: dbRecord?.pid ?? null,
        port: def.port,
        url: def.baseUrl,
        install_path: dbRecord?.install_path ?? null,
        started_at: dbRecord?.started_at ?? null,
        stopped_at: healthy ? null : (dbRecord?.stopped_at ?? null),
        last_health_at: healthy ? now : (dbRecord?.last_health_at ?? null),
        last_error: healthy ? null : (dbRecord?.last_error ?? null),
        restart_count: dbRecord?.restart_count ?? 0,
        updated_at: now,
      };
    }),
  );

  const ready = services.every((s) => s.status === "running");

  return {
    services,
    ready,
    ...(ready ? { webAppUrl: WEB_APP_URL } : {}),
  };
}

export async function startAiOs(mainWindow: BrowserWindow | null): Promise<AiOsRuntimeStatus> {
  if (!isAiOsInstalled()) {
    throw new Error("AI-OS is not installed");
  }

  const config = getAiOsEnvConfig();

  // 1. Write .env
  writeAiOsEnvFile();
  logEvent("aios-backend", "env-written", "Generated .env.desktop.local");

  // 2. Run DB migration
  setStatus("aios-backend", "starting");
  emitStatusChange(mainWindow, "aios-backend", "stopped", "starting", "DB migration");
  logEvent("aios-backend", "db-migrate-start", "Running database migration");

  const migrateResult = await runDbMigrate();
  if (!migrateResult.ok) {
    const errMsg = `DB migration failed: ${migrateResult.error}`;
    setStatus("aios-backend", "error", { last_error: errMsg });
    emitStatusChange(mainWindow, "aios-backend", "starting", "error", errMsg);
    logEvent("aios-backend", "db-migrate-failed", errMsg, "error");
    return getAiOsRuntimeStatus();
  }
  logEvent("aios-backend", "db-migrate-done", "Migration completed");

  // 3. Start backend
  const backendResult = spawnBackend();
  setStatus("aios-backend", "starting", {
    pid: backendResult.pid,
    started_at: new Date().toISOString(),
  });
  logEvent("aios-backend", "process-started", `PID: ${backendResult.pid}`);

  setupProcessExitHandler("aios-backend", mainWindow);

  const backendUrl = `http://127.0.0.1:${config.backendPort}/health`;
  const backendHealthy = await waitForHealth(backendUrl, 60_000);
  if (!backendHealthy) {
    setStatus("aios-backend", "error", { last_error: "Backend health check timed out" });
    emitStatusChange(mainWindow, "aios-backend", "starting", "error", "Health timeout");
    logEvent("aios-backend", "health-timeout", "Backend did not become healthy within 60s", "error");
    return getAiOsRuntimeStatus();
  }

  setStatus("aios-backend", "running", { last_health_at: new Date().toISOString() });
  emitStatusChange(mainWindow, "aios-backend", "starting", "running");
  logEvent("aios-backend", "running", "Backend is healthy");

  // 4. Start frontend
  setStatus("aios-frontend", "starting");
  emitStatusChange(mainWindow, "aios-frontend", "stopped", "starting");

  const frontendResult = spawnFrontend();
  setStatus("aios-frontend", "starting", {
    pid: frontendResult.pid,
    started_at: new Date().toISOString(),
  });
  logEvent("aios-frontend", "process-started", `PID: ${frontendResult.pid}`);

  setupProcessExitHandler("aios-frontend", mainWindow);

  const frontendUrl = `http://127.0.0.1:${config.frontendPort}`;
  const frontendHealthy = await waitForHealth(frontendUrl, 90_000, 3000);
  if (!frontendHealthy) {
    setStatus("aios-frontend", "error", { last_error: "Frontend health check timed out" });
    emitStatusChange(mainWindow, "aios-frontend", "starting", "error", "Health timeout");
    logEvent("aios-frontend", "health-timeout", "Frontend did not become healthy within 90s", "error");
    return getAiOsRuntimeStatus();
  }

  setStatus("aios-frontend", "running", { last_health_at: new Date().toISOString() });
  emitStatusChange(mainWindow, "aios-frontend", "starting", "running");
  logEvent("aios-frontend", "running", "Frontend is healthy");

  // 5. Start supervision
  startSupervision(mainWindow);

  return getAiOsRuntimeStatus();
}

export async function stopAiOs(mainWindow: BrowserWindow | null): Promise<AiOsRuntimeStatus> {
  stopSupervision();

  for (const id of ["aios-frontend", "aios-backend"] as AiOsServiceId[]) {
    const prev = getRuntimeService(id);
    if (prev && (prev.status === "running" || prev.status === "starting")) {
      setStatus(id, "stopping");
      emitStatusChange(mainWindow, id, prev.status as RuntimeServiceStatus, "stopping");
      killProcess(id);
      setStatus(id, "stopped", { stopped_at: new Date().toISOString(), pid: null });
      emitStatusChange(mainWindow, id, "stopping", "stopped");
      logEvent(id, "stopped", "Process stopped");
    }
  }

  return getAiOsRuntimeStatus();
}

export async function restartAiOs(mainWindow: BrowserWindow | null): Promise<AiOsRuntimeStatus> {
  await stopAiOs(mainWindow);
  return startAiOs(mainWindow);
}

function setupProcessExitHandler(serviceId: AiOsServiceId, mainWindow: BrowserWindow | null): void {
  const child = getProcess(serviceId);
  if (!child) return;

  child.on("exit", (code) => {
    const current = getRuntimeService(serviceId);
    if (current && current.status === "running") {
      setStatus(serviceId, "error", {
        last_error: `Process exited unexpectedly with code ${code}`,
        stopped_at: new Date().toISOString(),
        pid: null,
      });
      emitStatusChange(mainWindow, serviceId, "running", "error", `Unexpected exit (code ${code})`);
      logEvent(serviceId, "unexpected-exit", `Exit code: ${code}`, "error");
    }
  });
}

function startSupervision(mainWindow: BrowserWindow | null): void {
  stopSupervision();
  supervisionTimer = setInterval(async () => {
    const config = getAiOsEnvConfig();

    for (const [id, url] of [
      ["aios-backend", `http://127.0.0.1:${config.backendPort}/health`],
      ["aios-frontend", `http://127.0.0.1:${config.frontendPort}`],
    ] as [AiOsServiceId, string][]) {
      const svc = getRuntimeService(id);
      if (!svc || svc.status !== "running") continue;

      const healthy = await checkServiceHealth(url);
      if (healthy) {
        updateRuntimeServiceStatus(id, "running", { last_health_at: new Date().toISOString() });
      } else {
        setStatus(id, "degraded", { last_error: "Health check failed" });
        emitStatusChange(mainWindow, id, "running", "degraded", "Health check failed");
        logEvent(id, "health-failed", "Health check failed", "warn");
      }
    }
  }, SUPERVISION_INTERVAL_MS);
}

function stopSupervision(): void {
  if (supervisionTimer) {
    clearInterval(supervisionTimer);
    supervisionTimer = null;
  }
}

export function onBeforeQuit(): void {
  stopSupervision();
  killAllProcesses();

  for (const id of ["aios-backend", "aios-frontend"] as AiOsServiceId[]) {
    const svc = getRuntimeService(id);
    if (svc && svc.status === "running") {
      setStatus(id, "stopped", { stopped_at: new Date().toISOString(), pid: null });
    }
  }
}
