export type CopilotServeProcessStatus =
  | "stopped"
  | "starting"
  | "running"
  | "degraded"
  | "error";

export interface CopilotServeConnection {
  baseUrl: string;
  port: number;
  token: string;
}

export interface CopilotServeStatus {
  status: CopilotServeProcessStatus;
  pid: number | null;
  port: number;
  baseUrl: string;
  lastError: string | null;
  logPath: string;
}

export interface CopilotServeStatusChangeEvent {
  status: CopilotServeProcessStatus;
  pid: number | null;
  port: number;
  baseUrl: string;
  lastError: string | null;
  timestamp: string;
}

export interface CopilotServeAPI {
  getConnection: () => Promise<CopilotServeConnection | null>;
  getStatus: () => Promise<CopilotServeStatus>;
  start: () => Promise<CopilotServeStatus>;
  stop: () => Promise<CopilotServeStatus>;
  restart: () => Promise<CopilotServeStatus>;
  getLogs: (options?: { tailLines?: number }) => Promise<string>;
  onStatusChanged: (
    callback: (event: CopilotServeStatusChangeEvent) => void,
  ) => () => void;
}
