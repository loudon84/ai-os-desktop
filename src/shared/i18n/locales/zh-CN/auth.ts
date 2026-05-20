export default {
  login: "登录",
  logout: "退出登录",
  email: "邮箱",
  password: "密码",
  tenantCode: "租户代码",
  bootstrap: "正在应用配置…",
  configDiff: "配置变更",
  configDiffApply: "应用",
  configDiffCancel: "取消",
  checkingSession: "正在检查会话…",
  account: "账户",
  brandTitle: "SMC Copilot",
  brandSubtitle:
    "在下方填写 AI-OS 后端与 Auth API 前缀并完成验证。桌面会将 Bearer 注入嵌入的 AI-OS Home（默认 http://127.0.0.1:3000）。此登录不是 Hermes Gateway 登录。",
  loginPurposeHint:
    "账号密码发往你配置的 AI-OS Auth，用于内嵌门户页，不是发往 Hermes 网关。",
  endpointSection: "AI-OS 端点",
  backendUrl: "AI-OS 后端 URL",
  authPrefix: "Auth API 前缀",
  aiosHomeUrl: "AI-OS Home URL",
  signingIn: "正在登录…",
  notSignedIn: "未登录",
} as const;
