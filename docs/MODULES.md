# Modules

## 主进程模块 (src/main/)

### index.ts — 主进程入口

- **职责**: 创建 BrowserWindow、注册全部 IPC handler、构建应用菜单、设置自动更新、生命周期管理
- **关键行为**: **V1.9**: 启动顺序 `buildAppMenu() → setupIPC() → createWindow() → 延迟注册 AIOS/Enterprise/ShellView IPC`；菜单由 `shell-menu.ts` 的 `buildAppMenu` 统一构建；`AiOsWebContentsController` 停用，由 `ShellViewManager` 接管；before-quit 时清理 gateway、claw3d 进程和 ShellView
- **导出**: 无（入口文件）

### window/window-ipc.ts — V1.4.1 窗口控制 IPC

- **职责**: 主窗口最小化/最大化/关闭/最大化状态查询（通过 `BrowserWindow.getAllWindows()[0]` 定位主窗口）
- **IPC Channels**: `window:minimize`, `window:maximize-or-restore`, `window:close`, `window:is-maximized`
- **核心方法**: `registerWindowIpc()` — 在 `setupIPC()` 中调用一次，带 `registered` 防重复注册

### shell/main-window-controller.ts — V2.0 主窗口生命周期

- **职责**: 创建主 `BrowserWindow`、加载 Renderer、绑定 `window-ipc`、持久化窗口位置/尺寸（`window-state-store`）
- **V2.0 尺寸**: 默认 **1280×800**、最小 **900×600**（`shared/shell/main-page-constants.ts`）；若已有 `window-state` 则优先用户历史宽高

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
- **IPC Handler**: check-install, verify-install, start-install, start-install-with-source, get-hermes-version, run-hermes-doctor, run-hermes-update, check-openclaw, run-claw-migrate, run-hermes-backup, run-hermes-import, run-hermes-dump, list-mcp-servers, discover-memory-providers, read-logs

### config.ts — 配置管理

- **职责**: 读写 desktop.json（连接模式）、.env 文件、config.yaml、模型配置、凭证池、平台开关
- **关键文件**:
  - `~/.hermes/desktop.json` — 连接模式 (local/remote)
  - `~/.hermes/.env` — 环境变量 (API Keys)
  - `~/.hermes/config.yaml` — Hermes Agent 配置
- **IPC Handler**: get-env, set-env, get-config, set-config, get-hermes-home, get-model-config, set-model-config, is-remote-mode, is-remote-only-mode, get-connection-config, set-connection-config, test-remote-connection, set-ssh-config, test-ssh-connection, is-ssh-tunnel-active, start-ssh-tunnel, stop-ssh-tunnel, get-platform-enabled, set-platform-enabled, get-credential-pool, set-credential-pool

### ssh-remote.ts — SSH 远程连接

- **职责**: SSH 远程主机连接管理
- **IPC Handler**: test-ssh-connection, is-ssh-tunnel-active, start-ssh-tunnel, stop-ssh-tunnel

### ssh-tunnel.ts — SSH 隧道

- **职责**: SSH 隧道创建/销毁，端口转发

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

- **职责**: 注册 19+2 个 profile-runtime:* + 5 个 profile-entry:* IPC handler
- **V1.2 新增**: profile-runtime:getGatewayLogs, profile-runtime:setAutoRestart
- **IPC Channels**: profile-runtime:importConfig, importConfigContent, listProfiles, getProfile, startProfile, stopProfile, restartProfile, startAll, stopAll, status, delegate, listProfileSkills, copySkill, listProfileSessions, shareSessionContext, listSharedContexts, deleteSharedContext, listAuditEvents, getGatewayLogs, setAutoRestart; profile-entry:list, get, open, get-layout, update-layout

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

## AI-OS Runtime 模块 (src/main/aios/)

### aios-config.ts — AI-OS 配置

- **职责**: AI-OS 运行时配置管理（安装路径、端口、API 端点等）

### aios-doctor.ts — AI-OS Doctor

- **职责**: AI-OS 运行时健康诊断

### aios-health.ts — AI-OS 健康检查

- **职责**: AI-OS 服务健康状态检查

