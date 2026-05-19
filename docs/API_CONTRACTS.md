# API Contracts

## IPC 通信契约

所有渲染进程到主进程的通信通过 `window.hermesAPI.*` 发起，经 preload 层的 `ipcRenderer.invoke()` 到达主进程的 `ipcMain.handle()`。

### 安装与引擎

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `check-install` | — | `{ installed: boolean, version?: string }` | 检查安装状态 |
| `verify-install` | — | `{ ok: boolean }` | 验证安装完整性 |
| `start-install` | — | void | 启动安装（进度通过 install-progress 事件推送） |
| `get-hermes-version` | — | `string \| null` | 获取 Hermes Agent 版本 |
| `refresh-hermes-version` | — | `string \| null` | 刷新版本 |
| `run-hermes-doctor` | — | `string` | 运行诊断 |
| `run-hermes-update` | — | `string` | 运行更新 |
| `check-openclaw` | — | `{ exists: boolean }` | 检测 OpenClaw |
| `run-claw-migrate` | — | `string` | 迁移 OpenClaw |

### Startup Gate（启动路由决策）

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `startup:resolve-decision` | — | `StartupDecision` | 解析启动决策，决定进入 main/welcome/setup/installing |

**StartupDecision 结构：**
```typescript
{
  runtime: RuntimeState | null;
  connectionMode: "local" | "remote" | "ssh";
  nextScreen: "main" | "welcome" | "setup" | "installing";
  skipAgentInstall: boolean;
  skipModelSetup: boolean;
  shouldVerifyInBackground: boolean;
  reason: StartupDecisionReason;
  error?: string;
}
```

**决策规则：**
- `runtimeReady && modelConfigured` → `main`（跳过安装和配置）
- `runtimeReady && !modelConfigured` → `setup`（跳过安装，只做配置）
- `!runtimeReady` → `welcome`（需要安装）
- `remote mode && connection ok` → `main`
- `ssh mode && tunnel healthy` → `main`

### 配置

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `get-env` | — | `Record<string, string>` | 读取 .env |
| `set-env` | `{ key: string, value: string, profile?: string }` | `boolean` | 写入 .env（修改 API Key 时自动重启 Gateway） |
| `get-config` | — | `string` | 读取 config.yaml |
| `set-config` | `{ content: string }` | `boolean` | 写入 config.yaml |
| `get-hermes-home` | — | `string` | 获取 ~/.hermes 路径 |
| `get-model-config` | — | `{ provider, model, baseUrl }` | 获取模型配置 |
| `set-model-config` | `{ provider, model, baseUrl }` | `boolean` | 设置模型配置 |
| `is-remote-mode` | — | `boolean` | 是否远程模式 |
| `get-connection-config` | — | `{ mode, remoteUrl?, apiKey? }` | 获取连接配置 |
| `set-connection-config` | `{ mode, remoteUrl?, apiKey? }` | `boolean` | 设置连接配置 |
| `test-remote-connection` | — | `{ ok: boolean, error?: string }` | 测试远程连接 |
| `get-platform-enabled` | `{ platform: string }` | `boolean` | 获取平台开关 |
| `set-platform-enabled` | `{ platform: string, enabled: boolean }` | `boolean` | 设置平台开关 |
| `get-credential-pool` | — | `object` | 获取凭证池 |
| `set-credential-pool` | `object` | `boolean` | 设置凭证池 |

### 聊天与 Gateway

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `send-message` | `{ message, profile?, resumeSessionId?, history? }` | `ChatHandle` | 发送消息（返回中止控制器） |
| `abort-chat` | — | void | 中止当前聊天 |
| `start-gateway` | `{ profile?: string }` | void | 启动 Gateway |
| `stop-gateway` | — | void | 停止 Gateway |
| `gateway-status` | — | `{ running: boolean }` | Gateway 状态 |

