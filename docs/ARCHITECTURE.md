# SMC Copilot Shell 架构文档

> 版本: 0.3.5 | 最后更新: V2.3 MainPage 第四阶段

## 架构概述

SMC Copilot Desktop Shell 是基于 Electron 的桌面应用壳层，采用分层架构设计，实现功能模块化、可扩展、高可维护。

```
┌─────────────────────────────────────────────────────────────┐
│                      Renderer Process                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │   Chat      │ │  Sessions   │ │   AI-OS Workspace   │    │
│  │   Screen    │ │   Screen    │ │     (Profile)       │    │
│  └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘    │
│         └─────────────────┴───────────────────┘              │
│                           │                                  │
│              ┌────────────┴────────────┐                     │
│              │    React Components     │                     │
│              │  ┌─────┐ ┌─────┐ ┌────┐ │                     │
│              │  │Modal│ │Dropdown│ │UI│ │                     │
│              │  └─────┘ └─────┘ └────┘ │                     │
│              └────────────┬────────────┘                     │
│                           │                                  │
│              ┌────────────┴────────────┐                     │
│              │     useShell Hooks      │                     │
│              └────────────┬────────────┘                     │
└───────────────────────────┼─────────────────────────────────┘
                            │ IPC (Preload Bridge)
┌───────────────────────────┼─────────────────────────────────┐
│                      Main Process                            │
│  ┌────────────────────────┴────────────────────────┐        │
│  │                Shell Core Layer                  │        │
│  │  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │        │
│  │  │WindowManager│ │ShortcutMgr  │ │TrayManager │ │        │
│  │  └─────────────┘ └─────────────┘ └────────────┘ │        │
│  │  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │        │
│  │  │PluginLoader │ │ModalManager │ │StateManager│ │        │
│  │  └─────────────┘ └─────────────┘ └────────────┘ │        │
│  └──────────────────────────────────────────────────┘        │
│                                                              │
│  ┌──────────────────────────────────────────────────┐        │
│  │              Feature Modules                     │        │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │        │
│  │  │ Gateway │ │ Browser │ │ Profiles│ │ Skills │ │        │
│  │  └─────────┘ └─────────┘ └─────────┘ └────────┘ │        │
│  └──────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 进程模型

### 三层进程架构

1. **Renderer Process (React)**
   - 负责 UI 渲染
   - 通过 `window.*` API 访问主进程功能
   - 禁止直接访问 Node.js API

2. **Preload Script (Context Bridge)**
   - 安全桥梁：Renderer ↔ Main
   - 暴露受限 API 到 `window` 对象
   - 所有 IPC 通信必须经过此处

3. **Main Process (Node.js)**
   - 应用主入口
   - 管理所有系统资源
   - 启动 Python Gateway 后端

## 主界面布局（V2.0 MainPage）

主界面（`App.tsx` → `screen === "main"` → `Layout.tsx`）采用 **方案 B**：`MainPage` 为一级桌面容器，`DesktopSidebar` 为二级功能导航，顶部统一承载工作区 Tabs 与窗口控制。

```
App (main)
  └─ Layout.tsx                    ← hooks 编排，不内联业务 JSX
      └─ MainPage                  ← 一级壳层（screens/MainPage/）
          ├─ MainTopBar (40px)     ← Profile / Runtime / 工作区 Tabs / 快捷入口 / WindowControls
          ├─ MainPage__body
          │   ├─ DesktopSidebar    ← 232px 功能导航（Chat、Sessions、Gateway…）
          │   └─ WorkspaceOutlet   ← 各 Screen 视图路由
          ├─ StatusBar (24px)
          ├─ ModalLayer
          └─ DrawerLayer
