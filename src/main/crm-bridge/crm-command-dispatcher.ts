import { randomUUID } from "crypto";
import type {
  CrmBridgeResult,
  CrmDesktopCommand,
} from "../../shared/crm-bridge/crm-bridge-contract";
import { CrmBridgeEvents } from "../../shared/crm-bridge/crm-bridge-contract";
import type { BrowserViewPort } from "../browser/browser-viewport";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCommand(raw: unknown): CrmDesktopCommand | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.type !== "string" || !raw.type.startsWith("desktop.crm.")) {
    return null;
  }
  return {
    commandId:
      typeof raw.commandId === "string" && raw.commandId.trim()
        ? raw.commandId
        : randomUUID(),
    type: raw.type as CrmDesktopCommand["type"],
    target: isRecord(raw.target)
      ? {
          selector:
            typeof raw.target.selector === "string" ? raw.target.selector : undefined,
          fieldName:
            typeof raw.target.fieldName === "string" ? raw.target.fieldName : undefined,
          entityId:
            typeof raw.target.entityId === "string" ? raw.target.entityId : undefined,
          frameId:
            typeof raw.target.frameId === "string" ? raw.target.frameId : undefined,
        }
      : undefined,
    payload: isRecord(raw.payload) ? raw.payload : undefined,
    createdAt:
      typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  };
}

export function dispatchCrmCommand(
  commandInput: unknown,
  viewManager: BrowserViewPort,
): CrmBridgeResult {
  const command = normalizeCommand(commandInput);
  if (!command) {
    return {
      ok: false,
      requestId: "",
      errorCode: "INVALID_SCHEMA",
      message: "Invalid CRM command",
    };
  }

  const wc = viewManager.getExternalWebContents();
  if (!wc || wc.isDestroyed()) {
    return {
      ok: false,
      requestId: command.commandId,
      errorCode: "WEB_OPERATOR_NOT_READY",
      message: "WebOperator view is not ready",
    };
  }

  wc.send(CrmBridgeEvents.COMMAND, command);

  return {
    ok: true,
    requestId: command.commandId,
    action: "crm.command.sent",
    message: "Command dispatched to CRM page",
  };
}

// Keep validateCrmBridgeEventSchema import (command vs event mix-ups)
