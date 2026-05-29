/** v5.7.5 — WebOperator task ↔ Hermes session binding (Desktop SQLite, not Hermes state.db). */

export type WebOperatorTaskSessionStatus = "active" | "archived";

/** JSON-safe page context stored in task_session (mirrors HermesPanelPageContext). */
export type WebOperatorTaskPageContextPayload = {
  url: string;
  title: string;
  frameId: string | null;
  frameMeta?: {
    name?: string | null;
    origin?: string | null;
    path?: string | null;
    url?: string | null;
  };
  htmlExcerpt?: string;
  textExcerpt?: string;
  truncated?: boolean;
  capturedAt?: string;
  interactiveElementCount?: number;
};

export type WebOperatorTaskPageContext = {
  type: "web-operator";
  scopeKey: string;
  summary: string;
  payload: WebOperatorTaskPageContextPayload;
};

export type WebOperatorTaskSessionRecord = {
  taskId: string;
  pageUrl: string;
  sessionId: string;
  pageContext: WebOperatorTaskPageContext;
  skill: string;
  status: WebOperatorTaskSessionStatus;
  createdAt: string;
  updatedAt: string;
};

export type WebOperatorTaskSessionLookupResult = {
  taskId: string;
  pageUrl: string;
  record: WebOperatorTaskSessionRecord | null;
};

export type WebOperatorTaskSessionResolveInput = {
  pageUrl: string;
};

export type WebOperatorTaskSessionUpsertInput = {
  taskId: string;
  pageUrl: string;
  sessionId: string;
  pageContext: WebOperatorTaskPageContext;
  skill?: string;
};

export interface WebOperatorTaskSessionAPI {
  resolve(input: WebOperatorTaskSessionResolveInput): Promise<WebOperatorTaskSessionLookupResult>;
  upsert(input: WebOperatorTaskSessionUpsertInput): Promise<WebOperatorTaskSessionRecord>;
  remove(taskId: string): Promise<{ ok: true }>;
}