### aios-ipc.ts — AI-OS IPC 注册

- **职责**: 注册 AI-OS 相关 IPC handler（14 个通道）
- **IPC Channels**: aios:get-runtime-status, aios:install, aios:start, aios:stop, aios:restart, aios:view:load-home, aios:view:reload, aios:view:set-bounds, aios:get-logs, aios:doctor, aios:reconcile, aios:check-ports, aios:get-runtime-snapshot, aios:view:destroy, aios:view:hide

### aios-paths.ts — AI-OS 路径

- **职责**: AI-OS 安装与数据路径解析

### aios-port-check.ts — AI-OS 端口检查

- **职责**: AI-OS 端口可用性检测与冲突解决

### aios-process.ts — AI-OS 进程管理

- **职责**: AI-OS 子进程 spawn/kill 管理

### aios-reconciler.ts — AI-OS 协调器

- **职责**: App 重启后 AI-OS 运行时状态恢复

### aios-runtime-supervisor.ts — AI-OS 运行时监管

- **职责**: AI-OS 运行时健康监管与自动重启

### aios-webcontents-controller.ts — AI-OS WebContents 控制

- **职责**: AI-OS BrowserView/WebContentsView 生命周期管理
- **V1.9 状态**: **@deprecated** — 由 `ShellViewManager` 统一接管 View 管理，此控制器停用

### shell/shell-view-ipc.ts — V1.9 + V2.1 ShellView IPC 注册

- **职责**: 注册 ShellView IPC handler，桥接 Renderer 与 ShellViewManager
- **IPC Channels**: `shell:view:create|activate|set-bounds|load-url|focus|hide|destroy|get-state|get-all`
- **Lazy create**: `aios-home`、`web-operator` 在 activate/set-bounds 时自动 ensure
- **核心方法**: `registerShellViewIpc(svm)` — 在 createWindow 后调用；`destroyShellViews()` — before-quit 清理

---

## DB 迁移模块 (src/main/migrations/)

### migration-runner.ts — 迁移运行器

- **职责**: 数据库迁移版本管理与有序执行

### legacy-hermes-migration.ts — 旧版迁移

- **职责**: 从旧版 Hermes 安装迁移数据

### 001-install-location.ts — 迁移001

- **职责**: 安装位置路径迁移

### 002-runtime-layout.ts — 迁移002

- **职责**: 运行时目录结构迁移

### 003-web-operator-config.ts — 迁移003

- **职责**: Web Operator 配置格式迁移

---

## 更新模块 (src/main/update/)

### update-lifecycle.ts — 更新生命周期

- **职责**: 应用自动更新流程管理（检查/下载/安装/重启）
- **IPC Handler**: check-for-updates, download-update, install-update, get-app-version

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

### agent-deps-installer.ts — V1.4.1 依赖安装

- **职责**: uv/pip 依赖安装、PyPI 镜像解析、wheelhouse 离线安装
- **核心方法**: installHermesAgentDependencies()
- **策略**: uv --no-config 优先 requirements.txt；有 wheels 则离线；失败回退 pip

### pip-mirror-config.ts — V1.4.1 PyPI 镜像配置

- **职责**: 解析 PyPI 镜像配置优先级（UI → desktop-runtime.json → deployment.json → 环境变量 → 清华默认）
- **核心方法**: resolvePipMirrorConfig()

### desktop-runtime-config.ts — 桌面运行时配置

- **职责**: 读写 desktop-runtime.json（安装目录、agent 源、pipMirror 等）

### command-security-guard.ts — 命令安全守卫

- **职责**: 安装命令安全检查与过滤

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

### python-venv-installer.ts — Python Venv 管理

- **职责**: venv 创建/复用 + 依赖安装（优先 uv，fallback pip；优先 wheelhouse，fallback pipIndexUrl）
- **核心方法**: createOrReuseSharedVenv(config), installPythonDependencies(config, venvPath, agentPath, onProgress)
- **错误码**: E_VENV_CREATE_FAILED, E_VENV_REUSED_BROKEN, E_PIP_INSTALL_FAILED, E_PIP_INDEX_UNREACHABLE

### runtime-bootstrapper.ts — Python 运行时检测

