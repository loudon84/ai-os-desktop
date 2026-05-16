import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

import { getDesktopAgentDir } from "./windows/path-resolver";

const isWindows = process.platform === "win32";

async function extractZip(zipPath: string, targetDir: string): Promise<void> {
  mkdirSync(targetDir, { recursive: true });

  if (isWindows) {
    execSync(
      `powershell -ExecutionPolicy Bypass -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${targetDir}' -Force"`,
      { encoding: "utf-8", timeout: 300000 },
    );
  } else {
    execSync(`unzip -o "${zipPath}" -d "${targetDir}"`, {
      encoding: "utf-8",
      timeout: 300000,
    });
  }
}

function isSingleSubdir(dir: string): string | null {
  const entries = readdirSync(dir).filter((e) => !e.startsWith("."));
  if (entries.length === 1) {
    const sub = join(dir, entries[0]);
    try {
      const stat = require("fs").statSync(sub);
      if (stat.isDirectory()) return sub;
    } catch { /* not a dir */ }
  }
  return null;
}

function hasProjectFiles(dir: string): boolean {
  return existsSync(join(dir, "pyproject.toml")) || existsSync(join(dir, "setup.py"));
}

function promoteSubdir(targetDir: string): string {
  if (hasProjectFiles(targetDir)) return targetDir;

  const sub = isSingleSubdir(targetDir);
  if (sub && hasProjectFiles(sub)) {
    const tmpStage = join(tmpdir(), `hermes-promote-${randomUUID()}`);
    mkdirSync(tmpStage, { recursive: true });

    const entries = readdirSync(sub);
    for (const entry of entries) {
      renameSync(join(sub, entry), join(tmpStage, entry));
    }

    try { rmSync(sub, { recursive: true }); } catch { /* keep empty dir */ }

    for (const entry of readdirSync(tmpStage)) {
      renameSync(join(tmpStage, entry), join(targetDir, entry));
    }
    try { rmSync(tmpStage, { recursive: true }); } catch { /* cleanup */ }

    return targetDir;
  }

  const deepEntries = readdirSync(targetDir);
  for (const entry of deepEntries) {
    const candidate = join(targetDir, entry);
    try {
      const stat = require("fs").statSync(candidate);
      if (stat.isDirectory() && hasProjectFiles(candidate)) {
        return candidate;
      }
    } catch { /* skip */ }
  }

  return targetDir;
}

export interface AgentInstallProgress {
  stage: "extracting" | "cloning" | "checking-out" | "completed";
  message: string;
}

export type AgentProgressCallback = (progress: AgentInstallProgress) => void;

export interface AgentInstallResult {
  ok: boolean;
  agentPath?: string;
  version?: string;
  errorCode?: string;
  message?: string;
}

export type UserSourceType = "local-zip" | "git-clone";

export interface UserSourceConfig {
  sourceType: UserSourceType;
  localZipPath?: string;
  gitUrl?: string;
  gitBranch?: string;
  gitShallow?: boolean;
}

export async function installHermesAgentFromUserSource(
  userConfig: UserSourceConfig,
  onProgress?: AgentProgressCallback,
): Promise<AgentInstallResult> {
  const agentTargetPath = getDesktopAgentDir();

  if (existsSync(agentTargetPath) && hasProjectFiles(agentTargetPath)) {
    onProgress?.({ stage: "completed", message: `hermes-agent 已存在于 ${agentTargetPath}` });
    return { ok: true, agentPath: agentTargetPath };
  }

  if (existsSync(agentTargetPath) && readdirSync(agentTargetPath).length > 0) {
    try { rmSync(agentTargetPath, { recursive: true }); } catch { /* partial cleanup */ }
  }
  mkdirSync(agentTargetPath, { recursive: true });

  switch (userConfig.sourceType) {
    case "local-zip": {
      const zipPath = userConfig.localZipPath;
      if (!zipPath || !existsSync(zipPath)) {
        return {
          ok: false,
          errorCode: "E_AGENT_SOURCE_NOT_FOUND",
          message: `ZIP 文件不存在: ${zipPath || "(未指定)"}`,
        };
      }
      onProgress?.({ stage: "extracting", message: `解压 ${zipPath} 到 ${agentTargetPath}...` });
      try {
        await extractZip(zipPath, agentTargetPath);
        const resolvedPath = promoteSubdir(agentTargetPath);
        if (resolvedPath !== agentTargetPath) {
          onProgress?.({ stage: "extracting", message: `检测到子目录结构，源码路径: ${resolvedPath}` });
        }
      } catch (err) {
        return {
          ok: false,
          errorCode: "E_BUNDLE_EXTRACT_FAILED",
          message: `解压失败: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
      break;
    }

    case "git-clone": {
      const gitUrl = userConfig.gitUrl;
      if (!gitUrl) {
        return { ok: false, errorCode: "E_GIT_CLONE_FAILED", message: "Git URL 为空" };
      }

      onProgress?.({ stage: "cloning", message: `克隆 ${gitUrl}...` });

      const cloneArgs = ["clone"];
      if (userConfig.gitShallow !== false) cloneArgs.push("--depth", "1");
      if (userConfig.gitBranch) cloneArgs.push("-b", userConfig.gitBranch);
      cloneArgs.push(gitUrl, agentTargetPath);

      try {
        execSync(`git ${cloneArgs.join(" ")}`, {
          encoding: "utf-8",
          timeout: 300000,
          env: process.env as Record<string, string>,
        });
      } catch (err) {
        return {
          ok: false,
          errorCode: "E_GIT_CLONE_FAILED",
          message: `Git clone 失败: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
      break;
    }
  }

  if (!hasProjectFiles(agentTargetPath)) {
    return {
      ok: false,
      errorCode: "E_AGENT_SOURCE_NOT_FOUND",
      message: `未找到 pyproject.toml 或 setup.py，解压可能不正确`,
    };
  }

  onProgress?.({ stage: "completed", message: `hermes-agent 安装完成 → ${agentTargetPath}` });
  return { ok: true, agentPath: agentTargetPath };
}

export async function installHermesAgentSource(
  _config: unknown,
  _runtimePath: string,
  onProgress?: AgentProgressCallback,
): Promise<AgentInstallResult> {
  const agentTargetPath = getDesktopAgentDir();
  if (existsSync(agentTargetPath) && hasProjectFiles(agentTargetPath)) {
    onProgress?.({ stage: "completed", message: `hermes-agent 已存在` });
    return { ok: true, agentPath: agentTargetPath };
  }
  return {
    ok: false,
    errorCode: "E_AGENT_SOURCE_NOT_FOUND",
    message: "hermes-agent 未安装，请通过首次初始化选择安装源",
  };
}
