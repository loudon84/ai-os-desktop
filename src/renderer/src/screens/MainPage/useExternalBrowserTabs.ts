import { useCallback, useState } from "react";
import type { View } from "../../types/desktop-shell";
import type { ExternalBrowserTab } from "./main-page-types";

function createTabId(): `external-browser:${string}` {
  return `external-browser:${crypto.randomUUID()}`;
}

function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname || "External";
  } catch {
    return "External";
  }
}

export function useExternalBrowserTabs() {
  const [tabs, setTabs] = useState<ExternalBrowserTab[]>([]);

  const openExternalTab = useCallback(async (url: string): Promise<View> => {
    const id = createTabId();
    const now = Date.now();
    const normalizedUrl = url.trim();

    const tab: ExternalBrowserTab = {
      id,
      title: titleFromUrl(normalizedUrl),
      url: normalizedUrl,
      createdAt: now,
      updatedAt: now,
    };

    await window.shellView.create(id, "external-browser", normalizedUrl, {
      layer: "content",
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    });

    setTabs((prev) => [...prev, tab]);
    return id;
  }, []);

  const closeExternalTab = useCallback(async (id: `external-browser:${string}`) => {
    await window.shellView.destroy(id);
    setTabs((prev) => prev.filter((tab) => tab.id !== id));
  }, []);

  const reloadExternalTab = useCallback(async (tab: ExternalBrowserTab) => {
    await window.shellView.loadUrl(tab.id, tab.url);
    setTabs((prev) =>
      prev.map((item) =>
        item.id === tab.id ? { ...item, updatedAt: Date.now() } : item,
      ),
    );
  }, []);

  return {
    externalTabs: tabs,
    openExternalTab,
    closeExternalTab,
    reloadExternalTab,
  };
}
