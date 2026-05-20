import { describe, expect, it } from "vitest";
import {
  toPublicSession,
  type InternalAuthSession,
} from "../src/shared/auth/auth-contract";

describe("toPublicSession", () => {
  it("strips access and refresh tokens from internal session", () => {
    const internal: InternalAuthSession = {
      userId: "u1",
      username: "alice",
      displayName: "Alice",
      tenantId: "t1",
      tenantName: "Tenant",
      accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
      accessToken: "secret-access",
      refreshToken: "secret-refresh",
    };

    const pub = toPublicSession(internal);
    expect(pub).toEqual({
      userId: "u1",
      username: "alice",
      displayName: "Alice",
      tenantId: "t1",
      tenantName: "Tenant",
      accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
    });
    expect(pub).not.toHaveProperty("accessToken");
    expect(pub).not.toHaveProperty("refreshToken");
  });
});
