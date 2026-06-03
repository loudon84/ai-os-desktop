import type { HermesPanelPageContext } from "../../../components/hermes";

const DEFAULT_USER_PROMPT =
  "请分析当前页面内容，提取关键业务信息、风险点、可执行动作。";

export function buildTaskFirstMessage(input: {
  pageUrl: string;
  pageContext: HermesPanelPageContext;
  userPrompt?: string;
  skill?: string;
  sessionId?: string | null;
  hostBridge?: {
    requestId: string;
    formType: string;
    action: "create" | "edit" | "view" | "analytic";
    callbackUrl?: string;
    skillName: string;
  };
}): string {
  const { pageUrl, pageContext, userPrompt, skill, sessionId, hostBridge } = input;
  const body =
    pageContext.payload.textExcerpt?.trim() ||
    pageContext.payload.htmlExcerpt?.trim() ||
    "";

  const hostBridgeParamsJson = hostBridge
    ? `[SkillParamsJSON]\n${JSON.stringify(
        {
          requestId: hostBridge.requestId,
          formType: hostBridge.formType,
          action: hostBridge.action,
          callbackURL: hostBridge.callbackUrl ?? "",
          skillName: hostBridge.skillName,
        },
        null,
        2,
      )}`
    : "";

  const hostBridgeBlock = hostBridge
    ? `[HostBridge]
requestId: ${hostBridge.requestId}
formType: ${hostBridge.formType}
action: ${hostBridge.action}
skillName: ${hostBridge.skillName}

${hostBridgeParamsJson}

`
    : "";

  return `${hostBridgeBlock}[技能]
${skill?.trim() || "default"}

[会话]
${sessionId ?? "new"}

[页面 URL]
${pageUrl}

[页面摘要]
${pageContext.summary}

[页面内容]
${body}

[用户补充要求]
${userPrompt?.trim() || DEFAULT_USER_PROMPT}`;
}
