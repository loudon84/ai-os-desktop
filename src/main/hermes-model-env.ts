/** Env injection for custom / local inference endpoints (CLI path). */

export const LOCAL_PROVIDERS = new Set([
  "custom",
  "lmstudio",
  "ollama",
  "vllm",
  "llamacpp",
]);

export const URL_KEY_MAP: Array<{ pattern: RegExp; envKey: string }> = [
  { pattern: /openrouter\.ai/i, envKey: "OPENROUTER_API_KEY" },
  { pattern: /anthropic\.com/i, envKey: "ANTHROPIC_API_KEY" },
  { pattern: /openai\.com/i, envKey: "OPENAI_API_KEY" },
  { pattern: /huggingface\.co/i, envKey: "HF_TOKEN" },
  { pattern: /api\.groq\.com/i, envKey: "GROQ_API_KEY" },
  { pattern: /api\.deepseek\.com/i, envKey: "DEEPSEEK_API_KEY" },
  { pattern: /api\.together\.xyz/i, envKey: "TOGETHER_API_KEY" },
  { pattern: /api\.fireworks\.ai/i, envKey: "FIREWORKS_API_KEY" },
  { pattern: /api\.cerebras\.ai/i, envKey: "CEREBRAS_API_KEY" },
  { pattern: /api\.mistral\.ai/i, envKey: "MISTRAL_API_KEY" },
  { pattern: /api\.perplexity\.ai/i, envKey: "PERPLEXITY_API_KEY" },
];

export type ModelRoutingFields = {
  provider: string;
  model: string;
  baseUrl: string;
};

export function applyCustomEndpointEnv(
  env: Record<string, string>,
  profileEnv: Record<string, string>,
  routing: ModelRoutingFields,
): void {
  if (!LOCAL_PROVIDERS.has(routing.provider) || !routing.baseUrl) {
    return;
  }

  env.HERMES_INFERENCE_PROVIDER = "custom";
  env.OPENAI_BASE_URL = routing.baseUrl.replace(/\/+$/, "");

  let resolvedKey = "";
  for (const { pattern, envKey } of URL_KEY_MAP) {
    if (pattern.test(routing.baseUrl)) {
      resolvedKey = profileEnv[envKey] || env[envKey] || "";
      break;
    }
  }
  if (!resolvedKey) {
    resolvedKey =
      profileEnv.CUSTOM_API_KEY ||
      env.CUSTOM_API_KEY ||
      profileEnv.OPENAI_API_KEY ||
      env.OPENAI_API_KEY ||
      "";
  }
  if (!resolvedKey && /localhost|127\.0\.0\.1/i.test(routing.baseUrl)) {
    resolvedKey = "no-key-required";
  }
  env.OPENAI_API_KEY = resolvedKey || "no-key-required";

  delete env.OPENROUTER_API_KEY;
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_TOKEN;
  delete env.OPENROUTER_BASE_URL;
}
