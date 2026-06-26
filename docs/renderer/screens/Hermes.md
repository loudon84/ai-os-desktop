# Hermes

## 1. 路径

```text
src/renderer/src/screens/Hermes/
```

## 2. 入口

由 `WorkspaceRenderer` 根据 registry `local-hermes`（kind `react`）渲染。

## 3. 职责

- V5.6 Local Hermes 默认 Profile 三栏工作台
- **V7.1** Hermes Experts Workspace：专家广场 / 专家团队 / 专家运行 + profile-aware Chat
- **V7.1.1** E2E 闭环：专家 Gateway 端口路由、`policy.json`/MCP/Skills 物化、Chat↔Run 事件桥接、Tools&MCP Inspector、Desktop register/heartbeat
- **V7.1.1** E2E：`expert-profile-manager` 注册 runtime、`getApiUrl(profile)` 专家 Gateway、`expert-run-bridge` Chat↔Run、Tools/MCP Inspector、Desktop register/heartbeat/report
- 左栏 Sidebar：Chat / Experts / Expert Teams / Expert Runs / Sessions / models / skills / tools / memory / providers 导航
- 中栏：当前选中页面内容
- 右栏：Right Panel（Runtime / Inspector）
- 固定使用 `default` profile，通过 `hermesAPI` IPC 通信
- 与 Workspaces / copilot-serve 隔离

## 4. 关键文件

| 文件 | 作用 |
|---|---|
| `index.tsx` | 导出入口 |
| `api/hermesDefaultApi.ts` | 封装 `window.hermesAPI` 为 Screen 级 API |
| `constants.ts` | 常量 |
| `types.ts` | 类型定义 |
| `context/HermesDefaultContext.tsx` | Context Provider |
| `components/HermesSidebar.tsx` | 左栏导航 |
| `components/HermesShell.tsx` | 三栏壳层（实际在 panels/） |
| `components/HermesStatusCards.tsx` | 状态卡片 |
| `components/HermesStatusBadge.tsx` | 状态徽章 |
| `components/HermesPageErrorBoundary.tsx` | 页面错误边界 |
| `components/HermesPageSkeleton.tsx` | 页面骨架屏 |
| `components/HermesRightInspectorTabs.tsx` | 右栏 Inspector Tabs |
| `panels/HermesShell.tsx` | 三栏壳层编排 |
| `panels/HermesRightPanel.tsx` | 右面板 |
| `panels/HermesRightPanelRail.tsx` | 右面板 Rail |
| `panels/HermesRuntimePanel.tsx` | Runtime 运维面板 |
| `registry/hermes-pages.tsx` | 页面注册表 |
| `pages/Chat/` | Chat 页面（WebChat Surface + Active Expert Bar） |
| `pages/Experts/` | 专家广场（V7.1） |
| `pages/ExpertTeams/` | 专家团队（V7.1） |
| `pages/ExpertRuns/` | 专家运行记录（V7.1） |
| `context/HermesWorkspaceContext.tsx` | 专家/团队激活态与 work mode |
| `api/hermesProfileApi.ts` | profile-aware Chat API 工厂 |
| `panels/HermesExpertInspectorPanel.tsx` | 右栏专家 Timeline/Artifacts/Tools·MCP/Audit |
| `pages/Sessions/` | 会话列表页 |
| `pages/Models/` | 模型库页 |
| `pages/Skills/` | 技能页 |
| `pages/Tools/` | 工具页 |
| `pages/Memory/` | 记忆页 |
| `pages/Providers/` | Provider 页 |
| `hooks/` | Profile / Runtime / Sessions / Models 等 hooks |
| `utils/formatChatError.ts` | 错误格式化 |

## 5. 数据来源

| 来源 | API |
|---|---|
| Preload | `window.hermesAPI.*`（安装/配置/聊天/会话/模型/技能等） |
| Preload | `window.hermesExperts.*`（V7.1 专家目录/安装/召唤/运行） |
| Context | `HermesDefaultContext` + `HermesWorkspaceContext` + `HermesExpertsContext` |
| Local | `hermesDefaultApi` 封装层 |

## 6. 状态流

```text
HermesDefaultContext 初始化
  → hermesDefaultApi → window.hermesAPI
  → Sidebar 页面选择 → registry 渲染对应 page
  → Chat: sendMessage / onChatChunk / onChatDone → SSE 流
  → Models: getModels / setEnv / setModelConfig
  → Sessions: getSessions / deleteSession
```

## 7. 约束

- 不直接访问 Node.js
- 不新增未登记 IPC
- 不跨层 import main/preload
- **禁止**引入 `workspaceChat` / `profileRuntime` API（与 Workspaces 隔离）
- 固定 `default` 为 Portal 入口；专家召唤可切换到 expert profile（`HermesWorkspaceContext`）
- 专家 IPC 使用 `window.hermesExperts`，禁止 Renderer 直接 `ipcRenderer`

## 8. 相关文档

- `docs/API_CONTRACTS.md` § Hermes Chat / Models
- `docs/renderer/WORKSPACE_ROUTING.md`
- `prd/v5.6.2_hermes-webchat-surface.md`
- `prd/v5.6.4_hermes-chat.md`
