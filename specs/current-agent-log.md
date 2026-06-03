# Current Agent Log

## 2026-06-02
- Completed v6.2 WebOperator Hermes Panel attachments: hermesPanelApi upload/remove wrappers, hook attachment state + merge with web context, composer tray/drag-drop, CSS; typecheck OK.

## 2026-06-02 (earlier)
- Started v6.1 Hermes MCP implementation per plan `hermes-mcp-v61`.
- Confirmed legacy MCP list API in `installer.ts` (`listMcpServers`); new registry will not replace it in v6.1.
- Completed full stack: shared/mcp, main/mcp (DB, client, sync, binding, proxy, bridge), mcp:* IPC, hermesAPI.mcp, HermesMCPPage + i18n.
- typecheck + tests/mcp-registry.test.ts passed; docs synced.
