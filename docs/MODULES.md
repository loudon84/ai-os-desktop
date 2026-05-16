# Modules

## 主进程模块 (src/main/)

### index.ts — 主进程入口

- **职责**: 创建 BrowserWindow、注册全部 IPC handler、构建应用菜单、设置自动更新、生命周期管理
- **关键行为**: before-quit 时清理 gateway 和 claw3d 进程
- **导出**: 无（入口文件）

### hermes.ts — Hermes 引擎通信

- **职责**: Gateway 进程管理 + SSE 消息通信
- **核心常量**: `LOCAL_API_URL = "http://127.0.0.1:8642"`
- **导出函数**:
  - `sendMessage()` — 公开消息入口，自动选择 API/CLI 路径
  - `startGateway()` — spawn Python 进程执行 `hermes gateway`
  - `stopGateway()` — kill 进程 + pid 文件清理
  - `restartGateway()` — 停止后重启
  - `isRemoteMode()` — 判断是否远程模式
  - `isGatewayRunning()` — Gateway 运行状态
- **依赖**: config.ts (连接配置), sse-parser.ts (SSE 解析)

### installer.ts — 安装管理

- **职责**: Python 环境安装、健康检测、Doctor/Update、OpenClaw 迁移、备份/导入/导出
- **IPC Handler**: check-install, verify-install, start-install, get-hermes-version, run-hermes-doctor, run-hermes-update, check-openclaw, run-claw-migrate, run-hermes-backup, run-hermes-import, run-hermes-dump, list-mcp-servers, discover-memory-providers, read-logs

### config.ts — 配置管理

- **职责**: 读写 desktop.json（连接模式）、.env 文件、config.yaml、模型配置、凭证池、平台开关
- **关键文件**:
  - `~/.hermes/desktop.json` — 连接模式 (local/remote)
  - `~/.hermes/.env` — 环境变量 (API Keys)
  - `~/.hermes/config.yaml` — Hermes Agent 配置
- **IPC Handler**: get-env, set-env, get-config, set-config, get-hermes-home, get-model-config, set-model-config, is-remote-mode, get-connection-config, set-connection-config, test-remote-connection, get-platform-enabled, set-platform-enabled, get-credential-pool, set-credential-pool

### sessions.ts — 会话管理

- **职责**: 通过 better-sqlite3 读取 `~/.hermes/state.db`
- **IPC Handler**: list-sessions, get-session-messages, search-sessions
- **依赖**: better-sqlite3

### session-cache.ts — 会话缓存

- **职责**: 本地 JSON 缓存 + SQLite，自动生成会话标题、同步缓存
- **IPC Handler**: list-cached-sessions, sync-session-cache, update-session-title

### models.ts — 模型管理

- **职责**: CRUD 操作 `~/.hermes/models.json`
- **IPC Handler**: list-models, add-model, remove-model, update-model
- **依赖**: default-models.ts (种子数据)

### default-models.ts — 默认模型定义

- **职责**: 预置 Claude Sonnet 4 (OpenRouter+Anthropic)、GPT-4.1 (OpenAI)

### profiles.ts — 配置档案管理

- **职责**: 列出/创建/删除/切换 profile，每个 profile 独立目录 `~/.hermes/profiles/<name>`
- **IPC Handler**: list-profiles, create-profile, delete-profile, set-active-profile

### memory.ts — 记忆管理

- **职责**: 读写 MEMORY.md 和 USER.md，增删改记忆条目
- **字符限制**: MEMORY.md 2200 字符，USER.md 1375 字符
- **IPC Handler**: read-memory, add-memory-entry, update-memory-entry, remove-memory-entry, write-user-profile

### soul.ts — 灵魂/人格管理

- **职责**: 读写 SOUL.md，重置为默认人格提示词
- **IPC Handler**: read-soul, write-soul, reset-soul

### tools.ts — 工具集管理

