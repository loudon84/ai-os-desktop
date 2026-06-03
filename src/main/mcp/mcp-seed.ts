import { getMcpDb } from "./mcp-db";
import { createServer, getServer } from "./mcp-server-registry";

const PRESETS = [
  {
    id: "node-repl",
    name: "Node Repl",
    description: "Local stdio MCP server (configure command path)",
    transport: "stdio" as const,
    command: "node",
    args: ["./mcp-servers/node-repl/server.js"],
    enabled: false,
    profileScope: ["default"],
  },
  {
    id: "writer-gateway",
    name: "Writer MCP Gateway",
    description: "Remote Writer MCP Skills Gateway",
    transport: "streamable_http" as const,
    url: "https://agent.superic.com/api/v1/hermes/mcp",
    authType: "bearer" as const,
    enabled: false,
    profileScope: ["writer", "default"],
  },
  {
    id: "finance-gateway",
    name: "Finance MCP Gateway",
    description: "Remote Finance MCP Skills Gateway",
    transport: "streamable_http" as const,
    url: "https://agent.superic.com/api/v1/hermes/mcp",
    authType: "bearer" as const,
    enabled: false,
    profileScope: ["finance", "default"],
  },
  {
    id: "coding-gateway",
    name: "Coding MCP Gateway",
    description: "Remote Coding MCP Skills Gateway",
    transport: "streamable_http" as const,
    url: "https://agent.superic.com/api/v1/hermes/mcp",
    authType: "bearer" as const,
    enabled: false,
    profileScope: ["coding", "default"],
  },
];

export function seedDefaultMcpServers(): void {
  getMcpDb();
  for (const preset of PRESETS) {
    if (getServer(preset.id)) continue;
    try {
      createServer({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        transport: preset.transport,
        url: preset.url,
        command: preset.command,
        args: preset.args,
        authType: preset.authType,
        enabled: preset.enabled,
        profileScope: preset.profileScope,
      });
    } catch {
      /* ignore duplicate */
    }
  }
}
