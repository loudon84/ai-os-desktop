import { useState, useEffect, useCallback } from "react";
import { useI18n } from "../../components/useI18n";
import type { ProfileSummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import {
  LayoutDashboard,
  Send,
  Activity,
  Globe,
} from "../../assets/icons";

interface AIOSWorkspaceScreenProps {
  profile: string;
}

export function AIOSWorkspaceScreen({ profile }: AIOSWorkspaceScreenProps) {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [delegationTarget, setDelegationTarget] = useState<string>("");
  const [delegationMessage, setDelegationMessage] = useState("");
  const [delegationResult, setDelegationResult] = useState<string | null>(null);
  const [delegating, setDelegating] = useState(false);

  useEffect(() => {
    window.profileRuntime.listProfiles().then(setProfiles).catch(() => {});
  }, []);

  const handleDelegate = useCallback(async () => {
    if (!delegationTarget || !delegationMessage) return;
    setDelegating(true);
    setDelegationResult(null);
    try {
      const result = await window.profileRuntime.delegate({
        fromProfile: "default",
        toProfile: delegationTarget,
        message: delegationMessage,
      });
      setDelegationResult(result.ok ? result.response ?? "Success" : `Error: ${result.message}`);
    } catch (e) {
      setDelegationResult(`Error: ${String(e)}`);
    }
    setDelegating(false);
  }, [delegationTarget, delegationMessage]);

  const specialistProfiles = profiles.filter((p) => p.role === "specialist");

  return (
    <div className="flex h-full gap-4 p-4 overflow-auto">
      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-gray-900 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <LayoutDashboard size={18} /> AI-OS Main Control
        </h2>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Main chat with default profile — delegates to specialists</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-80 flex flex-col gap-3">
        {/* Profile Status */}
        <div className="bg-gray-900 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <Activity size={14} /> Specialist Status
          </h3>
          <div className="flex flex-col gap-1.5">
            {specialistProfiles.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${
                  p.runtime_status === "running" ? "bg-green-500" :
                  p.runtime_status === "failed" ? "bg-red-500" : "bg-gray-500"
                }`} />
                <span className="flex-1">{p.display_name}</span>
                <span className="text-gray-500">{p.runtime_status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delegation Panel */}
        <div className="bg-gray-900 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <Send size={14} /> Delegate Task
          </h3>
          <select
            className="w-full bg-gray-800 text-sm rounded px-2 py-1.5 mb-2"
            value={delegationTarget}
            onChange={(e) => setDelegationTarget(e.target.value)}
          >
            <option value="">Select target...</option>
            {specialistProfiles.map((p) => (
              <option key={p.id} value={p.name}>{p.display_name}</option>
            ))}
          </select>
          <textarea
            className="w-full bg-gray-800 text-sm rounded px-2 py-1.5 mb-2 resize-none"
            rows={3}
            placeholder="Task description..."
            value={delegationMessage}
            onChange={(e) => setDelegationMessage(e.target.value)}
          />
          <button
            className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={handleDelegate}
            disabled={delegating || !delegationTarget || !delegationMessage}
          >
            {delegating ? "Delegating..." : "Delegate"}
          </button>
          {delegationResult && (
            <div className="mt-2 text-xs bg-gray-800 rounded p-2 max-h-40 overflow-auto">
              {delegationResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
