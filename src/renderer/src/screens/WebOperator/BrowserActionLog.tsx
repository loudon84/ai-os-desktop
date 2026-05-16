import { useAuditLog } from "./hooks/use-audit-log";
import type { BrowserActionSource, BrowserActionStatus } from "../../../../../shared/browser/browser-contract";

interface BrowserActionLogProps {
  className?: string;
}

export function BrowserActionLog({ className }: BrowserActionLogProps) {
  const { records, filterSource, setFilterSource, filterStatus, setFilterStatus } = useAuditLog();

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <div className="px-3 py-2 border-b border-neutral-700">
        <h3 className="text-sm font-medium text-neutral-300 mb-1">Action Log</h3>
        <div className="flex gap-2">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as BrowserActionSource | "all")}
            className="bg-neutral-800 rounded px-1.5 py-0.5 text-xs text-neutral-300 outline-none"
          >
            <option value="all">All sources</option>
            <option value="user">User</option>
            <option value="hermes">Hermes</option>
            <option value="system">System</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as BrowserActionStatus | "all")}
            className="bg-neutral-800 rounded px-1.5 py-0.5 text-xs text-neutral-300 outline-none"
          >
            <option value="all">All status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="blocked">Blocked</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="timeout">Timeout</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {records.length === 0 ? (
          <p className="text-xs text-neutral-500 py-2">No audit records</p>
        ) : (
          records.map((record) => (
            <div key={record.id} className="text-xs py-1 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 tabular-nums">
                  {new Date(record.time).toLocaleTimeString()}
                </span>
                <span className={`font-mono ${
                  record.status === "success" ? "text-green-500" :
                  record.status === "failed" ? "text-red-500" :
                  record.status === "blocked" ? "text-yellow-500" :
                  "text-neutral-400"
                }`}>
                  {record.status}
                </span>
                <span className="text-neutral-400">{record.action}</span>
                <span className="text-neutral-500 ml-auto">{record.source}</span>
              </div>
              {record.errorCode && (
                <p className="text-red-400 mt-0.5">{record.errorCode}: {record.message}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
