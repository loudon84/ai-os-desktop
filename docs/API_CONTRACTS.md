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

Renderer 通过 `window.smcShell.resolveStartupDecision()` 访问（Preload：`src/preload/shell-api.ts`）。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `startup:resolve-decision` | — | `StartupDecision` | 解析启动路由；Main 注册于 `setupStartupIPC()` |

**StartupDecision 结构：**
```typescript
{
  runtime: RuntimeState | null;
  connectionMode: "local" | "remote" | "ssh";
  nextScreen: "login" | "main" | "welcome" | "setup" | "installing";
  skipAgentInstall: boolean;
  skipModelSetup: boolean;
  shouldVerifyInBackground: boolean;
  reason: StartupDecisionReason; // 含 auth-required | bootstrap-pending | runtime-ready-* | remote-* | ssh-*
  error?: string;
}
```

**V3.3.1 门控顺序**（`startup-decision.ts`）：① endpoint + token → ② `bootstrapState.initialized` → ③ 按 connection mode 分支（local 可能 → main / setup / welcome）。

**决策规则（V3.3.1，按优先级）：**
- 无 endpoint 或 token → `login`（`reason: auth-required`）
- 有 token 但 `!bootstrapState.initialized` → `login`（`reason: bootstrap-pending`；LoginScreen 自动 bootstrap）
- 上述通过后，按 connection mode 分支：
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

Browser IPC 处理受控浏览器相关的功能。V2.2 起 **运行时** 由 `ShellBrowserViewAdapter` 将 `browser.*` 操作转发到 ShellViewManager layer `web-operator`（不再创建独立 `BrowserViewManager` 子 View）。

### Renderer Preload 实际通道（`window.aiosBrowser`）

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `browser.open` | `BrowserOpenRequest` | `BrowserOpenResult` | 打开 URL（底层 SVM `web-operator`） |
| `browser.back` / `forward` / `reload` | `source` | `BrowserActionResult` | 导航 |
| `browser.get_state` | `source` | `BrowserStateResult` | 页面状态 |
| `browser.screenshot` | `source` | `BrowserScreenshotResult` | 截图 |
| `browser.click` / `type` / `extract_table` | 请求体 | `BrowserActionResult` | DOM 操作 |
| `browser.update_bounds` | `BrowserViewBounds` | `void` | 兼容通道，转发 SVM bounds |
| `browser.get_audit_log` / `confirm_action` / `reject_action` | — | — | 审计与敏感操作 |

### Main → Renderer 事件（V2.2）

| 事件名 | Payload | 说明 |
|---|---|---|
| `browser.opened` | `BrowserOpenedEvent` | `browser.open` 成功后推送；Preload `aiosBrowser.onOpened()` |

```typescript
// src/shared/browser/browser-contract.ts
export const BrowserEvents = { OPENED: "browser.opened" } as const;

export interface BrowserOpenedEvent {
  url: string;
  layerId: "web-operator";
  source: BrowserActionSource;
}
```

`BrowserOpenRequest.activateTab?: boolean` — 为 `false` 时不发送 `browser.opened`（不自动切 tab）。

### external-browser ShellView（V2.2，非 browser tool 默认目标）

| 操作 | API | layerId |
|---|---|---|
| 新建 tab | `shellView.create(id, "external-browser", url, opts)` | `external-browser:{uuid}` |
| 关闭 tab | `shellView.destroy(id)` | 同上 |
| 刷新 | `shellView.loadUrl(id, url)` | 同上 |
| 视口 | `WebContentsHost` + `setBounds` | 同上 |

Hermes `browser.open` **仅** 操作 `web-operator` layer，不自动打开 external-browser tab。

### BrowserView 管理（规划/遗留文档，非当前 Preload 通道）

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

## ShellView IPC (V1.9 + V2.1)

