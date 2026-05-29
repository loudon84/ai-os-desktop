import type { HermesPanelPageContext } from "../../../components/hermes";

const DEFAULT_USER_PROMPT =
  "请分析当前页面内容，提取关键业务信息、风险点、可执行动作。";

export function buildTaskFirstMessage(input: {
  pageUrl: string;
  pageContext: HermesPanelPageContext;
  userPrompt?: string;
  skill?: string;
}): string {
  const { pageUrl, pageContext, userPrompt, skill } = input;
  const body =
    pageContext.payload.textExcerpt?.trim() ||
    pageContext.payload.htmlExcerpt?.trim() ||
    "";

  return `[页面来源]
${pageUrl}

[页面摘要]
${pageContext.summary}

[技能]
${skill?.trim() || "default"}

[页面内容]
${body}

[用户补充要求]
${userPrompt?.trim() || DEFAULT_USER_PROMPT}`;
}