- **职责**: 列出/启用/禁用工具集 (web/browser/terminal/file/code_execution/vision/image_gen 等)
- **IPC Handler**: get-toolsets, set-toolset-enabled

### skills.ts — 技能管理

- **职责**: 列出已安装/内置技能、获取技能内容、安装/卸载技能，解析 SKILL.md frontmatter
- **IPC Handler**: list-installed-skills, list-bundled-skills, get-skill-content, install-skill, uninstall-skill

### cronjobs.ts — 定时任务管理

- **职责**: CRUD cron jobs，暂停/恢复/触发，支持多种投递渠道
- **IPC Handler**: list-cron-jobs, create-cron-job, remove-cron-job, pause-cron-job, resume-cron-job, trigger-cron-job

### claw3d.ts — Claw3D/Office 管理

- **职责**: 克隆 hermes-office 仓库、安装依赖、启动/停止 dev server 和 adapter
- **IPC Handler**: claw3d-status, claw3d-setup, claw3d-start-all, claw3d-stop-all, claw3d-get-logs, claw3d-start-dev, claw3d-stop-dev, claw3d-start-adapter, claw3d-stop-adapter, claw3d-get-port, claw3d-set-port, claw3d-get-ws-url, claw3d-set-ws-url

### sse-parser.ts — SSE 流解析器

- **职责**: 解析 Server-Sent Events 数据，处理自定义事件 (hermes.tool.progress)、提取 usage 统计
- **导出函数**: parseSseBlock(), processCustomEvent(), parseSseStream()

### locale.ts — 语言设置

- **职责**: 代理 shared/i18n 的 getLocale/setLocale

### askpass.ts — sudo 密码桥接

- **职责**: 将 sudo 密码提示桥接到 GUI 对话框，通过 Unix socket + Python3 中转

### utils.ts — 工具函数

- **导出**: stripAnsi(), profileHome(), escapeRegex(), safeWriteFile()

---

## V1.1 Profile Runtime 模块

### profile-runtime-db.ts — SQLite 运行时控制面

- **职责**: 管理 `~/.hermes/desktop/profile-runtime.db`，9 张核心表 + 索引 + 迁移 + CRUD
- **数据库**: profiles, runtime_instances, profile_entries, profile_capabilities, profile_skills, skill_sync_events, shared_contexts, delegation_events, audit_events
- **关键方法**: initProfileRuntimeDb(), transaction(), insertProfile(), getProfile(), listProfiles(), insertRuntimeInstance(), updateRuntimeStatus(), listAuditEvents(), insertAuditEvent()
- **V1.2 变更**: runtime_instances 新增 5 字段 (restart_count/last_exit_code/last_crash_at/auto_restart/health_fail_count)；updateRuntimeStatus 扩展支持 RuntimeStatusUpdateExtra (10 字段)

### config-importer.ts — 配置导入器

- **职责**: 解析 profile-runtime.yaml，校验名称/端口/adapter，创建目录结构，写入 DB
- **核心方法**: importConfig(yamlContent), importConfigFromFile(filePath), profileHome(name)
- **校验链**: 名称 kebab-case → 端口唯一 → adapter 可用 → 名称唯一
- **依赖**: js-yaml, profile-runtime-db

### runtime-adapter.ts — RuntimeAdapter 接口

- **职责**: 定义可插拔运行时适配器接口
- **方法**: validate, deploy, start, stop, restart, health, sendMessage

### capability-plugin.ts — CapabilityPlugin 接口

- **职责**: 定义能力插件接口
- **方法**: name, initialize?(db)

### plugin-registry.ts — 插件注册表

- **职责**: 管理 RuntimeAdapter 和 CapabilityPlugin 的注册与查询
- **方法**: registerAdapter, registerCapability, getAdapter, getCapability

### hermes-local-adapter.ts — HermesLocalRuntimeAdapter