### View 管理

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `shell:view:create` | `ShellViewCreateRequest` | `void` | 创建指定 layerId 的 WebContentsView；`options.partition` 见 V3.2.1 三分区表（external-browser **必填** per-tab partition） |
| `shell:view:activate` | `layerId: string` | `void` | 激活指定 Layer 的 View |
| `shell:view:set-bounds` | `layerId: string, bounds: { x, y, width, height }` | `void` | 设置指定 View 的位置与尺寸（width/height 必须 ≥ 1） |
| `shell:view:load-url` | `{ layerId, url }` | `void` | 对已存在 View 加载 URL |
| `shell:view:focus` | `layerId: string` | `void` | 聚焦指定 View |
| `shell:view:hide` | `layerId: string` | `void` | 隐藏指定 Layer 的 View |
| `shell:view:destroy` | `layerId: string` | `void` | 销毁指定 View |
| `shell:view:get-state` | `layerId: string` | `ShellViewSnapshot \| null` | 获取 View 快照 |
| `shell:view:get-all` | 无 | `ShellViewSnapshot[]` | 获取全部 View 快照 |
| `shell:view:reload` | `layerId: string` | `void` | 重新加载 |
| `shell:view:stop-loading` | `layerId: string` | `void` | 停止加载 |
| `shell:view:go-back` | `layerId: string` | `void` | 后退 |
| `shell:view:go-forward` | `layerId: string` | `void` | 前进 |
| `shell:view:recover` | `layerId: string` | `void` | 崩溃/失败后重建 View |

**Renderer 事件**（Main → Renderer，`webContents.send`）：

| Event | Payload | 说明 |
|---|---|---|
| `shell:view:metadata-changed` | `{ snapshot: ShellViewSnapshot }` | title/favicon/loading/navigation 等元数据更新 |
| `shell:view:load-failed` | `{ id, url, errorCode, errorDescription }` | 主框架加载失败 |
| `shell:view:crashed` | `{ id, reason, exitCode }` | 渲染进程崩溃 |

**MainPage 状态 IPC (V2.3 / V3.2)**：

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `main-page:read` | 无 | `MainPagePersistedState` | 读取 `~/.hermes/desktop/main-page-state.json`；V1 自动迁移为 V2 |
| `main-page:write` | `MainPagePersistedState` | `void` | 写入持久化状态（**version 必须为 2**） |

**V3.2 `MainPagePersistedStateV2` 字段**：`sidebarMode`、`workspaceOrder`（原 `tabOrder`）、`externalTabs`、`lastActiveWorkspace`、`lastSettingsDrawerPanel`、`workspaceSecondaryState`（各 Workspace 二级 panel，如 `aios-workspace` → `chat`）。

**V3.2 统一 Settings Drawer**：Renderer 内 `SettingsDrawer`（Account / Runtime / Profiles / Desktop config sync），**打开 Drawer 不切换顶栏 Workspace Tab**；Runtime 运维 UI 在 `HermesRuntimePanel`，底层仍调用既有 `hermesAPI` / `profileRuntime` IPC。

**V3.2.1 Runtime 快捷入口（PRD #5）**：以下入口语义等价，均打开 **Settings Drawer → Runtime panel**，**不**提供独立 Runtime 页面或 `HermesRuntimeSettingsDrawer`：

| Renderer 入口 | Prop / 调用 | 等价 Main 行为 |
|---|---|---|
| `RuntimeGuard`「打开设置」 | `onOpenRuntimeSettings()` | Layout `openSettingsDrawer("runtime")` |
| `MainTopBar` / Profile 管理 | `onOpenSettingsDrawer("runtime")` | 同上 |
| `MainProfileSwitch`「管理配置」 | `onManageProfiles` → `onOpenRuntimeSettings` | 同上 |

`resumeSessionId` **不**写入 `workspaceSecondaryState`（仅内存，避免持久化脏状态）。

**V3.2.1 WebContents Session 分区**（`src/shared/shell/browser-partitions.ts` + `view-registry.ts`）：

