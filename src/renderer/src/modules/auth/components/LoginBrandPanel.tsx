import { useI18n } from "../../../components/useI18n";

export function LoginBrandPanel(): React.JSX.Element {
  const { t } = useI18n();

  return (
    <div className="login-brand-panel hidden flex-col justify-center border-r border-zinc-800 bg-zinc-950 px-10 lg:flex lg:w-[42%]">
      <div
        className="mb-6 h-12 w-12 rounded-xl bg-emerald-600/20 ring-1 ring-emerald-500/40"
        aria-hidden
      />
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
        {t("auth.brandTitle")}
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
        {t("auth.brandSubtitle")}
      </p>
    </div>
  );
}