### 会话

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `list-sessions` | `{ limit?, offset? }` | `Session[]` | 列出会话 |
| `get-session-messages` | `{ sessionId }` | `Message[]` | 获取会话消息 |
| `search-sessions` | `{ query }` | `Session[]` | 搜索会话 |
| `list-cached-sessions` | — | `CachedSession[]` | 缓存会话列表 |
| `sync-session-cache` | — | `void` | 同步缓存 |
| `update-session-title` | `{ sessionId, title }` | `void` | 更新会话标题 |

### 配置档案

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `list-profiles` | — | `Profile[]` | 列出档案 |
| `create-profile` | `{ name: string }` | `boolean` | 创建档案 |
| `delete-profile` | `{ name: string }` | `boolean` | 删除档案 |
| `set-active-profile` | `{ name: string }` | `boolean` | 切换档案 |

### 记忆与灵魂

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `read-memory` | `{ limit?, offset?, profile? }` | `MemoryEntry[]` | 读取记忆 |
| `add-memory-entry` | `{ content, metadata?, profile? }` | `boolean` | 添加记忆 |
| `update-memory-entry` | `{ entryId, content, metadata?, profile? }` | `boolean` | 更新记忆 |
| `remove-memory-entry` | `{ entryId, profile? }` | `boolean` | 删除记忆 |
| `read-soul` | `{ profile? }` | `string` | 读取 SOUL |
| `write-soul` | `{ content, profile? }` | `boolean` | 写入 SOUL |

### 技能

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `list-skills` | `{ profile? }` | `Skill[]` | 列出已安装技能 |
| `list-bundled-skills` | — | `Skill[]` | 列出预置技能 |
| `get-skill-detail` | `{ skillId, profile? }` | `SkillDetail` | 技能详情 |
| `install-skill` | `{ skillId, profile? }` | `boolean` | 安装技能 |
| `uninstall-skill` | `{ skillId, profile? }` | `boolean` | 卸载技能 |

### 工具

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `get-toolsets` | `{ profile? }` | `Toolset[]` | 获取工具集 |
| `set-toolset-enabled` | `{ toolsetId, enabled, profile? }` | `boolean` | 启用/禁用工具集 |
| `list-mcp-servers` | `{ profile? }` | `McpServer[]` | 列出 MCP 服务器 |

### 定时任务

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `list-cron-jobs` | `{ includeDisabled?, profile? }` | `CronJob[]` | 列出定时任务 |
| `create-cron-job` | `{ schedule, prompt?, name?, deliver?, profile? }` | `boolean` | 创建任务 |
| `remove-cron-job` | `{ jobId, profile? }` | `boolean` | 删除任务 |
| `pause-cron-job` | `{ jobId, profile? }` | `boolean` | 暂停任务 |
| `resume-cron-job` | `{ jobId, profile? }` | `boolean` | 恢复任务 |

### 外部链接

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `open-external` | `{ url: string }` | `void` | 用系统浏览器打开链接 |

### 备份与导入

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `run-hermes-backup` | `{ profile? }` | `string` | 运行备份 |
| `run-hermes-import` | `{ archivePath, profile? }` | `string` | 导入备份 |
| `run-hermes-dump` | — | `string` | 调试导出 |

### 日志

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `read-logs` | `{ logFile?, lines?, profile? }` | `string` | 读取日志 |

---

## Web Operator Browser IPC

Browser IPC 处理受控浏览器相关的功能。

### BrowserView 管理

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `browser.create_view` | `{ url: string }` | `string` | 创建 BrowserView，返回 viewId |
| `browser.destroy_view` | `{ viewId: string }` | `boolean` | 销毁 BrowserView |
| `browser.attach_to_main` | `{ viewId: string }` | `boolean` | 附加到主窗口 |
| `browser.detach_from_main` | `{ viewId: string }` | `boolean` | 从主窗口分离 |
| `browser.get_all_views` | — | `BrowserViewInfo[]` | 获取所有 BrowserView |

