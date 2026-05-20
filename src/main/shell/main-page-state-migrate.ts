import type {
  MainPagePersistedStateV1,
  MainPagePersistedStateV2,
} from "../../shared/shell/main-page-state-contract";

const DEFAULT_V2: MainPagePersistedStateV2 = {
  version: 2,
  sidebarMode: "expanded",
  workspaceOrder: [],
  externalTabs: [],
};

export function migrateMainPageState(input: unknown): MainPagePersistedStateV2 {
  if (!input || typeof input !== "object") {
    return { ...DEFAULT_V2 };
  }

  const raw = input as Record<string, unknown>;

  if (raw.version === 2) {
    return normalizeV2(raw as Partial<MainPagePersistedStateV2>);
  }

  if (raw.version === 1) {
    return migrateV1ToV2(raw as Partial<MainPagePersistedStateV1>);
  }

  return { ...DEFAULT_V2 };
}

function migrateV1ToV2(v1: Partial<MainPagePersistedStateV1>): MainPagePersistedStateV2 {
  return {
    version: 2,
    sidebarMode: v1.sidebarMode ?? "expanded",
    workspaceOrder: Array.isArray(v1.tabOrder) ? v1.tabOrder : [],
    externalTabs: Array.isArray(v1.externalTabs) ? v1.externalTabs : [],
    lastActiveWorkspace: v1.lastActiveView,
    workspaceSecondaryState: {},
  };
}

function normalizeV2(raw: Partial<MainPagePersistedStateV2>): MainPagePersistedStateV2 {
  return {
    version: 2,
    sidebarMode: raw.sidebarMode ?? "expanded",
    workspaceOrder: Array.isArray(raw.workspaceOrder) ? raw.workspaceOrder : [],
    externalTabs: Array.isArray(raw.externalTabs) ? raw.externalTabs : [],
    lastActiveWorkspace: raw.lastActiveWorkspace,
    lastSettingsDrawerPanel: raw.lastSettingsDrawerPanel,
    workspaceSecondaryState:
      raw.workspaceSecondaryState && typeof raw.workspaceSecondaryState === "object"
        ? { ...raw.workspaceSecondaryState }
        : {},
  };
}
