import { describe, expect, it, vi, beforeEach } from "vitest";

const listModelsMock = vi.fn();

vi.mock("../src/main/models", () => ({
  listModels: () => listModelsMock(),
}));

import { buildGatewayChatCompletionsBody } from "../src/main/hermes-default-chat/hermes-default-chat-request";

describe("buildGatewayChatCompletionsBody", () => {
  beforeEach(() => {
    listModelsMock.mockReturnValue([
      {
        id: "uuid-deepseek",
        name: "deepseek-v4-flash",
        provider: "custom",
        model: "deepseek-v4-flash",
        baseUrl: "https://api.deepseek.com/v1",
        createdAt: 1,
      },
    ]);
  });

  it("uses API server model name in body; LLM id comes from config sync", () => {
    const body = buildGatewayChatCompletionsBody(
      [{ role: "user", content: "hi" }],
      undefined,
      "uuid-deepseek",
      "hermes-agent",
    );
    expect(body.model).toBe("hermes-agent");
    expect(body.provider).toBe("custom");
    expect(body.base_url).toBe("https://api.deepseek.com/v1");
    expect(body.stream).toBe(true);
  });

  it("falls back to API server model when model_id is absent", () => {
    const body = buildGatewayChatCompletionsBody(
      [{ role: "user", content: "hi" }],
      undefined,
      undefined,
      "hermes-agent",
    );
    expect(body.model).toBe("hermes-agent");
    expect(body.provider).toBeUndefined();
    expect(body.base_url).toBeUndefined();
  });
});