### 页面控制

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `browser.load_url` | `{ viewId: string, url: string }` | `boolean` | 加载 URL |
| `browser.go_back` | `{ viewId: string }` | `boolean` | 后退 |
| `browser.go_forward` | `{ viewId: string }` | `boolean` | 前进 |
| `browser.reload` | `{ viewId: string }` | `boolean` | 刷新 |
| `browser.stop` | `{ viewId: string }` | `boolean` | 停止加载 |
| `browser.get_url` | `{ viewId: string }` | `string` | 获取当前 URL |
| `browser.get_title` | `{ viewId: string }` | `string` | 获取页面标题 |

### 元素交互

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `browser.click` | `{ viewId: string, selector: string, options?: { double?, right?, strict? } }` | `{ success: boolean, error?: string }` | 点击元素 |
| `browser.type` | `{ viewId: string, selector: string, text: string, options?: { clear?, delay?, strict? } }` | `{ success: boolean, error?: string }` | 输入文本 |
| `browser.fill` | `{ viewId: string, selector: string, text: string, options?: { strict? } }` | `{ success: boolean, error?: string }` | 填充表单 |
| `browser.clear` | `{ viewId: string, selector: string, options?: { strict? } }` | `{ success: boolean, error?: string }` | 清空输入 |
| `browser.select` | `{ viewId: string, selector: string, values: string[], options?: { strict? } }` | `{ success: boolean, error?: string }` | 选择选项 |
| `browser.check` | `{ viewId: string, selector: string, options?: { strict? } }` | `{ success: boolean, error?: string }` | 勾选复选框 |
| `browser.uncheck` | `{ viewId: string, selector: string, options?: { strict? } }` | `{ success: boolean, error?: string }` | 取消勾选 |
| `browser.press` | `{ viewId: string, key: string }` | `{ success: boolean, error?: string }` | 按键 |

### 页面信息

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `browser.get_text` | `{ viewId: string, selector?: string }` | `string` | 获取文本内容 |
| `browser.get_html` | `{ viewId: string, selector?: string }` | `string` | 获取 HTML |
| `browser.get_attribute` | `{ viewId: string, selector: string, name: string }` | `string \| null` | 获取属性 |
| `browser.get_property` | `{ viewId: string, selector: string, name: string }` | `unknown` | 获取属性值 |
| `browser.get_count` | `{ viewId: string, selector: string }` | `number` | 获取匹配元素数量 |
| `browser.is_visible` | `{ viewId: string, selector: string }` | `boolean` | 元素是否可见 |
| `browser.is_enabled` | `{ viewId: string, selector: string }` | `boolean` | 元素是否可用 |
| `browser.is_checked` | `{ viewId: string, selector: string }` | `boolean` | 是否已勾选 |
| `browser.evaluate` | `{ viewId: string, script: string }` | `unknown` | 执行 JS |
| `browser.screenshot` | `{ viewId: string, options?: { selector?, fullPage?, type?, quality? } }` | `string` | 截图 (base64) |

### 会话与 Cookie

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `browser.get_cookies` | `{ viewId: string, url?: string }` | `Cookie[]` | 获取 Cookies |
| `browser.set_cookie` | `{ viewId: string, cookie: Cookie }` | `boolean` | 设置 Cookie |
| `browser.delete_cookie` | `{ viewId: string, name: string, url?: string }` | `boolean` | 删除 Cookie |
| `browser.clear_cookies` | `{ viewId: string }` | `boolean` | 清空 Cookies |
| `browser.get_storage` | `{ viewId: string, type: "local" \| "session" }` | `Record<string, string>` | 获取存储 |
| `browser.set_storage` | `{ viewId: string, type: "local" \| "session", key: string, value: string }` | `boolean` | 设置存储 |
| `browser.clear_storage` | `{ viewId: string, type: "local" \| "session" }` | `boolean` | 清空存储 |

### 安全与白名单

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `browser.check_domain_allowed` | `{ url: string }` | `{ allowed: boolean, domain: string }` | 检查域名是否在白名单 |
| `browser.add_domain_whitelist` | `{ domain: string }` | `boolean` | 添加白名单域名 |
| `browser.remove_domain_whitelist` | `{ domain: string }` | `boolean` | 移除白名单域名 |
| `browser.get_domain_whitelist` | — | `string[]` | 获取白名单列表 |
| `browser.confirm_sensitive_action` | `{ actionId: string, confirmed: boolean }` | `void` | 确认/拒绝敏感操作 |

