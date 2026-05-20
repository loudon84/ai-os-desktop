# Hermes Desktop — Agent 编码指南

> 面向 Cursor / AI Agent 的项目速查。详细设计见 `docs/INDEX.md`、`docs/ARCHITECTURE.md`、`docs/MODULES.md`。

## 项目是什么

**hermes-desktop** 是基于 Electron + React + TypeScript 的 AI 助手桌面应用：安装/配置 Hermes Agent、管理 Gateway、聊天、多 Profile 运行时（AI-OS Desktop）。

| 项 | 值 |
|---|---|
| 版本 | 0.3.5（V2.0 MainPage + **V3.2 Workspace Host** + **V3.2.1 Hotfix**） |
| appId | `com.smc.smc-ai-copilot`（productName: SMC Copilot） |
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
| `src/main/enterprise/` | 企业安装、本地 zip/git 源、**agent-deps-installer**、**pip-mirror-config** | 安装/预检/Doctor/依赖 |
| `src/main/window/` | V1.4.1 窗口 IPC（`registerWindowIpc`） | 标题栏按钮 |
| `src/main/shell/` | **main-window-controller.ts**（默认 1280×800）、ShellView、菜单 | 主窗口尺寸、壳层 IPC |
| `src/preload/` | contextBridge：`hermesAPI`、`aiosBrowser`、`profileRuntime`、`profileEntry`、`shellView` | API 桥接（影响面大） |
| `src/renderer/src/screens/MainPage/` | **V2.0** 主界面壳：`MainPage`、`MainTopBar`、`MainViewTabs` 等 | 顶栏 / 工作区 Tabs |
| `src/renderer/src/` | React UI：`screens/`、`components/` | **主要 UI 开发区** |
| `src/shared/shell/` | **`main-page-constants.ts`**、**`browser-partitions.ts`**、shell-view-contract、view-contract | 布局尺寸、Session 分区常量、ShellView 契约 |
| `src/shared/workspace/` | **workspace-contract**、**workspace-secondary-nav** | Workspace 模块元数据、二级 panel 导航 |
| `src/renderer/src/workspace/` | **workspace-registry**、workspace-tabs、resolve-workspace | 顶栏 Tab 与 `WorkspaceRenderer` 路由 |
| `src/main/auth/` | **token-inject-url.ts**、**token-header-injector.ts** | AI-OS Home 分区 Authorization 注入 |
| `resources/profiles/` | Profile 模板 + SOUL.md | Profile 种子配置 |
| `resources/skills/` | 内置技能包 | 新技能 |
| `tests/` | Vitest | 单测/集成测 |
| `docs/` | 架构与契约文档 | 随功能更新契约 |

## Preload 暴露的全局 API

| 全局对象 | 文件 | 用途 |
|---|---|---|
| `window.hermesAPI` | `src/preload/index.ts` | 安装、配置、聊天、会话、模型、技能等；**含 `windowControls`、`getInstallerPrecheck`** |
| `window.aiosBrowser` | `src/preload/browser-api.ts` | Web Operator（13 方法 + 事件） |
| `window.profileRuntime` | `src/preload/profile-runtime-api.ts` | 多 Profile 运行时（20 方法，含日志/自动重启） |
| `window.profileEntry` | `src/preload/profile-entry-api.ts` | Profile 页面入口与布局（5 方法） |
| `window.mainPageState` | `src/preload/main-page-state-api.ts` | MainPage 壳状态 V2（workspaceOrder / externalTabs / sidebarMode / workspaceSecondaryState） |
| `window.desktopAuth` | `src/preload/auth-api.ts` | V3 登录会话（无 token 暴露给 Renderer） |
| `window.desktopUserConfig` | `src/preload/user-config-api.ts` | V3 bootstrap / diff / apply 远程配置 |

类型定义：`src/preload/index.d.ts`。契约类型：`src/shared/profile-runtime/`、`src/shared/enterprise/`。

## 应用路由与 UI 结构

**生命周期路由**（`src/renderer/src/App.tsx`）：

```
splash → welcome → installing → setup → main (Layout)
```

**主界面壳层（V2.0）** — `Layout.tsx` 编排 hooks，渲染 `MainPage`：

```
MainPage
  ├─ MainTopBar        ← Profile、Gateway 状态、工作区 Tabs、WindowControls
  ├─ DesktopSidebar    ← 二级功能导航（232px）
  ├─ WorkspaceOutlet   ← 下方各 Screen
  ├─ StatusBar
  └─ ModalLayer / DrawerLayer
```

PRD：`prd/v2.0_mainpage.md` / `prd/v2.1_mainpage.md`。Legacy：`DesktopShell`、`PageHeader`（非主链路）。

**V2.1**：Sidebar 三态、动态 Profile Tabs、ShellView 全 IPC、`WebContentsHost` web-operator layer。

