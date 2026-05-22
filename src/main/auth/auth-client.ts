import type {
  AuthEndpointConfig,
  LoginInput,
  StoredAuthSession,
} from "../../shared/auth/auth-contract";
import { buildAuthUrl } from "./auth-url";

export interface AuthClient {
  login(input: LoginInput): Promise<StoredAuthSession>;
  refresh(
    endpointConfig: AuthEndpointConfig,
    refreshToken: string,
  ): Promise<StoredAuthSession>;
  logout(endpointConfig: AuthEndpointConfig, accessToken: string): Promise<void>;
}

/** Only Vitests/debug pipelines explicitly set `HERMES_USE_MOCK_AUTH=true`; Desktop Login otherwise always uses HTTP against your configured Portal backend + authPrefix. */
function useMockAuth(): boolean {
  return process.env.HERMES_USE_MOCK_AUTH === "true";
}

interface LoginResponseUser {
  id?: string;
  userId?: string;
  username?: string;
  email?: string;
  displayName?: string;
  tenantId?: string;
}

interface LoginResponseBody {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  expiresAt?: string;
  expires_at?: string;
  tokenType?: string;
  token_type?: string;
  user?: LoginResponseUser;
}

class MockAuthClient implements AuthClient {
  async login(input: LoginInput): Promise<StoredAuthSession> {
    if (!input.email.trim()) {
      throw new Error("Email is required");
    }
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return {
      user: {
        id: "mock-user-1",
        username: input.email,
        displayName: input.email,
        tenantId: "default-tenant",
      },
      expiresAt: expires,
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      tokenType: "Bearer",
    };
  }

  async refresh(
    _endpointConfig: AuthEndpointConfig,
    refreshToken: string,
  ): Promise<StoredAuthSession> {
    if (!refreshToken) throw new Error("Missing refresh token");
    return this.login({ endpointConfig: _endpointConfig, email: "mock@example.com", password: "" });
  }

  async logout(_endpointConfig: AuthEndpointConfig, _accessToken: string): Promise<void> {
    /* mock */
  }
}

function formatAuthError(status: number, text: string): string {
  if (!text) return `Login failed: ${status}`;
  try {
    const parsed = JSON.parse(text) as { message?: string; code?: string };
    if (parsed.message) {
      return parsed.message;
    }
  } catch {
    /* fall through */
  }
  return `Login failed: ${status} — ${text}`;
}

class HttpAuthClient implements AuthClient {
  async login(input: LoginInput): Promise<StoredAuthSession> {
    const url = buildAuthUrl(input.endpointConfig, "login");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email.trim(),
        password: input.password,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(formatAuthError(res.status, text));
    }
    const body = (await res.json()) as LoginResponseBody;
    return mapLoginResponse(body);
  }

  async refresh(
    endpointConfig: AuthEndpointConfig,
    refreshToken: string,
  ): Promise<StoredAuthSession> {
    const url = buildAuthUrl(endpointConfig, "refresh");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(formatAuthError(res.status, text));
    }
    const body = (await res.json()) as LoginResponseBody;
    return mapLoginResponse(body);
  }

  async logout(endpointConfig: AuthEndpointConfig, accessToken: string): Promise<void> {
    const url = buildAuthUrl(endpointConfig, "logout");
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch(() => {
      /* best-effort */
    });
  }
}

function mapLoginResponse(body: LoginResponseBody): StoredAuthSession {
  const accessToken = body.accessToken ?? body.access_token;
  const user = body.user;
  const userId = user?.id ?? user?.userId;
  const username = user?.username ?? user?.email;

  if (!accessToken || !userId || !username) {
    throw new Error("Invalid login response from server");
  }

  return {
    accessToken,
    refreshToken: body.refreshToken ?? body.refresh_token,
    expiresAt: body.expiresAt ?? body.expires_at,
    tokenType: "Bearer",
    user: {
      id: userId,
      username,
      displayName: user?.displayName,
      tenantId: user?.tenantId,
    },
  };
}

let client: AuthClient | null = null;

export function getAuthClient(): AuthClient {
  if (!client) {
    client = useMockAuth() ? new MockAuthClient() : new HttpAuthClient();
  }
  return client;
}
