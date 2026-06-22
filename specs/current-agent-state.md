# Current Agent State

| Stage | Status |
|---|---|
| v7.0-mcp-client-closure | done |

## Notes

**V7.0 Hermes MCP Client Integration**（计划 `.cursor/plans/v7.0_mcp_client闭环_6734583c.plan.md`）：

- Shared：`src/shared/hermes-client/` + `McpSkillGatewayRuntimeConfig` 四个 feature flag
- Main：`hermes-client-http/api/mappers`、`hermes-recent-tasks-store`、`hermes-structured-task`；`hermes-client:*` IPC（10 通道）
- Proxy/Invoke：structuredContent → recent tasks；诊断新增 clientBootstrap/clientAgents/clientToolsFilter/clientReadiness
- Renderer：Client Contract / Agent Alias / Readiness Drawer / Task Result Panel；`useMcpSkillGatewayRuntime` EventSource
- 文档：`docs/API_CONTRACTS.md`、`AGENTS.md`、`docs/INDEX.md` V7.0 增量

**验证**：`npm run typecheck` + `npm test` 全绿
