import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeneHubError } from "../src/shared/genehub/genehub-errors";

vi.mock("../src/main/genehub/genehub-backend-descriptor", () => ({
  fetchGeneHubDescriptor: vi.fn(async () => ({
    ok: true,
    descriptor: {
      enabled: true,
      name: "GeneHub",
      apiPrefix: "/api/v1/desktop",
      healthEndpoint: "/api/v1/desktop/genehub/health",
      requiresAuth: true,
      apiBaseUrl: "http://127.0.0.1:4510/api/v1/desktop",
      backendBaseUrl: "http://127.0.0.1:4510",
    },
  })),
}));

vi.mock("../src/main/genehub/genehub-auth", () => ({
  getGeneHubAccessToken: () => "token",
}));

import { listAuthorizedSkills } from "../src/main/genehub/genehub-client";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("genehub-client", () => {
  it("maps 401 to GENEHUB_NOT_AUTHENTICATED", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ code: 401, message: "unauthorized", data: null }),
      })) as typeof fetch,
    );

    await expect(listAuthorizedSkills("default")).rejects.toMatchObject({
      code: "GENEHUB_NOT_AUTHENTICATED",
    } satisfies Partial<GeneHubError>);
  });
});
