import { useCallback, useEffect, useRef, useState } from "react";
import type { HermesChatUsageEvent } from "../../../../../shared/hermes-default-chat/hermes-default-chat-contract";
import { formatChatError } from "../../../screens/Hermes/utils/formatChatError";
import { hermesPanelApi } from "../api/hermesPanelApi";
import {
  DEFAULT_PANEL_SYSTEM_PROMPT,
  HERMES_PANEL_DRAFT_SESSION_ID,
} from "../constants";
import { buildWebContextPrefix } from "../lib/build-web-context-prefix";
import { injectWebContextAttachments } from "../lib/inject-web-context-attachments";
import {
  clearPanelSessionBinding,
  getPanelSessionBinding,
  scopeKeyWebOperatorPage,
  setPanelSessionBinding,
} from "../lib/web-operator-hermes-session-binding";
import type {
  HermesPanelMessage,
  HermesPanelPageContext,
  HermesPanelRunState,
  HermesPanelToolCall,
} from "../types";

function newMessageId(): string {
  return `hp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useWebOperatorHermesPanelChat(options: {
  pageContext: HermesPanelPageContext | null;
  presetSystemPrompt?: string;
  persistenceScopeKey?: string | null;
}) {
  const [messages, setMessages] = useState<HermesPanelMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [runState, setRunState] = useState<HermesPanelRunState>("idle");
  const [toolCalls, setToolCalls] = useState<HermesPanelToolCall[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [defaultModelLabel, setDefaultModelLabel] = useState<string | null>(null);

  const messagesRef = useRef<HermesPanelMessage[]>([]);
  const runStateRef = useRef<HermesPanelRunState>("idle");
  const streamingRef = useRef("");
  const sessionIdRef = useRef<string | null>(null);
  const injectedRef = useRef(false);
  const pageContextRef = useRef(options.pageContext);
  const persistenceKeyRef = useRef<string | null>(
    options.persistenceScopeKey
      ? scopeKeyWebOperatorPage(options.persistenceScopeKey)
      : null,
  );

  pageContextRef.current = options.pageContext;
  persistenceKeyRef.current = options.persistenceScopeKey
    ? scopeKeyWebOperatorPage(options.persistenceScopeKey)
    : null;

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
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    void hermesPanelApi.getModelConfig().then((cfg) => {
      if (cfg?.model_label) setDefaultModelLabel(cfg.model_label);
      else if (cfg?.model_id) setDefaultModelLabel(cfg.model_id);
    });
  }, []);

  useEffect(() => {
    const unsubs = [
      hermesPanelApi.onChunk((chunk) => {
        setRunState("streaming");
        setStreamingContent((prev) => prev + chunk);
      }),
      hermesPanelApi.onToolProgress((tool) => {
        const tc: HermesPanelToolCall = {
          tid: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: tool,
          preview: "",
          done: false,
        };
        setToolCalls((prev) => [...prev, tc]);
        setRunState("streaming");
      }),
      hermesPanelApi.onUsage((_usage: HermesChatUsageEvent) => {
        /* optional display */
      }),
      hermesPanelApi.onDone((sid) => {
        setStreamingContent((current) => {
          if (current) {
            const msg: HermesPanelMessage = {
              id: newMessageId(),
              role: "assistant",
              content: current,
              timestamp: Date.now() / 1000,
            };
            setMessages((prev) => [...prev, msg]);
          }
          return "";
        });
        setRunState("idle");
        setToolCalls([]);
        setError(null);
        if (sid) {
          sessionIdRef.current = sid;
          setSessionId(sid);
          const pk = persistenceKeyRef.current;
          if (pk) setPanelSessionBinding(pk, sid);
        }
      }),
      hermesPanelApi.onError((err) => {
        setError(formatChatError(err));
        setRunState("error");
        setStreamingContent("");
        setToolCalls([]);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const loadSessionHistory = useCallback(async (sid: string) => {
    setRestoring(true);
    setError(null);
    try {
      const rows = await window.hermesAPI.getSessionMessages(sid);
      setMessages(
        rows
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m, i) => ({
            id: `hist-${sid}-${i}`,
            role: m.role as "user" | "assistant",
            content: m.content ?? "",
            timestamp: m.timestamp ?? Date.now() / 1000,
          })),
      );
      sessionIdRef.current = sid;
      setSessionId(sid);
      setStreamingContent("");
      setRunState("idle");
      setToolCalls([]);
    } catch (e) {
      setMessages([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoring(false);
    }
  }, []);

  useEffect(() => {
    const scope = options.persistenceScopeKey;
    if (!scope) {
      sessionIdRef.current = null;
      setSessionId(null);
      return;
    }
    const pk = scopeKeyWebOperatorPage(scope);
    const bound = getPanelSessionBinding(pk);
    if (bound) {
      void loadSessionHistory(bound);
    } else {
      sessionIdRef.current = null;
      setSessionId(null);
      setMessages([]);
      injectedRef.current = false;
    }
  }, [options.persistenceScopeKey, loadSessionHistory]);

  useEffect(() => {
    injectedRef.current = false;
  }, [options.persistenceScopeKey]);

  const busy = runState === "creating" || runState === "streaming";

  const cancel = useCallback(async () => {
    await hermesPanelApi.abort();
    if (streamingRef.current) {
      const msg: HermesPanelMessage = {
        id: newMessageId(),
        role: "assistant",
        content: `${streamingRef.current}\n\n[已中断]`,
        timestamp: Date.now() / 1000,
      };
      setMessages((prev) => [...prev, msg]);
    }
    setStreamingContent("");
    setToolCalls([]);
    setRunState("cancelled");
  }, []);

  const clear = useCallback(() => {
    if (runStateRef.current === "creating" || runStateRef.current === "streaming") {
      void cancel();
    }
    const pk = persistenceKeyRef.current;
    if (pk) clearPanelSessionBinding(pk);
    sessionIdRef.current = null;
    setSessionId(null);
    setMessages([]);
    messagesRef.current = [];
    setStreamingContent("");
    setToolCalls([]);
    setError(null);
    setRunState("idle");
    injectedRef.current = false;
  }, [cancel]);

  const send = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || busy || restoring) return;

      const ctx = pageContextRef.current;
      const prior = messagesRef.current.filter((m) => !m.isStreaming);
      const isFirstUserMessage = prior.length === 0;

      const userMsg: HermesPanelMessage = {
        id: newMessageId(),
        role: "user",
        content: trimmed,
        timestamp: Date.now() / 1000,
      };
      const nextMessages = [...prior, userMsg];
      setMessages(nextMessages);
      messagesRef.current = nextMessages;

      setRunState("creating");
      setStreamingContent("");
      setToolCalls([]);
      setError(null);

      let attachmentIds: string[] = [];
      const draftOrSession = sessionIdRef.current ?? HERMES_PANEL_DRAFT_SESSION_ID;

      if (isFirstUserMessage && ctx && !injectedRef.current) {
        const inj = await injectWebContextAttachments(draftOrSession, ctx);
        if (!inj.ok) {
          setError(inj.error);
          setRunState("error");
          return;
        }
        if (inj.attachmentIds.length > 0) {
          attachmentIds = inj.attachmentIds;
          injectedRef.current = true;
        }
      }

      const systemLead = (options.presetSystemPrompt ?? DEFAULT_PANEL_SYSTEM_PROMPT).trim();
      const ctxPrefix = buildWebContextPrefix(ctx);
      const payloadMessage = isFirstUserMessage
        ? `${systemLead}\n\n${ctxPrefix}[用户]\n${trimmed}`
        : trimmed;

      const history = nextMessages.map((m) => ({ role: m.role, content: m.content }));

      try {
        await hermesPanelApi.sendMessage({
          message: isFirstUserMessage ? payloadMessage : trimmed,
          resumeSessionId: sessionIdRef.current ?? HERMES_PANEL_DRAFT_SESSION_ID,
          history: isFirstUserMessage ? undefined : history,
          attachment_ids: attachmentIds.length ? attachmentIds : undefined,
        });
      } catch (e) {
        setError(formatChatError(e instanceof Error ? e.message : String(e)));
        setRunState("error");
      }
    },
    [busy, restoring, options.presetSystemPrompt],
  );

  return {
    messages,
    streamingContent,
    toolCalls,
    busy,
    error,
    restoring,
    runState,
    sessionId,
    defaultModelLabel,
    send,
    cancel,
    clear,
  };
}
