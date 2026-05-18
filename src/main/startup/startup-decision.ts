import { app } from "electron";
import { getConnectionConfig } from "../config";
import { resolveRuntimeState } from "../enterprise/runtime-state-resolver";
import { testRemoteConnection } from "../hermes";
import { isSshTunnelHealthy, startSshTunnel } from "../ssh-tunnel";
import type {
  StartupDecision,
  StartupScreen,
  StartupDecisionReason,
  ConnectionMode,
} from "../../shared/startup/startup-contract";

/**
 * 解析启动决策
 *
 * 根据连接配置和运行时状态，决定应用启动后应进入哪个屏幕。
 * 这是 Startup Gate 的核心函数，在 Main Process 中执行。
 *
 * 硬性验收规则：
 * - runtimeReady && modelConfigured → main（跳过安装和配置）
 * - runtimeReady && !modelConfigured → setup（跳过安装，只做配置）
 * - !runtimeReady → welcome（需要安装）
 */
export async function resolveStartupDecision(): Promise<StartupDecision> {
  const conn = getConnectionConfig();

  // 1. Remote 模式
  if (conn.mode === "remote" && conn.remoteUrl) {
    const ok = await testRemoteConnection(conn.remoteUrl, conn.apiKey);
    const nextScreen: StartupScreen = ok ? "main" : "welcome";
    const reason: StartupDecisionReason = ok
      ? "remote-ready"
      : "remote-unreachable";

    return {
      runtime: null,
      connectionMode: "remote",
      nextScreen,
      skipAgentInstall: true,
      skipModelSetup: true,
      shouldVerifyInBackground: false,
      reason,
      error: ok ? undefined : `Cannot reach remote Hermes at ${conn.remoteUrl}`,
    };
  }

  // 2. SSH 模式
  if (conn.mode === "ssh" && conn.ssh && conn.ssh.host) {
    try {
      await startSshTunnel(conn.ssh);
      const healthy = await isSshTunnelHealthy();

      if (healthy) {
        return {
          runtime: null,
          connectionMode: "ssh",
          nextScreen: "main",
          skipAgentInstall: true,
          skipModelSetup: true,
          shouldVerifyInBackground: false,
          reason: "ssh-ready",
        };
      } else {
        return {
          runtime: null,
          connectionMode: "ssh",
          nextScreen: "welcome",
          skipAgentInstall: true,
          skipModelSetup: true,
          shouldVerifyInBackground: false,
          reason: "ssh-unreachable",
          error: "SSH tunnel health check failed",
        };
      }
    } catch (err) {
      return {
        runtime: null,
        connectionMode: "ssh",
        nextScreen: "welcome",
        skipAgentInstall: true,
        skipModelSetup: true,
        shouldVerifyInBackground: false,
        reason: "ssh-unreachable",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 3. 本地模式
  const runtime = resolveRuntimeState();

  // Case A: 运行时已就绪且模型已配置 → 直接进主页
  if (runtime.runtimeReady && runtime.modelConfigured) {
    return {
      runtime,
      connectionMode: "local",
      nextScreen: "main",
      skipAgentInstall: true,
      skipModelSetup: true,
      shouldVerifyInBackground: true,
      reason: "runtime-ready-model-configured",
    };
  }

  // Case B: 运行时已就绪但模型未配置 → 进 Setup
  if (runtime.runtimeReady && !runtime.modelConfigured) {
    return {
      runtime,
      connectionMode: "local",
      nextScreen: "setup",
      skipAgentInstall: true,
      skipModelSetup: false,
      shouldVerifyInBackground: true,
      reason: "runtime-ready-model-missing",
    };
  }

  // Case C: 运行时未就绪 → 进 Welcome（需要安装）
  return {
    runtime,
    connectionMode: "local",
    nextScreen: "welcome",
    skipAgentInstall: false,
    skipModelSetup: false,
    shouldVerifyInBackground: false,
    reason: "runtime-missing",
  };
}
