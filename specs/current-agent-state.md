# Current Agent State

| Stage | Status |
|---|---|
| v6.7.1-genehub-mcp-registration-hardening | done |

## Notes

**V6.7.1 GeneHub MCP Registration Hardening**（PRD `prd/v6.7.1_genehub-mcp-registration-hardening.md`）：

- **Profile mapping**：`~/.hermes/desktop/genehub/profile-mapping.json`；`registerHermesProfile` 后持久化 serverProfileId
- **Bundle preview**：`GET .../bundle-preview`（不 claim）；`previewInstallBundle` 不再调用 `downloadBundle`
- **Ignore**：`POST .../ignore` 同步服务端 cancelled；移除本地 ignored-jobs 主路径
- **Install worker**：`getInstallJob` → claim → validate → write → restart → `syncInstalledSkills(serverProfileId)`；finally 刷新 pending cache
- **Signature**：`verifySignature` + `trustedPublicKeys`（heartbeat 可下发）
- **Scripts provenance**：`*.genehub.json` sidecar；无 provenance 阻断覆盖
- **UI**：MCP Registration mapping 门禁、validation preview；MCP Gateway 卡片 pending/in-progress/lastSync
- **验证**：`npm run typecheck` 通过；GeneHub 相关 vitest 27 cases 通过

## 文档同步摘要

- `docs/API_CONTRACTS.md` — GeneHub V6.7.1 IPC、profile-mapping、preview/ignore 行为
- `AGENTS.md` / `docs/INDEX.md` — 版本行 + V6.7.1 特性索引
