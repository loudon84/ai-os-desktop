import { useState, useEffect } from "react";
import { useI18n } from "../useI18n";
import {
  FolderOpen,
  GitBranch,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Spinner,
  X,
} from "../../assets/icons";
import {
  PipMirrorFields,
  createDefaultPipMirrorSelection,
} from "../install/PipMirrorFields";

type WizardStage =
  | "detect"
  | "select-source"
  | "installing"
  | "verifying"
  | "completed"
  | "error";

interface WizardState {
  stage: WizardStage;
  agentInstalled: boolean;
  agentPath?: string;
  error?: string;
}

interface InstallProgress {
  stage: string;
  message: string;
}

type SourceType = "local-zip" | "git-clone";

interface InstallWizardProps {
  onComplete: () => void;
  onCancel?: () => void;
}

function InstallWizard({
  onComplete,
  onCancel,
}: InstallWizardProps): React.JSX.Element {
  const { t } = useI18n();
  const [state, setState] = useState<WizardState>({
    stage: "detect",
    agentInstalled: false,
  });
  const [progress, setProgress] = useState<InstallProgress>({
    stage: "",
    message: "",
  });
  const [sourceType, setSourceType] = useState<SourceType>("local-zip");
  const [localZipPath, setLocalZipPath] = useState("");
  const [gitUrl, setGitUrl] = useState(
    "https://github.com/NousResearch/hermes-agent.git",
  );
  const [gitBranch, setGitBranch] = useState("main");
  const [gitShallow, setGitShallow] = useState(true);
  const [pipMirror, setPipMirror] = useState(createDefaultPipMirrorSelection);
  const [error, setError] = useState("");

  useEffect(() => {
    detectAgent();
  }, []);

  useEffect(() => {
    const cleanup = window.hermesAPI.onInstallProgress?.((p) => {
      setProgress({ stage: String(p.step), message: p.detail || p.title });
    });
    return () => {
      cleanup?.();
    };
  }, []);

  async function detectAgent(): Promise<void> {
    try {
      const result = await window.hermesAPI.firstRunWizardDetectAgent();
      if (result.agentInstalled) {
        setState({
          stage: "completed",
          agentInstalled: true,
          agentPath: result.agentPath,
        });
      } else {
        setState({ stage: "select-source", agentInstalled: false });
      }
    } catch {
      setState({ stage: "select-source", agentInstalled: false });
    }
  }

  async function handleBrowse(): Promise<void> {
    try {
      const result = await window.hermesAPI.showOpenDialog({
        title: "Select Hermes Agent ZIP",
        filters: [{ name: "ZIP", extensions: ["zip"] }],
        properties: ["openFile"],
      });
      if (result && !result.canceled && result.filePaths.length > 0) {
        setLocalZipPath(result.filePaths[0]);
        setError("");
      }
    } catch {
      /* non-fatal */
    }
  }

  async function handleStartInstall(): Promise<void> {
    if (sourceType === "local-zip" && !localZipPath.trim()) {
      setError(t("install.zipPathRequired") || "Please select a ZIP file");
      return;
    }
    if (sourceType === "git-clone" && !gitUrl.trim()) {
      setError(t("install.gitUrlRequired") || "Please enter a Git URL");
      return;
    }
    if (pipMirror.pipMirrorPreset === "custom" && !pipMirror.pipIndexUrl.trim()) {
      setError(t("install.pipMirrorUrlRequired") || "Please enter a PyPI mirror URL");
      return;
    }

    setError("");
    setState({ ...state, stage: "installing" });

    const config = {
      sourceType,
      localZipPath: sourceType === "local-zip" ? localZipPath : undefined,
      gitUrl: sourceType === "git-clone" ? gitUrl : undefined,
      gitBranch: sourceType === "git-clone" ? gitBranch : undefined,
      gitShallow: sourceType === "git-clone" ? gitShallow : undefined,
      pipMirrorPreset: pipMirror.pipMirrorPreset,
      pipIndexUrl: pipMirror.pipIndexUrl,
      trustedHost: pipMirror.trustedHost,
    };

    try {
      const result = await window.hermesAPI.startInstallWithSource(config);
      if (result.success) {
        setState({ stage: "completed", agentInstalled: true });
      } else {
        setState({
          stage: "error",
          agentInstalled: false,
          error: result.error,
        });
      }
    } catch (err) {
      setState({
        stage: "error",
        agentInstalled: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  function handleRetry(): void {
    setState({
      stage: "select-source",
      agentInstalled: false,
      error: undefined,
    });
    setError("");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("install.agentSourceTitle") || "Install SmartCopilot"}
          </h1>
          {onCancel && (
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={onCancel}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {state.stage === "detect" && (
          <div className="flex items-center gap-3 text-gray-500">
            <Spinner className="w-5 h-5 animate-spin" />
            <span>{t("install.detecting") || "Detecting installation..."}</span>
          </div>
        )}

        {state.stage === "select-source" && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("install.agentSourceDesc") ||
                "Select how to obtain the agent source code"}
            </p>

            <div className="space-y-3">
              <button
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  sourceType === "local-zip"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setSourceType("local-zip")}
              >
                <FolderOpen className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {t("install.fromLocalZip") || "From Local ZIP"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("install.fromLocalZipDesc") ||
                      "Select a local ZIP file, no network needed"}
                  </div>
                </div>
              </button>

              <button
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  sourceType === "git-clone"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setSourceType("git-clone")}
              >
                <GitBranch className="w-6 h-6 text-green-500 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {t("install.fromGitClone") || "From Git Repository"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("install.fromGitCloneDesc") ||
                      "Clone from GitHub or private repo"}
                  </div>
                </div>
              </button>
            </div>

            {sourceType === "local-zip" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("install.zipFilePath") || "ZIP File Path"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    value={localZipPath}
                    onChange={(e) => {
                      setLocalZipPath(e.target.value);
                      setError("");
                    }}
                    placeholder="C:\path\to\hermes-agent.zip"
                  />
                  <button className="btn btn-secondary" onClick={handleBrowse}>
                    {t("install.browse") || "Browse"}
                  </button>
                </div>
              </div>
            )}

            {sourceType === "git-clone" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("install.gitUrl") || "Git URL"}
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={gitUrl}
                    onChange={(e) => {
                      setGitUrl(e.target.value);
                      setError("");
                    }}
                    placeholder="https://github.com/user/hermes-agent.git"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("install.gitBranch") || "Branch"}
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={gitBranch}
                      onChange={(e) => setGitBranch(e.target.value)}
                      placeholder="main"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gitShallow}
                        onChange={(e) => setGitShallow(e.target.checked)}
                      />
                      {t("install.shallowClone") || "Shallow"}
                    </label>
                  </div>
                </div>
              </div>
            )}

            <PipMirrorFields value={pipMirror} onChange={setPipMirror} />

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              onClick={handleStartInstall}
            >
              {t("install.startInstall") || "Start Install"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {state.stage === "installing" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Spinner className="w-5 h-5 animate-spin text-blue-500" />
              <span>{t("install.installing") || "Installing..."}</span>
            </div>
            {progress.message && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {progress.message}
              </p>
            )}
            <button
              className="btn btn-secondary w-full"
              onClick={() => setState({ ...state, stage: "select-source" })}
            >
              {t("common.cancel") || "Cancel"}
            </button>
          </div>
        )}

        {state.stage === "verifying" && (
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Spinner className="w-5 h-5 animate-spin text-blue-500" />
            <span>{t("install.verifying") || "Verifying installation..."}</span>
          </div>
        )}

        {state.stage === "completed" && (
          <div className="space-y-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("install.completed") || "Installation Complete"}
            </h2>
            <button className="btn btn-primary w-full" onClick={onComplete}>
              {t("install.launchApp") || "Launch SmartCopilot"}
            </button>
          </div>
        )}

        {state.stage === "error" && (
          <div className="space-y-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("install.failed") || "Installation Failed"}
            </h2>
            {state.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}
            <button className="btn btn-primary w-full" onClick={handleRetry}>
              {t("install.retry") || "Retry"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { InstallWizard };
