import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { AuthEndpointConfig } from "../../../../shared/auth/auth-contract";
import { getDefaultAuthEndpointConfig } from "../../../../shared/auth/auth-url";
import { useI18n } from "../../components/useI18n";
import { useAuth } from "./AuthProvider";
import { BootstrapScreen } from "./BootstrapScreen";
import { ConfigDiffConfirmDrawer } from "./ConfigDiffConfirmDrawer";
import { EndpointConfigPanel } from "./components/EndpointConfigPanel";
import { LoginBrandPanel } from "./components/LoginBrandPanel";
import { LoginForm } from "./components/LoginForm";
import "./styles/login.css";

export interface LoginScreenProps {
  onSuccess: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps): React.JSX.Element {
  const { t } = useI18n();
  const { setAuthState, setPendingBootstrapDiff, pendingBootstrapDiff, refreshAuth } =
    useAuth();
  const [endpoint, setEndpoint] = useState<AuthEndpointConfig>(getDefaultAuthEndpointConfig());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [loadingState, setLoadingState] = useState(true);

  const runBootstrap = useCallback(async (): Promise<void> => {
    const result = await window.desktopUserConfig.bootstrap();
    if (result.diff && result.diff.length > 0) {
      setPendingBootstrapDiff(result);
      return;
    }
    onSuccess();
  }, [onSuccess, setPendingBootstrapDiff]);

  useEffect(() => {
    let cancelled = false;

    async function init(): Promise<void> {
      try {
        const [authState, bootstrapState] = await Promise.all([
          window.desktopAuth.getState(),
          window.desktopUserConfig.getBootstrapState(),
        ]);

        if (cancelled) return;

        if (authState.endpointConfig) {
          setEndpoint(authState.endpointConfig);
        }

        // V3.3.1: authenticated but bootstrap incomplete — auto-retry without re-login
        if (authState.authenticated && !bootstrapState.initialized) {
          setBootstrapping(true);
          try {
            await runBootstrap();
          } catch (err) {
            if (!cancelled) {
              setError((err as Error).message);
            }
          } finally {
            if (!cancelled) {
              setBootstrapping(false);
              setLoadingState(false);
            }
          }
          return;
        }

        setLoadingState(false);
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setLoadingState(false);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [runBootstrap]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setBootstrapping(true);
    try {
      await window.desktopAuth.saveEndpointConfig(endpoint);
      const state = await window.desktopAuth.login({
        endpointConfig: endpoint,
        email,
        password,
      });
      setAuthState(state);
      await runBootstrap();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBootstrapping(false);
    }
  };

  if (loadingState || bootstrapping) {
    return <BootstrapScreen state={bootstrapping ? "bootstrapping" : "checking-session"} />;
  }

  return (
    <div className="login-screen flex h-full min-h-0 bg-zinc-950">
      <LoginBrandPanel />
      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
          <div className="rounded-md border border-emerald-500/25 bg-emerald-950/30 px-3 py-2 text-xs leading-relaxed text-emerald-100/90">
            {t("auth.loginPurposeHint")}
          </div>
          <EndpointConfigPanel value={endpoint} onChange={setEndpoint} />
          <LoginForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={(e) => void handleSubmit(e)}
            error={error}
            busy={bootstrapping}
          />
        </div>
      </div>
      <ConfigDiffConfirmDrawer
        open={Boolean(pendingBootstrapDiff?.diff?.length)}
        result={pendingBootstrapDiff}
        onClose={() => setPendingBootstrapDiff(null)}
        onApplied={() => {
          void refreshAuth();
          onSuccess();
        }}
      />
    </div>
  );
}
