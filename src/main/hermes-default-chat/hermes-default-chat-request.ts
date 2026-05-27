import type { SavedModel } from "../models";
import { resolveModelIdForSend } from "./hermes-default-chat-models";

/** OpenAI-compatible POST /v1/chat/completions body (Hermes Gateway). */
export type GatewayChatCompletionsBody = {
  /** API Server 注册名（如 hermes-agent），非 LLM id。真实模型由 config.yaml 决定。 */
  model: string;
  messages: Array<{ role: string; content: unknown }>;
  stream: boolean;
  /** 仅用于日志/未来 Gateway；当前 Gateway 可能忽略 */
  provider?: string;
  base_url?: string;
};

/**
 * 构建 Gateway 请求体。
 * `model` 必须为 API Server 名；LLM 路由在发送前通过 ensureGatewayModelMatchesSaved 写入 config.yaml。
 */
export function buildGatewayChatCompletionsBody(
  messages: Array<{ role: string; content: unknown }>,
  profile: string | undefined,
  modelId: string | undefined,
  apiServerModel: string,
): GatewayChatCompletionsBody {
  const saved = resolveModelIdForSend(modelId, profile);
  const body: GatewayChatCompletionsBody = {
    model: apiServerModel,
    messages,
    stream: true,
  };
  if (saved) {
    applySavedModelFields(body, saved);
  }
  return body;
}

function applySavedModelFields(
  body: GatewayChatCompletionsBody,
  saved: SavedModel,
): void {
  const provider = saved.provider?.trim();
  if (provider && provider !== "auto") {
    body.provider = provider;
  }
  const baseUrl = saved.baseUrl?.trim();
  if (baseUrl) {
    body.base_url = baseUrl.replace(/\/+$/, "");
  }
}
