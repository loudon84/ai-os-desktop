import { describe, expect, it } from "vitest";
import { validateCrmBridgeEventSchema } from "../src/shared/crm-bridge";

describe("crm bridge schema", () => {
  it("accepts valid event", () => {
    const raw = {
      source: "crm-web",
      sdkVersion: "0.1.0",
      requestId: "req_1",
      type: "crm.context.submit",
      trigger: { type: "user-click", timestamp: new Date().toISOString() },
      page: { app: "crm", url: "https://crm.company.com/customer/1001" },
      payload: { foo: "bar" },
    };
    const result = validateCrmBridgeEventSchema(raw);
    expect(result.ok).toBe(true);
    expect(result.event?.requestId).toBe("req_1");
  });

  it("rejects invalid source", () => {
    const result = validateCrmBridgeEventSchema({ source: "x" });
    expect(result.ok).toBe(false);
  });

  it("rejects missing user-click trigger", () => {
    const raw = {
      source: "crm-web",
      sdkVersion: "0.1.0",
      requestId: "req_1",
      type: "crm.context.submit",
      trigger: { type: "system", timestamp: new Date().toISOString() },
      page: { app: "crm", url: "https://crm.company.com/customer/1001" },
    };
    const result = validateCrmBridgeEventSchema(raw);
    expect(result.ok).toBe(false);
  });

  it("accepts crm.page.ready without user-click trigger", () => {
    const raw = {
      source: "crm-web",
      sdkVersion: "0.3.0",
      requestId: "req_ready",
      type: "crm.page.ready",
      page: { app: "crm", url: "https://crm.company.com/leads/1001" },
      payload: { capabilities: ["pushJson", "runAction"] },
    };
    const result = validateCrmBridgeEventSchema(raw);
    expect(result.ok).toBe(true);
    expect(result.event?.type).toBe("crm.page.ready");
  });
});

