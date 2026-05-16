import { useBrowserState } from "./hooks/use-browser-state";
import { RefreshCw } from "lucide-react";

interface BrowserStatePanelProps {
  className?: string;
}

export function BrowserStatePanel({ className }: BrowserStatePanelProps) {
  const { state, isLoading, error, refresh } = useBrowserState();

  return (
    <div className={`flex flex-col h-full ${className ?? ""}`}>
      <div className="px-3 py-2 border-b border-neutral-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">Page State</h3>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {error && <p className="text-xs text-red-400">{error}</p>}

        {state ? (
          <>
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">Title</p>
              <p className="text-sm text-neutral-200">{state.title}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">URL</p>
              <p className="text-xs text-neutral-300 break-all">{state.url}</p>
            </div>

            {state.inputs.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500 mb-1">Inputs ({state.inputs.length})</p>
                {state.inputs.map((el, i) => (
                  <div key={i} className="text-xs text-neutral-400 py-0.5 border-b border-neutral-800">
                    <span className="text-neutral-300">{el.selectorHint ?? el.name ?? el.id ?? `input[${i}]`}</span>
                    {el.type && <span className="ml-1 text-neutral-500">({el.type})</span>}
                    {el.placeholder && <span className="ml-1 text-neutral-500">"{el.placeholder}"</span>}
                  </div>
                ))}
              </div>
            )}

            {state.buttons.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500 mb-1">Buttons ({state.buttons.length})</p>
                {state.buttons.map((el, i) => (
                  <div key={i} className="text-xs text-neutral-400 py-0.5 border-b border-neutral-800">
                    <span className="text-neutral-300">{el.text ?? el.selectorHint ?? `button[${i}]`}</span>
                    {el.type && <span className="ml-1 text-neutral-500">({el.type})</span>}
                  </div>
                ))}
              </div>
            )}

            {state.links.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500 mb-1">Links ({state.links.length})</p>
                {state.links.slice(0, 20).map((link, i) => (
                  <div key={i} className="text-xs py-0.5 border-b border-neutral-800">
                    <span className="text-neutral-300">{link.text || "untitled"}</span>
                    <span className="block text-neutral-500 truncate">{link.href}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          !error && !isLoading && (
            <p className="text-xs text-neutral-500">No page loaded</p>
          )
        )}
      </div>
    </div>
  );
}