- **职责**: 实现 hermes-local 运行时适配器，spawn/kill Gateway 进程，健康检查，消息发送
- **关键行为**: 端口参数化（从硬编码 8642 改为按 profile 配置），profileHome 参数化
- **V1.2 变更**: stdio 改为 pipe 模式捕获 stdout/stderr；集成 gateway-log-collector；exit 事件记录 last_exit_code/last_crash_at/restart_count
- **依赖**: hermes.ts（复用 spawn/kill 逻辑）, profile-runtime-db, gateway-log-collector

### gateway-supervisor.ts — Gateway 健康监管

- **职责**: 每 15 秒轮询运行中 Profile 的 /health，连续 3 次失败标记 failed
- **V1.2 变更**: 支持 autoRestart/maxRestartCount 选项；失败时递增 health_fail_count；超过 maxRestartCount(默认 3) 停止自动重启；启动 15 秒后自动重启；setAutoRestartHandler 注入回调；resetRestartCount/getSupervisionStatus
- **方法**: startSupervision(profileId, options?), stopSupervision(profileId), startAllSupervision(), stopAllSupervision(), setAutoRestartHandler(), resetRestartCount(), getSupervisionStatus()

### gateway-log-collector.ts — V1.2 新增: Gateway 日志收集

- **职责**: 收集 Gateway 子进程 stdout/stderr，提供历史查询与实时推送
- **关键方法**: startCollecting(profileId, proc), stopCollecting(profileId), getHistory(profileId, options?), onNewLog(profileId, callback), clearHistory(profileId)
- **缓冲上限**: MAX_BUFFER_SIZE = 2000 条
- **订阅保护**: SUBSCRIBER_HIGH_WATERMARK = 100

### runtime-reconciler.ts — V1.2 新增: App 重启状态恢复

- **职责**: App 重启后扫描所有 running 实例，检查进程存活/端口占用，校正不一致状态
- **关键方法**: reconcile(), isPortOccupied(port)
- **集成点**: initializeProfileRuntime() 启动时自动调用 reconcile()

### profile-runtime-manager.ts — Profile Runtime 核心管理器

- **职责**: 编排 Profile 生命周期（start/stop/restart/startAll/stopAll），状态流转保护，审计写入
- **状态流转**: not_deployed→starting→running, running→stopping→stopped, *→failed
- **V1.2 变更**: 启动前端口冲突检测 (isPortOccupied)；30 秒启动超时检测 (STARTUP_TIMEOUT_MS)；集成 GatewayLogCollector/Supervisor autoRestart/Reconciler
- **关键方法**: startProfile(), stopProfile(), restartProfile(), startAllProfiles(), stopAllProfiles(), listProfileSummaries(), onBeforeQuit(), isPortOccupied()
- **初始化**: initializeProfileRuntime() — 初始化 DB + 注册 hermes-local adapter + 注册 autoRestart handler + 调用 reconcile()

### profile-runtime-ipc.ts — Profile Runtime IPC 注册

- **职责**: 注册 17+2 个 profile-runtime:* + 5 个 profile-entry:* IPC handler
- **V1.2 新增**: profile-runtime:getGatewayLogs, profile-runtime:setAutoRestart
- **IPC Channels**: profile-runtime:importConfig, listProfiles, getProfile, startProfile, stopProfile, restartProfile, startAll, stopAll, status, delegate, listProfileSkills, copySkill, listProfileSessions, shareSessionContext, listSharedContexts, deleteSharedContext, listAuditEvents, getGatewayLogs, setAutoRestart; profile-entry:list, get, open, get-layout, update-layout

### delegation-capability.ts — 委托调用能力

- **职责**: default Profile 向 specialist Profile 发起委托调用，支持 context refs 注入
- **核心方法**: invoke(request) — 检查目标运行状态 → 解析 context refs → POST /v1/chat/completions → 写 delegation_events + audit_events
- **超时**: 默认 30000ms

### skill-sync-capability.ts — 技能同步能力

- **职责**: Profile 间技能复制，支持冲突策略（跳过/覆盖+备份）
- **核心方法**: copySkill(request) — 校验源技能 → 冲突检测 → 备份/覆盖/复制 → SHA-256 校验和 → 写 skill_sync_events + audit_events

