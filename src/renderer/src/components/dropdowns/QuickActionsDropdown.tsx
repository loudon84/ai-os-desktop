/**
 * Quick Actions Dropdown
 * 
 * 快捷操作菜单，提供常用功能入口。
 */
import React, { useEffect, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Settings,
  Moon,
  Sun,
  Keyboard,
  HelpCircle,
  LogOut,
  Bug,
  FileText,
  RefreshCw,
  Power,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface QuickActionsDropdownProps {
  anchorBounds: { x: number; y: number; width: number; height: number };
  onClose: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  onOpenShortcuts: () => void;
  onOpenHelp: () => void;
  onRestartGateway: () => void;
  onStopGateway: () => void;
  onReportIssue: () => void;
  onViewLogs: () => void;
  onQuit: () => void;
  isDarkMode?: boolean;
  gatewayRunning?: boolean;
}

export const QuickActionsDropdown: React.FC<QuickActionsDropdownProps> = ({
  anchorBounds,
  onClose,
  onNewChat,
  onOpenSettings,
  onToggleTheme,
  onOpenShortcuts,
  onOpenHelp,
  onRestartGateway,
  onStopGateway,
  onReportIssue,
  onViewLogs,
  onQuit,
  isDarkMode = false,
  gatewayRunning = false,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Define actions
  const actions: QuickAction[] = [
    {
      id: "new-chat",
      label: "New Chat",
      icon: <Plus size={16} />,
      shortcut: "⌘N",
      onClick: () => { onNewChat(); onClose(); },
    },
    {
      id: "divider-1",
      label: "",
      icon: null,
      onClick: () => {},
      divider: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={16} />,
      shortcut: "⌘,",
      onClick: () => { onOpenSettings(); onClose(); },
    },
    {
      id: "theme",
      label: isDarkMode ? "Light Mode" : "Dark Mode",
      icon: isDarkMode ? <Sun size={16} /> : <Moon size={16} />,
      shortcut: "⌘⇧L",
      onClick: () => { onToggleTheme(); onClose(); },
    },
    {
      id: "shortcuts",
      label: "Keyboard Shortcuts",
      icon: <Keyboard size={16} />,
      onClick: () => { onOpenShortcuts(); onClose(); },
    },
    {
      id: "divider-2",
      label: "",
      icon: null,
      onClick: () => {},
      divider: true,
    },
    {
      id: "gateway-restart",
      label: "Restart Gateway",
      icon: <RefreshCw size={16} />,
      onClick: () => { onRestartGateway(); onClose(); },
    },
    {
      id: "gateway-stop",
      label: gatewayRunning ? "Stop Gateway" : "Start Gateway",
      icon: <Power size={16} />,
      onClick: () => { 
        if (gatewayRunning) {
          onStopGateway(); 
        }
        onClose(); 
      },
    },
    {
      id: "divider-3",
      label: "",
      icon: null,
      onClick: () => {},
      divider: true,
    },
    {
      id: "logs",
      label: "View Logs",
      icon: <FileText size={16} />,
      onClick: () => { onViewLogs(); onClose(); },
    },
    {
      id: "report",
      label: "Report Issue",
      icon: <Bug size={16} />,
      onClick: () => { onReportIssue(); onClose(); },
    },
    {
      id: "help",
      label: "Help & Support",
      icon: <HelpCircle size={16} />,
      onClick: () => { onOpenHelp(); onClose(); },
    },
    {
      id: "divider-4",
      label: "",
      icon: null,
      onClick: () => {},
      divider: true,
    },
    {
      id: "quit",
      label: "Quit",
      icon: <LogOut size={16} />,
      shortcut: "⌘Q",
      onClick: () => { onQuit(); },
      danger: true,
    },
  ];

  // Calculate position
  const getPosition = () => {
    const dropdownWidth = 240;
    const dropdownHeight = actions.length * 36 + 60;
    
    let x = anchorBounds.x + anchorBounds.width - dropdownWidth;
    let y = anchorBounds.y + anchorBounds.height + 8;
    
    // Ensure dropdown stays within window bounds
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (x < 16) {
      x = 16;
    }
    
    if (y + dropdownHeight > windowHeight) {
      y = anchorBounds.y - dropdownHeight - 8;
    }
    
    return { x, y, width: dropdownWidth };
  };

  const position = getPosition();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden py-1"
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        maxHeight: 520,
      }}
    >
      {actions.map((action) => {
        if (action.divider) {
          return (
            <div
              key={action.id}
              className="my-1 border-t border-gray-200 dark:border-gray-700"
            />
          );
        }

        return (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`
              w-full px-3 py-2 flex items-center gap-3 text-left
              transition-colors duration-150
              ${action.danger 
                ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }
            `}
          >
            <span className={action.danger ? "text-red-500" : "text-gray-500 dark:text-gray-400"}>
              {action.icon}
            </span>
            
            <span className="flex-1 text-sm">{action.label}</span>
            
            {action.shortcut && (
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                {action.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default QuickActionsDropdown;