```

| 组件 | 路径 | 职责 |
|------|------|------|
| MainPage | `screens/MainPage/MainPage.tsx` | 壳层 flex 布局与 slot 组合 |
| MainTopBar | `screens/MainPage/MainTopBar.tsx` | 顶栏：`app-drag-region` + `no-drag` 交互区 |
| MainViewTabs | `screens/MainPage/MainViewTabs.tsx` | 工作区 Tab：`aios-home` / `aios-workspace` / `web-operator` |
| MainProfileSwitch | `screens/MainPage/MainProfileSwitch.tsx` | 当前 Profile + `ProfileSwitcherDropdown` |
| MainRuntimeIndicator | `screens/MainPage/MainRuntimeIndicator.tsx` | 轮询 `profileRuntime.getRuntimeStatus()` |
| WebContentsHost | `components/shell/WebContentsHost.tsx` | 内嵌 WebContentsView；`ResizeObserver` 同步 bounds |

**布局常量**（`src/shared/shell/main-page-constants.ts`）：

| 常量 | 值 | 用途 |
|------|-----|------|
| `MAIN_TOPBAR_HEIGHT` | 40 | 顶栏高度 |
| `MAIN_STATUSBAR_HEIGHT` | 24 | 底栏高度 |
| `MAIN_SIDEBAR_WIDTH` | 232 | 侧栏宽度 |
| `DEFAULT_WINDOW_WIDTH` × `HEIGHT` | 1280 × 800 | 主窗口默认尺寸（`main-window-controller.ts`） |
| `MINIMUM_WINDOW_WIDTH` × `HEIGHT` | 900 × 600 | 主窗口最小尺寸 |

**Legacy（非主链路，保留文件）**：`DesktopShell`、`PageHeader` — V1.4 布局，已由 MainPage 替代。

**内嵌 View 与壳层解耦**：`ShellViewManager` / `shell:view:*` IPC / `WebContentsHost` 不因 MainPage 迁移而变更；`aios-home` layer 仍通过 DOM bounds 定位。

### V2.1 增量

| 能力 | 说明 |
|------|------|
| Sidebar 三态 | `SidebarMode` + `MainPage--sidebar-{expanded\|rail\|hidden}`；`DesktopSidebar` 接收 `mode` |
| 动态 Tabs | `buildMainWorkspaceTabs(profileEntries)` |
| ShellView 全 API | 见 [`docs/API_CONTRACTS.md`](API_CONTRACTS.md) ShellView 表 |
| Web Operator UI 视口 | `WebOperatorScreen` → `WebContentsHost("web-operator")`；`WEB_OPERATOR_LAYER_ID` 见 `web-operator-constants.ts` |
| Web Operator 工具栏 | `BrowserToolbar` 单行 chrome（`web-operator.css`） |

### V2.2 增量（单轨 ShellView）

| 能力 | 说明 |
|------|------|
| BrowserViewPort | `browser-viewport.ts` 抽象；`ShellBrowserViewAdapter` 绑定 SVM `web-operator` |
| browser.opened | Main 推送 `browser.opened` → `Layout` 切 web-operator tab |
| external-browser | 动态 tab `external-browser:{uuid}` + ShellView layer；MainTopBar「+」创建 |
| Tab DnD | `@dnd-kit` 排序 profile / external tabs |

```text
browser.open / Toolbar
  → BrowserController → ShellBrowserViewAdapter → ShellViewManager(web-operator)
  → emit browser.opened → Renderer navigate web-operator
  → WebContentsHost.setBounds

external tab (+)
  → shellView.create(external-browser:uuid) → WebContentsHost(layerId)
```

### V2.3 增量（生产化 + KeepAlive）

| 能力 | 说明 |
|------|------|
| ShellView metadata | `ManagedWebContentsView.getSnapshot()` + `shell-view-event-forwarder` → `useShellViewMetadata` |
| 导航 | `shellView.reload/stopLoading/goBack/goForward/recover`；顶栏统一走 `shellView` |
| 持久化 | `main-page-state.json` @ `~/.hermes/desktop/`；`window.mainPageState` |
| React KeepAlive | `KeepAliveView` 包裹 Chat/Settings 等管理页，`display:none` 不 unmount |
| 安全 | `layout-calc-parser.ts` 替代 `LayoutCalculator` / `overlay-base` 的 `new Function` |

## 核心模块

### 1. Window Manager (C4)

多窗口管理器，支持完整的多窗口生命周期管理。

**文件**: `src/main/shell/window-manager.ts`

**功能**:
- 创建/销毁各类窗口 (main, chat, settings, devtools)
- 窗口状态管理 (focus, minimize, maximize)
- 窗口间通信 (broadcast, sendToWindow)
- 窗口池化支持

**使用示例**:
```typescript
const windowManager = createWindowManager(preloadPath);