| 分区 | Layer / 用途 | `shell:view:create` 默认 | Token 注入 |
|---|---|---|---|
| `persist:aios-home` | `aios-home` | registry 默认 | **是**（origin 白名单） |
| `persist:web-operator` | `web-operator` | registry 默认（`BROWSER_PARTITION`） | 否 |
| `persist:external-browser-{uuid}` | `external-browser:{uuid}` | **无默认**；创建时 **必须** 传 `options.partition` | 否 |

```typescript
// external tab（Renderer → preload shellView.create）
import { externalBrowserPartition } from "@shared/shell/browser-partitions";

await shellView.create({
  layerId: `external-browser:${uuid}`,
  kind: "external-browser",
  url,
  options: { partition: externalBrowserPartition(`external-browser:${uuid}`) },
});
```

**V3.3 Token 注入（Main only）**：

- **安装**：`installTokenHeaderInjector()`（应用启动时调用一次）
- **分区**：仅 `TOKEN_INJECT_PARTITIONS` = `[persist:aios-home]`
- **URL 判定**：`shouldInjectTokenForUrl(url)` — origin 白名单来自 `AuthEndpointConfig`（`aiosHomeUrl` + `backendUrl`）
- **不注入**：`persist:web-operator`、`persist:external-browser-*`、`persist:aios-workspace`、`persist:office`
- **凭据**：`getCachedAccessToken()` → 请求头 `Authorization: Bearer <token>`（keytar → safeStorage → 内存）

**V3.2 / V3.2.1（已 superseded）**：端口-based 注入 + `persist:aios-desktop`。

**Preload API**: `window.shellView`

```typescript
interface ShellViewAPI {
  create: (layerId, kind, url, options?) => Promise<void>;
  activate: (layerId: string) => Promise<void>;
  setBounds: (layerId: string, bounds: ShellViewBoundsIPC) => Promise<void>;
  loadUrl: (layerId: string, url: string) => Promise<void>;
  focus: (layerId: string) => Promise<void>;
  hide: (layerId: string) => Promise<void>;
  destroy: (layerId: string) => Promise<void>;
  getState: (layerId: string) => Promise<ShellViewSnapshot | null>;
  getAll: () => Promise<ShellViewSnapshot[]>;
  reload: (layerId: string) => Promise<void>;
  stopLoading: (layerId: string) => Promise<void>;
  goBack: (layerId: string) => Promise<void>;
  goForward: (layerId: string) => Promise<void>;
  recover: (layerId: string) => Promise<void>;
  onMetadataChanged: (cb) => () => void;
  onLoadFailed: (cb) => () => void;
  onCrashed: (cb) => () => void;
}
```

**Preload API**: `window.mainPageState` — `{ read(), write(state) }`

**Lazy create**: `aios-home` 与 `web-operator` 在 `set-bounds` / `activate` / `load-url` / `focus` 时若不存在会自动创建（`web-operator` 默认 `about:blank`）。

**Renderer 用法（Web Operator，V2.2）**：

| 步骤 | API | 说明 |
|------|-----|------|
| 进入页 | `shellView.create("web-operator", ...)` 或由 adapter 在 `browser.open` 时创建 | `WebOperatorScreen` mount 可 catch 已存在 |
| 布局 | `WebContentsHost` + `shellView.setBounds` | ResizeObserver 驱动 bounds |
| 用户/Hermes Open | `aiosBrowser.open` | Main `ShellBrowserViewAdapter` 加载同一 WebContents；`browser.opened` 切 tab |
| external tab | MainTopBar「+」→ `shellView.create(external-browser:uuid, { partition: externalBrowserPartition(id) })` | 每 Tab 独立 partition，与 web-operator / aios-home 隔离 |

Layer 常量：renderer `web-operator-constants.ts`；main `shell-browser-view-adapter.ts` → `WEB_OPERATOR_LAYER_ID`。

**错误响应**: 无效 `layerId` 抛出 `"Layer not found: xxx"` 或参数校验错误；无效 `bounds` 抛出 `"Invalid bounds: ..."`。

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
| `aios:get-home-url` | 无 | `{ url: string }` | 只读解析当前 AI-OS Home URL（无 token） |

