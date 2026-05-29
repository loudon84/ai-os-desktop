import { useCallback, useMemo, useState } from "react";
import { Copy, FileCode2, Play } from "lucide-react";
import type {
  BrowserFrameHtmlResult,
  BrowserFrameSnapshot,
} from "../../../../../shared/browser/browser-frame-contract";
import { buildPageContextFromFrameHtml } from "../context/build-page-context";
import { useWebOperatorPageContext } from "../context/use-web-operator-page-context";

export interface PageFrameHtmlInspectorProps {
  selectedFrameId: string | null;
  frames: BrowserFrameSnapshot[];
}

function stringifySafe(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Full-document HTML → body innerHTML only; fragments without <body> are unchanged. */
function extractBodyInnerHtml(html: string): string {
  const trimmed = html.trim();

  if (!trimmed || !/<body\b/i.test(trimmed)) {
    return html;
  }

  try {
    const doc = new DOMParser().parseFromString(trimmed, "text/html");
    if (doc.querySelector("parsererror")) {
      return html;
    }
    return doc.body?.innerHTML ?? html;
  } catch {
    const match = trimmed.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    return match?.[1] ?? html;
  }
}

export function PageFrameHtmlInspector({
  selectedFrameId,
  frames,
}: PageFrameHtmlInspectorProps): React.JSX.Element {
  const [selector, setSelector] = useState("");
  const [outer, setOuter] = useState(true);
  const [maxLength, setMaxLength] = useState(100_000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BrowserFrameHtmlResult | null>(null);

  const { setPageContext } = useWebOperatorPageContext();

  const frame = useMemo(
    () => frames.find((f) => f.frameId === selectedFrameId) ?? null,
    [frames, selectedFrameId],
  );

  const run = useCallback(async (): Promise<void> => {
    if (!selectedFrameId) return;
    const api = window.aiosBrowser as unknown as {
      getFrameHtml?: (input: {
        frameId: string;
        selector?: string;
        outer?: boolean;
        maxLength?: number;
      }) => Promise<BrowserFrameHtmlResult>;
    };
    if (typeof api.getFrameHtml !== "function") {
      setResult({
        ok: false,
        frameId: selectedFrameId,
        capturedAt: new Date().toISOString(),
        error: {
          code: "UNKNOWN_BROWSER_ERROR",
          message:
            "window.aiosBrowser.getFrameHtml is not available. Please fully restart Electron dev process to reload preload.",
        },
      });
      return;
    }
    setLoading(true);
    try {
      const next = await api.getFrameHtml({
        frameId: selectedFrameId,
        selector: selector.trim() || undefined,
        outer,
        maxLength,
      });
      setResult(next);
      if (next.ok && frame) {
        const excerpt = extractBodyInnerHtml(next.html ?? "");
        const ctx = buildPageContextFromFrameHtml({
          frame,
          result: next,
          htmlExcerpt: excerpt,
        });
        if (ctx) setPageContext(ctx);
      }
    } finally {
      setLoading(false);
    }
  }, [frame, maxLength, outer, selector, selectedFrameId, setPageContext]);

  const displayHtml = useMemo(() => {
    if (!result?.ok || !result.html) return null;
    return extractBodyInnerHtml(result.html);
  }, [result]);

  const copyHtml = useCallback(async (): Promise<void> => {
    if (!displayHtml) return;
    await navigator.clipboard.writeText(displayHtml);
  }, [displayHtml]);

  const metaText = useMemo(() => {
    if (!frame) return "";
    return stringifySafe({
      frameId: frame.frameId,
      name: frame.name,
      title: frame.title,
      url: frame.url,
      origin: frame.origin,
      path: frame.path,
      sameOriginWithParent: frame.sameOriginWithParent,
    });
  }, [frame]);

  return (
    <div className="px-3 py-2 border-b border-neutral-800 flex flex-col gap-2 shrink-0">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500 flex items-center gap-1">
          <FileCode2 size={14} className="text-neutral-500" />
          Frame HTML
        </p>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading || !selectedFrameId}
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200 text-xs disabled:opacity-50 disabled:hover:bg-neutral-700"
        >
          <Play size={12} />
          {loading ? "Getting…" : "Get HTML"}
        </button>
      </div>

      {frame ? (
        <pre className="rounded bg-neutral-950 p-2 text-[11px] text-neutral-300 overflow-auto max-h-32">
          {metaText}
        </pre>
      ) : (
        <p className="text-xs text-neutral-600">Select a frame to inspect.</p>
      )}

      <div className="flex items-center gap-2">
        <input
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
          placeholder="Optional selector (empty = whole document)"
          className="flex-1 min-w-0 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 placeholder:text-neutral-600"
        />
        <label className="flex items-center gap-1 text-xs text-neutral-400 select-none">
          <input
            type="checkbox"
            checked={outer}
            onChange={(e) => setOuter(e.target.checked)}
          />
          outer
        </label>
        <input
          type="number"
          value={maxLength}
          min={1000}
          max={500000}
          step={1000}
          onChange={(e) => setMaxLength(Number(e.target.value) || 100_000)}
          className="w-24 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200"
          title="maxLength"
        />
      </div>

      {result ? (
        <div className="rounded border border-neutral-800 bg-neutral-950">
          <div className="flex items-center justify-between px-2 py-1 border-b border-neutral-800">
            <p className="text-[11px] text-neutral-400">
              {result.ok ? "OK" : "ERROR"} · {result.capturedAt}
              {result.source ? ` · ${result.source}` : ""}
              {result.truncated ? " · truncated" : ""}
            </p>
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-300 text-[11px] disabled:opacity-50"
              disabled={!result.ok || !displayHtml}
              onClick={() => void copyHtml()}
              title="Copy HTML"
            >
              <Copy size={12} />
              Copy
            </button>
          </div>
          {result.ok ? (
            <pre className="p-2 text-[11px] text-neutral-200 overflow-auto max-h-48">
              {displayHtml}
            </pre>
          ) : (
            <pre className="p-2 text-[11px] text-rose-300 overflow-auto max-h-48">
              {stringifySafe(result.error)}
            </pre>
          )}
        </div>
      ) : null}
    </div>
  );
}

