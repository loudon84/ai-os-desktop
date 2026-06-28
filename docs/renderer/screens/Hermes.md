# Hermes

## 1. 路径

```text
src/renderer/src/screens/Hermes/
```

## 2. 入口

由 `WorkspaceRenderer` 根据 registry `local-hermes`（kind `react`）渲染。

## 3. 职责

- V5.6 Local Hermes 默认 Profile 三栏工作台
- **V7.2 Remote Experts Pivot** + **Expert MCP Gateway v6.1**：直连 `/api/v1/expert/mcp` 同步召唤（无 HermesTask）；root `tools/list` 严格 kind 过滤；统一 `callCatalogSkill`；`ExpertCatalogCallDrawer`；Workbench Expert Gateway 健康；本地 Runs/Artifacts（schema v3）
- **V7.1** Hermes Experts Workspace：专家广场 / 专家团队 / 专家运行 + profile-aware Chat
- **V7.1.1** E2E：Chat↔Run 事件桥接、Tools&MCP Inspector、Desktop register/heartbeat
- 左栏 Sidebar：**Workbench** / Chat / Experts / Expert Teams / Expert Runs / **Artifacts** / Sessions / models / skills / tools / memory / providers / mcpGateway
- 中栏：当前选中页面内容
- 右栏：Right Panel（Runtime / Inspector）
- 固定使用 `default` profile 做本地 Chat；远端专家 `profileId: remote`
- 与 Workspaces / copilot-serve 隔离

## 4. 关键文件

| 文件 | 作用 |
|---|---|
| `index.tsx` | 导出入口 + `useRemoteExpertContextBridge` |
| `api/hermesDefaultApi.ts` | 封装 `window.hermesAPI` |
| `constants.ts` | 导航项（含 workbench / artifacts） |
| `context/HermesDefaultContext.tsx` | 默认页 workbench |
| `context/HermesExpertsContext.tsx` | 专家目录 Context |
| `hooks/useRemoteExpertContextBridge.ts` | WebOperator/屏幕上下文事件桥 |
| `utils/remote-expert-context.ts` | tools/call context 存储 |
| `pages/Workbench/HermesWorkbenchPage.tsx` | **V7.2** 工作台首页 + Expert Gateway 健康（`publishedExperts` / `callableSkills` 等） |
| `pages/Artifacts/HermesArtifactsPage.tsx` | **V7.2** 本地 `expert_mcp_response` 成果 |
| `pages/Experts/components/ExpertCatalogCallDrawer.tsx` | **v6.1** 统一 expert/team 召唤 Drawer（`listCatalogSkills` + `callCatalogSkill`） |
| `pages/Experts/hooks/useCatalogSkillCall.ts` | skill 列表加载 + catalog skill 调用 |
| `pages/Experts/components/ExpertCallDrawer.tsx` | legacy Call Drawer（保留） |
| `pages/ExpertTeams/components/ExpertTeamCallDrawer.tsx` | legacy 团队 Call Drawer（主路径已切 `ExpertCatalogCallDrawer`） |
| `pages/Experts/` | 专家广场 |
| `pages/ExpertTeams/` | 专家团队 |
| `pages/ExpertRuns/` | 运行记录（同步本地 timeline + responseText） |
| `pages/GeneHub/components/GeneHubSkillPushPanel.tsx` | **V7.2** Skill Push / Submissions / Pull |
| `registry/hermes-pages.tsx` | 页面注册表 |

## 5. 数据来源

| 来源 | API |
|---|---|
| Preload | `window.hermesAPI.*`（本地 default profile） |
| Preload | `window.hermesExperts.*`（Expert MCP v6.1：`listCatalogSkills` / `callCatalogSkill` / catalog/summon/Runs/本地 artifacts；`getExpertGatewayHealth`；`listExpertSkills` 委托 `listCatalogSkills`；install* deprecated） |
| Preload | `window.mcpSkillGatewayRuntime.*`（非专家 MCP Skill Gateway；legacy hermes-client task） |

## 6. 边界

见 `docs/specs/v7.2-nodeskclaw-remote-experts/01-architecture-boundary.md`：禁止 route override；server_artifacts 导入为本地副本。

## 7. IPC

见 `docs/API_CONTRACTS.md` § Hermes Experts Workspace（V7.2）。
