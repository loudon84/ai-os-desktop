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
| `read-memory` | — | `{ memory: string, userProfile: string }` | 读取记忆 |
| `add-memory-entry` | `{ entry: string }` | `boolean` | 添加记忆条目 |
| `update-memory-entry` | `{ index, entry }` | `boolean` | 更新记忆条目 |
| `remove-memory-entry` | `{ index }` | `boolean` | 删除记忆条目 |
| `write-user-profile` | `{ content: string }` | `boolean` | 写入用户画像 |
| `read-soul` | — | `string` | 读取 SOUL.md |
| `write-soul` | `{ content: string }` | `boolean` | 写入 SOUL.md |
| `reset-soul` | — | `boolean` | 重置人格 |

### 工具集与技能

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `get-toolsets` | — | `Toolset[]` | 列出工具集 |
| `set-toolset-enabled` | `{ name, enabled }` | `boolean` | 启用/禁用工具集 |
| `list-installed-skills` | — | `Skill[]` | 已安装技能 |
| `list-bundled-skills` | — | `Skill[]` | 内置技能 |
| `get-skill-content` | `{ name }` | `string` | 技能内容 |
| `install-skill` | `{ name }` | `boolean` | 安装技能 |
| `uninstall-skill` | `{ name }` | `boolean` | 卸载技能 |

### 定时任务

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `list-cron-jobs` | — | `CronJob[]` | 列出任务 |
| `create-cron-job` | `CronJobConfig` | `boolean` | 创建任务 |
| `remove-cron-job` | `{ id }` | `boolean` | 删除任务 |
| `pause-cron-job` | `{ id }` | `boolean` | 暂停任务 |
| `resume-cron-job` | `{ id }` | `boolean` | 恢复任务 |
| `trigger-cron-job` | `{ id }` | `boolean` | 手动触发 |

### 模型

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `list-models` | — | `Model[]` | 列出模型 |
| `add-model` | `ModelConfig` | `boolean` | 添加模型 |
| `remove-model` | `{ id }` | `boolean` | 删除模型 |
| `update-model` | `{ id, ...updates }` | `boolean` | 更新模型 |

### Claw3D

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `claw3d-status` | — | `Claw3DStatus` | 状态查询 |
| `claw3d-setup` | — | void | 安装（进度通过事件推送） |
| `claw3d-start-all` | — | void | 启动全部 |
| `claw3d-stop-all` | — | void | 停止全部 |
| `claw3d-get-port` / `claw3d-set-port` | — / `{ port }` | `number` / `void` | 端口配置 |
| `claw3d-get-ws-url` / `claw3d-set-ws-url` | — / `{ url }` | `string` / `void` | WebSocket URL |

### 更新

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `check-for-updates` | — | void | 检查更新（结果通过事件推送） |
| `download-update` | — | void | 下载更新 |
| `install-update` | — | void | 安装更新 |
| `get-app-version` | — | `string` | 获取应用版本 |

---

## 主进程推送事件 (Main → Renderer)

| 事件 Channel | 数据类型 | 说明 |
|---|---|---|
| `install-progress` | `{ step, message, percent? }` | 安装进度 |
| `chat-chunk` | `{ content: string }` | 流式文本块 |
| `chat-done` | `{ sessionId?: string }` | 聊天完成 |
| `chat-error` | `{ error: string }` | 聊天错误 |
| `chat-tool-progress` | `{ label: string }` | 工具调用进度 |
| `chat-usage` | `{ promptTokens, completionTokens, totalTokens, cost?, rateLimitRemaining? }` | Token 用量 |
| `claw3d-setup-progress` | `{ step, message }` | Claw3D 安装进度 |
| `update-available` | `{ version }` | 有可用更新 |
| `update-download-progress` | `{ percent }` | 下载进度 |
| `update-downloaded` | — | 下载完成 |
| `update-error` | `{ error }` | 更新错误 |
| `menu-new-chat` | — | 菜单快捷键：新聊天 |
| `menu-search-sessions` | — | 菜单快捷键：搜索会话 |

---

## V1.1 Profile Runtime IPC 契约

