import type { AuthEndpointConfig } from "../../../../../shared/auth/auth-contract";
import { useI18n } from "../../../components/useI18n";

export interface EndpointConfigPanelProps {
  value: AuthEndpointConfig;
  onChange: (value: AuthEndpointConfig) => void;
  disabled?: boolean;
}

export function EndpointConfigPanel({
  value,
  onChange,
  disabled,
}: EndpointConfigPanelProps): React.JSX.Element {
  const { t } = useI18n();

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {t("auth.endpointSection")}
      </legend>
      <label className="block text-xs text-zinc-400">
        {t("auth.backendUrl")}
        <input
          type="url"
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          value={value.backendUrl}
          onChange={(e) => onChange({ ...value, backendUrl: e.target.value })}
          placeholder="http://127.0.0.1:8000"
          autoComplete="off"
        />
      </label>
      <label className="block text-xs text-zinc-400">
        {t("auth.authPrefix")}
        <input
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          value={value.authPrefix}
          onChange={(e) => onChange({ ...value, authPrefix: e.target.value })}
          placeholder="/api/v1/auth"
          autoComplete="off"
        />
      </label>
      <label className="block text-xs text-zinc-400">
        {t("auth.aiosHomeUrl")}
        <input
          type="url"
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          value={value.aiosHomeUrl}
          onChange={(e) => onChange({ ...value, aiosHomeUrl: e.target.value })}
          placeholder="http://127.0.0.1:3000"
          autoComplete="off"
        />
      </label>
    </fieldset>
  );
}
