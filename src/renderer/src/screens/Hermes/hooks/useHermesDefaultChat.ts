import { useCallback, useEffect, useRef, useState } from "react";
import { hermesDefaultApi } from "../api/hermesDefaultApi";
import type { HermesChatRunState, HermesMessage } from "../types";
import { formatChatError } from "../utils/formatChatError";

export function useHermesDefaultChat(activeSessionId: string | null) {
  const [messages, setMessages] = useState<HermesMessage[]>([]);
  const [runState, setRunState] = useState<HermesChatRunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const streamBufRef = useRef("");
  const assistantIdRef = useRef<string | null>(null);

  const loadSession = useCallback(async (sessionId: string) => {
    setError(null);
    try {
      const rows = await hermesDefaultApi.sessions.messages(sessionId);
      setMessages(
        rows.map((m, i) => ({
          id: `${sessionId}-${i}`,
          role: m.role as HermesMessage["role"],
          content: m.content,
          createdAt: Date.now(),
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    void loadSession(activeSessionId);
  }, [activeSessionId, loadSession]);

  useEffect(() => {
    const unsubs = [
      hermesDefaultApi.chat.onChunk((chunk) => {
        streamBufRef.current += chunk;
        const aid = assistantIdRef.current;
        if (!aid) return;
        const text = streamBufRef.current;
        setMessages((prev) =>
          prev.map((m) => (m.id === aid ? { ...m, content: text } : m)),
        );
      }),
      hermesDefaultApi.chat.onDone((_sessionId) => {
        setRunState("idle");
        streamBufRef.current = "";
        assistantIdRef.current = null;
      }),
      hermesDefaultApi.chat.onError((err) => {
        setError(formatChatError(err));
        setRunState("error");
        streamBufRef.current = "";
        const aid = assistantIdRef.current;
        assistantIdRef.current = null;
        if (aid) {
          setMessages((prev) =>
            prev.filter((m) => m.id !== aid || m.content.trim().length > 0),
          );
        }
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const send = useCallback(
    async (text: string, onSessionCreated?: (sessionId: string) => void) => {
      const trimmed = text.trim();
      if (!trimmed || runState === "streaming") return null;

      setError(null);
      setRunState("streaming");
      streamBufRef.current = "";

      const userMsg: HermesMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };
      const assistantId = `a-${Date.now()}`;
      assistantIdRef.current = assistantId;
      const assistantMsg: HermesMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const history = messages
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const result = await hermesDefaultApi.chat.sendMessage({
          message: trimmed,
          resumeSessionId: activeSessionId ?? undefined,
          history,
        });
        if (result.sessionId) {
          onSessionCreated?.(result.sessionId);
        }
        return result.sessionId ?? null;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(formatChatError(msg));
        setRunState("error");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        assistantIdRef.current = null;
        return null;
      }
    },
    [activeSessionId, messages, runState],
  );

  const abort = useCallback(async () => {
    await hermesDefaultApi.chat.abort();
    setRunState("idle");
    streamBufRef.current = "";
    assistantIdRef.current = null;
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    setRunState("idle");
  }, []);

  return {
    messages,
    runState,
    error,
    send,
    abort,
    clear,
    loadSession,
  };
}