### profile-runtime:* — 多 Profile 运行时管理

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `profile-runtime:importConfig` | `filePath: string` | `ImportRuntimeConfigResult` | 从 YAML 文件导入配置 |
| `profile-runtime:listProfiles` | — | `ProfileSummary[]` | 列出所有 Profile |
| `profile-runtime:getProfile` | `profileId: string` | `ProfileSummary \| null` | 获取单个 Profile |
| `profile-runtime:startProfile` | `profileId: string` | `ProfileGatewayState` | 启动 Profile Gateway |
| `profile-runtime:stopProfile` | `profileId: string` | `ProfileGatewayState` | 停止 Profile Gateway |
| `profile-runtime:restartProfile` | `profileId: string` | `ProfileGatewayState` | 重启 Profile Gateway |
| `profile-runtime:startAll` | — | `ProfileGatewayState[]` | 启动所有 autoStart Profile |
| `profile-runtime:stopAll` | — | `ProfileGatewayState[]` | 停止所有运行中 Profile |
| `profile-runtime:status` | — | `ProfileGatewayState[]` | 获取所有运行时状态 |
| `profile-runtime:delegate` | `DelegateToProfileRequest` | `DelegateToProfileResult` | default 向 specialist 发起委托 |
| `profile-runtime:listProfileSkills` | `profileId: string` | `ProfileSkillSummary[]` | 列出 Profile 技能 |
| `profile-runtime:copySkill` | `CopySkillRequest` | `CopySkillResult[]` | 跨 Profile 复制技能 |
| `profile-runtime:listProfileSessions` | `profileId: string` | `ProfileSessionSummary[]` | 列出 Profile 会话 |
| `profile-runtime:shareSessionContext` | `ShareSessionContextRequest` | `ShareSessionContextResult[]` | 共享会话上下文 |
| `profile-runtime:listSharedContexts` | `profileId?: string` | `SharedContextRef[]` | 列出共享上下文 |
| `profile-runtime:deleteSharedContext` | `contextId: string` | `{ ok: boolean }` | 删除共享上下文 |
| `profile-runtime:listAuditEvents` | `AuditEventFilter?` | `AuditEventRecord[]` | 查询审计事件 |

### profile-entry:* — Profile 页面入口

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `profile-entry:list` | — | `ProfileEntrySummary[]` | 列出所有 Profile 入口 |
| `profile-entry:get` | `profileId: string` | `ProfileEntrySummary \| null` | 获取单个入口 |
| `profile-entry:open` | `profileId: string` | `OpenProfileEntryResult` | 打开 Profile 页面 |
| `profile-entry:get-layout` | `profileId: string` | `ProfilePageLayout` | 获取页面布局 |
| `profile-entry:update-layout` | `profileId, layout` | `ProfilePageLayout` | 更新页面布局 |

### Profile Runtime 错误码

| 错误码 | 说明 |
|---|---|
| PROFILE_NOT_FOUND | Profile 不存在 |
| PROFILE_ALREADY_EXISTS | Profile 已存在 |
| PROFILE_INVALID_NAME | 名称不合法（需 kebab-case） |
| PROFILE_CONFIG_INVALID | 配置格式错误 |
| PROFILE_PORT_CONFLICT | 端口冲突 |
| PROFILE_RUNTIME_NOT_DEPLOYED | 运行时未部署 |
| PROFILE_RUNTIME_START_FAILED | 启动失败 |
| PROFILE_RUNTIME_STOP_FAILED | 停止失败 |
| PROFILE_GATEWAY_HEALTH_TIMEOUT | 健康检查超时 |
| PROFILE_ADAPTER_NOT_FOUND | 适配器未找到 |
| PROFILE_CAPABILITY_NOT_ENABLED | 能力未启用 |
| PROFILE_DELEGATION_FAILED | 委托失败 |
| PROFILE_SKILL_NOT_FOUND | 技能未找到 |
| PROFILE_SKILL_COPY_FAILED | 技能复制失败 |
| PROFILE_CONTEXT_SOURCE_SESSION_NOT_FOUND | 源会话未找到 |
| PROFILE_CONTEXT_SHARE_FAILED | 上下文共享失败 |
| PROFILE_ENTRY_NOT_FOUND | 入口未找到 |
| PROFILE_ENTRY_ROUTE_CONFLICT | 路由冲突 |
| WEB_OPERATOR_PROFILE_NOT_ALLOWED | Web Operator 不允许该 Profile |