### session-share-capability.ts — 会话上下文共享能力

- **职责**: 将指定 session 上下文导出为 context.md，支持 snapshot/summary/full 三种模式
- **核心方法**: shareSessionContext(request) — 读取源 session → 生成 context.md → 写入目标 shared-context/ 目录 → 写 shared_contexts + audit_events
- **禁止**: 不直接复制或合并 state.db

### web-operator-profile-bridge.ts — Web Operator Profile-Aware 桥接

- **职责**: Web Operator 操作注入 profileId 溯源，权限校验，审计写入，敏感操作确认
- **核心方法**: checkProfileAllowed(), injectSourceProfile(), executeAction(), confirmAction()
- **敏感操作**: browser.type, browser.click

---

## V1.2.1 Enterprise Install 模块 (src/main/enterprise/)

### deployment-config.ts — Deployment 配置加载

- **职责**: 读取 deployment.json → 校验 → 返回 DeploymentConfig；提供默认配置（7 Profile + 8642-8648 端口 + windows-native）
- **核心方法**: loadDeploymentConfig(configPath?), getDefaultDeploymentConfig(), getHermesBasePath(), getInstallBasePath(), getDeploymentConfigPaths()
- **依赖**: deployment-schema.ts

### deployment-schema.ts — Deployment Schema 校验

- **职责**: 31 字段手动校验 + 条件联动校验（bundleUrl/sourceType 联动、gitUrl/branch/sourceType 联动、gateway.host 安全约束 127.0.0.1）
- **核心方法**: validateDeploymentConfig(config): SchemaValidationResult

### checksum-verifier.ts — SHA-256 校验

- **职责**: 流式 SHA-256 计算（crypto.createHash），支持大文件；可选 manifest 签名校验
- **核心方法**: verifySha256(filePath, expectedHash), verifyManifestSignature(manifestPath)

### runtime-bundle-manager.ts — Runtime Bundle 管理

- **职责**: 三种 Bundle 来源（artifact 在线下载/离线路径/内嵌）+ 断点续传 + SHA-256 校验 + 解压 + 复用检测
- **核心方法**: resolveRuntimeBundle(config, onProgress, existingBundleHash?)
- **错误码**: E_BUNDLE_DOWNLOAD_FAILED, E_BUNDLE_SHA256_MISMATCH, E_BUNDLE_DISK_FULL, E_BUNDLE_EXTRACT_FAILED

### preflight-checker.ts — 环境预检

- **职责**: 20 项检查（P0 阻断 10 项 + P1 警告 5 项 + P2 信息 5 项），禁止修改系统状态
- **核心方法**: runPreflight(config): PreflightReport
- **P0 检查**: WIN-VERSION, DISK-SPACE, INSTALL-DIR-WRITABLE, HERMES-HOME-WRITABLE, PORT-AVAILABLE, PYTHON-AVAILABLE, VENV-CREATABLE, BUNDLE-SHA256, PROFILE-DB-CREATABLE, DEPLOY-SCHEMA

### hermes-agent-source-installer.ts — Agent 源码安装

- **职责**: Git clone / Bundle 两种模式安装 hermes-agent，PAT 通过环境变量注入不落盘
- **核心方法**: installHermesAgentSource(config, runtimePath, onProgress)
- **错误码**: E_GIT_CLONE_FAILED, E_GIT_AUTH_FAILED, E_GIT_CHECKOUT_FAILED, E_AGENT_VERSION_MISMATCH, E_AGENT_SOURCE_NOT_FOUND

### python-venv-installer.ts — Python Venv 管理

- **职责**: venv 创建/复用 + 依赖安装（优先 uv，fallback pip；优先 wheelhouse，fallback pipIndexUrl）
- **核心方法**: createOrReuseSharedVenv(config), installPythonDependencies(config, venvPath, agentPath, onProgress)
- **错误码**: E_VENV_CREATE_FAILED, E_VENV_REUSED_BROKEN, E_PIP_INSTALL_FAILED, E_PIP_INDEX_UNREACHABLE

