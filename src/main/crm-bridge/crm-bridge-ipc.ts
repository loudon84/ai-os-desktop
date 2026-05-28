import { ipcMain, type BrowserWindow } from "electron";
import type {
  CrmBridgeOnEventPayload,
  CrmBridgeResult,
  CrmBridgeStoredEvent,
} from "../../shared/crm-bridge/crm-bridge-contract";
import { CrmBridgeEvents } from "../../shared/crm-bridge/crm-bridge-contract";
import type { ValidateCrmBridgeEventSuccess } from "./crm-bridge-security";
import type { BrowserController } from "../browser/browser-controller";
import type { BrowserViewPort } from "../browser/browser-viewport";
import { validateCrmBridgeEvent } from "./crm-bridge-security";
import { routeCrmBridgeEvent } from "./crm-event-router";
import { dispatchCrmCommand } from "./crm-command-dispatcher";
import { insertCrmBridgeEvent, listCrmBridgeEvents, getLastCrmBridgeEvent } from "./crm-event-store";
import { logCrmBridgeAudit } from "./crm-bridge-audit";

export class CrmBridgeIPC {
  private registered = false;

  constructor(
    private readonly controller: BrowserController,
    private readonly viewManager: BrowserViewPort,
    private getMainWindow: () => BrowserWindow | null,
  ) {}

  register(): void {
    if (this.registered) return;

    ipcMain.handle("crm-bridge:emit", async (event, input) => {
      const validation = validateCrmBridgeEvent({
        sender: event.sender,
        frame: event.senderFrame,
        input,
        viewManager: this.viewManager,
      });

      if (!validation.ok) {
        const failed = validation as CrmBridgeResult;
        logCrmBridgeAudit({
          requestId: failed.requestId,
          action: "crm.event.rejected",
          status: "blocked",
          errorCode: failed.errorCode,
          message: failed.message,
        });
        return failed;
      }

      const { event: bridgeEvent, origin } = validation as ValidateCrmBridgeEventSuccess;

      const stored: CrmBridgeStoredEvent = {
        ...bridgeEvent,
        webContentsId: event.sender.id,
        origin,
        createdAt: new Date().toISOString(),
      };

      insertCrmBridgeEvent(stored);

      logCrmBridgeAudit({
        requestId: bridgeEvent.requestId,
        eventType: bridgeEvent.type,
        origin,
        url: bridgeEvent.page.url,
        entityType: bridgeEvent.page.entityType,
        entityId: bridgeEvent.page.entityId,
        action: "crm.event.received",
        status: "success",
      });

      const routeAction = await routeCrmBridgeEvent({
        sender: event.sender,
        event: bridgeEvent,
        controller: this.controller,
        mainWindow: this.getMainWindow(),
      });

      if (routeAction.ok) {
        logCrmBridgeAudit({
          requestId: bridgeEvent.requestId,
          eventType: bridgeEvent.type,
          action: "crm.event.routed",
          status: "success",
          message: routeAction.action,
        });
      } else {
        logCrmBridgeAudit({
          requestId: bridgeEvent.requestId,
          eventType: bridgeEvent.type,
          action: "crm.event.rejected",
          status: "failed",
          errorCode: "ROUTE_NOT_FOUND",
          message: routeAction.message,
        });
      }

      const payload: CrmBridgeOnEventPayload = {
        event: stored,
        routeAction,
      };

      const mainWindow = this.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(CrmBridgeEvents.ON_EVENT, payload);
      }

      return {
        ok: routeAction.ok,
        requestId: bridgeEvent.requestId,
        action: routeAction.action,
        message: routeAction.message,
      } satisfies CrmBridgeResult;
    });

    ipcMain.handle("crm-bridge:list-events", async (_event, limit = 20) => {
      return listCrmBridgeEvents(limit);
    });

    ipcMain.handle("crm-bridge:get-last-event", async () => {
      return getLastCrmBridgeEvent();
    });

    ipcMain.handle("crm-bridge:send-command", async (_event, command) => {
      const result = dispatchCrmCommand(command, this.viewManager);
      logCrmBridgeAudit({
        requestId: result.requestId,
        action: result.ok ? "crm.command.sent" : "crm.command.failed",
        status: result.ok ? "success" : "failed",
        errorCode: result.errorCode,
        message: result.message,
      });
      return result;
    });

    this.registered = true;
  }

  unregister(): void {
    if (!this.registered) return;
    const channels = [
      "crm-bridge:emit",
      "crm-bridge:list-events",
      "crm-bridge:get-last-event",
      "crm-bridge:send-command",
    ];
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    this.registered = false;
  }
}
