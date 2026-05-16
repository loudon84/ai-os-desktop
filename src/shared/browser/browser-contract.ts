export type BrowserActionSource = "user" | "hermes" | "system";

export type BrowserActionName =
  | "browser.open"
  | "browser.back"
  | "browser.forward"
  | "browser.reload"
  | "browser.get_state"
  | "browser.screenshot"
  | "browser.click"
  | "browser.type"
  | "browser.extract_table";

export type BrowserActionStatus =
  | "success"
  | "failed"
  | "blocked"
  | "confirmed"
  | "rejected"
  | "timeout";

export type BrowserErrorCode =
  | "EXTERNAL_WEB_VIEW_NOT_READY"
  | "DOMAIN_NOT_ALLOWED"
  | "SELECTOR_NOT_FOUND"
  | "PASSWORD_FIELD_BLOCKED"
  | "UNSAFE_ACTION_REQUIRES_CONFIRMATION"
  | "JAVASCRIPT_EXECUTION_FAILED"
  | "SCREENSHOT_FAILED";

export interface BrowserOpenRequest {
  url: string;
  profile?: string;
  source: BrowserActionSource;
}

export interface BrowserClickRequest {
  selector: string;
  source: BrowserActionSource;
  requireConfirm?: boolean;
}

export interface BrowserTypeRequest {
  selector: string;
  text: string;
  source: BrowserActionSource;
}

export interface BrowserExtractTableRequest {
  selector: string;
  source: BrowserActionSource;
}

export interface BrowserConfirmActionRequest {
  pendingActionId: string;
}

export interface BrowserRejectActionRequest {
  pendingActionId: string;
}

export interface BrowserViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BrowserActionResult {
  ok: boolean;
  errorCode?: BrowserErrorCode;
  message?: string;
}

export interface BrowserOpenResult extends BrowserActionResult {
  url?: string;
}

export interface BrowserElementSummary {
  index: number;
  tag: string;
  id?: string;
  name?: string;
  type?: string;
  text?: string;
  placeholder?: string;
  ariaLabel?: string;
  selectorHint?: string;
}

export interface BrowserPageState {
  title: string;
  url: string;
  text: string;
  inputs: BrowserElementSummary[];
  buttons: BrowserElementSummary[];
  links: Array<{
    text: string;
    href: string;
    selectorHint?: string;
  }>;
}

export interface BrowserStateResult extends BrowserActionResult {
  state?: BrowserPageState;
}

export interface BrowserScreenshotResult extends BrowserActionResult {
  mimeType?: "image/png";
  base64?: string;
}

export interface BrowserAuditRecord {
  id: string;
  time: string;
  profile?: string;
  source: BrowserActionSource;
  action: BrowserActionName;
  url?: string;
  argsSummary?: Record<string, unknown>;
  status: BrowserActionStatus;
  errorCode?: BrowserErrorCode;
  message?: string;
}

export interface PendingSensitiveAction {
  pendingActionId: string;
  action: BrowserActionName;
  selector: string;
  elementDescription?: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  originalParams: Record<string, unknown>;
}

export interface BrowserSecurityCheckResult {
  allowed: boolean;
  errorCode?: BrowserErrorCode;
  message?: string;
  isSensitiveAction?: boolean;
}
