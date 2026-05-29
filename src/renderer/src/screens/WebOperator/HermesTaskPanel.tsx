import { ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { WebOperatorHermesChatPanel } from "../../components/hermes";
import { useWebOperatorPageContext } from "./context/use-web-operator-page-context";
import { usePendingActions } from "./hooks/use-pending-actions";

interface HermesTaskPanelProps {
  className?: string;
}

export function HermesTaskPanel({ className }: HermesTaskPanelProps) {
  const { pageContext } = useWebOperatorPageContext();
  const { pendingActions, confirmAction, rejectAction } = usePendingActions();

  return (
    <div className={`flex flex-col h-full min-h-0 ${className ?? ""}`}>
      <WebOperatorHermesChatPanel
        className="flex-1 min-h-0"
        pageContext={pageContext}
      />
      {/*
      <div className="flex-shrink-0 border-t border-neutral-700 max-h-40 overflow-y-auto">
        <div className="px-3 py-2 border-b border-neutral-800">
          <h4 className="text-xs font-medium text-neutral-400">Pending Actions</h4>
        </div>
        <div className="px-3 py-2 space-y-2">
          {pendingActions.length === 0 ? (
            <p className="text-xs text-neutral-500">No pending actions</p>
          ) : (
            pendingActions.map((action) => {
              const isExpired = new Date(action.expiresAt) < new Date();
              return (
                <div
                  key={action.pendingActionId}
                  className="rounded border border-neutral-700 bg-neutral-800 p-2"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldAlert
                      size={12}
                      className={isExpired ? "text-neutral-500" : "text-yellow-500"}
                    />
                    <span className="text-xs font-medium text-neutral-300">{action.action}</span>
                    {isExpired && (
                      <span className="text-xs text-neutral-500 ml-auto">Expired</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mb-1">Selector: {action.selector}</p>
                  <p className="text-xs text-neutral-400 mb-2 truncate">URL: {action.url}</p>
                  {!isExpired && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => confirmAction(action.pendingActionId)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-green-700 hover:bg-green-600 text-white text-xs"
                      >
                        <CheckCircle size={12} /> Confirm
                      </button>
                      <button
                        type="button"
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
      */}
    </div>
  );
}
