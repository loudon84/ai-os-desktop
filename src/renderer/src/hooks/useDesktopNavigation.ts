import { useState, useCallback, useEffect } from "react";
import type { ChatMessage } from "../screens/Chat/Chat";
import type { View } from "../types/desktop-shell";

export interface UseDesktopNavigationResult {
  view: View;
  setView: (view: View) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentSessionId: string | null;
  activeProfile: string;
  officeVisited: boolean;
  setOfficeVisited: (visited: boolean) => void;
  handleNewChat: () => void;
  handleSelectProfile: (name: string) => void;
  handleResumeSession: (sessionId: string) => Promise<void>;
  navigateToView: (next: View) => void;
}

export function useDesktopNavigation(): UseDesktopNavigationResult {
  const [view, setView] = useState<View>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState("default");
  const [officeVisited, setOfficeVisited] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("smc-v13-navigate-runtime-setup") === "1") {
        sessionStorage.removeItem("smc-v13-navigate-runtime-setup");
        setView("runtime-setup");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleNewChat = useCallback(() => {
    window.hermesAPI.abortChat();
    setMessages([]);
    setCurrentSessionId(null);
    setView("chat");
  }, []);

  useEffect(() => {
    const cleanupNewChat = window.hermesAPI.onMenuNewChat(() => {
      handleNewChat();
    });
    const cleanupSearch = window.hermesAPI.onMenuSearchSessions(() => {
      setView("sessions");
    });
    return () => {
      cleanupNewChat();
      cleanupSearch();
    };
  }, [handleNewChat]);

  const handleSelectProfile = useCallback((name: string) => {
    setActiveProfile(name);
    setMessages([]);
    setCurrentSessionId(null);
  }, []);

  const handleResumeSession = useCallback(async (sessionId: string) => {
    const dbMessages = await window.hermesAPI.getSessionMessages(sessionId);
    const chatMessages: ChatMessage[] = dbMessages.map((m) => ({
      id: `db-${m.id}`,
      role: m.role === "user" ? "user" : "agent",
      content: m.content,
    }));
    setMessages(chatMessages);
    setCurrentSessionId(sessionId);
    setView("chat");
  }, []);

  const navigateToView = useCallback((next: View) => {
    if (next === "office") {
      setOfficeVisited(true);
    }
    setView(next);
  }, []);

  return {
    view,
    setView,
    messages,
    setMessages,
    currentSessionId,
    activeProfile,
    officeVisited,
    setOfficeVisited,
    handleNewChat,
    handleSelectProfile,
    handleResumeSession,
    navigateToView,
  };
}
