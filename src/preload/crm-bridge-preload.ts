import { contextBridge, ipcRenderer } from "electron";

const SDK_SOURCE = "copilot-crm-jssdk";
const EVENT_CHANNEL = "crm.desktop.bridge";
const COMMAND_CHANNEL = "crm.desktop.command";
const USER_GESTURE_WINDOW_MS = 1500;
const BRIDGE_VERSION = "0.1.0";

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

contextBridge.exposeInMainWorld("CopilotDesktopCRM", {
  version: BRIDGE_VERSION,
  isAvailable: () => true,
  emit,
});

window.addEventListener("message", (messageEvent) => {
  if (messageEvent.origin !== window.location.origin) return;

  const data = messageEvent.data as {
    source?: string;
    channel?: string;
    event?: unknown;
  } | null;

  if (!data || data.source !== SDK_SOURCE) return;
  if (data.channel !== EVENT_CHANNEL) return;
  if (!data.event) return;

  void emit(data.event);
});

ipcRenderer.on("crm-bridge:command", (_event, command) => {
  window.postMessage(
    {
      source: "copilot-desktop",
      channel: COMMAND_CHANNEL,
      version: BRIDGE_VERSION,
      command,
    },
    window.location.origin,
  );
});
