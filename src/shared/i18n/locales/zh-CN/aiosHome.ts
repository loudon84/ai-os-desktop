export default {
  noServices: "尚未检测到运行时服务",
  webAppPlaceholder: "AI-OS Web 应用将在运行时就绪后加载于此。",
  webAppHint: "AI-OS 前端通过本地 WebContentsView 提供，所有服务运行后自动挂载。",
  loadingRuntime: "正在检查 AI-OS 运行时…",
  supervisorFrontendDown:
    "桌面托管的 AI-OS 前端未运行，仍将加载您配置的门户 URL。",
  portalUnreachable:
    "无法访问登录配置的 AI-OS Home URL：{{url}}。请先启动本地 frontend（如 pnpm dev）或检查登录端点。",
  openRuntimeSettings: "运行时设置",
} as const;
