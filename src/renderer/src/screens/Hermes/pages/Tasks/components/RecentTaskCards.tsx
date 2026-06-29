import { useTranslation } from "react-i18next";
import type { WorkTask } from "../../../../../../../shared/work/work-task-contract";

type Props = {
  tasks: WorkTask[];
  onContinue: (taskId: string) => void;
};

export function RecentTaskCards({ tasks, onContinue }: Props) {
  const { t } = useTranslation();
  const recent = tasks.slice(0, 6);
  if (recent.length === 0) return null;

  return (
    <section className="hermes-task-recent">
      <h3>{t("workspaces.hermes.tasks.recentTasks")}</h3>
      <div className="hermes-task-recent__grid">
        {recent.map((task) => (
          <button
            key={task.id}
            type="button"
            className="hermes-task-recent__card"
            onClick={() => onContinue(task.id)}
          >
            <strong>{task.title}</strong>
            <span>{task.status}</span>
            <span className="hermes-task-recent__action">{t("workspaces.hermes.tasks.continueTask")}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