- **职责**: 检测系统 Python 版本，判断使用 bundled 或系统 Python
- **核心方法**: detectAndBootstrapRuntime(config)

### runtime-manifest.ts — 运行时清单

- **职责**: 运行时组件清单管理

### runtime-state-resolver.ts — 运行时状态解析

- **职责**: 解析当前运行时安装与运行状态

### runtime-jobs.ts — 运行时任务

- **职责**: 长时间运行时任务管理

### shim-manager.ts — Shim 管理

- **职责**: 命令行 Shim 脚本创建与管理

### model-config-status.ts — 模型配置状态

- **职责**: 模型配置就绪状态检查

### install-cancel.ts — 安装取消

- **职责**: 安装流程取消信号管理

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

### first-run-wizard.ts — 首次运行向导

- **职责**: 首次运行 Agent 源选择与安装流程
- **IPC Channels**: first-run-wizard:detect-agent, select-source, start-install, cancel-install, select-zip-file, get-state

### enterprise-installer.ts — 企业安装流水线

- **职责**: 20 步有序安装流水线编排 + IPC handler 注册 + 进度推送
- **流水线**: checkEnterpriseInstall → loadDeploymentConfig → acquireInstallLock → runPreflight → resolveRuntimeBundle → installHermesAgentSource → createOrReuseSharedVenv → installPythonDependencies → provisionDefaultHermesHome → bootstrapProfiles → installBundledSkills → applyPolicy → writeInstallMarker → openWorkspaces
- **IPC Channels**: enterprise:get-deployment-config, validate-deployment-config, preflight, install, install-cancel, update, repair, rollback, get-install-marker, get-install-log, open-log-dir, run-doctor, export-doctor-report, get-migration-status, get-installer-precheck, get-runtime-state
- **核心方法**: executeEnterpriseInstallPipeline(mainWindow, input?), setupEnterpriseInstallIPC(mainWindow)

### installer-precheck-reader.ts — V1.4 NSIS 预检结果读取

- **职责**: 从 `resolveInstallLocation().runtimeRoot/installer-precheck.json` 读取 NSIS 安装器预检结果
- **核心方法**: `readInstallerPrecheck(): InstallerPrecheck | null`（文件不存在或格式无效返回 `null`）
- **依赖**: install-location-resolver.ts

### enterprise-ipc.ts — IPC 重导出

- **职责**: 从 enterprise-installer 重导出 setupEnterpriseInstallIPC

### doctor/ — Runtime Doctor 模块 (7 个文件)

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

#### check-windows.ts — Windows 特定检查

- **核心方法**: Windows 平台特定环境与路径检查

### windows/ — Windows 平台模块 (4 个文件)

#### install-location-resolver.ts — 安装位置解析

- **职责**: Windows 安装目录解析（注册表/默认路径）

#### path-resolver.ts — 路径解析

- **职责**: Windows 特定路径解析

#### powershell-runner.ts — PowerShell 运行

- **职责**: PowerShell 命令执行封装

#### process-tree.ts — 进程树

- **职责**: Windows 进程树查询与清理

---

### browser/ — Web Operator 模块

基于 `hermes-desktop` 二开，扩展为 **AI-OS Desktop Web Operator**。V2.2 起浏览器视口统一经 **ShellViewManager**（`ShellBrowserViewAdapter`），`BrowserViewManager` 文件保留为 legacy。

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

#### browser-viewport.ts — BrowserViewPort（V2.2）

- **职责**: 浏览器视口抽象接口；`BrowserController` / `BrowserIPC` 依赖注入

#### shell-browser-view-adapter.ts — ShellBrowserViewAdapter（V2.2）

- **职责**: `BrowserViewPort` → ShellViewManager layer `web-operator`；partition `persist:web-operator`
- **常量**: `WEB_OPERATOR_LAYER_ID`

#### browser-view-manager.ts — BrowserViewManager（legacy）

- **职责**: 旧版独立 WebContentsView 单例（**V2.2 运行时不再使用**）；实现 `BrowserViewPort` 供回滚
- **核心方法**: `createView()`, `navigate()`, `destroyView()`, `updateBounds()`, `getExternalWebContents()`, `isReady()`

