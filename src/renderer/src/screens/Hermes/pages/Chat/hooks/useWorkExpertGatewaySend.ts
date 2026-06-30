import { useCallback } from "react";
import { workExpertGatewayApi } from "../../../api/workExpertGatewayApi";
import { HERMES_DEFAULT_PROFILE } from "../../../constants";
import type { WorkChatContext } from "../../../types/work-chat";

type LocalMessage = { role: "user" | "assistant"; content: string };

type StreamHelpers = {
  appendLocalMessage: (message: LocalMessage) => void;
  setExternalRunState: (state: "creating" | "streaming" | "completed" | "error" | "idle" | "cancelled") => void;
  setLastError: (error: string | null) => void;
};

export function useWorkExpertGatewaySend(
  workContext: WorkChatContext,
  stream: StreamHelpers,
) {
  const sendToExpertGateway = useCallback(
    async (input: {
      text: string;
      attachmentIds: string[];
      modelId: string | null;
      sessionId?: string | null;
      profile?: string;
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
        context: {
          source: "chat",
          sessionId: input.sessionId,
          profile: input.profile ?? HERMES_DEFAULT_PROFILE,
          modelId: input.modelId,
        },
      });

      if (result.ok && result.responseText) {
        stream.appendLocalMessage({
          role: "assistant",
          content: result.responseText,
        });
        stream.setExternalRunState("completed");
      } else {
        const errText = result.error ?? "Expert Gateway call failed";
        stream.appendLocalMessage({
          role: "assistant",
          content: `**Expert Gateway error**\n\n${errText}`,
        });
        stream.setLastError(errText);
        stream.setExternalRunState("error");
      }

      input.onComposerClear?.();
    },
    [workContext, stream],
  );

  return { sendToExpertGateway };
}
