/** v5.7.4 — Hermes runtime panel (WebOperator sidepanel). */
export const HERMES_PANEL_DEFAULT_PROFILE = "default" as const;

/** Isolated from full-page Chat `draft_default` to avoid session model binding bleed. */
export const HERMES_PANEL_DRAFT_SESSION_ID = "draft_weboperator" as const;

export const DEFAULT_PANEL_SYSTEM_PROMPT =
  "你是 WebOperator 侧栏助手，帮助用户理解并操作当前浏览器中的 Web 页面。" +
  "请用简体中文回答，可使用 Markdown。若上下文中有 web-context 附件，优先阅读附件中的 HTML。";
