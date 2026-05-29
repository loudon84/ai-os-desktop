import type { BrowserFrameHtmlResult, BrowserFrameSnapshot } from "../../../../../shared/browser/browser-frame-contract";
import type { HermesPanelPageContext } from "../../../components/hermes";

export function buildScopeKey(url: string, frameId: string | null): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}#${frameId ?? "main"}`;
  } catch {
    return `${url}#${frameId ?? "main"}`;
  }
}

export function buildPageContextFromFrameHtml(input: {
  frame: BrowserFrameSnapshot | null;
  result: BrowserFrameHtmlResult;
  htmlExcerpt: string;
  /** Stable task URL (e.g. parent + fragment for about:srcdoc iframes). */
  pageUrl?: string;
}): HermesPanelPageContext | null {
  const { frame, result, htmlExcerpt, pageUrl: pageUrlOverride } = input;
  if (!result.ok || !frame) return null;

  const url = pageUrlOverride?.trim() || (frame.url ?? result.url ?? "");
  const title = frame.title ?? result.title ?? "";
  const frameId = result.frameId ?? frame.frameId;
  const scopeKey = buildScopeKey(url, frameId);
  const summary =
    result.text?.trim() || `${title || "（无标题）"} · ${frame.origin ?? url}`;

  return {
    type: "web-operator",
    scopeKey,
    summary,
    payload: {
      url,
      title,
      frameId,
      frameMeta: {
        name: frame.name ?? null,
        origin: frame.origin ?? null,
        path: frame.path.length ? frame.path.join(".") : null,
        url: frame.url ?? null,
      },
      htmlExcerpt,
      textExcerpt: result.text ?? undefined,
      truncated: result.truncated,
      capturedAt: result.capturedAt,
    },
  };
}
