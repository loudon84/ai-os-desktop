# Current Agent State

| Stage | Status |
|---|---|
| expert-mcp-v1.2.1-catalog-hotfix | done |
| expert-mcp-v6.1-hotfix | done |
| remote-experts-pivot-v7.2 | done |

## Notes

**v1.2.1 Expert Catalog Hotfix**（PRD `prd_work/v1.2.1_hotfix_expert-mcp.md`）：

- 根因：MCP 成功但 0 expert 时仍 fallback 旧 cache（含 skill 明细）
- `expert-mcp-endpoint.ts`：独立 `/api/v1/expert/mcp` endpoint
- `listExpertCatalog`：MCP 成功 → 空列表也 source=remote；replace cache；旧 cache 校验 `catalogKind=expert`
- UI：Expert MCP endpoint 诊断 + 清除缓存按钮
- IPC：`get-expert-gateway-diagnostics`、`clear-expert-catalog-cache`
- 测试：expert-catalog-fallback、expert-mcp-endpoint
