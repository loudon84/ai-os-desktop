# Reading Guide

## 项目阅读顺序

### 第一阶段：理解全局架构

1. `docs/INDEX.md` — 项目定位、目录结构、技术栈
2. `docs/ARCHITECTURE.md` — 三层进程模型、Gateway 对接、屏幕路由
3. `AGENTS.md` — Agent 编码速查指南
4. `package.json` — 依赖和脚本
5. `electron.vite.config.ts` — 构建配置
6. `electron-builder.yml` — 打包配置

### 第二阶段：理解进程通信

7. `src/preload/index.ts` — 预加载桥接层（hermesAPI 90+ 方法定义）
8. `src/preload/index.d.ts` — TypeScript 类型声明
9. `src/preload/aios-api.ts` — AI-OS Preload API
10. `src/preload/profile-runtime-api.ts` — Profile Runtime Preload API
11. `src/preload/browser-api.ts` — Web Operator Preload API
12. `src/main/index.ts` — 主进程入口（IPC 注册中心）
13. `docs/API_CONTRACTS.md` — IPC 通信契约

### 第三阶段：理解核心模块

14. `src/main/hermes.ts` — Gateway 管理 + 消息路由（最核心）
15. `src/main/sse-parser.ts` — SSE 流解析
16. `src/main/config.ts` — 配置管理
17. `src/main/installer.ts` — 安装管理

### 第四阶段：理解数据模块

18. `src/main/sessions.ts` — 会话查询
19. `src/main/session-cache.ts` — 会话缓存
20. `src/main/models.ts` + `src/main/default-models.ts` — 模型管理
21. `src/main/profiles.ts` — 配置档案
22. `src/main/memory.ts` — 记忆管理
23. `src/main/soul.ts` — 人格管理
24. `src/main/tools.ts` — 工具集
25. `src/main/skills.ts` — 技能管理
26. `src/main/cronjobs.ts` — 定时任务

### 第五阶段：理解运行时模块

27. `src/main/profile-runtime-manager.ts` — Profile Runtime 生命周期
28. `src/main/profile-runtime-db.ts` — SQLite 控制面
29. `src/main/profile-runtime-ipc.ts` — Profile Runtime IPC
30. `src/main/gateway-supervisor.ts` — 健康监管 + 自动重启
31. `src/main/gateway-log-collector.ts` — 日志收集
32. `src/main/runtime-reconciler.ts` — 状态恢复
33. `src/main/aios/aios-ipc.ts` — AI-OS IPC
34. `src/main/aios/aios-runtime-supervisor.ts` — AI-OS 运行时监管
35. `src/main/aios/aios-reconciler.ts` — AI-OS 状态恢复

### 第六阶段：理解 UI 层

36. `src/renderer/src/App.tsx` — 根组件（屏幕路由）
37. `src/renderer/src/constants.ts` — 常量定义
38. `src/renderer/src/screens/Layout/Layout.tsx` — 主布局（V1.4 编排层）
39. `src/renderer/src/screens/Chat/Chat.tsx` — 聊天页（最核心 UI）
40. `src/renderer/src/components/layout/` — Desktop Shell 组件族
41. 其他 screens/ 按需阅读

### 第七阶段：理解共享模块

42. `src/shared/i18n/index.ts` — i18n 核心
43. `src/shared/i18n/config.ts` — i18n 配置
44. `src/shared/i18n/locales/zh-CN/` — 中文翻译（参考）
45. `src/shared/profile-runtime/profile-runtime-contract.ts` — Profile Runtime 契约
46. `src/shared/enterprise/enterprise-contract.ts` — Enterprise 契约
47. `src/shared/aios/aios-contract.ts` — AI-OS 契约

---

## 功能阅读顺序

### 阅读聊天功能

1. `src/renderer/src/screens/Chat/Chat.tsx` — UI 入口
2. `src/preload/index.ts` — sendMessage / onChatChunk / onChatDone
3. `src/main/hermes.ts` — sendMessage() → sendMessageViaApi() / sendMessageViaCli()
4. `src/main/sse-parser.ts` — SSE 流解析
5. `src/main/index.ts` — send-message / abort-chat IPC handler

### 阅读安装流程

1. `src/renderer/src/screens/Welcome/Welcome.tsx` — 欢迎页
2. `src/renderer/src/screens/Install/Install.tsx` — 安装页（含 AgentSourceSelect）
3. `src/renderer/src/components/install-wizard/install-wizard.tsx` — 安装向导
4. `src/renderer/src/components/install/PipMirrorFields.tsx` — PyPI 镜像选择
5. `src/renderer/src/screens/Setup/Setup.tsx` — 设置向导
6. `src/main/installer.ts` — 安装逻辑
7. `src/main/enterprise/enterprise-installer.ts` — 企业安装流水线
8. `src/main/enterprise/agent-deps-installer.ts` — 依赖安装
9. `src/main/enterprise/pip-mirror-config.ts` — PyPI 镜像配置
10. `src/main/index.ts` — check-install / start-install / start-install-with-source IPC handler