---

## V1.2.1 Enterprise Install IPC 契约

### enterprise:* — 企业级一键部署

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `enterprise:get-deployment-config` | — | `LoadConfigResult` | 获取 deployment.json 配置 |
| `enterprise:validate-deployment-config` | — | `ValidationResult` | 校验 deployment.json schema |
| `enterprise:preflight` | — | `PreflightReport` | 运行 20 项环境预检 |
| `enterprise:install` | `EnterpriseInstallInput?` | `EnterpriseInstallResult` | 执行 20 步安装流水线 |
| `enterprise:install-cancel` | — | `{ ok: boolean }` | 取消当前安装 |
| `enterprise:update` | `EnterpriseUpdateInput?` | `EnterpriseUpdateResult` | 更新 Desktop/Agent |
| `enterprise:repair` | `EnterpriseRepairInput?` | `EnterpriseRepairResult` | L1-L5 递进修复 |
| `enterprise:rollback` | `EnterpriseRollbackInput` | `EnterpriseRollbackResult` | 回滚到指定快照 |
| `enterprise:get-install-marker` | — | `InstallMarker \| null` | 获取安装标记 |
| `enterprise:get-install-log` | `{ type: InstallPhase }` | `string` | 获取安装日志 |
| `enterprise:open-log-dir` | — | `{ ok: boolean }` | 打开日志目录 |
| `enterprise:run-doctor` | `RuntimeDoctorInput?` | `DoctorReport` | 运行 9 项诊断检查 |
| `enterprise:export-doctor` | — | `{ ok: boolean, path: string }` | 导出诊断报告 |

### Enterprise Install 推送事件 (Main → Renderer)

| 事件 Channel | 数据类型 | 说明 |
|---|---|---|
| `enterprise-install:progress` | `InstallProgressEvent` | 安装进度实时推送（stage/status/progress/message/errorCode） |

### Enterprise Install 错误码

| 错误码 | 说明 |
|---|---|
| E_DEPLOY_SCHEMA_INVALID | deployment.json schema 校验失败 |
| E_DEPLOY_FILE_NOT_FOUND | deployment.json 文件不存在 |
| E_DEPLOY_FILE_READ_FAILED | deployment.json 读取失败 |
| E_BUNDLE_DOWNLOAD_FAILED | Runtime Bundle 下载失败 |
| E_BUNDLE_SHA256_MISMATCH | Runtime Bundle SHA-256 校验不匹配 |
| E_BUNDLE_SIGNATURE_INVALID | Runtime Bundle 签名校验失败 |
| E_BUNDLE_DISK_FULL | 磁盘空间不足 |
| E_BUNDLE_EXTRACT_FAILED | Runtime Bundle 解压失败 |
| E_GIT_CLONE_FAILED | Git clone 失败 |
| E_GIT_AUTH_FAILED | Git 认证失败 |
| E_GIT_CHECKOUT_FAILED | Git checkout 失败 |
| E_AGENT_VERSION_MISMATCH | Hermes Agent 版本不匹配 |
| E_AGENT_SOURCE_NOT_FOUND | Hermes Agent 源码不存在 |
| E_VENV_CREATE_FAILED | Python venv 创建失败 |
| E_VENV_REUSED_BROKEN | 复用的 Python venv 已损坏 |
| E_PIP_INSTALL_FAILED | pip 依赖安装失败 |
| E_PIP_INDEX_UNREACHABLE | PyPI 索引不可达 |
| E_PORT_EXHAUSTED | 可用端口耗尽 |
| E_PORT_CONFLICT | 端口冲突 |
| E_GATEWAY_STARTUP_TIMEOUT | Gateway 启动超时 |
| E_GATEWAY_HEALTH_FAILED | Gateway 健康检查失败 |
| E_INSTALL_LOCK_TIMEOUT | 安装锁获取超时 |
| E_INSTALL_CANCELLED | 安装已取消 |
| E_PROFILE_DB_CREATE_FAILED | Profile Runtime DB 创建失败 |
| E_PROFILE_BOOTSTRAP_FAILED | Profile 引导失败 |
| E_PROFILE_HOME_NOT_WRITABLE | Profile 目录不可写 |
| E_POLICY_APPLY_FAILED | Policy 应用失败 |
| E_DOCTOR_CHECK_FAILED | Doctor 检查失败 |
| E_ROLLBACK_CHECKSUM_MISMATCH | 回滚快照校验不匹配 |
| E_ROLLBACK_SNAPSHOT_NOT_FOUND | 回滚快照不存在 |
| E_REPAIR_FAILED | 修复失败 |
| E_DIR_PERMISSION_FAILED | 目录权限不足 |

