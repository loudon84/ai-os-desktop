# Hermes Desktop — Agent 编码指南

> 面向 Cursor / AI Agent 的项目速查。详细设计见 `docs/INDEX.md`、`docs/ARCHITECTURE.md`、`docs/MODULES.md`。

## 项目是什么

**hermes-desktop** 是基于 Electron + React + TypeScript 的 AI 助手桌面应用：安装/配置 Hermes Agent、管理 Gateway、聊天、多 Profile 运行时（AI-OS Desktop）。

| 项 | 值 |
|---|---|
| 版本 | 0.3.5（V1.2.1 Enterprise Install） |
| appId | `com.nousresearch.hermes` |
| 后端 | Hermes Python Gateway，`http://127.0.0.1:8642`（default Profile） |

## 架构：三层进程（必须遵守）

```
Renderer (React)  →  window.hermesAPI / profileRuntime / aiosBrowser
       ↓ ipcRenderer.invoke
Preload (contextBridge)  →  src/preload/index.ts
       ↓ IPC
Main (Node.js)  →  src/main/index.ts + 各 *-ipc.ts / *.ts 模块
       ↓ HTTP SSE / child_process
Hermes Python Backend (Gateway)
```

**硬性规则：**

- 渲染进程**禁止** `import` Node 模块；只通过 `window.*` API 访问主进程
- **禁止**猜测新增 IPC channel；新通道必须：Main 注册 handler → Preload 封装 → `index.d.ts` 类型 → `docs/API_CONTRACTS.md`
- **禁止**绕过 Preload 使用 `ipcRenderer`（除 Preload 自身）
- 改 Gateway 启停/进程管理前，先读 `src/main/hermes.ts` 与 `profile-runtime-manager.ts`
- 不要改 `electron-builder.yml` 的 appId / publish、i18n 语言代码与回退链

## 目录地图

| 路径 | 职责 | 常见改动 |
|---|---|---|
| `src/main/` | 主进程：IPC、Gateway、配置、SQLite、Enterprise Install | 新 IPC、后端逻辑 |
| `src/main/browser/` | Web Operator（BrowserView、安全、审计、Tool Server） | 浏览器自动化 |
| `src/main/enterprise/` | V1.2.1 企业一键部署流水线 | 安装/预检/Doctor |
| `src/preload/` | contextBridge：`hermesAPI`、`aiosBrowser`、`profileRuntime`、`profileEntry` | API 桥接（影响面大） |
| `src/renderer/src/` | React UI：`screens/`、`components/` | **主要 UI 开发区** |
| `src/shared/` | 共享类型：i18n、profile-runtime、enterprise、browser 契约 | 类型/错误码/常量 |
| `resources/profiles/` | Profile 模板 + SOUL.md | Profile 种子配置 |
| `resources/skills/` | 内置技能包 | 新技能 |
| `tests/` | Vitest | 单测/集成测 |
| `docs/` | 架构与契约文档 | 随功能更新契约 |

## Preload 暴露的全局 API

| 全局对象 | 文件 | 用途 |
|---|---|---|
| `window.hermesAPI` | `src/preload/index.ts` | 安装、配置、聊天、会话、模型、技能等（30+ 方法） |
| `window.aiosBrowser` | `src/preload/browser-api.ts` | Web Operator（13 方法 + 事件） |
| `window.profileRuntime` | `src/preload/profile-runtime-api.ts` | 多 Profile 运行时（20 方法，含日志/自动重启） |
| `window.profileEntry` | `src/preload/profile-entry-api.ts` | Profile 页面入口与布局（5 方法） |

类型定义：`src/preload/index.d.ts`。契约类型：`src/shared/profile-runtime/`、`src/shared/enterprise/`。

## 应用路由与 UI 结构

**生命周期路由**（`src/renderer/src/App.tsx`）：

```
splash → welcome → installing → setup → main (Layout)
```

**主界面**（`Layout.tsx`）侧边栏视图：