**V2.2**：`ShellBrowserViewAdapter` 单轨（`browser.open` → SVM）；`browser.opened` 自动切 Web Operator tab；MainTopBar「+」创建 `external-browser:*` tab；Tab DnD（`@dnd-kit`）；顶栏 Reload/Close。

**V2.3**：ShellView metadata 事件链（title/loading/error/crash → MainViewTabs）；导航 IPC（reload/stop/back/forward/recover）；`main-page-state.json` 持久化（`~/.hermes/desktop/`）；`KeepAliveView` 保活 React 管理页；`layout-calc-parser` 移除 `new Function`。

**V3.0**：View 收敛为 `aios-home` / `aios-workspace` / `web-operator` / `office` / `external-browser:*`；Hermes 运维迁入 **TopBar Settings Drawer**（`modules/hermes-runtime/`）；`main` 后 **LoginGate** + `desktopAuth` / `desktopUserConfig`（mock backend）；`aios-home` → `http://127.0.0.1:3000`（无 `/zh`）。

**V3.2**：**Workspace Module Host** — `src/shared/workspace/` + `src/renderer/src/workspace/` registry；`WorkspaceRenderer` 驱动 `WorkspaceOutlet`；顶栏固定 4 Tab（含 `office`）；Sidebar **二级 panel**（`aios-workspace` → Chat/Sessions/Agents panels）；统一 `screens/SettingsDrawer/`；`main-page-state.json` **V2** + `migrateMainPageState`；`token-header-injector` 对 `persist:aios-desktop` 注入 Bearer。

**V3.2.1（Hotfix）**：
- **Session 三分区**：`browser-partitions.ts` — `aios-home` → `persist:aios-desktop`（token）；`web-operator` → `persist:aios-external-web`；每个 `external-browser:{uuid}` → `persist:external-browser-{uuid}`（`useExternalBrowserTabs` 创建时必传 partition）。
- **Token 端口**：`token-inject-url.ts` 从 `getAiOsEnvConfig().frontendPort/backendPort` 解析，仅 `127.0.0.1|localhost`；不注入 Gateway `8642` 与 web-operator/external 分区。
- **PRD #5 收敛**：`RuntimeGuard` / `MainProfileSwitch` 仅「启动 Gateway」+「打开设置」→ `openSettingsDrawer("runtime")`；**禁止**独立 `HermesRuntimeSettingsDrawer`；运维仅在 `SettingsDrawer` → `HermesRuntimePanel`。
- **架构**：`WorkspaceRenderer` 按 `module.kind` 分发；`MainViewTabs` 固定 Tab 由 registry `!draggable` 判定（仅 `external-browser:*` 可拖）。
- **i18n**：`navigation.*` 四语言补齐二级侧栏 key（`chat`、`sessions`、`openSettings` 等）。

**主界面**（`WorkspaceOutlet` → `WorkspaceRenderer`）视图：

| 视图 | 路径 | 屏幕文件 |
|---|---|---|
| **AI-OS Home** | 顶栏 Tab `aios-home` | `screens/AIOSHome/AIOSHomeScreen.tsx`（`WebContentsHost` layer `aios-home`） |
| **AI-OS Workspace** | 顶栏 / 侧栏二级 | `screens/AIOSWorkspace/` + `panels/ChatPanel` 等 |
| Web Operator | 顶栏 / 侧栏二级 | `screens/WebOperator/WebOperatorScreen.tsx` |
| Office | 顶栏 Tab `office` | `screens/Office/Office.tsx`（KeepAlive） |
| External | 顶栏动态 Tab | `external-browser:{uuid}` → `WebViewWorkspace` |
| Hermes Runtime | TopBar Settings Drawer | `screens/SettingsDrawer/HermesRuntimePanel.tsx`（非独立页面路由） |

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

### Web Operator（V2.2 单轨 ShellView）

```
BrowserToolbar / Hermes tool
  → aiosBrowser.open → BrowserController → ShellBrowserViewAdapter
      → ShellViewManager layer "web-operator"
      → mainWindow.send("browser.opened") → Layout → web-operator tab
  → WebContentsHost.setBounds("web-operator")

MainTopBar (+) external tab
  → useExternalBrowserTabs.openExternalTab
      → shellView.create("external-browser:uuid", { partition: externalBrowserPartition(id) })
      → WebContentsHost(layerId) + navigate tab

browser.* back/forward/reload/getState/...
  → 同一 ShellBrowserViewAdapter WebContents（web-operator）
```

### Enterprise Install（V1.2.1）

```
Renderer Install 屏
  → enterprise:* IPC（13 个，见 enterprise-installer.ts）
  → 20 步流水线：预检 → Bundle → Agent → Venv → Hermes Home → Profile Bootstrap → Marker
```

