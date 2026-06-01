/**
 * CRM-Lite demo page SDK (V5.7.10).
 * Page script + optional Main injector (crm-lite-jssdk.js) share this implementation.
 */
(function () {
  "use strict";

  if (window.__copilotCrmLiteJssdkLoaded) return;
  window.__copilotCrmLiteJssdkLoaded = true;

  var DESKTOP_SOURCE = "copilot-desktop";
  var SDK_SOURCE = "copilot-crm-jssdk";
  var COMMAND_CHANNEL = "crm.desktop.command";
  var COMMAND_RESULT_CHANNEL = "crm.desktop.command.result";
  var commandHandlers = [];

  function isBridgeAvailable() {
    return !!(
      window.CopilotDesktopCRM &&
      typeof window.CopilotDesktopCRM.isAvailable === "function" &&
      window.CopilotDesktopCRM.isAvailable()
    );
  }

  function notifyBridgeStatus() {
    var available = isBridgeAvailable();
    window.dispatchEvent(
      new CustomEvent("crm-lite:bridge-status", {
        detail: { available: available, mode: available ? "electron" : "browser" },
      }),
    );
    return available;
  }

  function setReceiverLog(text) {
    var el =
      document.getElementById("bridgeLog") ||
      document.getElementById("electronBridgeLog") ||
      document.querySelector("[data-electron-bridge-log]");
    if (el) el.textContent = text;
  }

  function fillInput(name, value) {
    if (value === undefined || value === null) return;
    var el =
      document.querySelector('[name="' + name + '"]') ||
      document.getElementById(name) ||
      document.querySelector('[data-field="' + name + '"]');
    if (!el) return;
    if ("value" in el) el.value = String(value);
  }

  function fillProductForm(product) {
    if (!product || typeof product !== "object") return;
    var fields = [
      "sku",
      "brand",
      "model",
      "productName",
      "series",
      "os",
      "chipset",
      "screenSize",
      "ram",
      "storage",
      "color",
      "batteryMah",
      "network",
      "retailPrice",
      "status",
      "launchDate",
      "description",
    ];
    for (var i = 0; i < fields.length; i++) {
      fillInput(fields[i], product[fields[i]]);
    }
    window.dispatchEvent(
      new CustomEvent("crm-lite:product-filled", { detail: { product: product } }),
    );
  }

  function renderSuppliers(suppliers) {
    var container =
      document.getElementById("supplierRows") ||
      document.getElementById("supplierTableBody") ||
      document.querySelector("[data-supplier-table-body]");
    if (!container || !Array.isArray(suppliers)) return;
    container.innerHTML = suppliers
      .map(function (row) {
        return (
          "<tr><td>" +
          (row.supplierName || row.supplierId || "") +
          "</td><td>" +
          (row.supplyPrice ?? "") +
          "</td><td>" +
          (row.stockQty ?? "") +
          "</td></tr>"
        );
      })
      .join("");
  }

  function parseApiBody(body) {
    if (body && typeof body === "object" && body.data && typeof body.data === "object") {
      return body.data;
    }
    return body;
  }

  async function createProduct(product) {
    fillProductForm(product);
    var res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      throw new Error("POST /api/products failed: " + res.status);
    }
    var body = await res.json();
    var saved = parseApiBody(body);
    return saved;
  }

  function postCommandAck(command, result, ok, errMessage) {
    window.postMessage(
      {
        source: SDK_SOURCE,
        channel: COMMAND_RESULT_CHANNEL,
        result: {
          commandId: command.commandId,
          ok: ok,
          type: command.type,
          action: result && result.action,
          data: result && result.data,
          message: errMessage,
          errorCode: ok ? undefined : "COMMAND_FAILED",
          receivedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      },
      window.location.origin,
    );
  }

  async function handleDesktopCommand(command) {
    var type = command && command.type;
    var product = command && command.payload && command.payload.product;
    setReceiverLog(JSON.stringify(command, null, 2));

    if (type === "desktop.crm.product.fillForm") {
      fillProductForm(product);
      return { ok: true, action: "crm.product.fillForm" };
    }

    if (type === "desktop.crm.product.create") {
      var data = await createProduct(product);
      return { ok: true, action: "crm.product.create", data: data };
    }

    throw new Error("unsupported command: " + type);
  }

  function dispatchCommandToHandlers(command) {
    for (var i = 0; i < commandHandlers.length; i++) {
      void Promise.resolve(commandHandlers[i](command)).catch(function (err) {
        setReceiverLog("onCommand error: " + (err && err.message ? err.message : String(err)));
      });
    }
  }

  function onCommand(handler) {
    if (typeof handler !== "function") return function () {};
    commandHandlers.push(handler);
    return function () {
      commandHandlers = commandHandlers.filter(function (item) {
        return item !== handler;
      });
    };
  }

  function mockElectronCommand(command) {
    window.postMessage(
      { source: DESKTOP_SOURCE, channel: COMMAND_CHANNEL, command: command },
      window.location.origin,
    );
  }

  function submitProductContext(product, options) {
    if (!window.CopilotDesktopCRM || typeof window.CopilotDesktopCRM.emit !== "function") {
      window.postMessage(
        {
          source: SDK_SOURCE,
          channel: "crm.desktop.bridge",
          event: {
            source: "crm-web",
            sdkVersion: "0.2.0",
            requestId: "req_" + Date.now(),
            type: "crm.product.context.submit",
            trigger: {
              type: "user-click",
              elementId: options && options.triggerElementId,
              label: options && options.triggerLabel,
              timestamp: new Date().toISOString(),
            },
            page: {
              app: "crm-lite",
              entityType: "product",
              entityId: product && product.id,
              entityName: product && product.productName,
              url: window.location.href,
              title: document.title,
            },
            payload: { product: product },
          },
        },
        window.location.origin,
      );
      return Promise.resolve({
        ok: false,
        bridge: "postMessage-fallback",
        message: "Electron preload bridge not detected; postMessage fallback emitted for local testing.",
      });
    }
    var event = {
      source: "crm-web",
      sdkVersion: window.CopilotDesktopCRM.version || "0.2.0",
      requestId: "req_" + Date.now(),
      type: "crm.product.context.submit",
      trigger: {
        type: "user-click",
        elementId: options && options.triggerElementId,
        label: options && options.triggerLabel,
        timestamp: new Date().toISOString(),
      },
      page: {
        app: "crm-lite",
        entityType: "product",
        entityId: product && product.id,
        entityName: product && product.productName,
        url: window.location.href,
        title: document.title,
      },
      payload: { product: product },
    };
    return window.CopilotDesktopCRM.emit(event);
  }

  window.addEventListener("crm-lite:desktop-command", function (event) {
    var command = event && event.detail;
    if (!command) return;
    dispatchCommandToHandlers(command);
    void handleDesktopCommand(command).catch(function (err) {
      setReceiverLog("command error: " + (err && err.message ? err.message : String(err)));
    });
  });

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    var msg = event.data;
    if (!msg || msg.source !== DESKTOP_SOURCE || msg.channel !== COMMAND_CHANNEL) return;
    if (!msg.command) return;

    dispatchCommandToHandlers(msg.command);

    void handleDesktopCommand(msg.command)
      .then(function (result) {
        setReceiverLog("command ok: " + (msg.command.type || "") + "\n" + JSON.stringify(result, null, 2));
        if (msg.replyRequired) {
          postCommandAck(msg.command, result, true);
        }
        if (
          msg.command.type === "desktop.crm.product.create" &&
          result &&
          result.data &&
          result.data.id
        ) {
          setTimeout(function () {
            window.location.href =
              "/product-view.html?id=" + encodeURIComponent(String(result.data.id));
          }, 200);
        }
      })
      .catch(function (err) {
        var message = err && err.message ? err.message : String(err);
        setReceiverLog("command error: " + message);
        if (msg.replyRequired) {
          postCommandAck(msg.command, null, false, message);
        }
      });
  });

  window.CopilotCrmDesktopSDK = {
    version: (window.CopilotDesktopCRM && window.CopilotDesktopCRM.version) || "0.2.0",
    isAvailable: isBridgeAvailable,
    isDesktopAvailable: isBridgeAvailable,
    submitProductContext: submitProductContext,
    onCommand: onCommand,
    mockElectronCommand: mockElectronCommand,
  };

  notifyBridgeStatus();
  window.addEventListener("focus", notifyBridgeStatus);
  setTimeout(notifyBridgeStatus, 100);
  setTimeout(notifyBridgeStatus, 500);
})();