#### browser-controller.ts — BrowserController

- **职责**: 所有浏览器操作统一入口；V2.2 注入 `BrowserViewPort`；`openExternalUrl` 成功后 `emit browser.opened`

#### shell-view-event-forwarder.ts — ShellView 事件转发（V2.3）

- **职责**: `viewEventBus` → `mainWindow.webContents.send`（metadata / load-failed / crashed）

#### main-page-state-store.ts — MainPage 持久化（V2.3 / V3.2）

- **职责**: `~/.hermes/desktop/main-page-state.json`；V3.2 读写 **version 2**（`workspaceOrder`、`workspaceSecondaryState`）；V1 经 `main-page-state-migrate.ts` 自动迁移

#### view-registry.ts — ShellView 分区注册（V3.2.1）

- **职责**: `aios-home` / `web-operator` / `external-browser` 默认 partition；文件头三分区策略注释
- **分区**: `AIOS_HOME_PARTITION`、`WEB_OPERATOR_PARTITION`（来自 `browser-partitions.ts`）；external 创建时必须显式 `externalBrowserPartition(id)`

#### token-inject-url.ts — Token 注入 URL 判定（V3.3+）

- **职责**: `shouldInjectTokenForUrl()`；origin 白名单来自 `AuthEndpointConfig`（`buildAllowedOrigins`）
- **范围**: 仅 `TOKEN_INJECT_PARTITIONS` = `[persist:aios-home]`

#### token-header-injector.ts — Session 请求头注入（V3.3+）

- **职责**: `installTokenHeaderInjector()`；对 `persist:aios-home` 分区在 origin 白名单匹配时附加 `Authorization: Bearer`

#### layout-calc-parser.ts — 安全 calc 解析（V2.3）

- **职责**: 有限 `calc()` 求值（仅 +/-、px、%）；供 `ShellViewManager` 与 `overlay-base`
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

- **职责**: 通过 contextBridge 暴露 `window.hermesAPI`、`window.electron`、`window.aiosBrowser`、**`window.profileRuntime`**、**`window.profileEntry`**、**`window.aiosRuntime`**、**`window.shellView`**
- **关键**: 将所有 IPC invoke/on 封装为 Promise/回调 API
- **暴露对象**: hermesAPI (90+ 方法，含 getInstallerPrecheck、V1.4.1 windowControls、firstRunWizard、SSH 隧道、更新生命周期), electron (标准 Electron API), aiosBrowser (13 方法 + 2 事件订阅), **profileRuntime (17 方法 + 1 事件)**, **profileEntry (5 方法)**, **aiosRuntime (11 方法 + 1 事件)**, **shellView (9 方法: create/activate/setBounds/loadUrl/focus/hide/destroy/getState/getAll)**

### browser-api.ts — Web Operator Preload API

- **职责**: 封装 browser.* IPC 为 `window.aiosBrowser` API
- **核心方法**: `open()`, `back()`, `forward()`, `reload()`, `getState()`, `screenshot()`, `click()`, `type()`, `extractTable()`, `getAuditLog()`, `confirmAction()`, `rejectAction()`, `updateBounds()`
- **事件订阅**: `onPendingAction()`, `onAuditUpdate()`, **`onOpened()`（V2.2）**

### aios-api.ts — AI-OS Runtime Preload API

- **职责**: 封装 aios:* IPC 为 `window.aiosRuntime` API
- **方法**: getRuntimeStatus, installAiOs, startAiOs, stopAiOs, restartAiOs, openAiOsHome, reloadAiOsHome, setAiOsViewBounds, getAiOsLogs, runDoctor, reconcile, checkPorts
- **事件订阅**: onAiOsRuntimeChanged

### index.d.ts — 类型声明

- **职责**: HermesAPI（含 **WindowControlsAPI**）+ AiosBrowserAPI + **ProfileRuntimeAPI + ProfileEntryAPI + AiOsRuntimeAPI** 接口完整 TypeScript 类型定义，声明全局 Window 扩展

### profile-runtime-api.ts — V1.1+V1.2 Profile Runtime Preload API

