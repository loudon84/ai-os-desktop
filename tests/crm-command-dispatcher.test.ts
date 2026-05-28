import { describe, expect, it, vi } from "vitest";
import { dispatchCrmCommand } from "../src/main/crm-bridge/crm-command-dispatcher";

describe("crm command dispatcher", () => {
  it("sends command to webContents when ready", () => {
    const send = vi.fn();
    const viewManager = {
      getExternalWebContents: () => ({ isDestroyed: () => false, send } as any),
    } as any;

    const result = dispatchCrmCommand(
      {
        commandId: "cmd_1",
        type: "desktop.crm.showToast",
        payload: { message: "hi" },
        createdAt: new Date().toISOString(),
      },
      viewManager,
    );

    expect(result.ok).toBe(true);
    expect(send).toHaveBeenCalled();
  });
});

