export default {
  login: "Sign in",
  logout: "Sign out",
  email: "Email",
  password: "Password",
  tenantCode: "Tenant code",
  bootstrap: "Applying configuration…",
  configDiff: "Configuration changes",
  configDiffApply: "Apply",
  configDiffCancel: "Cancel",
  checkingSession: "Checking session…",
  account: "Account",
  brandTitle: "SMC Copilot",
  brandSubtitle:
    "Sign in to your AI-OS Auth API (below). The desktop injects a Bearer token so the embedded AI-OS Home tab loads. This is not Hermes Gateway login.",
  loginPurposeHint:
    "Credentials are verified against AI-OS backend + Auth prefix—for the embedded portal (default http://127.0.0.1:3000), not for Hermes.",
  endpointSection: "AI-OS endpoints",
  backendUrl: "AI-OS backend URL",
  authPrefix: "Auth API prefix",
  aiosHomeUrl: "AI-OS Home URL",
  signingIn: "Signing in…",
  notSignedIn: "Not signed in",
} as const;
