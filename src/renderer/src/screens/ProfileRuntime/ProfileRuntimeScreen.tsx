import { useState, useEffect } from "react";
import { useI18n } from "../../components/useI18n";
import type { ProfileSummary, ProfileGatewayState } from "../../../../shared/profile-runtime/profile-runtime-contract";
import {
  LayoutDashboard,
  Play,
  Square,
  RotateCw,
  PlayCircle,
  SquareCircle,
  Upload,
  Circle,
  FileText,
} from "../../assets/icons";
import { LogViewer } from "./LogViewer";

export function ProfileRuntimeScreen() {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [runtimeStatus, setRuntimeStatus] = useState<ProfileGatewayState[]>([]);
  const [loading, setLoading] = useState(false);
  const [logProfileId, setLogProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const [p, s] = await Promise.all([
        window.profileRuntime.listProfiles(),
        window.profileRuntime.getRuntimeStatus(),
      ]);
      setProfiles(p);
      setRuntimeStatus(s);
    } catch { /* ignore */ }
  }

  async function handleStart(profileId: string) {
    setLoading(true);
    try { await window.profileRuntime.startProfile(profileId); } catch { /* ignore */ }
    await loadProfiles();
    setLoading(false);
  }

  async function handleStop(profileId: string) {
    setLoading(true);
    try { await window.profileRuntime.stopProfile(profileId); } catch { /* ignore */ }
    await loadProfiles();
    setLoading(false);
  }

  async function handleRestart(profileId: string) {
    setLoading(true);
    try { await window.profileRuntime.restartProfile(profileId); } catch { /* ignore */ }
    await loadProfiles();
    setLoading(false);
  }

  async function handleStartAll() {
    setLoading(true);
    try { await window.profileRuntime.startAllProfiles(); } catch { /* ignore */ }
    await loadProfiles();
    setLoading(false);
  }

  async function handleStopAll() {
    setLoading(true);
    try { await window.profileRuntime.stopAllProfiles(); } catch { /* ignore */ }
    await loadProfiles();
    setLoading(false);
  }

  async function handleImportConfig() {
    const result = await window.profileRuntime.importConfig("");
    if (result.importedCount > 0) await loadProfiles();
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "running": return "text-green-500";
      case "starting": return "text-yellow-500";
      case "stopping": return "text-yellow-500";
      case "failed": return "text-red-500";
      default: return "text-gray-400";
    }
  }

  const statusMap = new Map(runtimeStatus.map((s) => [s.profileId, s]));

  return (
    <div className="flex flex-col h-full p-6 gap-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profile Runtime</h1>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            onClick={handleImportConfig}
          >
            <Upload size={14} /> Import
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
            onClick={handleStartAll}
            disabled={loading}
          >
            <PlayCircle size={14} /> Start All
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
            onClick={handleStopAll}
            disabled={loading}
          >
            <SquareCircle size={14} /> Stop All
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {profiles.map((profile) => {
          const status = statusMap.get(profile.id);
          const runtimeStatus = profile.runtime_status;
          const isRunning = runtimeStatus === "running";
          const isTransitioning = runtimeStatus === "starting" || runtimeStatus === "stopping";

          return (
            <div key={profile.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <Circle size={10} className={getStatusColor(runtimeStatus)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{profile.display_name}</span>
                  <span className="text-xs text-gray-400">({profile.name})</span>
                  <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded">{profile.role}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Port {profile.port} · {runtimeStatus}
                  {status?.pid && ` · PID ${status.pid}`}
                </div>
                {status?.lastError && (
                  <div className="text-xs text-red-400 mt-0.5 truncate" title={status.lastError}>
                    {status.lastError}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  className="p-1.5 text-gray-400 hover:bg-gray-700 rounded"
                  onClick={() => setLogProfileId(profile.id)}
                  title="View Logs"
                >
                  <FileText size={14} />
                </button>
                {!isRunning && !isTransitioning && (
                  <button
                    className="p-1.5 text-green-400 hover:bg-green-900/30 rounded"
                    onClick={() => handleStart(profile.id)}
                    disabled={loading}
                    title="Start"
                  >
                    <Play size={14} />
                  </button>
                )}
                {isRunning && (
                  <button
                    className="p-1.5 text-red-400 hover:bg-red-900/30 rounded"
                    onClick={() => handleStop(profile.id)}
                    disabled={loading}
                    title="Stop"
                  >
                    <Square size={14} />
                  </button>
                )}
                {isRunning && (
                  <button
                    className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded"
                    onClick={() => handleRestart(profile.id)}
                    disabled={loading}
                    title="Restart"
                  >
                    <RotateCw size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {profiles.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          No profiles imported. Click "Import" to load profile-runtime.yaml
        </div>
      )}

      {logProfileId && (
        <LogViewer profileId={logProfileId} onClose={() => setLogProfileId(null)} />
      )}
    </div>
  );
}
