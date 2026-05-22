import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDefaultAuthEndpointConfig } from "../src/shared/auth/auth-url";

describe("HttpAuthClient login payload", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.HERMES_USE_MOCK_AUTH;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it("posts email/password to Portal auth login", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, string>;
      expect(body).toEqual({ email: "user@example.com", password: "secret" });
      expect(body).not.toHaveProperty("username");

      return new Response(
        JSON.stringify({
          access_token: "access-1",
          refresh_token: "refresh-1",
          user: { id: "u1", email: "user@example.com", displayName: "User" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const { getAuthClient } = await import("../src/main/auth/auth-client");
    const session = await getAuthClient().login({
      endpointConfig: getDefaultAuthEndpointConfig(),
      email: "user@example.com",
      password: "secret",
    });

    expect(session.accessToken).toBe("access-1");
    expect(session.refreshToken).toBe("refresh-1");
    expect(session.user.username).toBe("user@example.com");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("posts refresh_token for refresh", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, string>;
      expect(body).toEqual({ refresh_token: "refresh-1" });

      return new Response(
        JSON.stringify({
          access_token: "access-2",
          refresh_token: "refresh-2",
          user: { id: "u1", email: "user@example.com" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const { getAuthClient } = await import("../src/main/auth/auth-client");
    const session = await getAuthClient().refresh(
      getDefaultAuthEndpointConfig(),
      "refresh-1",
    );

    expect(session.accessToken).toBe("access-2");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/auth/refresh",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
