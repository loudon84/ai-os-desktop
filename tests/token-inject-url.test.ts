import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/main/aios/aios-config", () => ({
  getAiOsEnvConfig: vi.fn(() => ({
    backendPort: 9001,
    frontendPort: 4001,
    databaseUrl: "",
    hermesGatewayUrl: "http://127.0.0.1:8642",
    hermesGatewayToken: "",
    hermesWebuiUrl: "",
  })),
}));

import { shouldInjectTokenForUrl, getTokenInjectPorts } from "../src/main/auth/token-inject-url";

describe("shouldInjectTokenForUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows configured frontend and backend ports on localhost", () => {
    expect(getTokenInjectPorts()).toEqual(new Set([4001, 9001]));
    expect(shouldInjectTokenForUrl("http://127.0.0.1:4001/")).toBe(true);
    expect(shouldInjectTokenForUrl("http://localhost:9001/api")).toBe(true);
  });

  it("rejects gateway and external ports", () => {
    expect(shouldInjectTokenForUrl("http://127.0.0.1:8642/health")).toBe(false);
    expect(shouldInjectTokenForUrl("http://127.0.0.1:8080/")).toBe(false);
  });

  it("rejects non-local hosts", () => {
    expect(shouldInjectTokenForUrl("https://example.com:4001/")).toBe(false);
  });
});
