export type CrmBridgeEventType =
  | "crm.context.submit"
  | "crm.customer.open-ai-panel"
  | "crm.quote.create-assist"
  | "crm.order.risk-check"
  | "crm.page.snapshot-request";

export type CrmBridgeErrorCode =
  | "CRM_BRIDGE_DISABLED"
  | "ORIGIN_NOT_ALLOWED"
  | "EVENT_TYPE_NOT_ALLOWED"
  | "PAYLOAD_TOO_LARGE"
  | "USER_GESTURE_REQUIRED"
  | "INVALID_SCHEMA"
  | "WEB_OPERATOR_NOT_READY"
  | "ROUTE_NOT_FOUND"
  | "DUPLICATE_REQUEST"
  | "UNKNOWN_ERROR";

export interface CrmBridgeTrigger {
  type: "user-click";
  elementId?: string;
  label?: string;
  timestamp: string;
}

export interface CrmPageContext {
  app: "crm";
  entityType?: "customer" | "contact" | "lead" | "opportunity" | "quote" | "order";
  entityId?: string;
  entityName?: string;
  url: string;
  title?: string;
  selectedIds?: string[];
  fields?: Record<string, string | number | boolean | null>;
  safeText?: string;
}

export interface CrmBridgeEvent {
  source: "crm-web";
  sdkVersion: string;
  requestId: string;
  type: CrmBridgeEventType;
  trigger: CrmBridgeTrigger;
  page: CrmPageContext;
  payload?: Record<string, unknown>;
}

export interface CrmBridgeResult {
  ok: boolean;
  requestId: string;
  action?: string;
  message?: string;
  errorCode?: CrmBridgeErrorCode;
}

export type CrmDesktopCommandType =
  | "desktop.crm.showToast"
  | "desktop.crm.highlightField"
  | "desktop.crm.focusField"
  | "desktop.crm.fillField"
  | "desktop.crm.scrollToSection"
  | "desktop.crm.requestContext";

export interface CrmDesktopCommand {
  commandId: string;
  type: CrmDesktopCommandType;
  target?: {
    selector?: string;
    fieldName?: string;
    entityId?: string;
    frameId?: string;
  };
  payload?: Record<string, unknown>;
  createdAt: string;
}

export type CrmBridgeRouteAction =
  | "open-web-operator-panel"
  | "open-renderer-route"
  | "refresh-snapshot";

export interface CrmBridgeRouteConfig {
  action: CrmBridgeRouteAction;
  focusedPanel?: string;
  refreshSnapshot?: boolean;
  route?: string;
}

export interface CrmBridgeRouteResult {
  ok: boolean;
  action?: string;
  focusedPanel?: string;
  refreshSnapshot?: boolean;
  route?: string;
  message?: string;
}

export interface CrmBridgeStoredEvent extends CrmBridgeEvent {
  webContentsId?: number;
  origin?: string;
  createdAt: string;
}

export interface CrmBridgeEmitInput {
  event: unknown;
  location?: {
    href: string;
    origin: string;
    title?: string;
  };
  receivedAt?: string;
}

export interface CrmBridgeOnEventPayload {
  event: CrmBridgeStoredEvent;
  routeAction: CrmBridgeRouteResult;
}

export const CrmBridgeEvents = {
  ON_EVENT: "crm-bridge:on-event",
  COMMAND: "crm-bridge:command",
} as const;
