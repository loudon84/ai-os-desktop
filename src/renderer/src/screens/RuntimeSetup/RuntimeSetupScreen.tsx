import { useState, useEffect, useCallback } from "react";
import { useI18n } from "../../components/useI18n";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wrench,
  Download,
  ChevronDown,
  ChevronRight,
} from "../../assets/icons";

interface DoctorCheck {
  id: string;
  name: string;
  status: "pass" | "fail" | "warn" | "error" | "skip";
  message: string;
  detail?: string;
  repairHint?: string;
  errorCode?: string;
}

interface RuntimeSetupState {
  platform: string;
  arch: string;
  installMode: string;
  hermesVersion: string | null;
  pythonVersion: string | null;
  nodeVersion: string | null;
  gatewayStatus: "running" | "stopped" | "unknown";
  apiServerPort: number | null;
  doctorChecks: DoctorCheck[];
  doctorLoading: boolean;
  doctorRanAt: string | null;
  installJobId: string | null;
  installJobStatus: string | null;
  installProgress: number;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pass: <CheckCircle className="w-4 h-4 text-green-500" />,
  fail: <XCircle className="w-4 h-4 text-red-500" />,
  warn: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  skip: <span className="w-4 h-4 text-gray-400 text-xs flex items-center justify-center">—</span>,
};

function RuntimeSetupScreen(): React.JSX.Element {
  const { t } = useI18n();
  const [state, setState] = useState<RuntimeSetupState>({
    platform: navigator.platform || "unknown",
    arch: "unknown",
    installMode: "windows-native",
    hermesVersion: null,
    pythonVersion: null,
    nodeVersion: null,
    gatewayStatus: "unknown",
    apiServerPort: null,
    doctorChecks: [],
    doctorLoading: false,
    doctorRanAt: null,
    installJobId: null,
    installJobStatus: null,
    installProgress: 0,
  });

  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

  const loadState = useCallback(async () => {
    try {
      const installStatus = await window.hermesAPI.checkInstallStatus();
      const gwRunning = await window.hermesAPI.gatewayStatus();
      setState((prev) => ({
        ...prev,
        gatewayStatus: gwRunning ? "running" : "stopped",
        hermesVersion: installStatus.installed ? "detected" : null,
      }));
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  async function runDoctor(): Promise<void> {
    setState((prev) => ({ ...prev, doctorLoading: true, doctorChecks: [] }));
    try {
      const report = await window.hermesAPI.runDoctor();
      setState((prev) => ({
        ...prev,
        doctorChecks: report?.checks || [],
        doctorRanAt: report?.createdAt || new Date().toISOString(),
        doctorLoading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, doctorLoading: false }));
    }
  }

  async function runRepair(errorCode?: string): Promise<void> {
    try {
      await window.hermesAPI.runRepair(errorCode);
      await runDoctor();
    } catch { /* non-fatal */ }
  }

  async function reinstallRuntime(): Promise<void> {
    try {
      await window.hermesAPI.reinstallRuntime();
      loadState();
    } catch { /* non-fatal */ }
  }

  function toggleCheck(id: string): void {
    setExpandedChecks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const failedChecks = state.doctorChecks.filter((c) => c.status === "fail" || c.status === "error");
  const warnChecks = state.doctorChecks.filter((c) => c.status === "warn");

  return (
    <div className="settings-container overflow-y-auto">
      <h1 className="settings-header">{t("gateway.runtimeSetup") || "Runtime Setup"}</h1>

      <div className="settings-section">
        <div className="settings-section-title">{t("gateway.environment") || "Environment"}</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-gray-500">Platform</span>
            <span className="font-mono">{state.platform}</span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-gray-500">Install Mode</span>
            <span className="font-mono">{state.installMode}</span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-gray-500">Hermes Agent</span>
            <span className="font-mono">{state.hermesVersion || "not installed"}</span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-gray-500">Gateway</span>
            <span className={`font-mono ${state.gatewayStatus === "running" ? "text-green-600" : "text-red-500"}`}>
              {state.gatewayStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="flex items-center justify-between mb-3">
          <div className="settings-section-title mb-0">
            {t("gateway.diagnostics") || "Diagnostics"}
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary btn-sm flex items-center gap-1"
              onClick={runDoctor}
              disabled={state.doctorLoading}
            >
              <RefreshCw className={`w-3 h-3 ${state.doctorLoading ? "animate-spin" : ""}`} />
              {t("gateway.runDoctor") || "Run Doctor"}
            </button>
            {failedChecks.length > 0 && (
              <button
                className="btn btn-primary btn-sm flex items-center gap-1"
                onClick={() => runRepair()}
              >
                <Wrench className="w-3 h-3" />
                {t("gateway.oneClickRepair") || "One-Click Repair"}
              </button>
            )}
          </div>
        </div>

        {state.doctorRanAt && (
          <div className="text-xs text-gray-400 mb-2">
            Last run: {new Date(state.doctorRanAt).toLocaleString()}
            {" "}&middot; {failedChecks.length} failed, {warnChecks.length} warnings
          </div>
        )}

        {state.doctorChecks.length === 0 && !state.doctorLoading && (
          <div className="text-sm text-gray-400 py-4 text-center">
            Click "Run Doctor" to check runtime status
          </div>
        )}

        {state.doctorLoading && (
          <div className="text-sm text-gray-400 py-4 text-center animate-pulse">
            Running diagnostics...
          </div>
        )}

        <div className="space-y-1">
          {state.doctorChecks.map((check) => (
            <div key={check.id} className="border border-gray-200 dark:border-gray-700 rounded">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => toggleCheck(check.id)}
              >
                {STATUS_ICONS[check.status]}
                <span className="font-medium flex-1">{check.name}</span>
                <span className="text-gray-400 text-xs truncate max-w-[40%]">{check.message}</span>
                {expandedChecks.has(check.id) ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </button>
              {expandedChecks.has(check.id) && (
                <div className="px-3 pb-2 text-xs space-y-1 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-gray-600 dark:text-gray-300">{check.message}</div>
                  {check.errorCode && (
                    <div className="font-mono text-red-500">Error: {check.errorCode}</div>
                  )}
                  {check.repairHint && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded font-mono">
                      Fix: {check.repairHint}
                    </div>
                  )}
                  {check.detail && (
                    <div className="text-gray-400 font-mono whitespace-pre-wrap">{check.detail}</div>
                  )}
                  {(check.status === "fail" || check.status === "error") && (
                    <button
                      className="btn btn-secondary btn-sm mt-1"
                      onClick={() => runRepair(check.errorCode)}
                    >
                      <Wrench className="w-3 h-3" /> Repair
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{t("gateway.actions") || "Actions"}</div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary btn-sm flex items-center gap-1"
            onClick={reinstallRuntime}
          >
            <Download className="w-3 h-3" />
            {t("gateway.reinstallRuntime") || "Reinstall Runtime"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { RuntimeSetupScreen };
