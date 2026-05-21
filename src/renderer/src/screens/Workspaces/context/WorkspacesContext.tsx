import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { workspacesApi } from "../api/workspacesApi";
import { STORAGE_KEYS, type NavItemKey } from "../constants";
import { useProfileRuntime, type ProfileRuntimeHandle } from "../hooks/useProfileRuntime";
import { useProfileSessions } from "../hooks/useProfileSessions";
import type { AIOSProfile, AIOSSession, RightInspectorTab } from "../types";

export interface WorkspacesContextValue {
  activeProfileId: string | null;
  activeSessionId: string | null;
  activeRightTab: RightInspectorTab;
  rightPanelCollapsed: boolean;
  activeNavItem: NavItemKey;
  profiles: AIOSProfile[];
  setProfiles: Dispatch<SetStateAction<AIOSProfile[]>>;
  setActiveProfileId: (id: string | null) => void;
  setActiveSessionId: (id: string | null) => void;
  setActiveRightTab: (tab: RightInspectorTab) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  setActiveNavItem: (key: NavItemKey) => void;
  activeProfile: AIOSProfile | null;
  sessionsRefreshNonce: number;
  refreshSessions: () => void;
  runtime: ProfileRuntimeHandle;
  sessions: AIOSSession[];
  sessionsLoading: boolean;
  sessionsKeyword: string;
  setSessionsKeyword: (keyword: string) => void;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

const WorkspacesContext = createContext<WorkspacesContextValue | null>(null);

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export interface WorkspacesProviderProps {
  children: ReactNode;
  initialProfileId?: string;
}

export function WorkspacesProvider({
  children,
  initialProfileId,
}: WorkspacesProviderProps): React.JSX.Element {
  const [profiles, setProfiles] = useState<AIOSProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => {
    return readStorage(STORAGE_KEYS.activeProfileId) ?? initialProfileId ?? null;
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeRightTab, setActiveRightTabState] = useState<RightInspectorTab>(() => {
    const saved = readStorage(STORAGE_KEYS.activeRightTab);
    if (saved === "workspace" || saved === "skills" || saved === "memory" || saved === "runtime") {
      return saved;
    }
    return "runtime";
  });
  const [rightPanelCollapsed, setRightPanelCollapsedState] = useState(() => {
    return readStorage(STORAGE_KEYS.collapsedRightPanel) === "true";
  });
  const [sessionsRefreshNonce, setSessionsRefreshNonce] = useState(0);
  const [sessionsKeyword, setSessionsKeyword] = useState("");
  const [activeNavItem, setActiveNavItemState] = useState<NavItemKey>(() => {
    const saved = readStorage(STORAGE_KEYS.activeNavItem);
    if (
      saved === "chat" || saved === "sessions" || saved === "skills" || saved === "tools" ||
      saved === "memory" || saved === "providers" || saved === "models" || saved === "settings"
    ) {
      return saved;
    }
    return "chat";
  });

  const refreshSessions = useCallback(() => {
    setSessionsRefreshNonce((n) => n + 1);
  }, []);

  const runtime = useProfileRuntime(activeProfileId, profiles, setProfiles);
  const sessionsHandle = useProfileSessions(activeProfileId, sessionsKeyword, sessionsRefreshNonce);

  const setActiveProfileId = useCallback((id: string | null) => {
    void workspacesApi.abortChat();
    setActiveProfileIdState(id);
    if (id) writeStorage(STORAGE_KEYS.activeProfileId, id);
    setActiveSessionId(null);
    setSessionsKeyword("");
  }, []);

  const setActiveRightTab = useCallback((tab: RightInspectorTab) => {
    setActiveRightTabState(tab);
    writeStorage(STORAGE_KEYS.activeRightTab, tab);
  }, []);

  const setRightPanelCollapsed = useCallback((collapsed: boolean) => {
    setRightPanelCollapsedState(collapsed);
    writeStorage(STORAGE_KEYS.collapsedRightPanel, String(collapsed));
  }, []);

  const setActiveNavItem = useCallback((key: NavItemKey) => {
    setActiveNavItemState(key);
    writeStorage(STORAGE_KEYS.activeNavItem, key);
  }, []);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId],
  );

  const value = useMemo(
    (): WorkspacesContextValue => ({
      activeProfileId,
      activeSessionId,
      activeRightTab,
      rightPanelCollapsed,
      activeNavItem,
      profiles,
      setProfiles,
      setActiveProfileId,
      setActiveSessionId,
      setActiveRightTab,
      setRightPanelCollapsed,
      setActiveNavItem,
      activeProfile,
      sessionsRefreshNonce,
      refreshSessions,
      runtime,
      sessions: sessionsHandle.sessions,
      sessionsLoading: sessionsHandle.loading,
      sessionsKeyword,
      setSessionsKeyword,
      renameSession: sessionsHandle.renameSession,
      deleteSession: sessionsHandle.deleteSession,
    }),
    [
      activeProfile,
      activeProfileId,
      activeRightTab,
      activeSessionId,
      activeNavItem,
      profiles,
      rightPanelCollapsed,
      runtime,
      sessionsHandle.deleteSession,
      sessionsHandle.loading,
      sessionsHandle.renameSession,
      sessionsHandle.sessions,
      sessionsKeyword,
      sessionsRefreshNonce,
      refreshSessions,
      setActiveProfileId,
      setActiveRightTab,
      setRightPanelCollapsed,
      setActiveNavItem,
    ],
  );

  return (
    <WorkspacesContext.Provider value={value}>{children}</WorkspacesContext.Provider>
  );
}

export function useWorkspaces(): WorkspacesContextValue {
  const ctx = useContext(WorkspacesContext);
  if (!ctx) {
    throw new Error("useWorkspaces must be used within WorkspacesProvider");
  }
  return ctx;
}