// 创建独立 Chat 窗口
windowManager.createWindow({
  type: "chat",
  id: `chat-${sessionId}`,
  title: "New Chat",
  bounds: { width: 900, height: 700 },
});
```

### 2. Tray Manager (B1)

系统托盘管理器，支持最小化到托盘。

**文件**: `src/main/shell/tray-manager.ts`

**功能**:
- 托盘图标管理（支持 macOS 模板图标）
- 右键菜单
- 点击切换窗口显示/隐藏
- Gateway 状态显示

**启动参数**:
```bash
# 启动时隐藏到托盘
SMC Copilot.exe --hidden
# 或
SMC Copilot.exe --tray
```

### 3. Shortcut Manager (B4)

全局快捷键管理器，支持自定义快捷键。

**文件**: `src/main/shell/shortcut-manager.ts`

**配置位置**: `~/.hermes/desktop/shortcuts.json`

**默认快捷键**:
| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl+Shift+H` | 切换窗口显示/隐藏 |
| `Cmd/Ctrl+N` | 新建聊天 |
| `Cmd/Ctrl+Shift+P` | 快捷操作菜单 |
| `Cmd/Ctrl+Shift+K` | 命令面板 |
| `Cmd/Ctrl+L` | 聚焦输入框 |
| `Cmd/Ctrl+Shift+L` | 切换主题 |
| `Cmd/Ctrl+,` | 打开设置 |

### 4. Modal Manager (Phase 3)

Modal 统一管理器，支持队列和优先级。

**文件**: `src/main/shell/overlays/modal-manager.ts`

**支持的 Modal 类型**:
- `update-ready` - 更新可用提示
- `confirm-exit` - 退出确认（Gateway 运行时）
- `error-report` - 错误报告
- `permission-request` - 权限请求 (B2)
- `custom-dialog` - 自定义对话框 (B2)

### 5. Dropdown Manager (Phase 3 + B3)

Dropdown 统一管理器，React 渲染方案。

**文件**: `src/main/shell/overlays/dropdown-manager.ts`

**Dropdown 组件**:
- `GatewayStatusDropdown` - Gateway 状态
- `ProfileSwitcherDropdown` - Profile 切换 (B3)
- `ModelSelectorDropdown` - 模型选择 (B3)
- `QuickActionsDropdown` - 快捷操作 (B3)

### 6. Plugin Loader (C1)

插件系统加载器，无沙箱限制。

**文件**: `src/main/shell/plugin-loader.ts`

**插件目录**: `~/.hermes/plugins/`

**插件清单** (`package.json`):
```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "main": "index.js",
  "activationEvents": ["onStartup"]
}
```

### 7. Shell State Manager

全局状态管理器，自动持久化。

**文件**: `src/main/shell/shell-state-manager.ts`

**持久化路径**: `~/.hermes/desktop/shell-state.json`

## IPC 契约

### 新增 IPC (Phase 5)

#### Tray IPC
```typescript
// 无需显式 IPC，自动集成
// Gateway 状态自动同步到托盘
```

#### Shortcut IPC
```typescript
// 获取所有快捷键
ipcRenderer.invoke("shortcut:get-all"): Promise<ShortcutConfig[]>

// 更新快捷键
ipcRenderer.invoke("shortcut:update", id: string, updates: Partial<ShortcutConfig>): Promise<boolean>

// 重置为默认
ipcRenderer.invoke("shortcut:reset"): Promise<boolean>

// 验证快捷键格式
ipcRenderer.invoke("shortcut:validate", accelerator: string): Promise<boolean>

// 检查冲突
ipcRenderer.invoke("shortcut:check-conflicts", accelerator: string, excludeId?: string): Promise<string[]>
```

#### Window IPC
```typescript
// 创建窗口
ipcRenderer.invoke("window:create", config: WindowConfig): Promise<string | null>

// 关闭窗口
ipcRenderer.invoke("window:close", id: string): Promise<boolean>

// 获取所有窗口
ipcRenderer.invoke("window:get-all"): Promise<WindowInfo[]>

// 发送消息到窗口
ipcRenderer.invoke("window:send", id: string, channel: string, ...args: unknown[]): Promise<boolean>
```