| 视图 | 路径 | 屏幕文件 |
|---|---|---|
| Chat | `/` | `screens/Chat/Chat.tsx` |
| Sessions | `/sessions` | `screens/Sessions/Sessions.tsx` |
| Agents | `/agents` | `screens/Agents/Agents.tsx` |
| Models / Providers / Skills / Soul / Memory / Tools / Schedules / Gateway / Settings | 各对应 `screens/*/` | |
| Web Operator | `/web-operator` | `screens/WebOperator/WebOperatorScreen.tsx` |
| **AI-OS Workspace** | `/aios-workspace` | `screens/AIOSWorkspace/AIOSWorkspaceScreen.tsx` |
| **Profile Workspace** | `/profile-workspace/:id` | `screens/ProfileWorkspace/ProfileWorkspaceScreen.tsx` |
| **Profile Runtime** | `/profile-runtime` | `screens/ProfileRuntime/ProfileRuntimeScreen.tsx` |

## 核心数据流（改功能时先定位）

### 聊天

```
Chat.tsx
  → hermesAPI.sendMessage / onChatChunk / onChatDone
  → main/hermes.ts: sendMessage()
      → 远程模式: sendMessageViaApi (HTTPS)
      → 本地: GET /health → SSE POST /v1/chat/completions 或 CLI fallback
  → main/sse-parser.ts: 解析 SSE（含 hermes.tool.progress）
```

### 单 Gateway（legacy default）

- 启动：`hermes.ts` → `startGateway()` spawn `hermes gateway`
- 健康：15s 轮询 `/health`
- 配置变更（API Key/模型/平台）可触发 `restartGateway()`

### Multi Profile Runtime（V1.1+）

7 个 Profile，端口 8642–8648：

| Profile | 端口 |
|---|---|
| default | 8642 |
| writer / coding / research / recruiters / finance / agenter | 8643–8648 |

状态机：`not_deployed → starting → running → stopping → stopped`，异常 → `failed`。

关键模块链：

```
profile-runtime-ipc.ts
  → profile-runtime-manager.ts（生命周期）
  → hermes-local-adapter.ts（spawn/health/message）
  → gateway-supervisor.ts（健康监管 + V1.2 自动重启）
  → gateway-log-collector.ts（V1.2 日志）
  → runtime-reconciler.ts（V1.2 App 重启恢复）
  → profile-runtime-db.ts（SQLite 控制面）
```

控制面 DB：`~/.hermes/desktop/profile-runtime.db`（9 表）。配置：`~/.hermes/desktop/profile-runtime.yaml`。

能力插件：`delegation-capability`、`skill-sync-capability`、`session-share-capability`。

### Enterprise Install（V1.2.1）

```
Renderer Install 屏
  → enterprise:* IPC（13 个，见 enterprise-installer.ts）
  → 20 步流水线：预检 → Bundle → Agent → Venv → Hermes Home → Profile Bootstrap → Marker
```

