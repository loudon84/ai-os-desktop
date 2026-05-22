export default {
  noServices: "No runtime services registered",
  webAppPlaceholder: "Portal Web App will load here when the runtime is ready.",
  webAppHint: "The Portal frontend is served via a local WebContentsView once all services are running.",
  loadingRuntime: "Checking Portal runtime…",
  supervisorFrontendDown:
    "Desktop-managed Portal frontend is not running. Still loading your configured portal URL.",
  portalUnreachable:
    "Configured Portal Home URL is not reachable: {{url}}. Start your local frontend (e.g. pnpm dev) or check the login endpoint.",
  openRuntimeSettings: "Runtime settings",
} as const;