### runtime-bootstrapper.ts — Python 运行时检测

- **职责**: 检测系统 Python 版本，判断使用 bundled 或系统 Python
- **核心方法**: detectAndBootstrapRuntime(config)

### enterprise-config-provisioner.ts — ~/.hermes 初始化

- **职责**: 创建 ~/.hermes 目录结构 + config.yaml + .env + SOUL.md（已有配置保留）
- **核心方法**: provisionDefaultHermesHome(config, agentPath, venvPath)

### profile-runtime-bootstrapper.ts — Profile 引导

- **职责**: 7 个 Profile 独立引导（HERMES_HOME 创建 + config.yaml + 端口递增分配 + SOUL.md）
- **核心方法**: bootstrapProfiles(config, agentPath, venvPath, onProgress)
- **错误码**: E_PORT_EXHAUSTED

### profile-policy-installer.ts — Skills 安装与 Policy

- **职责**: Bundle Skills 复制到 Profile 目录 + Policy 只读标记
- **核心方法**: installBundledSkills(config, profileName, profileHome, runtimePath), applyPolicyReadOnly(profileId)

### install-lock.ts — 安装锁

- **职责**: 独占文件锁（fs.open wx），stale lock 5 分钟自动清理
- **核心方法**: acquireInstallLock(timeoutMs): InstallLock
- **错误码**: E_INSTALL_LOCK_TIMEOUT

### install-marker.ts — 安装标记

- **职责**: 读写 install-marker.json（schemaVersion/desktopVersion/agentVersion/profiles/rollbackSnapshots）
- **核心方法**: writeInstallMarker(marker), readInstallMarker(), existsInstallMarker()

### install-log.ts — 安装日志

- **职责**: JSON Lines 格式日志 + 敏感信息自动脱敏（token/password/secret/key/auth → ***）
- **核心方法**: createInstallLogger(logDir?): InstallLogger

### enterprise-installer.ts — 企业安装流水线

- **职责**: 20 步有序安装流水线编排 + 13 个 IPC handler 注册 + 进度推送
- **流水线**: checkEnterpriseInstall → loadDeploymentConfig → acquireInstallLock → runPreflight → resolveRuntimeBundle → installHermesAgentSource → createOrReuseSharedVenv → installPythonDependencies → provisionDefaultHermesHome → bootstrapProfiles → installBundledSkills → applyPolicy → writeInstallMarker → openAIOSWorkspace
- **IPC Channels**: enterprise:get-deployment-config, validate-deployment-config, preflight, install, install-cancel, update, repair, rollback, get-install-marker, get-install-log, open-log-dir, run-doctor, export-doctor
- **核心方法**: executeEnterpriseInstallPipeline(mainWindow, input?), setupEnterpriseInstallIPC(mainWindow)

### enterprise-ipc.ts — IPC 重导出

- **职责**: 从 enterprise-installer 重导出 setupEnterpriseInstallIPC

### doctor/ — Runtime Doctor 模块

#### runtime-doctor.ts — 诊断编排

- **职责**: 9 项并发检查 + 报告导出，单项超时 10s
- **核心方法**: runAllChecks(input): DoctorReport, exportDoctorReport(report, exportDir?)

#### check-gateway-reachable.ts — Gateway 可达性检查

- **核心方法**: checkGatewayReachable(host, port, timeoutMs?)

#### check-python-deps.ts — Python 依赖完整性检查

- **核心方法**: checkPythonDeps(venvPath, agentPath)

#### check-agent-files.ts — Agent 文件完整性检查

- **核心方法**: checkAgentFiles(agentPath)

#### check-profile-db.ts — Profile DB 完整性检查

- **核心方法**: checkProfileDb(dbPath) — PRAGMA integrity_check

#### check-skills.ts — Skills 完整性检查

