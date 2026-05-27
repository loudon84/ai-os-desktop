import { useCallback } from "react";
import { useI18n } from "../../../../components/useI18n";
import { formatChatError } from "../../utils/formatChatError";
import { ChatScrollArea } from "./ChatScrollArea";
import { ComposerBar } from "./ComposerBar";
import { StatusToast } from "./StatusToast";
import { useHermesDefaultWebChat } from "./hooks/useHermesDefaultWebChat";

export function HermesDefaultWebChatSurface(): React.JSX.Element {
  const { t } = useI18n();
  const chat = useHermesDefaultWebChat();
  const { models, attachments, composer, stream, newConversation, viewSessions, modelId } = chat;
  const selectedModelId =
    models.pendingModel?.id ?? models.models.find((m) => m.is_current)?.id ?? null;

  const toast =
    stream.historyLoadError ??
    (stream.lastError
      ? formatChatError(stream.lastError)
      : stream.runState === "creating" || stream.runState === "streaming"
        ? t("workspaces.hermes.chat.generating", { defaultValue: "Generating…" })
        : "");

  const handleDropFiles = useCallback(
    (files: FileList) => {
      if (files.length === 0) return;
      void attachments.uploadFiles(files);
    },
    [attachments],
  );

  const handleSend = useCallback(() => {
    const text = composer.text.trim();
    if (!composer.canSend(attachments.attachments.length > 0)) return;
    void stream.send(
      text,
      attachments.attachments.map((a) => a.id),
      modelId,
    );
    composer.clear();
  }, [attachments.attachments, composer, modelId, stream]);

  const disabled = false;
  const busy = stream.runState === "streaming" || stream.runState === "creating";

  return (
    <div className="hermes-panel-root is-chat hermes-webchat-root">
      <StatusToast message={toast} variant={stream.lastError ? "error" : "info"} />
      <ChatScrollArea
        messages={stream.messages}
        streamingContent={stream.streamingContent}
        activeTool={stream.activeTool}
        runState={stream.runState}
        lastError={stream.lastError}
        lastUsage={stream.lastUsage}
      />
      <ComposerBar
        displayModel={models.displayModel}
        selectedModelId={selectedModelId}
        modelGroups={models.modelGroups}
        gatewayReady
        modelStatus={models.status}
        modelsLoading={models.loading}
        onModelsOpen={() => void models.reload()}
        onModelSelect={(m) => void models.selectModel(m)}
        onSaveDefaultModel={() => void models.saveAsDefault()}
        attachments={attachments.attachments}
        onUploadAttachment={() => void attachments.upload()}
        onRemoveAttachment={(id) => void attachments.remove(id)}
        text={composer.text}
        onTextChange={composer.setText}
        imeComposing={composer.imeComposing}
        onImeComposing={composer.setImeComposing}
        canSendMessage={composer.canSend(attachments.attachments.length > 0)}
        disabled={disabled || busy}
        runState={stream.runState}
        onSend={handleSend}
        onCancel={() => void stream.cancel()}
        onNewConversation={newConversation}
        onClear={() => {
          stream.clearMessages();
          composer.clear();
          attachments.clear();
        }}
        onDropFiles={handleDropFiles}
        onViewSessions={viewSessions}
      />
    </div>
  );
}

