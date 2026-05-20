export interface LoginInput {
  username: string;
  password: string;
  tenantCode?: string;
}

export interface PublicAuthSession {
  userId: string;
  username: string;
  displayName: string;
  tenantId: string;
  tenantName?: string;
  accessTokenExpiresAt: string;
}

export interface InternalAuthSession extends PublicAuthSession {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthAPI {
  getSession(): Promise<PublicAuthSession | null>;
  login(input: LoginInput): Promise<PublicAuthSession>;
  logout(): Promise<void>;
  refresh(): Promise<PublicAuthSession | null>;
}

export function toPublicSession(session: InternalAuthSession): PublicAuthSession {
  return {
    userId: session.userId,
    username: session.username,
    displayName: session.displayName,
    tenantId: session.tenantId,
    tenantName: session.tenantName,
    accessTokenExpiresAt: session.accessTokenExpiresAt,
  };
}
