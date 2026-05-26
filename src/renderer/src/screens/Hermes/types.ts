export type HermesGatewayUiStatus =
  | "running"
  | "stopped"
  | "starting"
  | "stopping"
  | "error";

export type HermesChatRunState = "idle" | "streaming" | "error";

export type HermesRightInspectorTab = "runtime" | "skills" | "memory" | "workspace";

export type HermesMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
};

export type HermesSession = {
  id: string;
  title: string;
  startedAt: number;
  source: string;
  messageCount: number;
  model: string;
};

export type HermesDefaultRuntimeHandle = {
  status: HermesGatewayUiStatus;
  busy: boolean;
  error: string | null;
  hermesHome: string | null;
  modelConfig: { provider: string; model: string; baseUrl: string } | null;
  version: string | null;
  refresh: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  restart: () => Promise<void>;
  readLogs: (lines?: number) => Promise<string>;
};
