import { useEffect, useRef } from "react";
import { aggregateStreamBlocks } from "../../../features/task-stream/workEventAggregator";
import { useWorkTaskStore } from "../../../features/task-store/useWorkTaskStore";
import { TaskHeader } from "./TaskHeader";
import { TaskStream } from "./TaskStream";
import { ParticipantBar } from "./ParticipantBar";
import { TaskComposer, type TaskComposerState } from "./TaskComposer";

export function TaskConversationRegion() {
  const {
    activeTask,
    events,
    participants,
    isStreaming,
    renameTask,
    setActiveTaskId,
    setRightPanelOpen,
    rightPanelOpen,
    sendMessage,
    stopStream,
    setRightPanelTab,
  } = useWorkTaskStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const blocks = aggregateStreamBlocks(events);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [blocks.length, events.length]);

  if (!activeTask) return null;

  const handleSubmit = (state: TaskComposerState) => {
    void sendMessage({
      taskId: activeTask.id,
      text: state.text,
      selectedTeamId: state.selectedTeamId ?? activeTask.activeTeamId,
      mode: state.mode,
      permissionMode: state.permissionMode,
    });
  };

  return (
    <section className="hermes-task-conversation">
      <TaskHeader
        task={activeTask}
        onRename={(title) => renameTask(activeTask.id, title)}
        onBack={() => setActiveTaskId(null)}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
      />
      <ParticipantBar participants={participants} />
      <div ref={scrollRef} className="hermes-task-conversation__stream">
        <TaskStream
          blocks={blocks}
          onOpenOutput={(outputId) => {
            setRightPanelTab("output");
            setRightPanelOpen(true);
            void outputId;
          }}
        />
      </div>
      <TaskComposer
        taskId={activeTask.id}
        isStreaming={isStreaming}
        onSubmit={handleSubmit}
        onStop={() => void stopStream()}
      />
    </section>
  );
}
