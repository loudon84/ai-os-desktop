import { ipcRenderer } from "electron";
import type {
  McpSkillGatewayRuntimeAPI,
  McpSkillGatewayRuntimeConfig,
} from "../shared/mcp-skill-gateway-runtime/mcp-skill-gateway-runtime-contract";

export const mcpSkillGatewayRuntimeApi: McpSkillGatewayRuntimeAPI = {
  getStatus: () => ipcRenderer.invoke("mcp-skill-gateway-runtime:get-status"),
  getConfig: () => ipcRenderer.invoke("mcp-skill-gateway-runtime:get-config"),
  saveConfig: (input: Partial<McpSkillGatewayRuntimeConfig>) =>
    ipcRenderer.invoke("mcp-skill-gateway-runtime:save-config", input),
  startProxy: () => ipcRenderer.invoke("mcp-skill-gateway-runtime:start-proxy"),
  stopProxy: () => ipcRenderer.invoke("mcp-skill-gateway-runtime:stop-proxy"),
  restartProxy: () => ipcRenderer.invoke("mcp-skill-gateway-runtime:restart-proxy"),
  testProxy: () => ipcRenderer.invoke("mcp-skill-gateway-runtime:test-proxy"),
  testRemoteMcp: () => ipcRenderer.invoke("mcp-skill-gateway-runtime:test-remote-mcp"),
  registerToProfile: (profile: string) =>
    ipcRenderer.invoke("mcp-skill-gateway-runtime:register-to-profile", profile),
  unregisterFromProfile: (profile: string) =>
    ipcRenderer.invoke("mcp-skill-gateway-runtime:unregister-from-profile", profile),
  listProfileRegistrations: () =>
    ipcRenderer.invoke("mcp-skill-gateway-runtime:list-profile-registrations"),
  readProxyLogs: (lines?: number) =>
    ipcRenderer.invoke("mcp-skill-gateway-runtime:read-proxy-logs", lines),
};
