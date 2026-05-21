export default {
  noServices: "No runtime services registered",
  webAppPlaceholder: "AI-OS Web App will load here when the runtime is ready.",
  webAppHint: "The AI-OS frontend is served via a local WebContentsView once all services are running.",
  loadingRuntime: "Checking AI-OS runtime…",
  supervisorFrontendDown:
    "Desktop-managed AI-OS frontend is not running. Still loading your configured portal URL.",
  portalUnreachable:
    "Configured AI-OS Home URL is not reachable: {{url}}. Start your local frontend (e.g. pnpm dev) or check the login endpoint.",
  openRuntimeSettings: "Runtime settings",
} as const;