**Preload API**: `window.aiosRuntime.getRuntimeSnapshot()` / `getHomeUrl()`

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

## copilot-serve（V1.3 Task Workbench）

Main 管理本地 `copilot-serve`（:8765）进程；Renderer **直调** HTTP/SSE，不经 Main 转发任务 API。

| IPC Channel | 返回值 | 说明 |
|---|---|---|
| `copilot-serve:get-connection` | `{ baseUrl, port, token } \| null` | Renderer fetch/SSE 用 `X-Copilot-Desktop-Token` |
| `copilot-serve:get-status` | `CopilotServeStatus` | pid / port / lastError / logPath |
| `copilot-serve:start` | `CopilotServeStatus` | `uvicorn main:app --app-dir src`，`windowsHide: true` |
| `copilot-serve:stop` | `CopilotServeStatus` | 停止子进程 |
| `copilot-serve:restart` | `CopilotServeStatus` | 重启 |
| `copilot-serve:get-logs` | `string` | `~/.hermes/desktop/copilot-serve.log` |

**Preload**: `window.copilotServe`（`src/preload/copilot-serve-api.ts`）

**Renderer HTTP**（`src/renderer/src/lib/copilot-serve/`）：`/api/v1/tasks`、`/api/v1/approvals/*`、`/api/v1/team-tasks/pull`、全局 SSE `/api/v1/desktop/task-workbench/events/stream`、任务 SSE `/api/v1/tasks/{id}/events/stream`。

**Workspace**: `task-workbench`（`TaskWorkbenchScreen` 三栏）；i18n `navigation.taskWorkbench`（en / zh-CN）。

---

### Desktop Auth（V3.3）

Renderer 通过 `window.desktopAuth` 访问；**不**向 Renderer 返回 `accessToken` / `refreshToken`。

**LoginInput**（`src/shared/auth/auth-contract.ts`）：

```typescript
{
  endpointConfig: { backendUrl: string; authPrefix: string; aiosHomeUrl: string };
  email: string;    // AI-OS backend 要求有效邮箱格式
  password: string;
}
```

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `auth:get-state` | — | `DesktopAuthState` | 认证状态 + endpoint 配置（无 token） |
| `auth:save-endpoint-config` | `AuthEndpointConfig` | `AuthEndpointConfig` | 持久化 endpoint 到 `userData/auth-endpoint-config.json` |
| `auth:login` | `LoginInput` | `DesktopAuthState` | 登录；token 写入 Main（keytar / safeStorage / 内存）；成功后通过 `portal-session-bridge` 在 `persist:aios-home` 建立 NextAuth 会话 Cookie（避免嵌入页再次进入 `/zh/login`） |
| `auth:logout` | — | `DesktopAuthState` | 登出并清除 token vault + 停止注入 |
| `auth:refresh` | — | `DesktopAuthState` | 刷新会话 |

**AI-OS Auth HTTP**（`auth-client.ts`，非 IPC；默认 `HERMES_USE_MOCK_AUTH` 关闭时启用）：

| 操作 | 方法 + URL | 请求体 | 响应映射 |
|---|---|---|---|
| 登录 | `POST {backendUrl}{authPrefix}/login` | `{ email, password }` | `access_token` / `accessToken` → vault |
| 刷新 | `POST {backendUrl}{authPrefix}/refresh` | `{ refresh_token }` | 同上 |
| 登出 | `POST {backendUrl}{authPrefix}/logout` | Bearer header | best-effort |

默认 Endpoint（`getDefaultAuthEndpointConfig()`）：backend `http://127.0.0.1:8000`、authPrefix `/api/v1/auth`、aiosHomeUrl `http://127.0.0.1:3000`。

Mock：仅当 `HERMES_USE_MOCK_AUTH=true`（单元测试/调试）时使用 `MockAuthClient`；否则始终向配置的 AI-OS Auth 发起 HTTP 请求。

