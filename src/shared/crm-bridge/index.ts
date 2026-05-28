export type {
  CrmBridgeEventType,
  CrmBridgeErrorCode,
  CrmBridgeTrigger,
  CrmPageContext,
  CrmBridgeEvent,
  CrmBridgeResult,
  CrmDesktopCommandType,
  CrmDesktopCommand,
  CrmBridgeRouteAction,
  CrmBridgeRouteConfig,
  CrmBridgeRouteResult,
  CrmBridgeStoredEvent,
  CrmBridgeEmitInput,
  CrmBridgeOnEventPayload,
} from "./crm-bridge-contract";

export { CrmBridgeEvents } from "./crm-bridge-contract";

export type {
  CrmBridgeAuditAction,
  CrmBridgeAuditStatus,
  CrmBridgeAuditRecord,
} from "./crm-bridge-errors";

export { createCrmBridgeError } from "./crm-bridge-errors";

export type { CrmBridgeSchemaValidation } from "./crm-bridge-schema";

export {
  validateCrmBridgeEventSchema,
  estimatePayloadBytes,
} from "./crm-bridge-schema";

export {
  CRM_RENDERER_ROUTES,
  CRM_RENDERER_ROUTE_DEFINITIONS,
  resolveCrmRendererRoute,
  isCrmRendererRoutePath,
} from "./crm-renderer-routes";

export type {
  CrmRendererRoutePath,
  CrmRendererRouteId,
  CrmRendererRouteDefinition,
} from "./crm-renderer-routes";
