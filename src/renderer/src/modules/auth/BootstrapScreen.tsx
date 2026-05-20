import { useI18n } from "../../components/useI18n";

export interface BootstrapScreenProps {
  state: "checking-session" | "bootstrapping";
}

export function BootstrapScreen({ state }: BootstrapScreenProps): React.JSX.Element {
  const { t } = useI18n();
  const label =
    state === "checking-session" ? t("auth.checkingSession") : t("auth.bootstrap");
  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-zinc-950">
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}
