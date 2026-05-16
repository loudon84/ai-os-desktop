# Reading Guide

## 项目阅读顺序

### 第一阶段：理解全局架构

1. `docs/INDEX.md` — 项目定位、目录结构、技术栈
2. `docs/ARCHITECTURE.md` — 三层进程模型、Gateway 对接、屏幕路由
3. `wiki_core.md` — 核心架构分析（含代码行号引用）
4. `package.json` — 依赖和脚本
5. `electron.vite.config.ts` — 构建配置
6. `electron-builder.yml` — 打包配置

### 第二阶段：理解进程通信

7. `src/preload/index.ts` — 预加载桥接层（hermesAPI 完整定义）
8. `src/preload/index.d.ts` — TypeScript 类型声明
9. `src/main/index.ts` — 主进程入口（IPC 注册中心）
10. `docs/API_CONTRACTS.md` — IPC 通信契约

### 第三阶段：理解核心模块

11. `src/main/hermes.ts` — Gateway 管理 + 消息路由（最核心）
12. `src/main/sse-parser.ts` — SSE 流解析
13. `src/main/config.ts` — 配置管理
14. `src/main/installer.ts` — 安装管理

### 第四阶段：理解数据模块

15. `src/main/sessions.ts` — 会话查询
16. `src/main/session-cache.ts` — 会话缓存
17. `src/main/models.ts` + `src/main/default-models.ts` — 模型管理
18. `src/main/profiles.ts` — 配置档案
19. `src/main/memory.ts` — 记忆管理
20. `src/main/soul.ts` — 人格管理
21. `src/main/tools.ts` — 工具集
22. `src/main/skills.ts` — 技能管理
23. `src/main/cronjobs.ts` — 定时任务

### 第五阶段：理解 UI 层

24. `src/renderer/src/App.tsx` — 根组件（屏幕路由）
25. `src/renderer/src/constants.ts` — 常量定义
26. `src/renderer/src/screens/Layout/Layout.tsx` — 主布局
27. `src/renderer/src/screens/Chat/Chat.tsx` — 聊天页（最核心 UI）
28. 其他 screens/ 按需阅读

### 第六阶段：理解共享模块

29. `src/shared/i18n/index.ts` — i18n 核心
30. `src/shared/i18n/config.ts` — i18n 配置
31. `src/shared/i18n/locales/zh-CN/` — 中文翻译（参考）

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
2. `src/renderer/src/screens/Install/Install.tsx` — 安装页
3. `src/renderer/src/screens/Setup/Setup.tsx` — 设置向导
4. `src/main/installer.ts` — 安装逻辑
5. `src/main/index.ts` — check-install / start-install IPC handler

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

---

## 输出要求

阅读代码后，按以下格式输出：

1. **模块职责** — 一句话说明
2. **入口文件** — 精确路径
3. **页面结构** — 页面 → 组件 → Hook 链
4. **组件依赖** — import 关系
5. **IPC 调用** — 使用的 hermesAPI 方法
6. **数据流** — 用户操作 → IPC → 主进程 → 返回
7. **类型定义** — 关键 TypeScript 类型
8. **可复用模式** — 现有可复用的组件/函数
9. **修改风险** — 改动可能影响的范围
10. **建议修改文件** — 精确路径列表
11. **禁止修改文件** — 精确路径列表

所有结论必须附带文件路径。不允许出现"可能""大概""看起来"。不确定就标记为 UNKNOWN，并说明需要读哪个文件。
