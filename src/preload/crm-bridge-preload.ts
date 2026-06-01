import { contextBridge, ipcRenderer } from "electron";
import { CrmBridgeEvents } from "../shared/crm-bridge/crm-bridge-contract";

console.info("[CRM-BRIDGE-PRELOAD] script evaluating");

const SDK_SOURCE = "copilot-crm-jssdk";
const DESKTOP_SOURCE = "copilot-desktop";
const EVENT_CHANNEL = "crm.desktop.bridge";
const COMMAND_CHANNEL = "crm.desktop.command";
const COMMAND_RESULT_CHANNEL = "crm.desktop.command.result";
const READY_CHANNEL = "crm.desktop.ready";
const USER_GESTURE_WINDOW_MS = 1500;
const BRIDGE_VERSION = "0.2.0";

let lastTrustedClickAt = 0;

window.addEventListener(
  "click",
  (event) => {
    if (event.isTrusted) {
      lastTrustedClickAt = Date.now();
    }
  },
  true,
);

function hasRecentTrustedGesture(): boolean {
  return Date.now() - lastTrustedClickAt <= USER_GESTURE_WINDOW_MS;
}

function assertTrustedGesture(): void {
  if (!hasRecentTrustedGesture()) {
    throw new Error("USER_GESTURE_REQUIRED");
  }
}

async function emit(event: unknown): Promise<{ ok: boolean; message?: string }> {
  try {
    assertTrustedGesture();
    return await ipcRenderer.invoke("crm-bridge:emit", {
      event,
      location: {
        href: window.location.href,
        origin: window.location.origin,
        title: document.title,
      },
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function emitReady(event: unknown): Promise<{ ok: boolean; message?: string }> {
  try {
    return await ipcRenderer.invoke("crm-bridge:emit", {
      event,
      location: {
        href: window.location.href,
        origin: window.location.origin,
        title: document.title,
      },
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function submitProductContext(
  product: Record<string, unknown>,
  options?: { triggerElementId?: string; triggerLabel?: string },
): Promise<{ ok: boolean; message?: string }> {
  const event = {
    source: "crm-web",
    sdkVersion: BRIDGE_VERSION,
    requestId: `req_${Date.now()}`,
    type: "crm.product.context.submit",
    trigger: {
      type: "user-click",
      elementId: options?.triggerElementId,
      label: options?.triggerLabel,
      timestamp: new Date().toISOString(),
    },
    page: {
      app: "crm-lite",
      entityType: "product",
      entityId: typeof product.id === "string" ? product.id : undefined,
      entityName: typeof product.productName === "string" ? product.productName : undefined,
      url: window.location.href,
      title: document.title,
    },
    payload: { product },
  };
  return emit(event);
}

contextBridge.exposeInMainWorld("CopilotDesktopCRM", {
  version: BRIDGE_VERSION,
  isAvailable: () => true,
  emit,
  emitReady,
});

contextBridge.exposeInMainWorld("CopilotCrmDesktopSDK", {
  version: BRIDGE_VERSION,
  isAvailable: () => true,
  submitProductContext,
});

window.addEventListener("message", (messageEvent) => {
  if (messageEvent.origin !== window.location.origin) return;

  const data = messageEvent.data as {
    source?: string;
    channel?: string;
    event?: unknown;
    result?: unknown;
  } | null;

  if (!data || data.source !== SDK_SOURCE) return;

  if (data.channel === EVENT_CHANNEL && data.event) {
    void emit(data.event);
    return;
  }

  if (data.channel === "crm.desktop.ready" && data.event) {
    void emitReady(data.event);
    return;
  }

  if (data.channel === COMMAND_RESULT_CHANNEL && data.result) {
    void ipcRenderer.invoke("crm-bridge:command-result", data.result);
  }
});

ipcRenderer.on(CrmBridgeEvents.COMMAND, (_event, command) => {
  window.postMessage(
    {
      source: DESKTOP_SOURCE,
      channel: COMMAND_CHANNEL,
      version: BRIDGE_VERSION,
      command,
      replyRequired: Boolean(
        command &&
          typeof command === "object" &&
          "expectAck" in command &&
          (command as { expectAck?: boolean }).expectAck,
      ),
    },
    window.location.origin,
  );
});

window.postMessage(
  {
    source: DESKTOP_SOURCE,
    channel: READY_CHANNEL,
    version: BRIDGE_VERSION,
  },
  window.location.origin,
);