### 审计日志

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `browser.get_audit_logs` | `{ viewId?: string, startTime?, endTime?, limit? }` | `BrowserAuditRecord[]` | 查询审计日志 |
| `browser.clear_audit_logs` | — | `boolean` | 清空审计日志 |
| `browser.export_audit_logs` | `{ path: string }` | `boolean` | 导出审计日志 |

---

## Web Operator Tool Bridge HTTP API

Tool Server 仅绑定 `127.0.0.1`，默认端口 `8765`（冲突时递增至 8775）。

| 端点 | 方法 | 请求体 | 响应 | 说明 |
|---|---|---|---|---|
| `/tools` | GET | — | `BrowserToolSchema[]` | 工具 Schema 列表 |
| `/tools/browser.open` | POST | `{ url: string }` | `{ ok, url?, errorCode?, message? }` | 打开页面 |
| `/tools/browser.get_state` | POST | `{}` | `{ ok, state?, ... }` | 获取页面状态 |
| `/tools/browser.screenshot` | POST | `{}` | `{ ok, data?, ... }` | 截图 |
| `/tools/browser.click` | POST | `{ selector: string }` | `{ ok, ... }` | 点击 |
| `/tools/browser.type` | POST | `{ selector: string, text: string }` | `{ ok, ... }` | 输入 |
| `/tools/browser.back` | POST | `{}` | `{ ok, ... }` | 后退 |
| `/tools/browser.forward` | POST | `{}` | `{ ok, ... }` | 前进 |
| `/tools/browser.reload` | POST | `{}` | `{ ok, ... }` | 刷新 |
| `/tools/browser.extract_table` | POST | `{ selector: string }` | `{ ok, message?, ... }` | 提取表格 |

所有 Tool Bridge 请求自动设置 `source: "hermes"` 。

---

## Phase 5: Shell Platform APIs

### Tray IPC (B1)

Tray 功能自动集成，无需显式 IPC。Gateway 状态自动同步到托盘图标。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `tray:update-status` | `{ running: boolean }` | `boolean` | 更新托盘 Gateway 状态显示 |
| `tray:update-profile` | `{ profile: string }` | `boolean` | 更新托盘当前 Profile 显示 |

### Shortcut IPC (B4)

快捷键配置存储在 `~/.hermes/desktop/shortcuts.json`。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `shortcut:get-all` | — | `ShortcutConfig[]` | 获取所有快捷键配置 |
| `shortcut:update` | `{ id: string, updates: Partial<ShortcutConfig> }` | `boolean` | 更新快捷键 |
| `shortcut:reset` | — | `boolean` | 重置为默认快捷键 |
| `shortcut:validate` | `{ accelerator: string }` | `boolean` | 验证快捷键格式是否有效 |
| `shortcut:check-conflicts` | `{ accelerator: string, excludeId?: string }` | `string[]` | 检查快捷键冲突 |

**ShortcutConfig 结构:**
```typescript
interface ShortcutConfig {
  id: string;
  name: string;
  description: string;
  accelerator: string;  // Electron Accelerator 格式
  enabled: boolean;
  global: boolean;      // true = 全局快捷键
  action: string;       // 动作标识符
}
```

**默认快捷键:**
| ID | 快捷键 | 动作 |
|---|---|---|
| `toggle-window` | `Cmd/Ctrl+Shift+H` | 切换窗口显示/隐藏 |
| `new-chat` | `Cmd/Ctrl+N` | 新建聊天 |
| `quick-action` | `Cmd/Ctrl+Shift+P` | 快捷操作菜单 |
| `command-palette` | `Cmd/Ctrl+Shift+K` | 命令面板 |
| `focus-input` | `Cmd/Ctrl+L` | 聚焦输入框 |
| `toggle-theme` | `Cmd/Ctrl+Shift+L` | 切换主题 |
| `settings` | `Cmd/Ctrl+,` | 打开设置 |

