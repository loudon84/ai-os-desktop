import { useState } from "react";
import { Camera, Save } from "lucide-react";

interface ScreenshotPanelProps {
  className?: string;
}

export function ScreenshotPanel({ className }: ScreenshotPanelProps) {
  const [base64, setBase64] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [persistEnabled, setPersistEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = async () => {
    setIsCapturing(true);
    setError(null);
    try {
      const result = await window.aiosBrowser.screenshot();
      if (result.ok && result.base64) {
        setBase64(result.base64);
      } else {
        setError(result.message ?? "Screenshot failed");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <div className="px-3 py-2 border-b border-neutral-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">Screenshot</h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={persistEnabled}
              onChange={(e) => setPersistEnabled(e.target.checked)}
              className="rounded"
            />
            <Save size={12} />
          </label>
          <button
            onClick={capture}
            disabled={isCapturing}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
          >
            <Camera size={14} className={isCapturing ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>

      <div className="px-3 py-2">
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        {base64 ? (
          <img
            src={`data:image/png;base64,${base64}`}
            alt="Screenshot"
            className="w-full rounded border border-neutral-700"
          />
        ) : (
          <p className="text-xs text-neutral-500">No screenshot captured</p>
        )}
      </div>
    </div>
  );
}
