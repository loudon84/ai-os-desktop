import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Globe,
  LayoutDashboard,
  Plus,
  RotateCw,
  X,
} from "lucide-react";
import { WindowControls } from "../../components/layout/WindowControls";
import type { ProfileEntrySummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import type { View } from "../../types/desktop-shell";
import type { ExternalBrowserTab, SidebarMode } from "./main-page-types";
import { MainViewTabs } from "./MainViewTabs";
import { MainProfileSwitch } from "./MainProfileSwitch";
import { MainRuntimeIndicator } from "./MainRuntimeIndicator";

interface MainTopBarProps {
  activeProfile: string;
  activeView: View;
  profileEntries: ProfileEntrySummary[];
  externalTabs: ExternalBrowserTab[];
  tabOrder: string[];
  sidebarMode: SidebarMode;
  canCloseActiveTab: boolean;
  onSidebarModeChange: (mode: SidebarMode) => void;
  onNavigate: (view: View) => void;
  onSelectProfile: (name: string) => void;
  onTabOrderChange: (order: string[]) => void;
  onCloseTab: (id: View) => void;
  onOpenExternalTab: (url: string) => Promise<View>;
  onReloadActiveTab: () => void;
  onCloseActiveTab: () => void;
}

function nextSidebarMode(mode: SidebarMode): SidebarMode {
  if (mode === "expanded") return "rail";
  if (mode === "rail") return "hidden";
  return "expanded";
}

function normalizeUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function MainTopBar({
  activeProfile,
  activeView,
  profileEntries,
  externalTabs,
  tabOrder,
  sidebarMode,
  canCloseActiveTab,
  onSidebarModeChange,
  onNavigate,
  onSelectProfile,
  onTabOrderChange,
  onCloseTab,
  onOpenExternalTab,
  onReloadActiveTab,
  onCloseActiveTab,
}: MainTopBarProps): React.JSX.Element {
  const SidebarIcon = sidebarMode === "hidden" ? PanelLeftOpen : PanelLeftClose;
  const [newTabOpen, setNewTabOpen] = useState(false);
  const [newTabUrl, setNewTabUrl] = useState("https://");
  const newTabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!newTabOpen) return;

    const onPointerDown = (event: MouseEvent): void => {
      if (newTabRef.current && !newTabRef.current.contains(event.target as Node)) {
        setNewTabOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [newTabOpen]);

  const handleNewTabSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const url = normalizeUrlInput(newTabUrl);
    if (!url) return;

    try {
      const id = await onOpenExternalTab(url);
      onNavigate(id);
      setNewTabOpen(false);
      setNewTabUrl("https://");
    } catch (err) {
      console.error("[MainTopBar] openExternalTab failed:", err);
    }
  };

  return (
    <header className="MainTopBar app-drag-region">
      <button
        type="button"
        className="MainTopBar__menu no-drag"
        aria-label="Toggle sidebar"
        title={`Sidebar: ${sidebarMode}`}
        onClick={() => onSidebarModeChange(nextSidebarMode(sidebarMode))}
      >
        <SidebarIcon size={16} />
      </button>

      <MainProfileSwitch
        activeProfile={activeProfile}
        onSelectProfile={onSelectProfile}
        onNavigate={onNavigate}
      />

      <MainRuntimeIndicator activeProfile={activeProfile} />

      <MainViewTabs
        activeView={activeView}
        profileEntries={profileEntries}
        externalTabs={externalTabs}
        tabOrder={tabOrder}
        onTabOrderChange={onTabOrderChange}
        onNavigate={onNavigate}
        onCloseTab={onCloseTab}
      />

      <div className="MainTopBar__actions no-drag">
        <div className="MainTopBar__new-tab" ref={newTabRef}>
          <button
            type="button"
            aria-label="New browser tab"
            title="New browser tab"
            onClick={() => setNewTabOpen((open) => !open)}
          >
            <Plus size={15} />
          </button>
          {newTabOpen ? (
            <form className="MainTopBar__new-tab-popover no-drag" onSubmit={handleNewTabSubmit}>
              <input
                type="text"
                value={newTabUrl}
                onChange={(e) => setNewTabUrl(e.target.value)}
                placeholder="https://"
                className="MainTopBar__new-tab-input"
                autoFocus
                spellCheck={false}
              />
              <button type="submit" className="MainTopBar__new-tab-go">
                Open
              </button>
            </form>
          ) : null}
        </div>

        <button type="button" aria-label="Reload tab" title="Reload tab" onClick={onReloadActiveTab}>
          <RotateCw size={15} />
        </button>

        {canCloseActiveTab ? (
          <button type="button" aria-label="Close tab" title="Close tab" onClick={onCloseActiveTab}>
            <X size={15} />
          </button>
        ) : null}

        <button type="button" aria-label="AI-OS Home" onClick={() => onNavigate("aios-home")}>
          <LayoutDashboard size={15} />
        </button>
        <button type="button" aria-label="Web Operator" onClick={() => onNavigate("web-operator")}>
          <Globe size={15} />
        </button>
        <button type="button" aria-label="Settings" onClick={() => onNavigate("settings")}>
          <Settings size={15} />
        </button>
      </div>

      <WindowControls />
    </header>
  );
}
