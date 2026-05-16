import { useState } from "react";
import { Send, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { usePendingActions } from "./hooks/use-pending-actions";

interface HermesTaskPanelProps {
  className?: string;
}

export function HermesTaskPanel({ className }: HermesTaskPanelProps) {
  const [taskInput, setTaskInput] = useState("");
  const { pendingActions, confirmAction, rejectAction } = usePendingActions();

  const handleSendTask = () => {
    if (!taskInput.trim()) return;
    setTaskInput("");
  };

  return (
    <div className={`flex flex-col h-full ${className ?? ""}`}>
      <div className="px-3 py-2 border-b border-neutral-700">
        <h3 className="text-sm font-medium text-neutral-300">Hermes Task</h3>
      </div>

      <div className="px-3 py-2">
        <div className="flex gap-2">
          <textarea
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Describe task for Hermes..."
            className="flex-1 bg-neutral-800 rounded px-2 py-1 text-sm text-neutral-200 placeholder-neutral-500 outline-none resize-none"
            rows={3}
          />
          <button
            onClick={handleSendTask}
            className="self-end p-2 rounded bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {pendingActions.length === 0 ? (
          <p className="text-xs text-neutral-500">No pending actions</p>
        ) : (
          pendingActions.map((action) => {
            const isExpired = new Date(action.expiresAt) < new Date();
            return (
              <div key={action.pendingActionId} className="rounded border border-neutral-700 bg-neutral-800 p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldAlert size={12} className={isExpired ? "text-neutral-500" : "text-yellow-500"} />
                  <span className="text-xs font-medium text-neutral-300">{action.action}</span>
                  {isExpired && <span className="text-xs text-neutral-500 ml-auto">Expired</span>}
                </div>
                <p className="text-xs text-neutral-400 mb-1">Selector: {action.selector}</p>
                <p className="text-xs text-neutral-400 mb-2 truncate">URL: {action.url}</p>
                {!isExpired && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmAction(action.pendingActionId)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-green-700 hover:bg-green-600 text-white text-xs"
                    >
                      <CheckCircle size={12} /> Confirm
                    </button>
                    <button
                      onClick={() => rejectAction(action.pendingActionId)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
