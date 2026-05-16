import { useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Globe, ShieldCheck, ShieldX } from "lucide-react";
import { useBrowserActions } from "./hooks/use-browser-actions";

interface BrowserToolbarProps {
  onNavigate?: (url: string) => void;
  currentUrl?: string;
  isDomainAllowed?: boolean;
}

export function BrowserToolbar({ onNavigate, currentUrl = "", isDomainAllowed }: BrowserToolbarProps) {
  const [url, setUrl] = useState(currentUrl);
  const actions = useBrowserActions();

  const handleNavigate = async () => {
    if (!url.trim()) return;
    const result = await actions.open(url.trim());
    if (result.ok && onNavigate) {
      onNavigate(url.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleNavigate();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-700 bg-neutral-900">
      <button
        onClick={() => actions.back()}
        className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
        title="Back"
      >
        <ArrowLeft size={16} />
      </button>
      <button
        onClick={() => actions.forward()}
        className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
        title="Forward"
      >
        <ArrowRight size={16} />
      </button>
      <button
        onClick={() => actions.reload()}
        className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
        title="Reload"
      >
        <RotateCw size={16} />
      </button>

      <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded px-2 py-1">
        <Globe size={14} className="text-neutral-500 shrink-0" />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL..."
          className="flex-1 bg-transparent text-sm text-neutral-200 placeholder-neutral-500 outline-none"
        />
        {isDomainAllowed !== undefined && (
          isDomainAllowed
            ? <ShieldCheck size={14} className="text-green-500 shrink-0" />
            : <ShieldX size={14} className="text-red-500 shrink-0" />
        )}
      </div>

      <button
        onClick={handleNavigate}
        disabled={actions.isLoading}
        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50"
      >
        Open
      </button>
    </div>
  );
}
