# Current Agent State

| Stage | Status |
|---|---|
| mcp-diagnostics-probe-fix | done |

## Notes

**MCP diagnostics report 状态判定修复**：

- One-click diagnostics 主判定统一走 local proxy `POST /debug/probe`（`testRemoteMcpSkillGateway`）
- `remoteMcp.ok`：`probe.ok && status=connected && initialized=true`
- `toolsList.ok` / `toolCount`：来自 `probe.toolCount > 0`，不再因 `listRemoteMcpTools` 失败而误判
- 移除 diagnostics 内 `/health` 检查，避免 404 写入 `localProxy` errors
- 每次 run 重建 `errors`；`ok = steps.every(step => step.ok)`
- `testMcpSkillGatewayProxy`：`/health` 404 时 fallback 为 proxy running（供 Test Proxy 按钮）

**验证**：`npm run typecheck` 通过；`mcp-gateway-diagnostics` + `mcp-skill-gateway-health` vitest 8 cases 通过
