/**
 * CRM-Lite demo page SDK (V5.7.10).
 * Loaded by Main injector on web-operator navigations to allowed crm-lite origins.
 * Requires preload `CopilotDesktopCRM` / `CopilotCrmDesktopSDK`.
 */
(function () {
  "use strict";

  if (window.__copilotCrmLiteJssdkLoaded) return;
  window.__copilotCrmLiteJssdkLoaded = true;

  var DESKTOP_SOURCE = "copilot-desktop";
  var COMMAND_CHANNEL = "crm.desktop.command";

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

  async function createProduct(product) {
    fillProductForm(product);
    renderSuppliers(product.suppliers);
    var res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      throw new Error("POST /api/products failed: " + res.status);
    }
    var data = await res.json();
    var id = data && (data.id || data.productId);
    if (id) {
      window.location.href = "/product-view.html?id=" + encodeURIComponent(String(id));
    }
    return data;
  }

  async function handleDesktopCommand(command) {
    var type = command && command.type;
    var product = command && command.payload && command.payload.product;
    setReceiverLog(JSON.stringify(command, null, 2));

    if (type === "desktop.crm.product.fillForm") {
      fillProductForm(product);
      renderSuppliers(product && product.suppliers);
      return { ok: true, action: "crm.product.fillForm" };
    }

    if (type === "desktop.crm.product.create") {
      var data = await createProduct(product);
      return { ok: true, action: "crm.product.create", data: data };
    }

    throw new Error("unsupported command: " + type);
  }

  window.addEventListener("crm-lite:desktop-command", function (event) {
    var command = event && event.detail;
    if (!command) return;
    void handleDesktopCommand(command).catch(function (err) {
      setReceiverLog("command error: " + (err && err.message ? err.message : String(err)));
    });
  });

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    var msg = event.data;
    if (!msg || msg.source !== DESKTOP_SOURCE || msg.channel !== COMMAND_CHANNEL) return;
    if (!msg.command) return;

    void handleDesktopCommand(msg.command)
      .then(function (result) {
        setReceiverLog("command ok: " + (msg.command.type || "") + "\n" + JSON.stringify(result, null, 2));
        if (msg.replyRequired && window.CopilotDesktopCRM) {
          window.postMessage(
            {
              source: "copilot-crm-jssdk",
              channel: "crm.desktop.command.result",
              result: {
                commandId: msg.command.commandId,
                ok: true,
                type: msg.command.type,
                action: result.action,
                data: result.data,
                receivedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
              },
            },
            window.location.origin,
          );
        }
      })
      .catch(function (err) {
        setReceiverLog("command error: " + (err && err.message ? err.message : String(err)));
      });
  });

  if (!window.CopilotCrmDesktopSDK && window.CopilotDesktopCRM) {
    window.CopilotCrmDesktopSDK = {
      version: window.CopilotDesktopCRM.version,
      isAvailable: function () {
        return isBridgeAvailable();
      },
      submitProductContext: function (product, options) {
        if (!window.CopilotDesktopCRM || typeof window.CopilotDesktopCRM.emit !== "function") {
          return Promise.resolve({ ok: false, message: "CopilotDesktopCRM.emit missing" });
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
      },
    };
  }

  notifyBridgeStatus();
  window.addEventListener("focus", notifyBridgeStatus);
  setTimeout(notifyBridgeStatus, 100);
  setTimeout(notifyBridgeStatus, 500);
})();
