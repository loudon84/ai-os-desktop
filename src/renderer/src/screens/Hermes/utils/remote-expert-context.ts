import type { RemoteRunContext } from "../../../../../shared/hermes-experts/hermes-experts-contract";

export const REMOTE_EXPERT_CONTEXT_EVENT = "hermes:remote-expert-context";

export function savePageContextForRemoteExpert(context: Partial<RemoteRunContext>): void {
  try {
    const existing = buildPageContextFromStorage();
    const merged = { ...existing, ...context, source: context.source ?? existing?.source ?? "copilot-desktop" };
    sessionStorage.setItem(PAGE_CONTEXT_KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
}

const PAGE_CONTEXT_KEY = "hermes-remote-page-context-v1";

export function buildPageContextFromStorage(): RemoteRunContext | undefined {
  try {
    const raw = sessionStorage.getItem(PAGE_CONTEXT_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as RemoteRunContext;
  } catch {
    return undefined;
  }
}

/** WebOperator / screen bridge — inject into tools/call context (no route override). */
export function buildWebOperatorContext(input: {
  pageUrl?: string;
  screenSummary?: string;
  conversationId?: string;
}): RemoteRunContext {
  return {
    source: "copilot-desktop",
    page_url: input.pageUrl,
    screen_summary: input.screenSummary,
    conversation_id: input.conversationId,
  };
}