- **核心方法**: checkSkills(skillsDir)

#### check-misc.ts — 辅助检查

- **核心方法**: checkPolicy(profileId), checkPortBinding(host, port), checkDirPermission(dirPath), checkConfigValidity(configPath)

---

### browser/ — Web Operator 模块

基于 `hermes-desktop` 二开，扩展为 **AI-OS Desktop Web Operator**，让 Electron 桌面端打开外部 Web 页面，用户可手工操作，Hermes 通过受控 Browser Tool Bridge 操作同一页面。

#### browser-types.ts — 内部类型定义

- **导出**: `BrowserViewBounds`, `PendingSensitiveAction`, `SENSITIVE_ACTION_KEYWORDS`, `JS_SCRIPT_NAMES`, `BROWSER_PARTITION`, `PENDING_ACTION_TIMEOUT_MS`

#### browser-security.ts — BrowserSecurityGuard

- **职责**: 域名白名单校验（精确 + 通配符）、密码字段检测、敏感动作识别
- **核心方法**: `isDomainAllowed()`, `isPasswordField()`, `isSensitiveAction()`, `validateAction()`
- **配置文件**: `~/.hermes/desktop/web-operator/web-operator.config.json`

#### browser-audit.ts — BrowserAuditLogger

- **职责**: JSONL 审计日志追加写入、日期轮转、文本脱敏（browser.type 仅记录 textLength）、实时推送
- **核心方法**: `log()`, `query()`, `onLog()`, `close()`
- **日志路径**: `~/.hermes/desktop/web-operator/logs/browser-audit-YYYY-MM-DD.jsonl`

#### browser-view-manager.ts — BrowserViewManager

- **职责**: WebContentsView 单例创建/销毁/Bounds 同步，独立 Partition（persist:aios-external-web）
- **核心方法**: `createView()`, `navigate()`, `destroyView()`, `updateBounds()`, `getExternalWebContents()`, `isReady()`

#### browser-controller.ts — BrowserController

- **职责**: 所有浏览器操作统一入口，JS 注入脚本执行，敏感动作挂起/裁决，审计记录
- **核心方法**: `openExternalUrl()`, `goBack/Forward/Reload()`, `getPageState()`, `captureScreenshot()`, `clickSelector()`, `typeIntoSelector()`, `extractTable()`, `confirmAction()`, `rejectAction()`, `getAuditLog()`
- **注入脚本**: `__get_page_state__`, `__click_selector__`, `__type_selector__`, `__extract_table__`

#### browser-ipc.ts — BrowserIPC

- **职责**: 注册/注销 13 个 browser.* IPC handlers
- **IPC Channels**: browser.open, browser.back, browser.forward, browser.reload, browser.get_state, browser.screenshot, browser.click, browser.type, browser.extract_table, browser.get_audit_log, browser.confirm_action, browser.reject_action, browser.update_bounds

#### browser-tool-bridge.ts — BrowserToolBridge

- **职责**: Hermes 工具调用 → Controller 方法路由，强制 source="hermes"
- **核心方法**: `handleToolCall()`, `getToolSchemas()`

#### browser-tool-server.ts — BrowserToolServer

- **职责**: 本地 HTTP 工具服务器，仅绑定 127.0.0.1，端口冲突自动递增（8765→8775）
- **端点**: GET /tools → Schema 列表；POST /tools/:toolName → 执行工具
- **配置**: REQUEST_TIMEOUT_MS=30000, BASE_PORT=8765, MAX_PORT=8775

---

## 预加载层 (src/preload/)

### index.ts — 预加载脚本

- **职责**: 通过 contextBridge 暴露 `window.hermesAPI`、`window.electron`、`window.aiosBrowser`、**`window.profileRuntime`**、**`window.profileEntry`**
- **关键**: 将所有 IPC invoke/on 封装为 Promise/回调 API
- **暴露对象**: hermesAPI (30+ 方法), electron (标准 Electron API), aiosBrowser (13 方法 + 2 事件订阅), **profileRuntime (20 方法)**, **profileEntry (5 方法)**