#### Plugin IPC
```typescript
// 获取所有插件
ipcRenderer.invoke("plugin:get-all"): Promise<PluginInfo[]>

// 激活插件
ipcRenderer.invoke("plugin:activate", id: string): Promise<boolean>

// 停用插件
ipcRenderer.invoke("plugin:deactivate", id: string): Promise<boolean>
```

## 数据流

### 窗口创建流程
```
Renderer → IPC → WindowManager → BrowserWindow
                                    ↓
                              Load Content
                                    ↓
                              Bind Events
                                    ↓
                              Store in Map
                                    ↓
                              Emit Events
```

### 快捷键触发流程
```
GlobalShortcut → ShortcutManager → Execute Action
                                         ↓
                              ┌─────────┼─────────┐
                              ↓         ↓         ↓
                           Window    Renderer   Custom
                              ↓         ↓         ↓
                          toggle   send IPC    emit event
```

### 插件生命周期
```
Load All → Validate → Register → Activate
                                 ↓
                              On Event
                                 ↓
                              Deactivate → Unregister
```

## 目录结构

```
src/
├── main/
│   ├── shell/
│   │   ├── window-manager.ts      # 多窗口管理
│   │   ├── tray-manager.ts        # 托盘管理
│   │   ├── shortcut-manager.ts    # 快捷键管理
│   │   ├── plugin-loader.ts       # 插件加载器
│   │   ├── shell-state-manager.ts # 状态管理
│   │   ├── shell-menu.ts          # V1.9 菜单构建（唯一入口）
│   │   ├── views/
│   │   │   ├── shell-view-manager.ts  # View 管理器
│   │   │   ├── managed-webcontents-view.ts  # 单 View 生命周期
│   │   │   ├── view-registry.ts   # View 注册表
│   │   │   └── view-events.ts     # View 事件总线
│   │   ├── shell-view-ipc.ts      # V1.9 ShellView IPC
│   │   └── overlays/
│   │       ├── modal-manager.ts   # Modal 管理
│   │       └── dropdown-manager.ts # Dropdown 管理
│   └── ...
├── renderer/
│   ├── modals/                    # Modal HTML 页面
│   │   ├── update-ready/
│   │   ├── confirm-exit/
│   │   ├── error-report/
│   │   ├── permission-request/    # 权限请求 (B2)
│   │   └── custom-dialog/         # 自定义对话框 (B2)
│   └── src/
│       ├── screens/
│       │   ├── Layout/Layout.tsx        # 编排层 → MainPage
│       │   └── MainPage/              # V2.0 主界面壳层
│       │       ├── MainPage.tsx
│       │       ├── MainTopBar.tsx
│       │       ├── MainViewTabs.tsx
│       │       ├── MainProfileSwitch.tsx
│       │       ├── MainRuntimeIndicator.tsx
│       │       └── main-page.css
│       └── components/
│           ├── layout/                # DesktopSidebar, WorkspaceOutlet, WindowControls…
│           ├── shell/
│           │   └── WebContentsHost.tsx  # V1.9 通用 View 承载组件
│           └── dropdowns/         # Dropdown React 组件
│               ├── GatewayStatusDropdown.tsx
│               ├── ProfileSwitcherDropdown.tsx (B3)
│               ├── ModelSelectorDropdown.tsx (B3)
│               └── QuickActionsDropdown.tsx (B3)
└── shared/
    ├── shell/
    │   ├── main-page-constants.ts # V2.0 主界面布局与默认窗口尺寸
    │   ├── view-contract.ts       # View 核心类型
    │   ├── shell-view-contract.ts # V1.9 ShellView IPC 契约
    │   └── overlay-contract.ts    # Overlay 契约
    └── plugin/
        └── plugin-contract.ts     # 插件契约
```

## 配置路径

| 配置项 | 路径 |
|--------|------|
| 快捷键配置 | `~/.hermes/desktop/shortcuts.json` |
| Shell 状态 | `~/.hermes/desktop/shell-state.json` |
| 插件目录 | `~/.hermes/plugins/` |
| 插件存储 | `~/.hermes/desktop/plugin-storage/` |