**V3.3.1 启动门控**：所有连接模式均先要求 endpoint + token + `bootstrapState.initialized`；未完成 bootstrap 时 `reason: bootstrap-pending` → LoginScreen 自动重试 bootstrap。

不可加密时**禁止明文落盘**，仅内存 session。keytar 加载失败时回退 safeStorage / 内存（见 `token-store.ts`）。

### Desktop User Config Bootstrap（V3.3）

Renderer 通过 `window.desktopUserConfig` 访问。`DesktopBootstrapConfig.schemaVersion` = **2**（`aios.authPrefix`、`aios.aiosHomeUrl`；兼容 `frontendUrl`）。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `user-config:get-local` | — | `DesktopBootstrapConfig \| null` | 本地缓存的 bootstrap 配置 |
| `user-config:get-bootstrap-state` | — | `BootstrapState` | 是否已完成首次 bootstrap |
| `user-config:fetch-remote` | — | `DesktopBootstrapConfig` | 解析 bootstrap 配置（**默认本地合成**，见下） |
| `user-config:bootstrap` | — | `BootstrapResult` | 首次登录覆盖；后续返回 diff |
| `user-config:diff-remote` | — | `ConfigDiffItem[]` | 本地 vs 远程 diff |
| `user-config:apply-remote` | `confirmToken?: string` | `BootstrapResult` | 用户确认后应用 |

应用顺序见 `user-config-applier.ts` + `user-config-applier-hermes.ts`（profiles/env → connection → models → toolsets/platforms → AI-OS env → reconcile/start → restartGateway → 提交本地缓存）。

**Bootstrap 来源（默认）**：登录成功后 Desktop **不请求** `GET /api/v1/desktop/bootstrap`，而是根据当前 auth session + endpoint 在 Main 合成 `local-v1`（`configVersion: "local-v1"`）并 apply。Backend 实现该接口后，设 `HERMES_USE_REMOTE_USER_CONFIG=true` 恢复远程拉取。

**远程 Bootstrap API**（仅 `HERMES_USE_REMOTE_USER_CONFIG=true`）：`GET {normalizeBackendBaseUrl(backendUrl)}/api/v1/desktop/bootstrap`，Bearer 认证，响应 `DesktopBootstrapConfig` schema v2。

**aios-home 嵌入**：bootstrap apply 会 prepare URL（`refreshAiosHomeView`），但 coordinator 在 create/reload 后 **deactivate**；进入 main 且 `WebContentsHost.setBounds("aios-home")` 后才显示嵌入页。

Mock / 远程环境变量：

| 变量 | 默认 | 说明 |
|---|---|---|
| `HERMES_USE_MOCK_AUTH` | 显式 `true` 时启用 Mock Auth | 默认关闭；Desktop 登录一律走 AI-OS HTTP Auth |
| `HERMES_USE_MOCK_USER_CONFIG` | 关闭 | `true` 时使用 mock bootstrap 数据（单测/调试） |
| `HERMES_USE_REMOTE_USER_CONFIG` | 关闭 | `true` 时从 `{backendUrl}/api/v1/desktop/bootstrap` 拉取远程配置 |
| `HERMES_PORTAL_SESSION_BRIDGE` | 开启 | `false` 时跳过 NextAuth Cookie 桥接（仅保留 Bearer 注入） |

---

## Profile Runtime IPC（`window.profileRuntime`）

