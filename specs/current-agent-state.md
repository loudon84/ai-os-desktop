# Current Agent State

| Stage | Status |
|---|---|
| hermes-experts-workspace-v7.1 | done |
| hermes-experts-phase7-8 | done |

## Notes

**V7.1.1 Hermes Experts E2E + Desktop Sync**（计划 `hermes-experts-phase7-8_830a3719.plan.md`）：

- Phase 7.1：`expert-profile-manager.ts` + `getApiUrl(profile)` / `startGateway(profile)` 专家 Gateway 路由
- Phase 7.2：`expert-install-materializer.ts` — policy.json、config MCP merge、Skills、team_instances
- Phase 7.3：`expert-run-bridge.ts` Chat↔Run 事件/artifact；团队首条消息 dispatch；Starter prompts、Run Cancel/Retry
- Phase 7.4：Trust/MCP enforcement、Inspector Tools/MCP Tab、RiskReport 增强
- Phase 7.5：`expert-preflight.ts`、i18n `workspaces.hermes.experts.errors.*`
- Phase 7.6：Vitest（profile-manager、gateway-url、preload）、文档 API_CONTRACTS/AGENTS/Hermes.md
- Phase 8：`expert-desktop-client.ts` register/heartbeat/run-report + IPC + Experts 页 sync pill

**验证**：`npm run typecheck` 通过；hermes-experts 相关单测通过