安装目录（Windows）：`%LOCALAPPDATA%\Programs\SMC Copilot\` 或注册表解析的 `$INSTDIR`（`runtime/hermes-agent/venv/logs`）。  
用户数据：`%USERPROFILE%\.hermes\`。

安全：仅 `127.0.0.1`、不写 HKLM/系统 PATH、Token 不落盘、Bundle 必须 SHA-256。

### 用户源安装 + PyPI 镜像（V1.4.1）

欢迎页 / Install 向导选择 **本地 zip** 或 **Git clone** 时：

```
AgentSourceSelect / install-wizard
  → PipMirrorFields（预设：清华/阿里/腾讯/官方/自定义）
  → hermesAPI.startInstallWithSource({ sourceType, localZipPath?, pipIndexUrl, trustedHost, pipMirrorPreset })
  → installer.runInstallWithSource
      → hermes-agent-source-installer（解压 zip / git clone）
      → agent-deps-installer.installHermesAgentDependencies
          → resolvePipMirrorConfig（UI → desktop-runtime.json → deployment.json → 环境变量 → 清华默认）
          → uv --no-config 优先 requirements.txt；有 wheels 则离线；失败回退 pip
  → desktop-runtime.json 持久化 pipMirror + agentSource
```

**环境变量（可选，覆盖 UI）**：`HERMES_PIP_INDEX_URL`、`HERMES_PIP_TRUSTED_HOST`（或 `PIP_INDEX_URL` / `PIP_TRUSTED_HOST`）。

**离线 wheel**：`$INSTDIR/runtime/wheels/` 或 `hermes-agent/wheels/`（`--offline` / `--find-links`）。

### 窗口控制（V1.4.1 + V2.0）

- Preload：`window.hermesAPI.windowControls` → IPC `window:minimize|maximize-or-restore|close|is-maximized`
- Main：`src/main/window/window-ipc.ts` → `registerWindowIpc()`（`setupIPC()` 内一次）
- Main 窗口尺寸：`src/main/shell/main-window-controller.ts` ← `shared/shell/main-page-constants.ts`（默认 **1280×800**，最小 **900×600**；有 `window-state` 持久化时优先历史值）
- Renderer：**主界面** `WindowControls` 挂于 `MainTopBar`（`screens/MainPage/MainTopBar.tsx`）；splash/welcome/install/setup 仍用各屏自有标题栏；macOS 主界面由 `MainTopBar` 拖拽（`App.tsx` 在 `screen === "main"` 时不渲染全局 `drag-region`）

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
| `$INSTDIR/runtime/desktop-runtime.json` | 安装目录、agent 源、**pipMirror**（V1.4.1） |
| `$INSTDIR/runtime/deployment.json` | 企业部署配置；默认 `runtime.pipIndexUrl` 清华源 |
| `$INSTDIR/runtime/installer-precheck.json` | NSIS 预检结果（`enterprise:get-installer-precheck`） |

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
| 安装 | `installer.ts` | `runInstallWithSource`、Doctor；委托 **agent-deps-installer** |
| 依赖安装 | `enterprise/agent-deps-installer.ts` | uv/pip、镜像、wheelhouse、requirements 优先 |
| PyPI 镜像 | `enterprise/pip-mirror-config.ts` + `shared/enterprise/pip-mirror-presets.ts` | 解析/预设 |
| 窗口 IPC | `window/window-ipc.ts` | `registerWindowIpc` |
| NSIS 预检读 | `enterprise/installer-precheck-reader.ts` | `installer-precheck.json` |
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
| Token 注入 | `auth/token-inject-url.ts`, `auth/token-header-injector.ts` | AI-OS Home 分区 Bearer |
| Session 分区 | `shared/shell/browser-partitions.ts`, `shell/views/view-registry.ts` | 三分区策略常量与注册 |

## 深入阅读顺序

1. `docs/ARCHITECTURE.md` — 进程模型与 Gateway
2. `docs/MODULES.md` — 模块边界
3. `docs/API_CONTRACTS.md` — IPC 完整契约
4. `docs/READING_GUIDE.md` — 按功能阅读路径
5. `src/preload/index.ts` + `src/main/index.ts` — 通信全貌

按功能跳转：

| 任务 | 起点文件 |
|---|---|
| 改 Gateway/聊天 IPC | `hermes.ts` → `sse-parser.ts`；UI 在 `modules/hermes-runtime/` |
| 改安装 | `screens/Install/AgentSourceSelect` → `installer.ts` → `agent-deps-installer.ts` |
| 改 PyPI 镜像 | `PipMirrorFields.tsx` → `pip-mirror-presets.ts` → `pip-mirror-config.ts` |
| 改主界面壳层 / 顶栏 | `screens/MainPage/*` → `Layout.tsx`；常量 `shared/shell/main-page-constants.ts` |
| 改窗口按钮 | `MainTopBar.tsx` / `WindowControls.tsx` → `window-ipc.ts` → preload `windowControls` |
| 改多 Profile | `profile-runtime-manager.ts`；UI 在 `modules/hermes-runtime/` 或 `profileRuntime` API |
| 改 Web Operator 视口 / adapter | `shell-browser-view-adapter.ts` + `shell-view-manager.ts` + `WebContentsHost` |
| 改 Web Operator 地址栏 / tool | `BrowserToolbar` → `browser-controller.ts` → `ShellBrowserViewAdapter` |
| 改 external-browser 多 tab | `useExternalBrowserTabs.ts` + `MainViewTabs` + `WorkspaceOutlet` + `shellView.create` |
| 改 Tab DnD / 顶栏操作 | `MainViewTabs.tsx` + `workspace-registry.ts` + `tab-order.ts` + `Layout.tsx` |
| 改 Workspace 路由 | `workspace-registry.ts` → `WorkspaceRenderer.tsx` → `WorkspaceOutlet.tsx` |
| 改 Session 分区 / Token | `browser-partitions.ts` → `useExternalBrowserTabs.ts` / `view-registry.ts`；`token-inject-url.ts` |
| 改 Settings / Runtime 入口 | `SettingsDrawer.tsx` + `Layout.openSettingsDrawer`；勿新建独立 Runtime Drawer |
| 改 i18n | `src/shared/i18n/locales/<locale>/navigation.ts`（二级侧栏 + openSettings） |

## 版本特性索引

| 版本 | 能力 | 关键路径 |
|---|---|---|
| V1.1 | Multi Profile Gateway、AI-OS/Experts 工作台 | `profile-runtime-*`, `AIOSWorkspace`, `ProfileWorkspace` |
| V1.2 | 崩溃检测、自动重启、端口冲突、启动超时、日志、状态恢复 | `gateway-supervisor`, `gateway-log-collector`, `runtime-reconciler`, `LogViewer` |
| V1.2.1 | Enterprise 一键部署、Preflight、Bundle、Doctor | `src/main/enterprise/`, `src/shared/enterprise/` |
| V1.4 | Desktop Shell、NSIS 预检、WindowControls、RuntimeSetup 预检卡片 | `components/layout/`, `build/nsis/`, `installer-precheck-reader` |
| V1.4.1 | 窗口 IPC 加固、PyPI 镜像 UI、`agent-deps-installer`、`--no-config` uv | `pip-mirror-*`, `agent-deps-installer`, `window-ipc` |
| V1.9 | ShellView IPC、`WebContentsHost`、启动顺序与菜单接管 | `shell-view-*`, `WebContentsHost`, `shell-menu` |
| **V2.0** | **MainPage 主界面壳层**、顶栏 Tabs/Profile/Runtime、默认窗口 1280×800 | `screens/MainPage/`, `main-page-constants.ts`, `Layout.tsx` |
| **V2.1** | Sidebar 三态、动态 Profile Tabs、ShellView 全 IPC、WebOperator→`WebContentsHost` | `main-page-tabs.ts`, `shell-view-contract.ts`, `WebOperatorScreen.tsx` |
| **V2.2** | ShellBrowserViewAdapter、browser.opened、external-browser tabs、Tab DnD | `shell-browser-view-adapter.ts`, `useExternalBrowserTabs.ts`, `MainViewTabs.tsx`, `browser-contract.ts` |
| **V2.3** | metadata 事件、导航 IPC、Tab 持久化、KeepAlive、layout-calc-parser | `shell-view-event-forwarder.ts`, `main-page-state-store.ts`, `KeepAliveView.tsx`, `useShellViewMetadata.ts` |
| **V3.2** | Workspace registry、SettingsDrawer 统一、Sidebar 二级、state V2、token 注入 | `workspace-registry.ts`, `SettingsDrawer/`, `workspace-secondary-nav.ts`, `main-page-state-migrate.ts`, `token-header-injector.ts` |
| **V3.2.1** | 三分区、per-tab external partition、token 端口可配置、Runtime 入口收敛、kind 分发、registry Tab 规则 | `browser-partitions.ts`, `token-inject-url.ts`, `view-registry.ts`, `RuntimeGuard.tsx`, `MainViewTabs.tsx` |
| **V3.0** | View 收敛、LoginGate、`desktopAuth` / `desktopUserConfig`（mock） | `modules/auth/`, `main/auth/`, `main/user-config/`, `auth-api.ts`, `user-config-api.ts` |

---

编码时：**先确定改哪一层（Renderer / Preload / Main）→ 查是否已有 IPC → 复用现有模块与类型 → 同步文档与测试。**
