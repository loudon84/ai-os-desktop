export type HermesPanelRunState = "idle" | "creating" | "streaming" | "error" | "cancelled";

export type HermesPanelMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
};

export type HermesPanelToolCall = {
  tid: string;
  name: string;
  preview: string;
  done: boolean;
};

export type HermesPanelPageContextPayload = {
  url: string;
  title: string;
  frameId: string | null;
  frameMeta?: {
    name?: string | null;
    origin?: string | null;
    /** Serialized frame path indices */
    path?: string | null;
    url?: string | null;
  };
  htmlExcerpt?: string;
  textExcerpt?: string;
  truncated?: boolean;
  capturedAt?: string;
  interactiveElementCount?: number;
};

/** Page context passed into the runtime panel (e.g. from WebOperator). */
export type HermesPanelPageContext = {
  type: "web-operator";
  scopeKey: string;
  summary: string;
  payload: HermesPanelPageContextPayload;
};

export type HermesPanelPresetAction = {
  label: string;
  prompt: string;
};
