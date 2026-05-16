import { useState, useEffect, useRef } from "react";
import type { GatewayLogEntry, GatewayLogLevel } from "../../../../shared/profile-runtime/profile-runtime-contract";

interface LogViewerProps {
  profileId: string;
  onClose: () => void;
}

const LEVEL_COLORS: Record<GatewayLogLevel, string> = {
  stdout: "text-gray-300",
  stderr: "text-red-400",
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

const LEVELS: GatewayLogLevel[] = ["stdout", "stderr", "info", "warn", "error"];

export function LogViewer({ profileId, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<GatewayLogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<GatewayLogLevel | undefined>(undefined);
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 2000);
    return () => clearInterval(interval);
  }, [profileId, levelFilter]);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  async function loadLogs() {
    try {
      const entries = await window.profileRuntime.getGatewayLogs(profileId, {
        limit: 500,
        level: levelFilter,
      });
      setLogs(entries);
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col h-64 bg-gray-900 border-t border-gray-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
        <span className="text-xs font-medium text-gray-300">Gateway Logs — {profileId}</span>
        <div className="flex items-center gap-2">
          <select
            className="text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded px-1.5 py-0.5"
            value={levelFilter ?? ""}
            onChange={(e) => setLevelFilter((e.target.value || undefined) as GatewayLogLevel | undefined)}
          >
            <option value="">All Levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            Auto-scroll
          </label>
          <button
            className="text-xs text-gray-400 hover:text-white px-1"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto px-3 py-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-gray-500 py-4 text-center">No logs available</div>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className={`flex gap-2 leading-5 ${LEVEL_COLORS[entry.level]}`}>
              <span className="text-gray-600 shrink-0">{entry.timestamp.slice(11, 19)}</span>
              <span className="text-gray-600 shrink-0 w-12">[{entry.level}]</span>
              <span className="break-all">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
