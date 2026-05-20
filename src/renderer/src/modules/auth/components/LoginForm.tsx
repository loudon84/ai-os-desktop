import type { FormEvent } from "react";
import { useI18n } from "../../../components/useI18n";

export interface LoginFormProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  error: string | null;
  busy: boolean;
  disabled?: boolean;
}

export function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  error,
  busy,
  disabled,
}: LoginFormProps): React.JSX.Element {
  const { t } = useI18n();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-100">{t("auth.login")}</h2>
      <label className="block text-xs text-zinc-400">
        {t("auth.email")}
        <input
          type="email"
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          autoComplete="email"
          disabled={disabled || busy}
        />
      </label>
      <label className="block text-xs text-zinc-400">
        {t("auth.password")}
        <input
          type="password"
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          autoComplete="current-password"
          disabled={disabled || busy}
        />
      </label>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={disabled || busy}
        className="w-full rounded bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? t("auth.signingIn") : t("auth.login")}
      </button>
    </form>
  );
}
