import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "http";
import { getCachedAccessToken } from "../auth/token-store";
import {
  MCP_SKILL_GATEWAY_JSONRPC_ERRORS,
  type McpSkillGatewayRuntimeConfig,
} from "../../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";
import {
  getMcpSkillGatewayConfig,
  resolveBackendBaseUrl,
  resolveLocalMcpUrl,
  resolveRemoteMcpUrl,
} from "./mcp-skill-gateway-config";
import { McpSkillGatewayError } from "./mcp-skill-gateway-errors";
import { writeMcpSkillGatewayLog } from "./mcp-skill-gateway-log";

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 60_000;

let server: Server | null = null;
let currentPort = 48742;
let lastProxyError: string | null = null;

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(
          new McpSkillGatewayError(
            "MCP_GATEWAY_REQUEST_TOO_LARGE",
            "Request body exceeds 2MB",
          ),
        );
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function buildProxyUrl(port: number): string {
  return resolveLocalMcpUrl(port);
}

function resolveRemoteTarget(_config: McpSkillGatewayRuntimeConfig): string {
  const backend = resolveBackendBaseUrl();
  if (!backend) {
    throw new McpSkillGatewayError(
      "MCP_GATEWAY_BACKEND_NOT_CONFIGURED",
      "Backend endpoint not configured",
    );
  }
  return resolveRemoteMcpUrl();
}

function jsonRpcError(
  id: unknown,
  code: number,
  message: string,
): Record<string, unknown> {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message },
  };
}

export function getMcpSkillGatewayProxyUrl(): string {
  return buildProxyUrl(currentPort);
}

export function isMcpSkillGatewayProxyRunning(): boolean {
  return server != null;
}

export function getMcpSkillGatewayProxyLastError(): string | null {
  return lastProxyError;
}

export async function startMcpSkillGatewayProxy(
  portOverride?: number,
): Promise<void> {
  if (server) return;

  const config = getMcpSkillGatewayConfig();
  const port = portOverride ?? config.localProxyPort;

  await new Promise<void>((resolve, reject) => {
    const s = createServer((req, res) => {
      void handleRequest(req, res);
    });

    s.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        lastProxyError = `Port ${port} is in use`;
        reject(
          new McpSkillGatewayError(
            "MCP_GATEWAY_PROXY_PORT_IN_USE",
            lastProxyError,
          ),
        );
        return;
      }
      lastProxyError = err.message;
      reject(
        new McpSkillGatewayError("MCP_GATEWAY_PROXY_START_FAILED", err.message),
      );
    });

    s.listen(port, "127.0.0.1", () => {
      server = s;
      currentPort = port;
      lastProxyError = null;
      console.log(`[MCP-SKILL-GATEWAY] Proxy listening on ${getMcpSkillGatewayProxyUrl()}`);
      resolve();
    });
  });
}

export function stopMcpSkillGatewayProxy(): void {
  if (server) {
    server.close();
    server = null;
  }
}

