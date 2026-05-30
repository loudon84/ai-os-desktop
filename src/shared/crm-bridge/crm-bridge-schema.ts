import type { CrmBridgeEvent, CrmBridgeEventType } from "./crm-bridge-contract";

const ALLOWED_EVENT_TYPES = new Set<CrmBridgeEventType>([
  "crm.context.submit",
  "crm.customer.open-ai-panel",
  "crm.quote.create-assist",
  "crm.order.risk-check",
  "crm.page.snapshot-request",
  "crm.page.ready",
]);

const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "password",
  "token",
  "cookie",
  "authorization",
  "apiKey",
  "api_key",
  "secret",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasForbiddenSecrets(value: unknown, depth = 0): boolean {
  if (depth > 6) return false;
  if (!isRecord(value)) return false;

  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (FORBIDDEN_PAYLOAD_KEYS.has(normalized)) {
      return true;
    }
    if (hasForbiddenSecrets(child, depth + 1)) {
      return true;
    }
  }
  return false;
}

export interface CrmBridgeSchemaValidation {
  ok: boolean;
  event?: CrmBridgeEvent;
  message?: string;
}

export function validateCrmBridgeEventSchema(raw: unknown): CrmBridgeSchemaValidation {
  if (!isRecord(raw)) {
    return { ok: false, message: "Event must be an object" };
  }

  if (raw.source !== "crm-web") {
    return { ok: false, message: "Invalid event source" };
  }

  if (typeof raw.sdkVersion !== "string" || !raw.sdkVersion.trim()) {
    return { ok: false, message: "sdkVersion is required" };
  }

  if (typeof raw.requestId !== "string" || !raw.requestId.trim()) {
    return { ok: false, message: "requestId is required" };
  }

  if (typeof raw.type !== "string" || !ALLOWED_EVENT_TYPES.has(raw.type as CrmBridgeEventType)) {
    return { ok: false, message: "Invalid or missing event type" };
  }

  const eventType = raw.type as CrmBridgeEventType;
  const isPageReady = eventType === "crm.page.ready";

  if (isPageReady) {
    if (raw.trigger !== undefined && !isRecord(raw.trigger)) {
      return { ok: false, message: "trigger must be an object when provided" };
    }
  } else {
    if (!isRecord(raw.trigger) || raw.trigger.type !== "user-click") {
      return { ok: false, message: "trigger.type must be user-click" };
    }
    if (typeof raw.trigger.timestamp !== "string" || !raw.trigger.timestamp.trim()) {
      return { ok: false, message: "trigger.timestamp is required" };
    }
  }

  if (!isRecord(raw.page) || raw.page.app !== "crm") {
    return { ok: false, message: "page.app must be crm" };
  }

  if (typeof raw.page.url !== "string" || !raw.page.url.trim()) {
    return { ok: false, message: "page.url is required" };
  }

  if (raw.payload !== undefined) {
    if (!isRecord(raw.payload)) {
      return { ok: false, message: "payload must be an object when provided" };
    }
    if (hasForbiddenSecrets(raw.payload)) {
      return { ok: false, message: "payload contains forbidden secret fields" };
    }
  }

  const triggerTimestamp =
    isRecord(raw.trigger) && typeof raw.trigger.timestamp === "string" && raw.trigger.timestamp.trim()
      ? raw.trigger.timestamp
      : new Date().toISOString();

  const event: CrmBridgeEvent = {
    source: "crm-web",
    sdkVersion: raw.sdkVersion,
    requestId: raw.requestId,
    type: eventType,
    trigger: isPageReady
      ? {
          type: "user-click",
          elementId:
            isRecord(raw.trigger) && typeof raw.trigger.elementId === "string"
              ? raw.trigger.elementId
              : undefined,
          label:
            isRecord(raw.trigger) && typeof raw.trigger.label === "string"
              ? raw.trigger.label
              : undefined,
          timestamp: triggerTimestamp,
        }
      : {
          type: "user-click",
          elementId:
            isRecord(raw.trigger) && typeof raw.trigger.elementId === "string"
              ? raw.trigger.elementId
              : undefined,
          label:
            isRecord(raw.trigger) && typeof raw.trigger.label === "string"
              ? raw.trigger.label
              : undefined,
          timestamp: triggerTimestamp,
        },
    page: {
      app: "crm",
      entityType:
        typeof raw.page.entityType === "string"
          ? (raw.page.entityType as CrmBridgeEvent["page"]["entityType"])
          : undefined,
      entityId: typeof raw.page.entityId === "string" ? raw.page.entityId : undefined,
      entityName: typeof raw.page.entityName === "string" ? raw.page.entityName : undefined,
      url: raw.page.url,
      title: typeof raw.page.title === "string" ? raw.page.title : undefined,
      selectedIds: Array.isArray(raw.page.selectedIds)
        ? raw.page.selectedIds.filter((id): id is string => typeof id === "string")
        : undefined,
      fields: isRecord(raw.page.fields)
        ? (raw.page.fields as CrmBridgeEvent["page"]["fields"])
        : undefined,
      safeText: typeof raw.page.safeText === "string" ? raw.page.safeText : undefined,
    },
    payload: isRecord(raw.payload) ? raw.payload : undefined,
  };

  return { ok: true, event };
}

export function estimatePayloadBytes(value: unknown): number {
  try {
    // Avoid Node-only Buffer in renderer/preload contexts.
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}
