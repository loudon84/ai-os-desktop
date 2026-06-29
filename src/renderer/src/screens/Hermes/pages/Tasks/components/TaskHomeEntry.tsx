import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TaskComposer, type TaskComposerState } from "./TaskComposer";
import { ScenarioTabs, type ScenarioKey } from "./ScenarioTabs";
import { QuickPromptChips } from "./QuickPromptChips";
import { RecentTaskCards } from "./RecentTaskCards";
import { useWorkTaskStore } from "../../../features/task-store/useWorkTaskStore";
import { MOCK_TEAMS } from "../../../mock/mockTeams";

type Props = {
  onTaskStarted: () => void;
};

export function TaskHomeEntry({ onTaskStarted }: Props) {
  const { t } = useTranslation();
  const { tasks, createTask, sendMessage, setActiveTaskId } = useWorkTaskStore();
  const [scenario, setScenario] = useState<ScenarioKey>("sales");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (state: TaskComposerState) => {
    setBusy(true);
    try {
      const teamId =
        state.selectedTeamId ??
        (scenario === "sales" ? MOCK_TEAMS[0]?.id : undefined);
      const task = await createTask({
        text: state.text,
        selectedTeamId: teamId,
        mode: state.mode,
        permissionMode: state.permissionMode,
      });
      await sendMessage({
        taskId: task.id,
        text: state.text,
        selectedTeamId: teamId,
        mode: state.mode,
        permissionMode: state.permissionMode,
      });
      onTaskStarted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hermes-task-home">
      <header className="hermes-task-home__hero">
        <h2>{t("workspaces.hermes.tasks.heroTitle")}</h2>
        <p>{t("workspaces.hermes.tasks.heroSubtitle")}</p>
      </header>

      <ScenarioTabs activeScenario={scenario} onScenarioChange={setScenario} />
      <QuickPromptChips scenario={scenario} onSelect={setDraftPrompt} />

      <div className="hermes-task-home__composer">
        <TaskComposer
          initialText={draftPrompt}
          isStreaming={busy}
          onSubmit={handleSubmit}
        />
      </div>

      <RecentTaskCards
        tasks={tasks}
        onContinue={(id) => {
          setActiveTaskId(id);
          onTaskStarted();
        }}
      />
    </div>
  );
}