- **职责**: 封装 profile-runtime:* IPC 为 `window.profileRuntime` API
- **方法**: importConfig, listProfiles, getProfile, startProfile, stopProfile, restartProfile, startAllProfiles, stopAllProfiles, getRuntimeStatus, delegate, listProfileSkills, copySkill, listProfileSessions, shareSessionContext, listSharedContexts, deleteSharedContext, listAuditEvents, **V1.2 新增**: getGatewayLogs, onRuntimeStatusChanged, setAutoRestart

### profile-entry-api.ts — V1.1 Profile Entry Preload API

- **职责**: 封装 profile-entry:* IPC 为 `window.profileEntry` API
- **方法**: listProfileEntries, getProfileEntry, openProfileEntry, getProfilePageLayout, updateProfilePageLayout

### shell-view-api.ts — V1.9 + V2.1 ShellView Preload API

- **职责**: 封装 shell:view:* IPC 为 `window.shellView` API
- **核心方法**: `create`, `activate`, `setBounds`, `loadUrl`, `focus`, `hide`, `destroy`, `getState`, `getAll`

---

## 渲染进程 (src/renderer/)

### App.tsx — 根组件

- **职责**: 屏幕路由 (splash → welcome → installing → setup → main)
- **状态管理**: 安装状态检查、远程模式检测
- **V1.4.1**: Win/Linux 在非 `main` 屏显示 `layout-titlebar` + `WindowControls`
- **V2.0**: `screen === "main"` 时由 `MainTopBar` 承担拖拽；macOS 仅在非 `main` 屏渲染全局 `drag-region`；根 `.app` 使用 `100dvh`

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
| Install | screens/Install/Install.tsx | 安装流程+进度（含 AgentSourceSelect） |
| Setup | screens/Setup/Setup.tsx | API Key 配置向导 |
| Layout | screens/Layout/Layout.tsx | **V2.2** 编排：`useExternalBrowserTabs`、`tabOrder`、`aiosBrowser.onOpened`、Tab reload/close |
| **MainPage** | **screens/MainPage/MainPage.tsx** | **V2.0** 一级桌面壳：TopBar + Sidebar 槽 + Outlet + StatusBar + Modal/Drawer |
| **MainTopBar** | **screens/MainPage/MainTopBar.tsx** | **V2.2** 顶栏：Sidebar、Tabs、**「+」新 external tab**、Reload/Close、`WindowControls` |
| **main-page-tabs.ts** | **screens/MainPage/main-page-tabs.ts** | **V2.1+** `buildMainWorkspaceTabs` / `isWorkspaceTabView`（含 external） |
| **tab-order.ts** | **screens/MainPage/tab-order.ts** | **V3.2.1** `sortTabsByOrder` / `isDraggableTabId`；`FIXED_TAB_IDS` 由 registry `!draggable` 导出 |
| **useExternalBrowserTabs.ts** | **screens/MainPage/useExternalBrowserTabs.ts** | **V3.2.1** external tab CRUD；`shellView.create` 传 `partition: externalBrowserPartition(id)` |
| **MainViewTabs** | **screens/MainPage/MainViewTabs.tsx** | **V3.2.1** 固定 Tab = `resolveWorkspaceModule` 且 `!draggable`；可拖仅 `external-browser:*`（`@dnd-kit`） |
| **MainProfileSwitch** | **screens/MainPage/MainProfileSwitch.tsx** | **V2.0** 当前 Profile + `ProfileSwitcherDropdown` |
| **MainRuntimeIndicator** | **screens/MainPage/MainRuntimeIndicator.tsx** | **V2.0** 当前 Profile Gateway 状态（轮询 `profileRuntime.getRuntimeStatus()`） |
| **RuntimeSetup** | **screens/RuntimeSetup/RuntimeSetupScreen.tsx** | **运行时诊断 + V1.4 NSIS Installer Precheck 卡片** |
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
| WebOperator | screens/WebOperator/WebOperatorScreen.tsx | **V2.1** 三栏布局；`WebContentsHost` + `shellView.create`；mount 时 ensure layer |
| **web-operator-constants.ts** | **screens/WebOperator/web-operator-constants.ts** | **V2.1** `WEB_OPERATOR_LAYER_ID` |
| **BrowserToolbar** | **screens/WebOperator/BrowserToolbar.tsx** | **V2.1+** 单行地址栏；`aiosBrowser.open`（V2.2 经 adapter 单轨） |
| **use-browser-actions.ts** | **screens/WebOperator/hooks/use-browser-actions.ts** | **V2.2** 薄封装 `window.aiosBrowser.*` |
| **web-operator.css** | **screens/WebOperator/web-operator.css** | **V2.1** 布局 + `browser-toolbar*` 单行 chrome |
| Settings | screens/Settings/Settings.tsx | 主题/语言/连接/更新/备份/诊断 |
| **ProfileRuntime** | **screens/ProfileRuntime/ProfileRuntimeScreen.tsx** | **V1.1+V1.2 Profile Runtime 管理面板（Profile 列表/运行状态/启停控制/配置导入/日志查看/错误提示）** |
| **LogViewer** | **screens/ProfileRuntime/LogViewer.tsx** | **V1.2 新增: Gateway 日志查看面板（实时/历史/级别过滤/自动滚动）** |
| **AIOSHome** | **screens/AIOSHome/AIOSHomeScreen.tsx** | **AI-OS 首页（`WebContentsHost` layer `aios-home`、运行状态条）** |
| **Workspaces** | **screens/Workspaces/WorkspacesScreen.tsx** | **V3.2→V5.0** 工作台壳；`WorkspacesShell` 三区域布局（ProfileSwitcher + Sidebar 8 项导航 + 主内容） |
| **WorkspacesShell** | **screens/Workspaces/panels/WorkspacesShell.tsx** | Sidebar 导航 + React.lazy 按需加载子页面（chat/sessions/skills/tools/memory/providers/models/settings） |
| **WorkspacesSidebar** | **screens/Workspaces/components/WorkspacesSidebar.tsx** | 8 项导航（232px，lucide-react 图标，active 高亮） |
| **ChatPanel** | **screens/Workspaces/panels/ChatPanel.tsx** | **V3.2** 侧栏内嵌聊天（`hermesAPI.sendMessage` + 流式） |
| **pages/\*** | **screens/Workspaces/pages/\*/** | 从 hermes-desktop 克隆的子页面（Chat/Sessions/Skills/Tools/Memory/Providers/Models/Settings） |
| **SettingsDrawer** | **screens/SettingsDrawer/SettingsDrawer.tsx** | **V3.2** 统一设置抽屉（Account / Runtime / Profiles / Config sync） |
| **HermesRuntimePanel** | **screens/SettingsDrawer/HermesRuntimePanel.tsx** | **V3.2** Runtime 运维唯一 UI（Gateway / Profile Runtime） |
| **ProfileWorkspace** | **screens/ProfileWorkspace/ProfileWorkspaceScreen.tsx** | **V1.1 specialist 独立工作台（独立 chat/skills/context/audit）** |

### renderer/workspace/ — V3.2 Workspace 路由（V3.2.1 加固）

| 模块 | 文件 | 职责 |
|---|---|---|
| workspace-registry | `workspace/workspace-registry.ts` | 4 静态 Workspace 元数据（`kind` / `draggable` / `shellLayerId`）；`web-operator`/`office` **不可拖** |
| workspace-tabs | `workspace/workspace-tabs.ts` | `buildWorkspaceTabs`；`isWorkspaceTabView` 复用 `isStaticWorkspaceId` |
| resolve-workspace | `workspace/resolve-workspace.ts` | View → Shell layerId |
| WorkspaceRenderer | `components/workspace/WorkspaceRenderer.tsx` | **V3.2.1** `switch (module.kind)`；external → `WebViewWorkspace` |

### shared/workspace/ — V3.2 契约

| 模块 | 文件 | 职责 |
|---|---|---|
| workspace-contract | `shared/workspace/workspace-contract.ts` | `WorkspaceModule`、`WorkspaceSecondaryPanel` 类型 |
| workspace-secondary-nav | `shared/workspace/workspace-secondary-nav.ts` | 各 Workspace 二级 panel 列表与 i18n key（`navigation.*`） |

### shared/shell/ — V3.2.1 分区

| 模块 | 文件 | 职责 |
|---|---|---|
| browser-partitions | `shared/shell/browser-partitions.ts` | `AIOS_HOME_PARTITION`、`WEB_OPERATOR_PARTITION`、`externalBrowserPartition()` |

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
| AiOsWebAppHost | components/aios/AiOsWebAppHost.tsx | **@deprecated V1.9** AI-OS Web 应用宿主，由 WebContentsHost 替换 |
| WebContentsHost | components/shell/WebContentsHost.tsx | **V1.9** 通用 View 承载组件（activate+ResizeObserver+setBounds+卸载hide+错误降级） |
| PipMirrorFields | components/install/PipMirrorFields.tsx | V1.4.1 PyPI 镜像选择字段 |
| InstallWizard | components/install-wizard/install-wizard.tsx | 安装向导组件 |
| RuntimeGuard | components/runtime/RuntimeGuard.tsx | **V3.2.1** AI-OS Home 未就绪时：启动 Gateway +「打开设置」（`openSettingsDrawer("runtime")`） |
| ProfileSwitcherDropdown | components/dropdowns/ProfileSwitcherDropdown.tsx | Profile 切换；**V3.2.1** `manageSettings` / `createProfile` i18n |
| RuntimeStatusBar | components/runtime/RuntimeStatusBar.tsx | 运行时状态栏 |

### components/layout/ — V2.0 Desktop Shell（二级导航与 Outlet）

| 组件 | 文件 | 职责 |
|---|---|---|
| DesktopSidebar | components/layout/DesktopSidebar.tsx | **V2.1** 二级导航；`mode: expanded \| rail \| hidden`（rail 仅 icon） |
| WorkspaceOutlet | components/layout/WorkspaceOutlet.tsx | **V3.2** 委托 `WorkspaceRenderer`（按 `view` + `secondaryPanel` 渲染 Workspace） |
| WindowControls | components/layout/WindowControls.tsx | Win/Linux 窗口按钮；**V2.0** 主界面挂于 `MainTopBar`；调用 `hermesAPI.windowControls`；macOS 返回 null |
| StatusBar | components/layout/StatusBar.tsx | 底栏 24px：profile、连接模式、更新状态 |
| ModalLayer | components/layout/ModalLayer.tsx | 全局 Modal 挂载点（占位） |
| DrawerLayer | components/layout/DrawerLayer.tsx | 全局 Drawer 挂载点（占位） |
| DesktopShell | components/layout/DesktopShell.tsx | **@legacy V1.4** 旧壳：sidebar + header + outlet；主链路已由 `MainPage` 替代，文件保留 |
| PageHeader | components/layout/PageHeader.tsx | **@legacy V1.4** 全局页头（标题 + profile）；已从 `Layout` 移除，可供单页局部复用 |

**V2.0 主界面组合关系**（PRD `prd/v2.0_mainpage.md`）：

```
Layout → MainPage → MainTopBar + DesktopSidebar + WorkspaceOutlet + StatusBar
```

### hooks/ — V1.4 从 Layout 抽离（V2.0 仍由 Layout 调用）

| Hook | 文件 | 职责 |
|---|---|---|
| useDesktopNavigation | hooks/useDesktopNavigation.ts | view 状态、菜单事件、会话恢复、office lazy 标记 |
| useUpdateState | hooks/useUpdateState.ts | 自动更新事件与下载进度 |
| useRemoteMode | hooks/useRemoteMode.ts | 远程模式检测（随 view 刷新） |
| useProfileEntries | hooks/useProfileEntries.ts | profileEntry 列表加载 |

### types/ — V1.4 桌面壳类型

| 文件 | 职责 |
|---|---|
| types/desktop-shell.ts | `View`、`NavItem`、`UpdateState`、`resolveViewTitleKey()` |

---

## 构建与安装器 (build/)

| 文件 | 职责 |
|---|---|
| installer.nsh | NSIS 自定义宏：preInit / **customInit (VC++)** / customInstall / customUnInstall |
| afterPack.js | 打包后处理脚本 |
| nsis/Include/AddToPathSafe.nsh | 用户 PATH 安全增删 |
| nsis/Include/VCRuntimeCheck.nsh | **V1.4** VC++ 2015–2022 x64 检测与可选安装 |
| nsis/Include/RuntimePrecheck.nsh | **V1.4** Git/Python/uv/8642 检测，写出 installer-precheck.json |
| winget/ | WinGet 清单模板（Installer/Locale/Version） |

安装产物路径示例：`$INSTDIR/runtime/installer-precheck.json`、`$INSTDIR/runtime/logs/nsis-install.log`

---

## 共享模块 (src/shared/)

### profile-runtime/ — V1.1+V1.2 Profile Runtime 契约

| 文件 | 职责 |
|---|---|
| profile-runtime-contract.ts | 全部 TypeScript 类型定义（V1.2: 115+ 接口/类型/枚举），含 ProfileRuntimeAPI + ProfileEntryAPI 接口 + V1.2 新增 RuntimeReconcileResult/GatewayLogEntry/GatewayLogQueryOptions/GatewayLogLevel/RuntimeStatusChangeEvent |
| profile-runtime-errors.ts | 19 个错误码（V1.2 新增 PROFILE_STARTUP_TIMEOUT） + ProfileRuntimeError 类 + createProfileError() 工厂函数 |

### enterprise/ — V1.2.1+V1.4+V1.4.1 Enterprise 契约

| 文件 | 职责 |
|---|---|
| enterprise-contract.ts | API 契约；**V1.4 新增** `InstallerPrecheck` 及预检状态类型 |
| enterprise-schema.ts | 数据结构类型 |
| enterprise-constants.ts | 枚举/错误码/常量 |
| pip-mirror-presets.ts | **V1.4.1** PyPI 镜像预设（清华/阿里/腾讯/官方/自定义） |
| migration-contract.ts | 迁移契约类型 |
| runtime-state-contract.ts | 运行时状态契约类型 |

### aios/ — AI-OS 契约

| 文件 | 职责 |
|---|---|
| aios-contract.ts | AI-OS 运行时 API 契约与类型定义 |

### browser/ — Web Operator 契约

| 文件 | 职责 |
|---|---|
| browser-contract.ts | Web Operator API 契约与类型定义 |
| browser-errors.ts | Web Operator 错误码 |
| browser-tool-schema.ts | Web Operator 工具 Schema 定义 |

### shell/ — Shell View 与主界面布局契约

| 文件 | 职责 |
|---|---|
| **main-page-constants.ts** | **V2.0** 主界面布局常量（顶栏 40、底栏 24、侧栏 232、默认窗口 1280×800、最小 900×600） |
| view-contract.ts | ShellView 核心类型（Kind/Layer/State/Bounds/Layout/Options/RegistryEntry） |
| **shell-view-contract.ts** | **V1.9** ShellView IPC 契约（ShellViewChannels 常量 + 请求/响应类型） |
| overlay-contract.ts | Overlay 契约（Modal/Dropdown/InternalView） |

### i18n/ — 国际化

| 文件 | 职责 |
|---|---|
| index.ts | i18next 实例初始化，en/zh-CN 资源加载，t() 翻译函数 |
| config.ts | SOURCE_LOCALE=en, FALLBACK_LOCALE=en, APP_LOCALES=[en, zh-CN] |
| types.ts | AppLocale 类型, TranslationTree |
| locales/en/ | 英文翻译（源语言） |
| locales/zh-CN/ | 简体中文翻译 |

每种语言的翻译模块: common, navigation, welcome, setup, chat, settings, tools, sessions, models, providers, office, errors, schedules, skills, gateway, agents, soul, memory, install, constants, **aiosHome**

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
| enterprise-install-cancel.test.ts | 企业安装取消 |
| install-location-resolver.test.ts | 安装位置解析 |
| install-paths.test.ts | 安装路径 |
| migration-runner.test.ts | 迁移运行器 |
| runtime-state-resolver.test.ts | 运行时状态解析 |
| runtime-v1.2-phase1.test.ts | V1.2 Phase1 |
| ssh-remote.test.ts | SSH 远程连接 |
| update-lifecycle.test.ts | 更新生命周期 |