## 版本历史

### 0.1.8 (Phase 5)
- **Tray 集成**: 系统托盘、最小化到托盘、启动隐藏
- **Modal 扩展**: permission-request、custom-dialog
- **Dropdown 组件**: Profile、Model、Quick Actions
- **全局快捷键**: 可自定义快捷键、冲突检测
- **多窗口**: WindowManager、独立 Chat 窗口支持
- **插件系统**: PluginLoader、PluginAPI 契约

### 0.3.5 (V2.2 MainPage 第三阶段)
- **ShellBrowserViewAdapter** 替代运行时 BrowserViewManager
- **browser.opened** 事件 + 自动切换 Web Operator tab
- **external-browser** 多 tab + 顶栏「+」
- **Tab** close/reload + **@dnd-kit** 排序

### 0.3.5 (V2.1 MainPage 第二阶段)
- **Sidebar 三态** + **动态 Profile 工作区 Tabs**
- **ShellView IPC**：CREATE / LOAD_URL / FOCUS / DESTROY / GET_STATE / GET_ALL
- **WebOperator** UI 视口迁移至 ShellViewManager；工具栏 `open` 同步 `shellView.loadUrl`；BVM 仍供 agent tool / 侧栏状态

### 0.3.5 (V2.0 MainPage 主界面壳层)
- **MainPage 一级容器**: 替代 `DesktopShell` + 全局 `PageHeader`；`MainTopBar` 集成 `WindowControls`（Win/Linux）
- **工作区 Tabs**: `MainViewTabs` — AI-OS / Workspace / Web Operator；首版可点击切换，无 DnD
- **Profile / Runtime 顶栏**: `MainProfileSwitch` + `MainRuntimeIndicator`
- **布局常量**: `main-page-constants.ts`；主窗口默认 1280×800、最小 900×600
- **根 CSS**: `html/body/#root` 100% 高度；`.app` 使用 `100dvh`

### 0.3.5 (V1.9 Desktop Shell 加固)
- **启动顺序修复**: `buildAppMenu() → setupIPC() → createWindow() → 延迟注册 AIOS/Enterprise/ShellView IPC`，解决 mainWindow 为 null 导致 IPC 未注册
- **菜单接管**: 统一 `shell-menu.ts` 的 `buildAppMenu`，删除 index.ts 内联 `buildMenu`
- **ShellViewManager 集成**: aios-home View 由 SVM 统一管理，URL 动态化
- **ShellView IPC**: `shell:view:activate/set-bounds/hide` 三通道 + `window.shellView` Preload API
- **WebContentsHost**: 通用 View 承载组件，替换 `AiOsWebAppHost`
- **AiOsWebContentsController**: @deprecated，由 ShellViewManager 接管

### 0.1.7 (Phase 1-4)
- Startup Gate + MainWindowController
- ShellViewManager + Layer 分层
- Modal/Dropdown Overlay Manager
- ShellStateManager + Confirm Exit Modal

## 最佳实践

### 添加新的 Modal 类型

1. 创建 `src/renderer/modals/{name}/` 目录
2. 添加 HTML 和 TypeScript 文件
3. 更新 `modal-manager.ts` 的路径映射
4. 更新 `overlay-contract.ts` 的 `ShellModalKey` 类型

### 添加新的 Dropdown 组件

1. 创建 React 组件 `src/renderer/src/components/dropdowns/{Name}Dropdown.tsx`
2. 使用 `useDropdownManager` hook
3. 在需要的地方触发显示

### 添加全局快捷键

1. 在 `shortcut-manager.ts` 的 `DEFAULT_SHORTCUTS` 中添加
2. 在 `executeAction` 方法中处理动作
3. 可选：在 Renderer 中监听对应 IPC 事件

## 参考文献

- [Electron Documentation](https://www.electronjs.org/docs)
- [IPC 完整契约](./API_CONTRACTS.md)
- [插件开发指南](./PLUGIN_DEVELOPMENT.md)
- [多窗口实现指南](./MULTI_WINDOW.md)
