import { getAiOsEnvConfig } from "../aios/aios-config";
import type {
  InternalAuthSession,
  LoginInput,
  PublicAuthSession,
} from "../../shared/auth/auth-contract";
import { toPublicSession } from "../../shared/auth/auth-contract";

export interface AuthClient {
  login(input: LoginInput): Promise<InternalAuthSession>;
  refresh(refreshToken: string): Promise<InternalAuthSession>;
  logout(accessToken: string): Promise<void>;
}

function useMockAuth(): boolean {
  return process.env.HERMES_USE_MOCK_AUTH !== "false";
}

class MockAuthClient implements AuthClient {
  async login(input: LoginInput): Promise<InternalAuthSession> {
    if (!input.username.trim()) {
      throw new Error("Username is required");
    }
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return {
      userId: "mock-user-1",
      username: input.username,
      displayName: input.username,
      tenantId: input.tenantCode ?? "default-tenant",
      tenantName: "Mock Tenant",
      accessTokenExpiresAt: expires,
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    };
  }

  async refresh(refreshToken: string): Promise<InternalAuthSession> {
    if (!refreshToken) throw new Error("Missing refresh token");
    return this.login({ username: "mock", password: "" });
  }

  async logout(_accessToken: string): Promise<void> {
    /* mock */
  }
}

class HttpAuthClient implements AuthClient {
  private baseUrl(): string {
    const config = getAiOsEnvConfig();
    return `http://127.0.0.1:${config.backendPort}`;
  }

  async login(input: LoginInput): Promise<InternalAuthSession> {
    const res = await fetch(`${this.baseUrl()}/api/v1/desktop/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(`Login failed: ${res.status}`);
    }
    return (await res.json()) as InternalAuthSession;
  }

  async refresh(refreshToken: string): Promise<InternalAuthSession> {
    const res = await fetch(`${this.baseUrl()}/api/v1/desktop/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      throw new Error(`Refresh failed: ${res.status}`);
    }
    return (await res.json()) as InternalAuthSession;
  }

  async logout(accessToken: string): Promise<void> {
    await fetch(`${this.baseUrl()}/api/v1/desktop/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}

let client: AuthClient | null = null;

export function getAuthClient(): AuthClient {
  if (!client) {
    client = useMockAuth() ? new MockAuthClient() : new HttpAuthClient();
  }
  return client;
}

export function getPublicSessionFromStore(
  session: InternalAuthSession | null,
): PublicAuthSession | null {
  if (!session) return null;
  return toPublicSession(session);
}
