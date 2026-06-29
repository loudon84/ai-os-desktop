import type { WorkTaskPermissionMode } from "../../../../../../../../shared/work/work-task-contract";
import { useTranslation } from "react-i18next";

const MODES: WorkTaskPermissionMode[] = ["default", "confirm_sensitive", "auto"];

type Props = {
  value: WorkTaskPermissionMode;
  onChange: (mode: WorkTaskPermissionMode) => void;
};

export function PermissionSelector({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <select
      className="hermes-composer-select"
      value={value}
      onChange={(e) => onChange(e.target.value as WorkTaskPermissionMode)}
    >
      {MODES.map((m) => (
        <option key={m} value={m}>
          {t(`workspaces.hermes.tasks.permission.${m === "confirm_sensitive" ? "confirm" : m}`)}
        </option>
      ))}
    </select>
  );
}
