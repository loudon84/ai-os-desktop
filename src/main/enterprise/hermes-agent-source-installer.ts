import { existsSync, mkdirSync, cpSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync, spawn } from "node:child_process";

import type {
  DeploymentConfig,
  EnterpriseErrorResult,
} from "../../shared/enterprise/enterprise-schema";

import { getHermesBasePath } from "./deployment-config";

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

export async function installHermesAgentSource(
  config: DeploymentConfig,
  runtimePath: string,
  onProgress?: AgentProgressCallback,
): Promise<AgentInstallResult> {
  const basePath = getHermesBasePath();
  const agentTargetPath = join(basePath, "agent", "hermes-agent");
  mkdirSync(dirname(agentTargetPath), { recursive: true });

  const { hermesAgent } = config;

  switch (hermesAgent.sourceType) {
    case "release-zip": {
      const bundleAgentPath = join(runtimePath, "agent", "hermes-agent-release.zip");
      const bundleExtractedPath = join(runtimePath, "agent", "hermes-agent");

      if (existsSync(bundleExtractedPath)) {
        onProgress?.({ stage: "extracting", message: "从 Bundle 提取 hermes-agent..." });
        if (!existsSync(agentTargetPath)) {
          cpSync(bundleExtractedPath, agentTargetPath, { recursive: true });
        }
      } else if (existsSync(bundleAgentPath)) {
        onProgress?.({ stage: "extracting", message: "解压 hermes-agent-release.zip..." });
        mkdirSync(agentTargetPath, { recursive: true });
        try {
          const { Extract } = await import("unzipper");
          const { pipeline } = await import("node:stream/promises");
          const { createReadStream } = await import("node:fs");
          await pipeline(createReadStream(bundleAgentPath), Extract({ path: agentTargetPath }));
        } catch (err) {
          return {
            ok: false,
            errorCode: "E_AGENT_SOURCE_NOT_FOUND",
            message: `解压 agent 失败: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      } else {
        return {
          ok: false,
          errorCode: "E_AGENT_SOURCE_NOT_FOUND",
          message: "Runtime Bundle 中未找到 hermes-agent",
        };
      }
      break;
    }

    case "git-clone": {
      if (!hermesAgent.gitUrl) {
        return { ok: false, errorCode: "E_GIT_CLONE_FAILED", message: "gitUrl 为空" };
      }

      onProgress?.({ stage: "cloning", message: `克隆 ${hermesAgent.gitUrl}...` });

      const env: Record<string, string> = { ...process.env as Record<string, string> };

      if (hermesAgent.authMode === "personal-access-token") {
        const token = process.env.HTTPS_AIO_TOKEN || "";
        if (!token) {
          return { ok: false, errorCode: "E_GIT_AUTH_FAILED", message: "HTTPS_AIO_TOKEN 环境变量未设置" };
        }
        env.HTTPS_AIO_TOKEN = token;
      }

      const cloneArgs = ["clone"];
      if (hermesAgent.shallowClone) cloneArgs.push("--depth", "1");
      if (hermesAgent.branch) cloneArgs.push("-b", hermesAgent.branch);
      cloneArgs.push(hermesAgent.gitUrl, agentTargetPath);

      try {
        execSync(`git ${cloneArgs.join(" ")}`, { encoding: "utf-8", timeout: 120000, env });
      } catch (err) {
        return {
          ok: false,
          errorCode: "E_GIT_CLONE_FAILED",
          message: `Git clone 失败: ${err instanceof Error ? err.message : String(err)}`,
        };
      }

      if (hermesAgent.commit) {
        onProgress?.({ stage: "checking-out", message: `Checkout ${hermesAgent.commit}...` });
        try {
          execSync(`git checkout ${hermesAgent.commit}`, { cwd: agentTargetPath, encoding: "utf-8", timeout: 30000 });
        } catch (err) {
          return {
            ok: false,
            errorCode: "E_GIT_CHECKOUT_FAILED",
            message: `Git checkout 失败: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      }
      break;
    }
  }

  onProgress?.({ stage: "completed", message: "hermes-agent 安装完成" });

  return { ok: true, agentPath: agentTargetPath, version: hermesAgent.version };
}

function dirname(p: string): string {
  const sep = p.lastIndexOf("/");
  const sep2 = p.lastIndexOf("\\");
  const idx = Math.max(sep, sep2);
  return idx === -1 ? "." : p.slice(0, idx);
}
