import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { MainPagePersistedState } from "../../shared/shell/main-page-state-contract";
import { profileHome } from "../utils";

const DEFAULT_STATE: MainPagePersistedState = {
  version: 1,
  sidebarMode: "expanded",
  tabOrder: [],
  externalTabs: [],
};

/** Persists under ~/.hermes/desktop/ (aligned with other desktop shell state). */
function getStatePath(): string {
  const dir = join(profileHome(), "desktop");
  mkdirSync(dir, { recursive: true });
  return join(dir, "main-page-state.json");
}

export function readMainPageState(): MainPagePersistedState {
  try {
    const raw = JSON.parse(
      readFileSync(getStatePath(), "utf-8"),
    ) as Partial<MainPagePersistedState>;
    return {
      ...DEFAULT_STATE,
      ...raw,
      version: 1,
      externalTabs: Array.isArray(raw.externalTabs)
        ? raw.externalTabs
        : DEFAULT_STATE.externalTabs,
      tabOrder: Array.isArray(raw.tabOrder)
        ? raw.tabOrder
        : DEFAULT_STATE.tabOrder,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function writeMainPageState(state: MainPagePersistedState): void {
  writeFileSync(getStatePath(), JSON.stringify(state, null, 2), "utf-8");
}