### Window IPC (C4)

多窗口管理 IPC。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `window:create` | `{ type: WindowType, config?: WindowConfig }` | `string \| null` | 创建窗口，返回窗口 ID |
| `window:close` | `{ id: string }` | `boolean` | 关闭指定窗口 |
| `window:hide` | `{ id: string }` | `boolean` | 隐藏窗口 |
| `window:show` | `{ id: string }` | `boolean` | 显示并聚焦窗口 |
| `window:focus` | `{ id: string }` | `boolean` | 聚焦窗口 |
| `window:get-all` | — | `WindowInfo[]` | 获取所有窗口信息 |
| `window:get` | `{ id: string }` | `WindowInfo \| null` | 获取单个窗口信息 |
| `window:broadcast` | `{ channel: string, args?: unknown[] }` | `void` | 广播消息到所有窗口 |

**WindowType:** `"main" \| "chat" \| "settings" \| "devtools" \| "custom"`

**WindowConfig 结构:**
```typescript
interface WindowConfig {
  type: WindowType;
  id?: string;              // 可选，自动生成
  parentId?: string;        // 父窗口 ID
  title?: string;
  url?: string;             // 加载的 URL
  bounds?: { x?, y?, width, height };
  rememberBounds?: boolean; // 记住位置大小
  minimizeToTray?: boolean; // 关闭时最小化到托盘
  modal?: boolean;          // 模态窗口
  alwaysOnTop?: boolean;
}
```

### Plugin IPC (C1)

插件管理 IPC。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `plugin:get-all` | — | `PluginInfo[]` | 获取所有插件 |
| `plugin:get` | `{ id: string }` | `PluginInfo \| null` | 获取单个插件 |
| `plugin:activate` | `{ id: string }` | `boolean` | 激活插件 |
| `plugin:deactivate` | `{ id: string }` | `boolean` | 停用插件 |
| `plugin:reload` | `{ id: string }` | `boolean` | 重新加载插件 |
| `plugin:uninstall` | `{ id: string }` | `boolean` | 卸载插件 |

**PluginInfo 结构:**
```typescript
interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  activated: boolean;
  path: string;
  activationTime?: number;
}
```

### Modal IPC (Phase 3 + B2)

Modal 系统 IPC。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `modal:show` | `{ key: ShellModalKey, data?: unknown, options?: ModalOptions }` | `Promise<unknown>` | 显示 Modal |
| `modal:close` | `{ result?: unknown }` | `void` | 关闭当前 Modal |
| `modal:dismiss` | `{ reason?: string }` | `void` | 取消当前 Modal |

**ShellModalKey:** `"update-ready" \| "confirm-exit" \| "error-report" \| "permission-request" \| "custom-dialog" \| "custom"`

**ModalOptions 结构:**
```typescript
interface ModalOptions {
  priority?: number;        // 优先级，高可打断低
  uncloseable?: boolean;    // 不可通过 ESC/点击外部关闭
  showBackdrop?: boolean;   // 显示遮罩
  backdropOpacity?: number; // 遮罩透明度
}
```

### Dropdown IPC (Phase 3 + B3)

Dropdown 系统 IPC。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `dropdown:show` | `{ key: ShellDropdownKey, anchor: DOMRect, data?: unknown }` | `Promise<unknown>` | 显示 Dropdown |
| `dropdown:close` | — | `void` | 关闭 Dropdown |
| `dropdown:update-data` | `{ data: unknown }` | `void` | 更新 Dropdown 数据 |

**ShellDropdownKey:** `"gateway-status" \| "profile-switcher" \| "model-selector" \| "quick-actions"`

### Internal View IPC (Modal/Dropdown 内部使用)

供 Modal 和 Dropdown 内部渲染进程使用。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `internal-view:get-data` | — | `unknown` | 获取传入的数据 |
| `internal-view:close` | `{ result?: unknown }` | `void` | 关闭并返回结果 |
| `internal-view:confirm` | `{ result?: unknown }` | `void` | 确认关闭 |
| `internal-view:cancel` | `{ reason?: string }` | `void` | 取消关闭 |
| `internal-view:ready` | — | `void` | 通知 Modal 已准备好 |

