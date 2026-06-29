import type { WorkTaskMode } from "../../../../../../../../shared/work/work-task-contract";
import { useTranslation } from "react-i18next";

const MODES: WorkTaskMode[] = ["ask", "plan", "craft", "execute"];

type Props = {
  value: WorkTaskMode;
  onChange: (mode: WorkTaskMode) => void;
};

export function ModeSelector({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <select
      className="hermes-composer-select"
      value={value}
      onChange={(e) => onChange(e.target.value as WorkTaskMode)}
    >
      {MODES.map((m) => (
        <option key={m} value={m}>
          {t(`workspaces.hermes.tasks.mode.${m}`)}
        </option>
      ))}
    </select>
  );
}
