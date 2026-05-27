import { useCallback, useEffect, useRef, useState } from "react";
import { hermesDefaultApi } from "../../../api/hermesDefaultApi";
import type { HermesChatUsageEvent } from "../../../../../../../shared/hermes-default-chat/hermes-default-chat-contract";
import type { HermesChatRunState, HermesMessage, HermesToolCall } from "../../../types";
import { formatChatError } from "../../../utils/formatChatError";

function newId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useHermesDefaultChatStream(input: {
  activeSessionId: string | null;
  onSessionId?: (id: string) => void;
}): {
  messages: HermesMessage[];
  streamingContent: string;
  runState: HermesChatRunState;
  activeTool: HermesToolCall | null;
  lastError: string | null;
  lastUsage: HermesChatUsageEvent | null;
  historyLoadError: string | null;
  send: (text: string, attachmentIds: string[], modelId: string | null) => Promise<void>;
  cancel: () => Promise<void>;
  clearMessages: () => void;
  loadSessionHistory: (sid: string) => Promise<void>;
} {
  const [messages, setMessages] = useState<HermesMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [runState, setRunState] = useState<HermesChatRunState>("idle");
  const [activeTool, setActiveTool] = useState<HermesToolCall | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastUsage, setLastUsage] = useState<HermesChatUsageEvent | null>(null);
  const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);

  const messagesRef = useRef<HermesMessage[]>([]);
  const runStateRef = useRef<HermesChatRunState>("idle");
  const streamingRef = useRef("");
  const activeSessionRef = useRef<string | null>(input.activeSessionId);
  const onSessionIdRef = useRef(input.onSessionId);
  onSessionIdRef.current = input.onSessionId;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    runStateRef.current = runState;
  }, [runState]);
  useEffect(() => {
    streamingRef.current = streamingContent;
  }, [streamingContent]);
  useEffect(() => {
    activeSessionRef.current = input.activeSessionId;
  }, [input.activeSessionId]);

  useEffect(() => {
    const unsubs = [
      hermesDefaultApi.chat.onChunk((chunk) => {
        setRunState("streaming");
        setStreamingContent((prev) => prev + chunk);
      }),
      hermesDefaultApi.chat.onToolProgress((tool) => {
        const tc: HermesToolCall = {
          id: `tool-${Date.now()}`,
          name: tool,
          status: "running",
        };
        setActiveTool(tc);
        setRunState("streaming");
      }),
      hermesDefaultApi.chat.onUsage((usage) => {
        setLastUsage(usage);
      }),
      hermesDefaultApi.chat.onDone((sessionId) => {
        setStreamingContent((current) => {
          if (current) {
            const msg: HermesMessage = {
              id: newId(),
              role: "assistant",
              content: current,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, msg]);
          }
          return "";
        });
        setRunState("completed");
        setActiveTool(null);
        setLastError(null);
        if (sessionId) onSessionIdRef.current?.(sessionId);
      }),
      hermesDefaultApi.chat.onError((err) => {
        setLastError(formatChatError(err));
        setRunState("error");
        setStreamingContent("");
        setActiveTool(null);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const loadSessionHistory = useCallback(async (sid: string) => {
    setHistoryLoadError(null);
    try {
      const rows = await hermesDefaultApi.sessions.messages(sid);
      setMessages(
        rows.map((m) => ({
          id: `hist-${sid}-${m.id}`,
          role: m.role as HermesMessage["role"],
          content: m.content,
          createdAt: new Date(m.timestamp).toISOString(),
        })),
      );
      setStreamingContent("");
      setRunState("idle");
      setActiveTool(null);
      setLastError(null);
      setLastUsage(null);
    } catch (e) {
      setMessages([]);
      setHistoryLoadError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    messagesRef.current = [];
    setStreamingContent("");
    setRunState("idle");
    setActiveTool(null);
    setLastError(null);
    setLastUsage(null);
    setHistoryLoadError(null);
  }, []);

  const send = useCallback(
    async (text: string, attachmentIds: string[], modelId: string | null) => {
      const trimmed = text.trim();
      if (!trimmed && attachmentIds.length === 0) return;
      if (runStateRef.current === "streaming" || runStateRef.current === "creating") return;

      const userMsg: HermesMessage = {
        id: newId(),
        role: "user",
        content: trimmed || "(attachments)",
        createdAt: new Date().toISOString(),
      };
      const nextMessages = [...messagesRef.current, userMsg];
      setMessages(nextMessages);
      messagesRef.current = nextMessages;

      setRunState("creating");
      setStreamingContent("");
      setActiveTool(null);
      setLastError(null);
      setLastUsage(null);

      const history = nextMessages.map((m) => ({ role: m.role, content: m.content }));
      console.info("[Hermes Chat] Renderer 发送", {
        model_id: modelId ?? "(未选)",
        resumeSessionId: activeSessionRef.current ?? "(新会话)",
      });
      await hermesDefaultApi.chat.sendMessage({
        message: trimmed,
        resumeSessionId: activeSessionRef.current ?? undefined,
        history,
        attachment_ids: attachmentIds,
        model_id: modelId ?? undefined,
      });
    },
    [],
  );

  const cancel = useCallback(async () => {
    await hermesDefaultApi.chat.abort();
    if (streamingRef.current) {
      const msg: HermesMessage = {
        id: newId(),
        role: "assistant",
        content: `${streamingRef.current}\n\n[interrupted]`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg]);
    }
    setStreamingContent("");
    setActiveTool(null);
    setRunState("cancelled");
  }, []);

  return {
    messages,
    streamingContent,
    runState,
    activeTool,
    lastError,
    lastUsage,
    historyLoadError,
    send,
    cancel,
    clearMessages,
    loadSessionHistory,
  };
}

