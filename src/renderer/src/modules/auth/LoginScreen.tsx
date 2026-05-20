import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import { BootstrapScreen } from "./BootstrapScreen";
import { useI18n } from "../../components/useI18n";

export function LoginScreen(): React.JSX.Element {
  const { t } = useI18n();
  const { setSession, setPendingBootstrapDiff } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBootstrapping(true);
    try {
      const session = await window.desktopAuth.login({
        username,
        password,
        tenantCode: tenantCode || undefined,
      });
      setSession(session);

      const result = await window.desktopUserConfig.bootstrap();
      if (result.diff && result.diff.length > 0) {
        setPendingBootstrapDiff(result);
        return;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBootstrapping(false);
    }
  };

  if (bootstrapping) {
    return <BootstrapScreen state="bootstrapping" />;
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-zinc-950 p-8">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-6"
      >
        <h1 className="text-lg font-semibold text-zinc-100">{t("auth.login")}</h1>
        <label className="block text-xs text-zinc-400">
          {t("auth.username")}
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="block text-xs text-zinc-400">
          {t("auth.password")}
          <input
            type="password"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label className="block text-xs text-zinc-400">
          {t("auth.tenantCode")}
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            value={tenantCode}
            onChange={(e) => setTenantCode(e.target.value)}
          />
        </label>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {t("auth.login")}
        </button>
      </form>
    </div>
  );
}