Preload：`src/preload/profile-runtime-api.ts`。Main：`setupProfileRuntimeIPC()`。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `profile-runtime:importConfig` | `filePath: string` | `ImportRuntimeConfigResult` | 从 YAML 文件导入 |
| `profile-runtime:importConfigContent` | `content: string` | `ImportRuntimeConfigResult` | 从 YAML 字符串导入 |
| `profile-runtime:importConfigContentWithOptions` | `content, { overwrite? }` | `ImportRuntimeConfigResult` | 带覆盖选项导入 |
| `profile-runtime:listProfiles` | — | `ProfileSummary[]` | 列表 |
| `profile-runtime:getProfile` | `profileId` | `ProfileSummary \| null` | 详情 |
| `profile-runtime:startProfile` | `profileId` | `ProfileGatewayState` | 启动 Gateway |
| `profile-runtime:stopProfile` | `profileId` | `ProfileGatewayState` | 停止 |
| `profile-runtime:restartProfile` | `profileId` | `ProfileGatewayState` | 重启 |
| `profile-runtime:startAll` | — | `ProfileGatewayState[]` | 批量启动 |
| `profile-runtime:stopAll` | — | `ProfileGatewayState[]` | 批量停止 |
| `profile-runtime:status` | — | `ProfileGatewayState[]` | 运行时状态 |
| `profile-runtime:delegate` | `DelegateToProfileRequest` | `DelegateToProfileResult` | 跨 Profile 委派 |
| `profile-runtime:listProfileSkills` | `profileId` | `ProfileSkillSummary[]` | Profile 技能 |
| `profile-runtime:copySkill` | `CopySkillRequest` | `CopySkillResult[]` | 技能同步 |
| `profile-runtime:listProfileSessions` | `profileId` | `ProfileSessionSummary[]` | 会话列表 |
| `profile-runtime:shareSessionContext` | `ShareSessionContextRequest` | `ShareSessionContextResult[]` | 会话共享 |
| `profile-runtime:listSharedContexts` | `profileId` | `SharedContextRef[]` | 共享上下文 |
| `profile-runtime:deleteSharedContext` | `contextId` | `{ ok: boolean }` | 删除共享 |
| `profile-runtime:listAuditEvents` | `AuditEventFilter` | `AuditEventRecord[]` | 审计 |
| `profile-runtime:getGatewayLogs` | `profileId, options?` | `GatewayLogEntry[]` | Gateway 日志 |
| `profile-runtime:setAutoRestart` | `profileId, enabled` | `void` | 自动重启开关 |

**事件**：`profile-runtime:onStatusChanged` → Preload `onRuntimeStatusChanged`（返回 unsubscribe）。

**V4.0 Gateway 隔离**（`hermes-local-adapter.ts`）：spawn 时设置 `HERMES_HOME` / `HERMES_PROFILE` / `HERMES_PROFILE_HOME` / `HERMES_GATEWAY_HOST` / `HERMES_GATEWAY_PORT`；`stop` 读取对应 profile home 的 `gateway.pid`。

---

## Profile Role IPC（`window.profileRole`，V4.0）

Preload：`src/preload/profile-role-api.ts`。Main：`setupProfileRoleIPC()`。类型：`src/shared/profile-roles/profile-role-contract.ts`。

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `profile-role:syncLibrary` | `RoleLibraryRef?` | `SyncRoleLibraryResult` | git clone/更新 `~/.hermes/desktop/role-library/agency-agents-zh`；写入 `audit_events`（`action: sync_role_library`） |
| `profile-role:previewExpertPreset` | `{ overwrite? }` | `ExpertPresetPreviewResult` | 安装前端口/重名预检（不写 DB） |
| `profile-role:installPreset` | `{ overwrite? }` | `InstallExpertPresetResult` | 安装 `resources/profile-presets/hermes-expert-profiles.v1.yaml`（6 专家 Profile）；`partialSuccess` 表示部分导入 |
| `profile-role:listSpecs` | — | `ProfileRoleSpecSummary[]` | 角色规格列表 |
| `profile-role:getSpec` | `profileId` | `ProfileRoleSpecSummary \| null` | 单 Profile 角色元数据 |
| `profile-role:recompile` | `profileId` | `RecompileProfileRoleResult` | 重新生成 SOUL/MEMORY/profile-role.json |

**DB**：`profile-runtime.db` schema v3 表 `profile_role_specs`（`profile-runtime-db.ts`）。

**UI**：Settings Drawer → **Profiles** panel → `MultiProfilesPanel`（安装预设 / 启停 / 角色源 / 日志）。

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
