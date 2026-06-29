import { useWorkTaskStore } from "../../../features/task-store/useWorkTaskStore";
import { TaskListPanel } from "./TaskListPanel";
import { TaskConversationRegion } from "./TaskConversationRegion";
import { TaskRightPanel } from "./TaskRightPanel";

export function TaskWindow() {
  const {
    tasks,
    activeTask,
    activeTaskId,
    events,
    outputs,
    participants,
    rightPanelOpen,
    rightPanelTab,
    setActiveTaskId,
    setRightPanelTab,
    setRightPanelOpen,
  } = useWorkTaskStore();

  if (!activeTask) return null;

  return (
    <div className="hermes-task-window">
      <TaskListPanel
        tasks={tasks}
        activeTaskId={activeTaskId}
        onSelect={setActiveTaskId}
        onNewTask={() => setActiveTaskId(null)}
      />
      <TaskConversationRegion />
      <TaskRightPanel
        open={rightPanelOpen}
        tab={rightPanelTab}
        task={activeTask}
        events={events}
        outputs={outputs}
        participants={participants}
        onTabChange={setRightPanelTab}
        onClose={() => setRightPanelOpen(false)}
      />
    </div>
  );
}
