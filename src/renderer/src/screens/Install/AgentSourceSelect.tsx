import { useState } from "react";
import { useI18n } from "../../components/useI18n";
import {
  FolderOpen,
  GitBranch,
  ArrowRight,
  AlertTriangle,
} from "../../assets/icons";
import {
  PipMirrorFields,
  createDefaultPipMirrorSelection,
  type PipMirrorSelection,
} from "../../components/install/PipMirrorFields";

export type AgentSourceType = "local-zip" | "git-clone";

export interface AgentSourceConfig {
  sourceType: AgentSourceType;
  localZipPath: string;
  gitUrl: string;
  gitBranch: string;
  gitShallow: boolean;
  pipMirrorPreset: PipMirrorSelection["pipMirrorPreset"];
  pipIndexUrl: string;
  trustedHost: string;
}

interface AgentSourceSelectProps {
  onConfirm: (config: AgentSourceConfig) => void;
  onCancel?: () => void;
}

function AgentSourceSelect({ onConfirm, onCancel }: AgentSourceSelectProps): React.JSX.Element {
  const { t } = useI18n();
  const [sourceType, setSourceType] = useState<AgentSourceType>("local-zip");
  const [localZipPath, setLocalZipPath] = useState("");
  const [gitUrl, setGitUrl] = useState("https://github.com/NousResearch/hermes-agent.git");
  const [gitBranch, setGitBranch] = useState("main");
  const [gitShallow, setGitShallow] = useState(true);
  const [pipMirror, setPipMirror] = useState(createDefaultPipMirrorSelection);
  const [error, setError] = useState("");

  async function handleBrowse(): Promise<void> {
    try {
      const path = await window.hermesAPI.showOpenDialog({
        title: t("install.selectAgentZip") || "选择 hermes-agent.zip",
        filters: [{ name: "ZIP", extensions: ["zip"] }],
        properties: ["openFile"],
      });
      if (path && !path.canceled && path.filePaths.length > 0) {
        setLocalZipPath(path.filePaths[0]);
        setError("");
      }
    } catch { /* non-fatal */ }
  }

  function handleConfirm(): void {
    if (
      pipMirror.pipMirrorPreset === "custom" &&
      !pipMirror.pipIndexUrl.trim()
    ) {
      setError(t("install.pipMirrorUrlRequired") || "请填写 PyPI 镜像地址");
      return;
    }

    if (sourceType === "local-zip") {
      if (!localZipPath.trim()) {
        setError(t("install.zipPathRequired") || "请选择或输入 zip 文件路径");
        return;
      }
    } else {
      if (!gitUrl.trim()) {
        setError(t("install.gitUrlRequired") || "请输入 Git 仓库地址");
        return;
      }
    }
    setError("");
    onConfirm({
      sourceType,
      localZipPath,
      gitUrl,
      gitBranch,
      gitShallow,
      pipMirrorPreset: pipMirror.pipMirrorPreset,
      pipIndexUrl: pipMirror.pipIndexUrl,
      trustedHost: pipMirror.trustedHost,
    });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("install.agentSourceTitle") || "安装 SMC Copilot"}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("install.agentSourceDesc") || "选择 SMC Copilot 源码的获取方式"}
          </p>
        </div>

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
                {t("install.fromLocalZip") || "从本地 ZIP 文件"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t("install.fromLocalZipDesc") || "选择本地的 hermes-agent.zip 解压安装，无需网络"}
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
                {t("install.fromGitClone") || "从 Git 仓库克隆"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t("install.fromGitCloneDesc") || "从 GitHub 或私有 Git 仓库克隆源码，需要网络和 Git"}
              </div>
            </div>
          </button>
        </div>

        {sourceType === "local-zip" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("install.zipFilePath") || "ZIP 文件路径"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                value={localZipPath}
                onChange={(e) => { setLocalZipPath(e.target.value); setError(""); }}
                placeholder="C:\path\to\hermes-agent.zip"
              />
              <button className="btn btn-secondary" onClick={handleBrowse}>
                {t("install.browse") || "浏览"}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {t("install.zipHint") || "支持官方发布包或内部构建的 hermes-agent.zip"}
            </p>
          </div>
        )}

        {sourceType === "git-clone" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("install.gitUrl") || "Git 仓库地址"}
              </label>
              <input
                type="text"
                className="input w-full"
                value={gitUrl}
                onChange={(e) => { setGitUrl(e.target.value); setError(""); }}
                placeholder="https://github.com/user/hermes-agent.git"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("install.gitBranch") || "分支"}
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
                  {t("install.shallowClone") || "浅克隆"}
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

        <div className="flex gap-3">
          {onCancel && (
            <button className="btn btn-secondary flex-1" onClick={onCancel}>
              {t("common.cancel") || "取消"}
            </button>
          )}
          <button
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={handleConfirm}
          >
            {t("install.startInstall") || "开始安装"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { AgentSourceSelect };
