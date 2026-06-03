import type { McpToolSyncResult } from "../../shared/mcp/mcp-contract";
import { MCP_ERROR_CODES, McpServiceError } from "../../shared/mcp/mcp-errors";
import { generateMcpId, getMcpDb, insertAuditMcpEvent } from "./mcp-db";
import { listToolsFromServer } from "./mcp-client-service";
import { getServer, hashToolSchema, updateServerStatus } from "./mcp-server-registry";

function now(): string {
  return new Date().toISOString();
}

export async function syncTools(serverId: string): Promise<McpToolSyncResult> {
  const server = getServer(serverId);
  if (!server) {
    throw new McpServiceError(MCP_ERROR_CODES.SERVER_NOT_FOUND, `Server not found: ${serverId}`);
  }
  if (!server.enabled) {
    throw new McpServiceError(MCP_ERROR_CODES.SERVER_DISABLED, "Enable server before syncing tools");
  }

  let remoteTools;
  try {
    remoteTools = await listToolsFromServer(server);
  } catch (err) {
    updateServerStatus(serverId, "sync_failed", {
      lastError: err instanceof Error ? err.message : String(err),
    });
    throw new McpServiceError(
      MCP_ERROR_CODES.TOOLS_LIST_FAILED,
      err instanceof Error ? err.message : "tools/list failed",
    );
  }

  const db = getMcpDb();
  const ts = now();
  const existing = db
    .prepare(`SELECT id, tool_name FROM desktop_mcp_tools WHERE server_id = ? AND deleted_at IS NULL`)
    .all(serverId) as Array<{ id: string; tool_name: string }>;
  const existingByName = new Map(existing.map((r) => [r.tool_name, r.id]));
  const seen = new Set<string>();

  let added = 0;
  let updated = 0;

  const upsert = db.prepare(
    `INSERT INTO desktop_mcp_tools (
      id, server_id, tool_name, title, description, input_schema_json, output_schema_json,
      version, tool_hash, enabled, source_type, category, visibility, last_synced_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'mcp', ?, 'personal', ?, ?, ?)
    ON CONFLICT(server_id, tool_name) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      input_schema_json = excluded.input_schema_json,
      output_schema_json = excluded.output_schema_json,
      tool_hash = excluded.tool_hash,
      last_synced_at = excluded.last_synced_at,
      updated_at = excluded.updated_at,
      deleted_at = NULL`,
  );

  for (const tool of remoteTools) {
    seen.add(tool.name);
    const toolHash = hashToolSchema(tool.name, tool.inputSchema);
    const id = existingByName.get(tool.name) ?? generateMcpId("tool");
    const isNew = !existingByName.has(tool.name);
    upsert.run(
      id,
      serverId,
      tool.name,
      tool.title ?? tool.name,
      tool.description ?? null,
      JSON.stringify(tool.inputSchema ?? null),
      JSON.stringify(tool.outputSchema ?? null),
      null,
      toolHash,
      server.id.split("-")[0] ?? "mcp",
      ts,
      ts,
      ts,
    );
    if (isNew) added += 1;
    else updated += 1;
  }

  let removed = 0;
  for (const row of existing) {
    if (!seen.has(row.tool_name)) {
      db.prepare(`UPDATE desktop_mcp_tools SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(ts, ts, row.id);
      removed += 1;
    }
  }

  updateServerStatus(serverId, "connected", {
    toolsCount: remoteTools.length,
    synced: true,
    connected: true,
    lastError: null,
  });

  insertAuditMcpEvent("mcp.tools.synced", { serverId, added, updated, removed });

  return {
    serverId,
    added,
    updated,
    removed,
    toolsCount: remoteTools.length,
  };
}