---

## ShellView IPC (V1.9)

### View 管理

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `shell:view:activate` | `layerId: string` | `void` | 激活指定 Layer 的 View |
| `shell:view:set-bounds` | `layerId: string, bounds: { x: number, y: number, width: number, height: number }` | `void` | 设置指定 View 的位置与尺寸（width/height 必须 ≥ 1） |
| `shell:view:hide` | `layerId: string` | `void` | 隐藏指定 Layer 的 View |

**Preload API**: `window.shellView`

```typescript
interface ShellViewAPI {
  activate: (layerId: string) => Promise<void>;
  setBounds: (layerId: string, bounds: ShellViewBoundsIPC) => Promise<void>;
  hide: (layerId: string) => Promise<void>;
}

interface ShellViewBoundsIPC {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

**错误响应**: 无效 `layerId` 抛出 `"Layer not found: xxx"`；无效 `bounds` 抛出 `"Invalid bounds: ..."`。

### aios-home View URL 检测增强 (V1.9.2)

`ensureAiosHomeView()` 在 `shell:view:set-bounds` / `shell:view:activate` 触发时自动检测 aios-home 视图 URL：

- 新增 `normalizeUrl()` 归一化函数，去除尾部斜杠后对比当前 URL 与目标 URL
- 当前 URL 与目标 URL 不一致时触发 `load(url)` reload
- reload 失败时降级为 `destroyView` + `createView` recreate
- 目标 URL 来自 `getAiOsEnvConfig().frontendPort`，默认 `http://127.0.0.1:3000/zh`

---

## AI-OS Runtime IPC (V1.9.2)

### Runtime Snapshot

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `aios:get-runtime-snapshot` | 无 | `AiOsRuntimeSnapshot` | 获取 AI-OS 运行时快照，包含 services、ready、webAppUrl |

**Preload API**: `window.aiosRuntime.getRuntimeSnapshot()`

```typescript
interface AiOsRuntimeSnapshot {
  services: RuntimeServiceRecord[];
  ready: boolean;
  webAppUrl?: string;
}
```

### 弃用 IPC 路径

以下 IPC 路径已弃用，新代码应使用 `shell:view:set-bounds` → `ensureAiosHomeView()` → `ShellViewManager.activateView()` 路径：

| IPC Channel | 状态 | 替代路径 |
|---|---|---|
| `aios:view:load-home` | **@deprecated** | `shell:view:set-bounds` + `ensureAiosHomeView()` |
| `aios:view:reload` | **@deprecated** | `shell:view:set-bounds` + `ensureAiosHomeView()` |
| `aios:view:set-bounds` | **@deprecated** | `shell:view:set-bounds` |

---

## 事件推送 (Main → Renderer)

### 快捷键事件

| 事件 Channel | 数据 | 说明 |
|---|---|---|
| `shortcut:new-chat` | — | 新建聊天快捷键触发 |
| `shortcut:focus-input` | — | 聚焦输入快捷键触发 |
| `shortcut:open-palette` | — | 命令面板快捷键触发 |
| `shortcut:toggle-theme` | — | 切换主题快捷键触发 |
| `shortcut:open-settings` | — | 打开设置快捷键触发 |

### 窗口事件

| 事件 Channel | 数据 | 说明 |
|---|---|---|
| `window:created` | `{ id, type }` | 窗口创建 |
| `window:focus` | `{ id }` | 窗口获得焦点 |
| `window:blur` | `{ id }` | 窗口失去焦点 |
| `window:closed` | `{ id }` | 窗口关闭 |

### 插件事件

| 事件 Channel | 数据 | 说明 |
|---|---|---|
| `plugin:loaded` | `PluginInfo` | 插件加载 |
| `plugin:activated` | `PluginInfo` | 插件激活 |
| `plugin:deactivated` | `PluginInfo` | 插件停用 |
| `plugin:error` | `{ id, error }` | 插件错误 |