### browser-api.ts — Web Operator Preload API

- **职责**: 封装 browser.* IPC 为 `window.aiosBrowser` API
- **核心方法**: `open()`, `back()`, `forward()`, `reload()`, `getState()`, `screenshot()`, `click()`, `type()`, `extractTable()`, `getAuditLog()`, `confirmAction()`, `rejectAction()`, `updateBounds()`
- **事件订阅**: `onPendingAction()`, `onAuditUpdate()`

### index.d.ts — 类型声明

- **职责**: HermesAPI + AiosBrowserAPI + **ProfileRuntimeAPI + ProfileEntryAPI** 接口完整 TypeScript 类型定义，声明全局 Window 扩展

### profile-runtime-api.ts — V1.1+V1.2 Profile Runtime Preload API

- **职责**: 封装 profile-runtime:* IPC 为 `window.profileRuntime` API
- **方法**: importConfig, listProfiles, getProfile, startProfile, stopProfile, restartProfile, startAllProfiles, stopAllProfiles, getRuntimeStatus, delegate, listProfileSkills, copySkill, listProfileSessions, shareSessionContext, listSharedContexts, deleteSharedContext, listAuditEvents, **V1.2 新增**: getGatewayLogs, onRuntimeStatusChanged, setAutoRestart

### profile-entry-api.ts — V1.1 Profile Entry Preload API

- **职责**: 封装 profile-entry:* IPC 为 `window.profileEntry` API
- **方法**: listProfileEntries, getProfileEntry, openProfileEntry, getProfilePageLayout, updateProfilePageLayout

---

## 渲染进程 (src/renderer/)

### App.tsx — 根组件

- **职责**: 屏幕路由 (splash → welcome → installing → setup → main)
- **状态管理**: 安装状态检查、远程模式检测

### constants.ts — 常量定义

- **Provider 列表**: OpenRouter, Anthropic, OpenAI, Google, xAI, Nous, Qwen, MiniMax, Custom
- **本地预设**: LMStudio, Ollama, vLLM, llama.cpp
- **远程预设**: Groq, DeepSeek, Together, Fireworks, Cerebras, Mistral
- **Gateway 平台**: Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Mattermost, Email, SMS, BlueBubbles, 钉钉, 飞书, 企微, 微信, Webhooks, HomeAssistant

### screens/ — 页面组件

| 页面 | 文件 | 职责 |
|---|---|---|
| SplashScreen | screens/SplashScreen/SplashScreen.tsx | 启动品牌动画 |
| Welcome | screens/Welcome/Welcome.tsx | 首次使用引导 |
| Install | screens/Install/Install.tsx | 安装流程+进度 |
| Setup | screens/Setup/Setup.tsx | API Key 配置向导 |
| Layout | screens/Layout/Layout.tsx | 主布局(侧边栏+内容区) |
| Chat | screens/Chat/Chat.tsx | 消息输入/流式输出/工具进度/Usage |
| Sessions | screens/Sessions/Sessions.tsx | 会话历史浏览/搜索 |
| Agents | screens/Agents/Agents.tsx | 配置档案管理 |
| Office | screens/Office/Office.tsx | Claw3D WebView |
| Models | screens/Models/Models.tsx | 模型 CRUD |
| Providers | screens/Providers/Providers.tsx | API 密钥/凭证池 |
| Skills | screens/Skills/Skills.tsx | 技能浏览/安装/卸载 |
| Soul | screens/Soul/Soul.tsx | SOUL.md 编辑器 |
| Memory | screens/Memory/Memory.tsx | 记忆条目管理 |
| Tools | screens/Tools/Tools.tsx | 工具集开关 |
| Schedules | screens/Schedules/Schedules.tsx | Cron Job 管理 |
| Gateway | screens/Gateway/Gateway.tsx | 16 个消息平台配置 |
| WebOperator | screens/WebOperator/WebOperatorScreen.tsx | Web Operator 三栏布局(Hermes任务面板/浏览器视口/状态面板) |
| Settings | screens/Settings/Settings.tsx | 主题/语言/连接/更新/备份/诊断 |
| **ProfileRuntime** | **screens/ProfileRuntime/ProfileRuntimeScreen.tsx** | **V1.1+V1.2 Profile Runtime 管理面板（Profile 列表/运行状态/启停控制/配置导入/日志查看/错误提示）** |
| **LogViewer** | **screens/ProfileRuntime/LogViewer.tsx** | **V1.2 新增: Gateway 日志查看面板（实时/历史/级别过滤/自动滚动）** |
| **AIOSWorkspace** | **screens/AIOSWorkspace/AIOSWorkspaceScreen.tsx** | **V1.1 AI-OS 主控工作台（主控对话/多 Profile 状态/委派入口/Web Operator）** |
| **ProfileWorkspace** | **screens/ProfileWorkspace/ProfileWorkspaceScreen.tsx** | **V1.1 specialist 独立工作台（独立 chat/skills/context/audit）** |

