import { useCallback } from "react";
import { workExpertGatewayApi } from "../../../api/workExpertGatewayApi";
import type { WorkChatContext } from "../../../types/work-chat";

type LocalMessage = { role: "user" | "assistant"; content: string };

type StreamHelpers = {
  appendLocalMessage: (message: LocalMessage) => void;
  setExternalRunState: (state: "creating" | "streaming" | "completed" | "error" | "idle" | "cancelled") => void;
  setLastError: (error: string | null) => void;
};

type TaskStreamHelpers = {
  startStream: (input: {
    taskId: string;
    taskNo?: string;
    eventSseUrl: string;
    artifactUrl?: string;
    expertName?: string;
    skillName?: string;
    runId?: string;
  }) => Promise<void>;
};

export function useWorkExpertGatewaySend(
  workContext: WorkChatContext,
  stream: StreamHelpers,
  taskStream: TaskStreamHelpers,
) {
  const sendToExpertGateway = useCallback(
    async (input: {
      text: string;
      attachmentIds: string[];
      modelId: string | null;
      sessionId?: string | null;
      onComposerClear?: () => void;
    }) => {
      const expert = workContext.selectedExpert;
      const skill = workContext.selectedSkill;
      if (!expert || !skill) return;

      const trimmed = input.text.trim();
      if (!trimmed && input.attachmentIds.length === 0) return;

      stream.appendLocalMessage({
        role: "user",
        content: trimmed || "(attachments)",
      });
      stream.setExternalRunState("creating");
      stream.setLastError(null);

      const result = await workExpertGatewayApi.callExpertSkill({
        expertSlug: expert.slug,
        skillName: skill.name,
        prompt: trimmed,
        permissionMode: workContext.permissionMode,
        attachmentIds: input.attachmentIds,
        sessionId: input.sessionId,
        modelId: input.modelId,
      });

      if (result.ok && result.mode === "event_stream" && result.taskId && result.eventSseUrl) {
        await taskStream.startStream({
          taskId: result.taskId,
          taskNo: result.taskNo,
          eventSseUrl: result.eventSseUrl,
          artifactUrl: result.artifactUrl,
          expertName: expert.name,
          skillName: skill.displayName,
          runId: result.runId,
        });
        stream.setExternalRunState("streaming");
      } else if (result.ok && result.mode === "sync_result" && result.responseText) {
        stream.appendLocalMessage({
          role: "assistant",
          content: result.responseText,
        });
        stream.setExternalRunState("completed");
      } else if (!result.ok) {
        const errText = result.error ?? "Expert Gateway call failed";
        stream.appendLocalMessage({
          role: "assistant",
          content: `**Expert Gateway error**\n\n${errText}`,
        });
        stream.setLastError(errText);
        stream.setExternalRunState("error");
      } else {
        const errText = "Expert Gateway call failed";
        stream.appendLocalMessage({
          role: "assistant",
          content: `**Expert Gateway error**\n\n${errText}`,
        });
        stream.setLastError(errText);
        stream.setExternalRunState("error");
      }

      input.onComposerClear?.();
    },
    [workContext, stream, taskStream],
  );

  return { sendToExpertGateway };
}
