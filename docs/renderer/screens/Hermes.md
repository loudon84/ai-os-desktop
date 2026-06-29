# Hermes

> **v1.3 Spec Pack（AI Coding）**：[`docs/specs/v1.3-workbuddy-product-line/00-overview.md`](../../specs/v1.3-workbuddy-product-line/00-overview.md) — Layout 边界见 [`03-layout-boundary.md`](../../specs/v1.3-workbuddy-product-line/03-layout-boundary.md)，UI 质量见 [`13-ai-coding-structure.md`](../../specs/v1.3-workbuddy-product-line/13-ai-coding-structure.md)。

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
- **v1.4 Work 任务窗口**：`pages/Tasks/` — TaskHomeEntry + TaskWindow 三栏（TaskStream 事件流 / TaskRightPanel 五 Tab）；`workApi.task.*` + `workTaskApi`；`VITE_WORK_MOCK_MODE` 销售作战 mock SSE；Main 预留 `work:task-*` IPC
- 左栏 Sidebar：**三段分组**（主流程含 **tasks** / workbench / chat …；能力管理 / 高级设置，后两组默认折叠）；**v1.3 Phase 6** `requiresGateway` 离线门控（disabled + tooltip，当前页自动回 workbench）；窄栏仅显示主流程 icon
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
| `context/HermesDefaultContext.tsx` | 默认页 **tasks**（v1.4） |
| `context/HermesExpertsContext.tsx` | 专家/团队目录 Context（Inspector / Chat 用 `getExpertById`；**Phase 6** 已移除 `runs`/`refreshRuns`） |
| `hooks/useRemoteExpertContextBridge.ts` | WebOperator/屏幕上下文事件桥 |
| `utils/remote-expert-context.ts` | tools/call context 存储 |
| `pages/Workbench/HermesWorkbenchPage.tsx` | **v1.3** 工作台首页：`features/workbench` + ConnectionStatusCard / QuickTaskEntry / Recommended* / Recent* |
| `pages/Artifacts/HermesArtifactsPage.tsx` | **V7.2** 本地 `expert_mcp_response` 成果 |
| `pages/Experts/components/ExpertCatalogCallDrawer.tsx` | **v6.1** 统一 expert/team 召唤 Drawer（`listCatalogSkills` + `callCatalogSkill`） |
| `pages/Experts/hooks/useCatalogSkillCall.ts` | skill 列表加载 + catalog skill 调用 |
| `pages/Experts/components/ExpertCallDrawer.tsx` | legacy Call Drawer（保留） |
| `pages/ExpertTeams/components/ExpertTeamCallDrawer.tsx` | legacy 团队 Call Drawer（主路径已切 `ExpertCatalogCallDrawer`） |
| `pages/Experts/` | 专家广场 |
| `pages/ExpertTeams/` | 专家团队 |
| `pages/ExpertRuns/` | 运行记录（`features/expert-run` + `workApi.runs`；组件 RunFilterBar / RunList / RunDetailPanel） |
| `pages/Artifacts/` | 成果中心（`features/artifact` + `workApi.artifacts`；ArtifactList / PreviewPanel / ImportDialog） |
| `api/workApi.ts` | **v1.3** Work 域 API 封装（Experts / Teams / Runs / Artifacts → `window.hermesExperts`；**v1.4** `task.*` → `workTaskApi`） |
| `api/workTaskApi.ts` | **v1.4** 任务 create/send/stop/subscribe；mock 流 + `workspaceChat` 归一化 |
| `features/task-store/` | **v1.4** `useWorkTaskStore` / reducer / selectors |
| `features/task-stream/` | **v1.4** `useWorkTaskStream` / `workEventNormalizer` / aggregator |
| `pages/Tasks/WorkTasksPage.tsx` | **v1.4** 任务首页 + 三栏任务窗口 |
| `features/expert-run/` | Runs 列表/详情 hooks（`useExpertRuns`、`useExpertRunDetail`） |
| `features/artifact/` | 成果列表/预览/导入 hooks |
| `features/workbench/` | Workbench 聚合 hooks（`useWorkbenchOverview`、`useQuickTaskEntry`） |
| `features/nav/` | **v1.3 Phase 6** 导航门控（`useGatewayNavGate`、`navItemAccess.isNavItemAccessible`） |
| `pages/GeneHub/components/GeneHubSkillPushPanel.tsx` | **V7.2** Skill Push / Submissions / Pull |
| `registry/hermes-pages.tsx` | 页面注册表 |

## 5. 数据来源

| 来源 | API |
|---|---|
| Preload | `window.hermesAPI.*`（本地 default profile） |
| Preload | `window.hermesExperts.*`（Expert MCP v6.1：`listCatalogSkills` / `callCatalogSkill` / catalog/summon/Runs/本地 artifacts；`getExpertGatewayHealth`；`listExpertSkills` 委托 `listCatalogSkills`；install* deprecated） |
| Preload | `window.work.task.*`（**v1.4** 任务 IPC：`work:task-send` / `work:task-stop` / `work:task-event`） |
| Preload | `window.mcpSkillGatewayRuntime.*`（非专家 MCP Skill Gateway；legacy hermes-client task） |

## 6. 边界

见 `docs/specs/v7.2-nodeskclaw-remote-experts/01-architecture-boundary.md`：禁止 route override；server_artifacts 导入为本地副本。

## 7. IPC

见 `docs/API_CONTRACTS.md` § Hermes Experts Workspace（V7.2）。