### 阅读 Gateway 管理

1. `src/renderer/src/screens/Gateway/Gateway.tsx` — 平台配置 UI
2. `src/main/hermes.ts` — startGateway / stopGateway / restartGateway
3. `src/main/config.ts` — 平台开关
4. `src/main/index.ts` — gateway 相关 IPC handler

### 阅读会话管理

1. `src/renderer/src/screens/Sessions/Sessions.tsx` — 会话列表 UI
2. `src/main/sessions.ts` — SQLite 查询
3. `src/main/session-cache.ts` — 缓存逻辑
4. `src/main/index.ts` — sessions 相关 IPC handler

### 阅读 Profile Runtime

1. `src/renderer/src/screens/ProfileRuntime/ProfileRuntimeScreen.tsx` — UI
2. `src/renderer/src/screens/ProfileRuntime/LogViewer.tsx` — 日志查看
3. `src/preload/profile-runtime-api.ts` — Preload API
4. `src/main/profile-runtime-ipc.ts` — IPC handler
5. `src/main/profile-runtime-manager.ts` — 生命周期
6. `src/main/profile-runtime-db.ts` — 控制面 DB
7. `src/main/gateway-supervisor.ts` — 健康监管
8. `src/main/gateway-log-collector.ts` — 日志收集
9. `src/main/runtime-reconciler.ts` — 状态恢复

### 阅读 AI-OS Runtime

1. `src/renderer/src/screens/AIOSHome/AIOSHomeScreen.tsx` — AI-OS 首页
2. `src/renderer/src/screens/AIOSWorkspace/AIOSWorkspaceScreen.tsx` — AI-OS 工作台
3. `src/renderer/src/components/aios/AiOsWebAppHost.tsx` — Web 宿主
4. `src/preload/aios-api.ts` — Preload API
5. `src/main/aios/aios-ipc.ts` — IPC handler
6. `src/main/aios/aios-runtime-supervisor.ts` — 运行时监管
7. `src/main/aios/aios-reconciler.ts` — 状态恢复

### 阅读 Web Operator

1. `src/renderer/src/screens/WebOperator/WebOperatorScreen.tsx` — UI
2. `src/preload/browser-api.ts` — Preload API
3. `src/main/browser/browser-ipc.ts` — IPC handler
4. `src/main/browser/browser-controller.ts` — 核心控制器
5. `src/main/browser/browser-view-manager.ts` — BrowserView 管理
6. `src/main/browser/browser-security.ts` — 安全策略
7. `src/main/browser/browser-audit.ts` — 审计日志

### 阅读 SSH 远程连接

1. `src/main/ssh-remote.ts` — SSH 远程连接
2. `src/main/ssh-tunnel.ts` — SSH 隧道
3. `src/main/config.ts` — SSH 配置（set-ssh-config / test-ssh-connection / start-ssh-tunnel / stop-ssh-tunnel）

### 阅读 DB 迁移

1. `src/main/migrations/migration-runner.ts` — 迁移运行器
2. `src/main/migrations/legacy-hermes-migration.ts` — 旧版迁移
3. `src/main/migrations/001-install-location.ts` — 迁移001
4. `src/main/migrations/002-runtime-layout.ts` — 迁移002
5. `src/main/migrations/003-web-operator-config.ts` — 迁移003

### 阅读窗口控制（V1.4.1）

1. `src/renderer/src/components/layout/WindowControls.tsx` — UI
2. `src/main/window/window-ipc.ts` — IPC handler
3. `src/preload/index.ts` — windowControls API

---

## 输出要求

阅读代码后，按以下格式输出：

1. **模块职责** — 一句话说明
2. **入口文件** — 精确路径
3. **页面结构** — 页面 → 组件 → Hook 链
4. **组件依赖** — import 关系
5. **IPC 调用** — 使用的 hermesAPI / profileRuntime / aiosRuntime / aiosBrowser 方法
6. **数据流** — 用户操作 → IPC → 主进程 → 返回
7. **类型定义** — 关键 TypeScript 类型
8. **可复用模式** — 现有可复用的组件/函数
9. **修改风险** — 改动可能影响的范围
10. **建议修改文件** — 精确路径列表
11. **禁止修改文件** — 精确路径列表

所有结论必须附带文件路径。不允许出现"可能""大概""看起来"。不确定就标记为 UNKNOWN，并说明需要读哪个文件。
