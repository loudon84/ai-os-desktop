# Current Agent State

| Stage | Status |
|---|---|
| v6.5-genehub-hermes-skill-sync | done |
| v6.5.1-hotfix-genehub-skill-center-connection | done |

## Notes
- **V6.5.1 Hotfix**：修复 `contextBridge` 未暴露 `genehubRuntime`；`useGeneHubRuntime` 兜底；`team_v3.4.1` API 对齐（`desktop_device_id`、`job_type`、`mapSkill`/`mapBundle`）；删除 `claimed` 状态回传；Connection 可读错误文案；新增 `genehub-session.ts` 保存 device/server profile id。
- V6.5：GeneHub 连接（`system/info.genehub`）、`window.genehubRuntime`、device/profile 注册、Bundle 安装链、Skill Center 四 Tab；登录后 auto-init + heartbeat。
- typecheck 通过；GeneHub hotfix 相关 vitest 17 cases 通过。