安装目录（Windows）：`%LOCALAPPDATA%\AIOS-Hermes\`（runtime/agent/venv/logs）。  
用户数据：`%USERPROFILE%\.hermes\`。

安全：仅 `127.0.0.1`、不写 HKLM/系统 PATH、Token 不落盘、Bundle 必须 SHA-256。

## 配置文件位置

| 文件 | 用途 |
|---|---|
| `~/.hermes/desktop.json` | 连接模式 local/remote |
| `~/.hermes/.env` | API Keys |
| `~/.hermes/config.yaml` | Hermes Agent 配置 |
| `~/.hermes/state.db` | 会话历史（better-sqlite3 只读） |
| `~/.hermes/profiles/<name>/` | 各 Profile 目录 |
| `~/.hermes/desktop/profile-runtime.db` | 运行时控制面 |
| `~/.hermes/desktop/web-operator/` | Web Operator 配置与审计日志 |

## 新增/修改功能 checklist

### 新增 IPC

1. `src/main/<module>.ts` 或 `*-ipc.ts`：`ipcMain.handle('channel-name', ...)`
2. `src/main/index.ts` 确保注册（若独立文件则 `setup*IPC()`）
3. `src/preload/index.ts`（或专用 api 文件）封装为 Promise
4. `src/preload/index.d.ts` 补充类型
5. 更新 `docs/API_CONTRACTS.md`
6. 必要时加 `tests/ipc-handlers.test.ts` / `preload-api-surface.test.ts`

### 新增 UI 页面

1. `src/renderer/src/screens/<Name>/` 组件
2. `Layout.tsx` 导航项 + 路由
3. `src/shared/i18n/locales/*/` 四个语言的对应模块（共 20 个模块名，见 `MODULES.md`）
4. 通过 Preload API 调主进程，不在 Renderer 写文件 IO

### 新增 Profile Runtime 能力

1. 类型放 `src/shared/profile-runtime/profile-runtime-contract.ts`
2. 错误码放 `profile-runtime-errors.ts`
3. Main 实现 + `profile-runtime-ipc.ts` 注册
4. `profile-runtime-api.ts` + `index.d.ts` 暴露

## 技术栈与命令

| 类别 | 技术 |
|---|---|
| 桌面 | Electron 39 + electron-vite 5 |
| UI | React 19 + TailwindCSS 4 + Lucide |
| 语言 | TypeScript 5.9 |
| DB | better-sqlite3 |
| i18n | i18next（en / es / pt-BR / zh-CN，源语言 en） |
| 测试 | Vitest + Testing Library |

```bash
npm run dev          # 开发
npm run build        # typecheck + 构建
npm run typecheck    # 双 tsconfig 检查
npm test             # Vitest
npm run lint         # ESLint
```

## 主进程模块速查

| 模块 | 文件 | 一句话 |
|---|---|---|
| 入口 | `index.ts` | BrowserWindow + 全部 IPC 注册 |
| Gateway/聊天 | `hermes.ts` | 消息双路由 + Gateway 生命周期 |
| 安装 | `installer.ts` | Python/Hermes 安装与 Doctor |
| 配置 | `config.ts` | desktop.json / .env / config.yaml |
| 会话 | `sessions.ts`, `session-cache.ts` | state.db 查询 + 本地缓存 |
| 模型/档案 | `models.ts`, `profiles.ts` | models.json + profile 目录 |
| 记忆/人格 | `memory.ts`, `soul.ts` | MEMORY.md / SOUL.md |
| 技能/工具/定时 | `skills.ts`, `tools.ts`, `cronjobs.ts` | |
| Claw3D | `claw3d.ts` | Office 可视化 |
| SSE | `sse-parser.ts` | 流式解析 |
| Profile Runtime | `profile-runtime-*.ts`, `gateway-*.ts` | 多实例运行时 |
| Enterprise | `enterprise/*.ts` | 企业安装流水线 |
| Web Operator | `browser/*.ts` | 受控浏览器 + Tool Server |

## 深入阅读顺序

1. `docs/ARCHITECTURE.md` — 进程模型与 Gateway
2. `docs/MODULES.md` — 模块边界
3. `docs/API_CONTRACTS.md` — IPC 完整契约
4. `docs/READING_GUIDE.md` — 按功能阅读路径
5. `src/preload/index.ts` + `src/main/index.ts` — 通信全貌

按功能跳转：

| 任务 | 起点文件 |
|---|---|
| 改聊天 | `screens/Chat/Chat.tsx` → `hermes.ts` → `sse-parser.ts` |
| 改安装 | `screens/Install/` → `installer.ts` 或 `enterprise/enterprise-installer.ts` |
| 改多 Profile | `ProfileRuntimeScreen.tsx` → `profile-runtime-manager.ts` |
| 改 Web Operator | `WebOperatorScreen.tsx` → `browser/browser-controller.ts` |
| 改 i18n | `src/shared/i18n/locales/<locale>/` |

## 版本特性索引

| 版本 | 能力 | 关键路径 |
|---|---|---|
| V1.1 | Multi Profile Gateway、AI-OS/Experts 工作台 | `profile-runtime-*`, `AIOSWorkspace`, `ProfileWorkspace` |
| V1.2 | 崩溃检测、自动重启、端口冲突、启动超时、日志、状态恢复 | `gateway-supervisor`, `gateway-log-collector`, `runtime-reconciler`, `LogViewer` |
| V1.2.1 | Enterprise 一键部署、Preflight、Bundle、Doctor | `src/main/enterprise/`, `src/shared/enterprise/` |

---

编码时：**先确定改哪一层（Renderer / Preload / Main）→ 查是否已有 IPC → 复用现有模块与类型 → 同步文档与测试。**