### Enterprise Install 状态机

```
splash → check-install → load-deployment-config → preflight → runtime-bundle
  → install-agent → bootstrap-profiles → start-gateway → doctor → setup → main
```

---

## Hermes Python Backend API

| 接口 | 方法 | 请求体 | 响应 | 说明 |
|---|---|---|---|---|
| `/health` | GET | — | `200 OK` | 健康检测 |
| `/v1/chat/completions` | POST | `{ model, messages, stream: true }` | SSE 流 | OpenAI 兼容流式聊天 |
| `/v1/chat/completions` | POST | `{ model, messages, stream: false }` | JSON | 非流式（错误诊断用） |

响应头: `X-Hermes-Session-Id` — 会话 ID，用于续接

---

## Web Operator IPC 契约

### Browser 操作 IPC

| IPC Channel | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `browser.open` | `{ url: string, profile?: string, source: "user"\|"hermes"\|"system" }` | `{ ok, url?, errorCode?, message? }` | 打开外部 URL |
| `browser.back` | `source` | `{ ok, errorCode?, message? }` | 后退 |
| `browser.forward` | `source` | `{ ok, errorCode?, message? }` | 前进 |
| `browser.reload` | `source` | `{ ok, errorCode?, message? }` | 刷新 |
| `browser.get_state` | `source` | `{ ok, state?, errorCode?, message? }` | 获取页面状态（title/url/inputs/buttons/links） |
| `browser.screenshot` | `source` | `{ ok, mimeType?, base64?, errorCode?, message? }` | 截图 |
| `browser.click` | `{ selector: string, source, requireConfirm?: boolean }` | `{ ok, errorCode?, message? }` | 点击元素 |
| `browser.type` | `{ selector: string, text: string, source }` | `{ ok, errorCode?, message? }` | 输入文本 |
| `browser.extract_table` | `{ selector: string, source }` | `{ ok, message?, errorCode? }` | 提取表格 |
| `browser.get_audit_log` | `limit?: number` | `BrowserAuditRecord[]` | 获取审计日志 |
| `browser.confirm_action` | `pendingActionId: string` | `{ ok, message? }` | 确认敏感动作 |
| `browser.reject_action` | `pendingActionId: string` | `{ ok, message? }` | 拒绝敏感动作 |
| `browser.update_bounds` | `{ x, y, width, height }` | `void` | 同步视口尺寸 |

### Browser 错误码

| 错误码 | HTTP Status | 说明 |
|---|---|---|
| EXTERNAL_WEB_VIEW_NOT_READY | 503 | WebContentsView 未创建或已销毁 |
| DOMAIN_NOT_ALLOWED | 403 | 域名不在白名单 |
| SELECTOR_NOT_FOUND | 404 | 选择器未匹配到元素 |
| PASSWORD_FIELD_BLOCKED | 403 | 禁止在密码字段输入 |
| UNSAFE_ACTION_REQUIRES_CONFIRMATION | 202 | 敏感动作需用户确认 |
| JAVASCRIPT_EXECUTION_FAILED | 500 | JS 注入执行失败 |
| SCREENSHOT_FAILED | 500 | 截图失败 |

### Browser 推送事件 (Main → Renderer)

| 事件 Channel | 数据类型 | 说明 |
|---|---|---|
| `browser.on_pending_action` | `PendingSensitiveAction` | 敏感动作待确认推送 |
| `browser.on_audit_update` | `BrowserAuditRecord` | 审计记录实时追加 |

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

所有 Tool Bridge 请求自动设置 `source: "hermes"`。
