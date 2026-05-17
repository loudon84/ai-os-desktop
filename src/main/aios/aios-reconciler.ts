import { getRuntimeService, updateRuntimeServiceStatus, listRuntimeServices } from "../profile-runtime-db";
import { checkServiceHealth } from "./aios-health";
import { isPortAvailable } from "./aios-port-check";
import type { AiOsServiceId, RuntimeServiceStatus } from "../../shared/aios/aios-contract";

export interface ReconcileCorrection {
  serviceId: AiOsServiceId;
  previousStatus: RuntimeServiceStatus;
  correctedStatus: RuntimeServiceStatus;
  reason: string;
}

export interface AiOsReconcileResult {
  corrections: ReconcileCorrection[];
}

export async function reconcileAiOsRuntime(): Promise<AiOsReconcileResult> {
  const corrections: ReconcileCorrection[] = [];
  const services = listRuntimeServices();

  for (const svc of services) {
    const serviceId = svc.service_id as AiOsServiceId;
    const prevStatus = svc.status as RuntimeServiceStatus;

    if (prevStatus === "running" || prevStatus === "starting") {
      if (!svc.port) continue;

      const portInUse = !(await isPortAvailable(svc.port));
      if (!portInUse) {
        updateRuntimeServiceStatus(serviceId, "stopped", {
          pid: null,
          stopped_at: new Date().toISOString(),
          last_error: "Service was not running after app restart",
        });
        corrections.push({
          serviceId,
          previousStatus: prevStatus,
          correctedStatus: "stopped",
          reason: `Port ${svc.port} not in use — service was not running`,
        });
        continue;
      }

      if (svc.url) {
        const healthy = await checkServiceHealth(`${svc.url}/health`);
        if (healthy) {
          updateRuntimeServiceStatus(serviceId, "running", {
            last_health_at: new Date().toISOString(),
          });
          if (prevStatus !== "running") {
            corrections.push({
              serviceId,
              previousStatus: prevStatus,
              correctedStatus: "running",
              reason: "Service responded to health check",
            });
          }
        } else {
          updateRuntimeServiceStatus(serviceId, "degraded", {
            last_error: "Service process exists but health check failed",
          });
          corrections.push({
            serviceId,
            previousStatus: prevStatus,
            correctedStatus: "degraded",
            reason: "Port in use but health check failed",
          });
        }
      }
    }
  }

  return { corrections };
}
