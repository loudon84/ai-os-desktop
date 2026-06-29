import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { WorkTaskStoreProvider, useWorkTaskStore } from "../../features/task-store/useWorkTaskStore";
import { buildSalesCombatMockEvents } from "../../mock/mockEvents";
import { TaskHomeEntry } from "./components/TaskHomeEntry";
import { TaskWindow } from "./components/TaskWindow";

function WorkTasksPageInner() {
  const { t } = useTranslation();
  const { activeTaskId, setActiveTaskId, appendEvent, events } = useWorkTaskStore();

  useEffect(() => {
    if (activeTaskId !== "task-mock-sales-001") return;
    if (events.length > 0) return;
    for (const ev of buildSalesCombatMockEvents(activeTaskId)) {
      appendEvent(ev);
    }
  }, [activeTaskId, events.length, appendEvent]);

  const handleTaskStarted = useCallback(() => {
    /* active task already set by store */
  }, []);

  return (
    <div className="hermes-page hermes-tasks-page">
      <header className="hermes-page__header">
        <div>
          <h2>{t("workspaces.hermes.tasks.title")}</h2>
          <p className="hermes-page__subtitle">{t("workspaces.hermes.tasks.subtitle")}</p>
        </div>
      </header>

      {activeTaskId ? (
        <TaskWindow />
      ) : (
        <TaskHomeEntry onTaskStarted={handleTaskStarted} />
      )}
    </div>
  );
}

export default function WorkTasksPage() {
  return (
    <WorkTaskStoreProvider>
      <WorkTasksPageInner />
    </WorkTaskStoreProvider>
  );
}
