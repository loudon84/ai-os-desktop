import { useState, useEffect, useCallback } from "react";
import { useI18n } from "../components/useI18n";
import type { StartupDecision } from "../../../shared/startup/startup-contract";

type Screen = "splash" | "welcome" | "installing" | "setup" | "main";

// Minimum time the splash stays visible so the brand animation plays through
const SPLASH_MIN_MS = 1300;

export interface UseStartupGateResult {
  /** 当前屏幕 */
  screen: Screen;
  /** 安装错误信息 */
  installError: string | null;
  /** 设置安装错误 */
  setInstallError: (error: string | null) => void;
  /** 导航到指定屏幕 */
  navigateTo: (screen: Screen) => void;
  /** 重新检查启动状态 */
  recheck: () => void;
}

/**
 * 启动门控 Hook
 *
 * 封装启动路由决策逻辑：
 * 1. 调用 Main Process 的 resolveStartupDecision()
 * 2. 确保最小 splash 显示时间
 * 3. 根据决策设置初始屏幕
 * 4. 后台验证（含 updateMode 保护）
 */
export function useStartupGate(): UseStartupGateResult {
  const { t } = useI18n();
  const [screen, setScreen] = useState<Screen>("splash");
  const [installError, setInstallError] = useState<string | null>(null);
  const [checkKey, setCheckKey] = useState(0);

  const navigateTo = useCallback((next: Screen) => {
    setScreen(next);
  }, []);

  const recheck = useCallback(() => {
    setCheckKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function runDecision() {
      setScreen("splash");
      setInstallError(null);

      const startedAt = Date.now();
      let decision: StartupDecision;

      try {
        // 使用新的 Startup Gate API
        decision = await window.smcShell.resolveStartupDecision();
      } catch (err) {
        // 如果 smcShell 不可用（理论上不应该），fallback 到 welcome
        console.error("[STARTUP] Failed to resolve startup decision:", err);
        decision = {
          runtime: null,
          connectionMode: "local",
          nextScreen: "welcome",
          skipAgentInstall: false,
          skipModelSetup: false,
          shouldVerifyInBackground: false,
          reason: "runtime-missing",
          error: "Failed to resolve startup decision",
        };
      }

      // 确保最小 splash 显示时间
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, SPLASH_MIN_MS - elapsed);
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }

      if (cancelled) return;

      // 设置目标屏幕
      setScreen(decision.nextScreen as Screen);

      // 后台验证（不阻塞 UI）
      if (decision.shouldVerifyInBackground && decision.runtime) {
        window.hermesAPI.verifyInstall().then((ok) => {
          if (cancelled) return;

          if (!ok) {
            // PRD 要求：updateMode=true 时不回退 Welcome，只 console.warn
            if (decision.runtime!.updateMode) {
              console.warn(
                "[STARTUP] Background verify failed in update mode, staying on current screen",
              );
              // 可选：设置警告状态（第一阶段暂不显示 UI）
            } else {
              // updateMode=false：回退到 welcome
              setInstallError(t("errors.installBroken"));
              setScreen("welcome");
            }
          }
        });
      }
    }

    runDecision();

    return () => {
      cancelled = true;
    };
  }, [t, checkKey]);

  return {
    screen,
    installError,
    setInstallError,
    navigateTo,
    recheck,
  };
}
