import { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import Welcome from "./screens/Welcome/Welcome";
import Install from "./screens/Install/Install";
import Setup from "./screens/Setup/Setup";
import Layout from "./screens/Layout/Layout";
import SplashScreen from "./screens/SplashScreen/SplashScreen";
import { WindowControls } from "./components/layout/WindowControls";
import { useI18n } from "./components/useI18n";

type Screen = "splash" | "welcome" | "installing" | "setup" | "main";

// Minimum time the splash stays visible so the brand animation plays
// through. Tracks the splash logo fade-in duration in main.css.
const SPLASH_MIN_MS = 1300;

function App(): React.JSX.Element {
  const { t } = useI18n();
  const [screen, setScreen] = useState<Screen>("splash");
  const [installError, setInstallError] = useState<string | null>(null);
  const isMac =
    window.electron?.process?.platform === "darwin" ||
    navigator.platform.toLowerCase().includes("mac");
  const showAppTitlebar = !isMac && screen !== "main";

  const runInstallCheck = useCallback(async () => {
    const startedAt = Date.now();
    let next: Screen = "welcome";
    let error: string | null = null;
    let isRemote = false;

    try {
      const conn = await window.hermesAPI.getConnectionConfig();
      isRemote = conn.mode === "remote" || conn.mode === "ssh";

      if (conn.mode === "ssh" && conn.ssh) {
        // Start (or ensure) the SSH tunnel, then go straight to main
        try {
          await window.hermesAPI.startSshTunnel();
          next = "main";
        } catch (tunnelErr) {
          error = `SSH tunnel failed to start: ${(tunnelErr as Error).message}`;
          next = "welcome";
        }
      } else if (conn.mode === "remote" && conn.remoteUrl) {
        const ok = await window.hermesAPI.testRemoteConnection(
          conn.remoteUrl,
          conn.apiKey,
        );
        if (ok) {
          next = "main";
        } else {
          error = `Cannot reach remote Hermes at ${conn.remoteUrl}. Check the URL or switch to local mode.`;
          next = "welcome";
        }
      } else {
        const runtime = await window.hermesAPI.getRuntimeState();
        if (runtime.runtimeReady && runtime.modelConfigured) {
          next = "main";
        } else if (runtime.runtimeReady && !runtime.modelConfigured) {
          next = "setup";
        } else {
          next = "welcome";
        }
      }
    } catch {
      next = "welcome";
    }

    if (error) setInstallError(error);

    const elapsed = Date.now() - startedAt;
    const wait = Math.max(0, SPLASH_MIN_MS - elapsed);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    setScreen(next);

    // Lazy deep-verify in the background after the UI is up. If the
    // install is broken, surface the warning then — don't block startup.
    //
    // Skip for remote-mode connections: verifyInstall() probes the LOCAL
    // Python + script paths (HERMES_PYTHON / HERMES_SCRIPT in installer.ts),
    // which don't exist on machines that only use a remote backend. Without
    // this guard the user is bounced back to Welcome with an "installBroken"
    // error immediately after a successful remote connect. (#47, #41, #30)
    if ((next === "main" || next === "setup") && !isRemote) {
      window.hermesAPI.getRuntimeState().then((runtime) => {
        if (!runtime.runtimeReady) return;
        window.hermesAPI.verifyInstall().then((ok) => {
          if (!ok && !runtime.updateMode) {
            setInstallError(t("errors.installBroken"));
            setScreen("welcome");
          }
        });
      });
    }
  }, [t]);

  useEffect(() => {
    runInstallCheck();
  }, [runInstallCheck]);

  const handleSplashFinished = useCallback(() => {
    /* splash transition is driven by the install check, not a timer */
  }, []);

  function handleInstallComplete(): void {
    setInstallError(null);
    try {
      sessionStorage.setItem("smc-v13-navigate-runtime-setup", "1");
      sessionStorage.setItem("smc-v13-run-doctor", "1");
    } catch {
      /* sessionStorage unavailable */
    }
    setScreen("setup");
  }

  function handleInstallFailed(error: string): void {
    setInstallError(error);
    setScreen("welcome");
  }

  function handleRetryInstall(): void {
    setInstallError(null);
    setScreen("installing");
  }

  function handleRecheck(): void {
    setInstallError(null);
    setScreen("splash");
    runInstallCheck();
  }

  function renderScreen(): React.JSX.Element {
    console.log(screen)
    switch (screen) {
      case "splash":
        return <SplashScreen onFinished={handleSplashFinished} />;
      case "welcome":
        return (
          <Welcome
            error={installError}
            onStart={handleRetryInstall}
            onRecheck={handleRecheck}
          />
        );
      case "installing":
        return (
          <Install
            onComplete={handleInstallComplete}
            onFailed={handleInstallFailed}
          />
        );
      case "setup":
        return (
          <Setup
            onComplete={() => {
              try {
                sessionStorage.setItem("smc-v13-navigate-runtime-setup", "1");
              } catch {
                /* ignore */
              }
              setScreen("main");
            }}
          />
        );
      case "main":
        return <Layout />;
    }
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="app">
          {isMac && <div className="drag-region" />}          
          <div className="app-content">{renderScreen()}</div>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
