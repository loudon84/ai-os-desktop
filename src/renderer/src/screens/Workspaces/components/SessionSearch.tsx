import { useI18n } from "../../../components/useI18n";

export function SessionSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}): React.JSX.Element {
  const { t } = useI18n();
  return (
    <input
      className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t("workspaces.sessions.search", { defaultValue: "Search sessions…" })}
    />
  );
}
