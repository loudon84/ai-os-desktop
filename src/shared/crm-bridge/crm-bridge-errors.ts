import type { CrmBridgeErrorCode } from "./crm-bridge-contract";

export type CrmBridgeAuditAction =
  | "crm.event.received"
  | "crm.event.rejected"
  | "crm.event.routed"
  | "crm.command.sent"
  | "crm.command.failed";

export type CrmBridgeAuditStatus = "success" | "failed" | "blocked";

export interface CrmBridgeAuditRecord {
  id: string;
  requestId?: string;
  eventType?: string;
  origin?: string;
  url?: string;
  entityType?: string;
  entityId?: string;
  action: CrmBridgeAuditAction;
  status: CrmBridgeAuditStatus;
  errorCode?: CrmBridgeErrorCode;
  message?: string;
  createdAt: string;
}

export function createCrmBridgeError(
  errorCode: CrmBridgeErrorCode,
  message: string,
): { ok: false; errorCode: CrmBridgeErrorCode; message: string } {
  return { ok: false, errorCode, message };
}