export async function restartMcpSkillGatewayProxy(): Promise<void> {
  stopMcpSkillGatewayProxy();
  await startMcpSkillGatewayProxy();
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const started = Date.now();
  const config = getMcpSkillGatewayConfig();
  const url = new URL(req.url ?? "/", getMcpSkillGatewayProxyUrl());
  const remoteIp = req.socket.remoteAddress ?? "";
  if (remoteIp && remoteIp !== "127.0.0.1" && remoteIp !== "::1" && remoteIp !== "::ffff:127.0.0.1") {
    sendJson(res, 403, { error: "forbidden" });
    return;
  }

  const backendBaseUrl = resolveBackendBaseUrl();
  const remoteMcpUrl = resolveRemoteMcpUrl();
  const localMcpUrl = getMcpSkillGatewayProxyUrl();
  const token = getCachedAccessToken();

  if (req.method === "GET" && url.pathname === "/health") {
    if (!token) {
      sendJson(res, 200, {
        ok: false,
        service: "mcp-skill-gateway-proxy",
        status: "running",
        loggedIn: false,
        backendBaseUrl,
        remoteMcpUrl,
        localMcpUrl,
        errorCode: "MCP_GATEWAY_NOT_LOGGED_IN",
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      service: "mcp-skill-gateway-proxy",
      status: "running",
      loggedIn: true,
      backendBaseUrl,
      remoteMcpUrl,
      localMcpUrl,
    });
    return;
  }

  if (req.method !== "POST" || url.pathname !== "/mcp") {
    sendJson(res, 404, { error: "not_found" });
    return;
  }

  let bodyText = "";
  let parsed: { jsonrpc?: string; id?: unknown; method?: string; params?: unknown } = {};
  try {
    bodyText = await readBody(req);
    parsed = JSON.parse(bodyText) as typeof parsed;
    if (parsed.jsonrpc !== "2.0" || typeof parsed.method !== "string") {
      sendJson(
        res,
        400,
        jsonRpcError(parsed.id, MCP_SKILL_GATEWAY_JSONRPC_ERRORS.REMOTE_FAILED, "Invalid JSON-RPC request"),
      );
      return;
    }
  } catch (err) {
    const code =
      err instanceof McpSkillGatewayError && err.code === "MCP_GATEWAY_REQUEST_TOO_LARGE"
        ? MCP_SKILL_GATEWAY_JSONRPC_ERRORS.REMOTE_FAILED
        : MCP_SKILL_GATEWAY_JSONRPC_ERRORS.REMOTE_FAILED;
    sendJson(res, 400, jsonRpcError(null, code, "Invalid JSON-RPC request"));
    writeMcpSkillGatewayLog({
      time: new Date().toISOString(),
      level: "error",
      method: "POST /mcp",
      durationMs: Date.now() - started,
      errorCode: "MCP_GATEWAY_INVALID_JSONRPC",
      message: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  if (!token) {
    sendJson(
      res,
      401,
      jsonRpcError(
        parsed.id,
        MCP_SKILL_GATEWAY_JSONRPC_ERRORS.NOT_LOGGED_IN,
        "Desktop login required",
      ),
    );
    writeMcpSkillGatewayLog({
      time: new Date().toISOString(),
      level: "warn",
      method: parsed.method,
      jsonrpcId: parsed.id as string | number | null,
      durationMs: Date.now() - started,
      errorCode: MCP_SKILL_GATEWAY_JSONRPC_ERRORS.NOT_LOGGED_IN,
      message: "Desktop login required",
    });
    return;
  }

  let target = "";
  try {
    target = resolveRemoteTarget(config);
  } catch (err) {
    sendJson(
      res,
      503,
      jsonRpcError(
        parsed.id,
        MCP_SKILL_GATEWAY_JSONRPC_ERRORS.BACKEND_NOT_CONFIGURED,
        "Backend endpoint not configured",
      ),
    );
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const remoteRes = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: bodyText,
      signal: controller.signal,
    });

    const remoteText = await remoteRes.text();
    let remoteJson: unknown = null;
    try {
      remoteJson = remoteText ? JSON.parse(remoteText) : null;
    } catch {
      remoteJson = { raw: remoteText };
    }

    if (remoteRes.status === 401) {
      sendJson(
        res,
        401,
        jsonRpcError(
          parsed.id,
          MCP_SKILL_GATEWAY_JSONRPC_ERRORS.SESSION_EXPIRED,
          "Desktop session expired",
        ),
      );
      writeMcpSkillGatewayLog({
        time: new Date().toISOString(),
        level: "warn",
        method: parsed.method,
        jsonrpcId: parsed.id as string | number | null,
        remoteStatus: remoteRes.status,
        durationMs: Date.now() - started,
        errorCode: MCP_SKILL_GATEWAY_JSONRPC_ERRORS.SESSION_EXPIRED,
      });
      return;
    }

    if (!remoteRes.ok) {
      sendJson(
        res,
        remoteRes.status,
        jsonRpcError(
          parsed.id,
          MCP_SKILL_GATEWAY_JSONRPC_ERRORS.REMOTE_FAILED,
          "MCP gateway request failed",
        ),
      );
      writeMcpSkillGatewayLog({
        time: new Date().toISOString(),
        level: "error",
        method: parsed.method,
        jsonrpcId: parsed.id as string | number | null,
        remoteStatus: remoteRes.status,
        durationMs: Date.now() - started,
        errorCode: MCP_SKILL_GATEWAY_JSONRPC_ERRORS.REMOTE_FAILED,
      });
      return;
    }

    sendJson(res, 200, remoteJson);
    writeMcpSkillGatewayLog({
      time: new Date().toISOString(),
      level: "info",
      method: parsed.method,
      jsonrpcId: parsed.id as string | number | null,
      remoteStatus: remoteRes.status,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    sendJson(
      res,
      502,
      jsonRpcError(
        parsed.id,
        MCP_SKILL_GATEWAY_JSONRPC_ERRORS.REMOTE_FAILED,
        "MCP gateway request failed",
      ),
    );
    writeMcpSkillGatewayLog({
      time: new Date().toISOString(),
      level: "error",
      method: parsed.method,
      jsonrpcId: parsed.id as string | number | null,
      durationMs: Date.now() - started,
      errorCode: MCP_SKILL_GATEWAY_JSONRPC_ERRORS.REMOTE_FAILED,
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    clearTimeout(timer);
  }
}