### components/ — 共享组件

| 组件 | 文件 | 职责 |
|---|---|---|
| AgentMarkdown | components/AgentMarkdown.tsx | Markdown 渲染(代码高亮) |
| ErrorBoundary | components/ErrorBoundary.tsx | React 错误边界 |
| I18nProvider | components/I18nProvider.tsx | i18n Provider |
| ThemeProvider | components/ThemeProvider.tsx | 主题 Provider(系统/亮/暗) |
| RemoteNotice | components/RemoteNotice.tsx | 远程模式提示横幅 |
| Versions | components/Versions.tsx | 版本信息展示 |
| HermesLogo | components/common/HermesLogo.tsx | Logo 组件 |

---

## 共享模块 (src/shared/)

### profile-runtime/ — V1.1+V1.2 Profile Runtime 契约

| 文件 | 职责 |
|---|---|
| profile-runtime-contract.ts | 全部 TypeScript 类型定义（V1.2: 115+ 接口/类型/枚举），含 ProfileRuntimeAPI + ProfileEntryAPI 接口 + V1.2 新增 RuntimeReconcileResult/GatewayLogEntry/GatewayLogQueryOptions/GatewayLogLevel/RuntimeStatusChangeEvent |
| profile-runtime-errors.ts | 19 个错误码（V1.2 新增 PROFILE_STARTUP_TIMEOUT） + ProfileRuntimeError 类 + createProfileError() 工厂函数 |

### i18n/ — 国际化

| 文件 | 职责 |
|---|---|
| index.ts | i18next 实例初始化，4 语言资源加载，t() 翻译函数 |
| config.ts | SOURCE_LOCALE=en, FALLBACK_LOCALE=en, APP_LOCALES=[en, es, pt-BR, zh-CN] |
| types.ts | AppLocale 类型, TranslationTree |
| locales/en/ | 英文翻译（20 模块） |
| locales/es/ | 西班牙文翻译 |
| locales/pt-BR/ | 葡萄牙文(巴西)翻译 |
| locales/zh-CN/ | 简体中文翻译 |

每种语言的翻译模块: common, navigation, welcome, setup, chat, settings, tools, sessions, models, providers, office, errors, schedules, skills, gateway, agents, soul, memory, install, constants

---

## 测试 (tests/)

| 文件 | 覆盖范围 |
|---|---|
| constants.test.ts | 渲染进程常量 |
| installer-utils.test.ts | 安装工具函数 |
| ipc-handlers.test.ts | IPC Handler 集成 |
| preload-api-surface.test.ts | 预加载 API 完整性 |
| profiles.test.ts | 配置档案管理 |
| session-cache-sync.test.ts | 会话缓存同步 |
| sse-parser.test.ts | SSE 解析器 |
| winget-generator.test.ts | WinGet 清单生成 |
