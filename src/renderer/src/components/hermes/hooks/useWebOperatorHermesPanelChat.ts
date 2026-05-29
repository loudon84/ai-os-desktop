import { useCallback, useEffect, useRef, useState } from "react";
import type { HermesChatUsageEvent } from "../../../../../shared/hermes-default-chat/hermes-default-chat-contract";
import { formatChatError } from "../../../screens/Hermes/utils/formatChatError";
import { hermesPanelApi } from "../api/hermesPanelApi";
import {
  DEFAULT_PANEL_SYSTEM_PROMPT,
  HERMES_PANEL_DRAFT_SESSION_ID,
} from "../constants";
import { buildTaskFirstMessage } from "../lib/build-task-first-message";
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
  HermesPanelTaskInput,
  HermesPanelTaskSessionReadyInput,
  HermesPanelToolCall,
} from "../types";

function newMessageId(): string {
  return `hp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useWebOperatorHermesPanelChat(options: {
  pageContext: HermesPanelPageContext | null;
  task?: HermesPanelTaskInput | null;
  presetSystemPrompt?: string;
  persistenceScopeKey?: string | null;
  onTaskSessionReady?: (input: HermesPanelTaskSessionReadyInput) => void;
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
  const taskRef = useRef(options.task);
  const onTaskSessionReadyRef = useRef(options.onTaskSessionReady);
  const autoRunKeyRef = useRef<string | null>(null);
  const persistenceKeyRef = useRef<string | null>(
    options.persistenceScopeKey
      ? scopeKeyWebOperatorPage(options.persistenceScopeKey)
      : null,
  );

  pageContextRef.current = options.pageContext;
  taskRef.current = options.task;
  onTaskSessionReadyRef.current = options.onTaskSessionReady;
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
        const pending = streamingRef.current;
        if (pending) {
          const msg: HermesPanelMessage = {
            id: newMessageId(),
            role: "assistant",
            content: pending,
            timestamp: Date.now() / 1000,
          };
          setMessages((prev) => [...prev, msg]);
        }
        setStreamingContent("");
        setRunState("idle");
        setToolCalls([]);
        setError(null);
        if (sid) {
          sessionIdRef.current = sid;
          setSessionId(sid);
          const task = taskRef.current;
          if (task) {
            onTaskSessionReadyRef.current?.({
              taskId: task.taskId,
              pageUrl: task.pageUrl,
              sessionId: sid,
              pageContext: task.pageContext,
              skill: task.skill ?? "",
            });
          } else {
            const pk = persistenceKeyRef.current;
            if (pk) setPanelSessionBinding(pk, sid);
          }
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
      injectedRef.current = true;
    } catch (e) {
      setMessages([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoring(false);
    }
  }, []);

  useEffect(() => {
    const task = options.task;
    if (task) {
      if (task.action === "loading" && task.sessionId) {
        void loadSessionHistory(task.sessionId);
      } else if (task.action === "pending") {
        sessionIdRef.current = null;
        setSessionId(null);
        setMessages([]);
        injectedRef.current = false;
      } else if (task.action === "running" && !task.sessionId) {
        sessionIdRef.current = null;
        setSessionId(null);
        setMessages([]);
        injectedRef.current = false;
      }
      return;
    }

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
  }, [options.task, options.persistenceScopeKey, loadSessionHistory]);

  useEffect(() => {
    if (options.task) return;
    injectedRef.current = false;
  }, [options.persistenceScopeKey, options.task]);

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
    const task = taskRef.current;
    if (!task) {
      const pk = persistenceKeyRef.current;
      if (pk) clearPanelSessionBinding(pk);
    }
    sessionIdRef.current = null;
    setSessionId(null);
    setMessages([]);
    messagesRef.current = [];
    setStreamingContent("");
    setToolCalls([]);
    setError(null);
    setRunState("idle");
    injectedRef.current = false;
    autoRunKeyRef.current = null;
  }, [cancel]);

  const sendInternal = useCallback(
    async (userText: string, opts?: { forceFirstMessage?: boolean; displayText?: string }) => {
      const trimmed = userText.trim();
      if (!trimmed || busy || restoring) return;

      const ctx = pageContextRef.current;
      const task = taskRef.current;
      const prior = messagesRef.current.filter((m) => !m.isStreaming);
      const isFirstUserMessage = opts?.forceFirstMessage ?? prior.length === 0;

      const displayContent = opts?.displayText?.trim() || trimmed;
      const userMsg: HermesPanelMessage = {
        id: newMessageId(),
        role: "user",
        content: displayContent,
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
      const resumeId =
        sessionIdRef.current ?? task?.sessionId ?? HERMES_PANEL_DRAFT_SESSION_ID;

      if (isFirstUserMessage && ctx && !injectedRef.current) {
        const inj = await injectWebContextAttachments(resumeId, ctx);
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
        ? task
          ? `${systemLead}\n\n${trimmed}`
          : `${systemLead}\n\n${ctxPrefix}[用户]\n${trimmed}`
        : trimmed;

      const history = nextMessages.map((m) => ({ role: m.role, content: m.content }));

      try {
        await hermesPanelApi.sendMessage({
          message: isFirstUserMessage ? payloadMessage : trimmed,
          resumeSessionId: resumeId,
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

  const send = useCallback(
    async (userText: string) => {
      await sendInternal(userText);
    },
    [sendInternal],
  );

  useEffect(() => {
    const task = options.task;
    if (!task || task.action !== "running") return;

    const autoRunKey = `${task.taskId}:${task.action}:${task.userPrompt ?? ""}:${task.skill ?? ""}`;
    if (autoRunKeyRef.current === autoRunKey) return;
    if (busy || restoring) return;

    autoRunKeyRef.current = autoRunKey;

    const message = buildTaskFirstMessage({
      pageUrl: task.pageUrl,
      pageContext: task.pageContext,
      userPrompt: task.userPrompt,
      skill: task.skill,
    });

    const displayText = task.userPrompt?.trim() || "请分析当前页面内容…";
    void sendInternal(message, { forceFirstMessage: true, displayText });
  }, [options.task, busy, restoring, sendInternal]);

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
