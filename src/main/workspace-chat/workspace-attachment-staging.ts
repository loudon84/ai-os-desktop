import { dialog } from "electron";
import { uploadAttachmentsMultipart } from "./workspace-chat-client";

export async function pickAndUploadAttachments(input: {
  profile_id: string;
  workspace_id: string;
  session_id: string;
  file_paths?: string[];
}) {
  let paths = input.file_paths ?? [];
  if (paths.length === 0) {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { attachments: [] };
    }
    paths = result.filePaths;
  }
  return uploadAttachmentsMultipart(
    input.workspace_id,
    input.profile_id,
    input.session_id,
    paths,
  );
}
