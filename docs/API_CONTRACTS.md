# API Contracts (copilot-desktop)

IPC channels exposed to the Renderer via Preload. This document is incrementally maintained; full `index.ts` inventory is not duplicated here.

## AIOS Workspace (read-only file tree)

Registered in `src/main/aios-workspace-ipc.ts`, exposed as `window.aiosWorkspace`.

| Channel | Direction | Args | Returns | Notes |
|---------|-----------|------|---------|-------|
| `aios-workspace:list-files` | invoke | `profileId: string`, `relativePath?: string` (default `"."`) | `WorkspaceFileEntryDto[]` | Lists non-dot entries under profile home. Paths resolved with `root + sep` sandbox (see below). |
| `aios-workspace:read-file` | invoke | `profileId: string`, `relativePath: string` | `{ ok: true, content, encoding }` or `{ ok: false, error }` | Preview whitelist extensions; max size 256KB (text) / 512KB (images). Errors: `FILE_NOT_FOUND`, `NOT_A_FILE`, `UNSUPPORTED_TYPE`, `FILE_TOO_LARGE`. |
| `aios-workspace:git-status` | invoke | `profileId: string` | `{ branch: string \| null, dirtyCount: number }` | Runs `git` in profile home; no `.git` → `{ branch: null, dirtyCount: 0 }`; 3s timeout. **team_v1.5.3** |

**Path sandbox:** `profileId` resolves to DB profile `name` (e.g. `writer-9601`) → `profileHome(name)`. Target path must equal root or start with `root + path.sep` after `resolve()` (prevents `writer-evil` prefix bypass on Windows).

## Profile Runtime (AIOSWorkspace consumers)

Registered in `src/main/profile-runtime-ipc.ts`, exposed as `window.profileRuntime` (`profile-runtime-api.ts`).

| Channel | Direction | Args | Returns | Notes |
|---------|-----------|------|---------|-------|
| `profile-runtime:status` | invoke | — | `ProfileGatewayState[]` | All runtime instances. |
| `profile-runtime:probeHealth` | invoke | `profileId: string` | `{ healthy: boolean }` | Read-only `GET http://{host}:{port}/health`. Only probes when DB status is `running`; does not mutate status. **team_v1.5.2** |
| `profile-runtime:listProfileSessions` | invoke | `profileId: string` | `ProfileSessionSummary[]` | Reads `{profile_home}/state.db` sessions table; home resolved via profile **name**, not UUID. **Fixed v1.5.2** |
| `profile-runtime:deleteProfileSession` | invoke | `profileId: string`, `sessionId: string` | `{ ok: boolean }` | `DELETE FROM sessions WHERE id = ?` on profile state.db; no-op if db missing. **team_v1.5.2** |
| `profile-runtime:startProfile` | invoke | `profileId: string` | `ProfileGatewayState` | |
| `profile-runtime:stopProfile` | invoke | `profileId: string` | `ProfileGatewayState` | |
| `profile-runtime:restartProfile` | invoke | `profileId: string` | `ProfileGatewayState` | |
| `profile-runtime:getGatewayLogs` | invoke | `profileId`, `options?` | `GatewayLogEntry[]` | |
| `profile-runtime:listProfileSkills` | invoke | `profileId: string` | skill summaries | |
| `profile-runtime:listAuditEvents` | invoke | `filter?` | audit rows | |

**Events (Main → Renderer):** `profile-runtime:onStatusChanged` → `RuntimeStatusChangeEvent`.

## Hermes chat (AIOSWorkspace via `aiosWorkspaceApi`)

Global channels on `window.hermesAPI` (not profile-scoped in payload):

| Event | Payload | Notes |
|-------|---------|-------|
| `chat-chunk` | `string` | Stream token |
| `chat-done` | `sessionId?: string` | Persisted session id after first message |
| `chat-error` | `string` | |
| `chat-tool-progress` | `string` | Tool name |

Renderer guards by `streamingOwnerRef` + `abortChat` on profile switch (**team_v1.5.1**).

**Approval UI (team_v1.5.3):** No new chat IPC. Renderer sets `waiting_approval` when `chat-tool-progress` payload matches heuristics (`approval`, `confirm`, `human`, etc. in `approvalUtils.ts`). Approve clears local state only; Reject calls `abortChat`. Gateway resume is out of scope for P2.

## Workspace Chat (team_v1.8)

Workspaces Chat 面板经 `window.workspaceChat` 代理到 `copilot-serve`（`:8765`），不再经 `hermesAPI` 直连 Gateway。Main 注册于 `src/main/workspace-chat/workspace-chat-ipc.ts`，Preload：`src/preload/workspace-chat-api.ts`，契约：`src/shared/workspace-chat/workspace-chat-contract.ts`。

| Channel | Direction | Args | Returns | Notes |
|---------|-----------|------|---------|-------|
| `workspace-chat:resolve-profile` | invoke | `profileRef: string` | `ResolvedProfile` | ref 支持 id / name / `default` |
| `workspace-chat:list-models` | invoke | `profileId: string` | `ChatModelListResponse` | Gateway 模型列表 |
| `workspace-chat:get-model-config` | invoke | `profileId: string` | `ProfileChatModelConfig \| null` | 持久化默认模型 |
| `workspace-chat:set-model-config` | invoke | `profileId`, `SetProfileChatModelConfigPayload` | `ProfileChatModelConfig` | |
| `workspace-chat:upload-attachments` | invoke | `UploadWorkspaceAttachmentsPayload` | `UploadWorkspaceAttachmentsResponse` | Main 弹窗选文件后 multipart 上传 serve |
| `workspace-chat:remove-attachment` | invoke | `workspaceId`, `attachmentId` | `{ ok: true }` | |
| `workspace-chat:send-message` | invoke | `WorkspaceChatSendPayload` | `{ stream_id: string }` | 立即返回；SSE 在 Main 后台消费 |
| `workspace-chat:abort` | invoke | `profileId: string` 或 `{ profile_id, session_id? }` | `{ ok: true }` | 中止 stream；带 `session_id` 仅中止该会话桶 |

**Events (Main → Renderer):** 载荷均含 `stream_id`、`profile_id`、`workspace_id`、`session_id`（scope 校验）。

| Event | Payload | Notes |
|-------|---------|-------|
| `workspace-chat:chunk` | `WorkspaceChatChunkEvent` | 流式文本 |
| `workspace-chat:tool-progress` | `WorkspaceChatToolProgressEvent` | 工具进度 |
| `workspace-chat:usage` | `WorkspaceChatUsageEvent` | token 用量 |
| `workspace-chat:done` | `WorkspaceChatDoneEvent` | 流结束；可含 `resolved_session_id`（Gateway `x-hermes-session-id`） |
| `workspace-chat:error` | `WorkspaceChatErrorEvent` | 结构化错误 |
| `workspace-chat:status` | `WorkspaceChatStatusEvent` | 预留状态（可选） |

Renderer UI：`panels/ChatPanel.tsx` → `pages/Chat/HermesWebChatSurface.tsx`；编排 hook：`hooks/useHermesWebChat.ts`。

**team_v1.8.1 hotfix：** 会话历史改走 copilot-serve `GET /api/v1/profiles/{id}/sessions/{session_id}/messages`（Renderer `copilotServeFetch`）；`chat.done` 回写 `resolved_session_id`；Main stream 按 `profile_id:session_id` 分桶 abort。

**team_v1.8.3 hotfix：** 聊天门控以 `resolveProfile` 为准；Profile runtime 启停/状态变更后 Renderer 必须 re-resolve（`useHermesWebChat` 监听 `runtime.status` 等）。勿用 legacy `hermesAPI.gatewayStatus` 覆盖 copilot-serve 的 stopped/starting 状态。

**Serve 会话消息（Renderer 直连 serve，不经 IPC）：**

```http
GET /api/v1/profiles/{profile_id}/sessions/{session_id}/messages
```

## Hermes Default Chat (v5.6.2)

Local Hermes（固定 `default` profile）WebChat Surface 使用 `window.hermesDefaultChat`（Main 新 IPC），不依赖 `workspaceChat` / copilot-serve。

Main：`src/main/hermes-default-chat/hermes-default-chat-ipc.ts`  
Preload：`src/preload/hermes-default-chat-api.ts`  
契约：`src/shared/hermes-default-chat/hermes-default-chat-contract.ts`

| Channel | Direction | Args | Returns | Notes |
|---------|-----------|------|---------|-------|
| `hermes-chat:list-models` | invoke | `profile?: string` | `HermesChatModelListResponse` | 来自 `models.json` + 当前 `config.yaml` 标记 `is_current` |
| `hermes-chat:get-model-config` | invoke | `profile?: string` | `HermesChatModelConfig \| null` | 当前默认模型（`config.yaml`） |
| `hermes-chat:set-model-config` | invoke | `profile?: string`, `SetHermesChatModelConfigPayload` | `HermesChatModelConfig` | **显式「保存为默认」**时写入 `config.yaml`；仅配置变化时 Gateway restart |
| `hermes-chat:upload-attachments` | invoke | `UploadHermesAttachmentsPayload` | `UploadHermesAttachmentsResponse` | Main 弹窗选文件并落盘到 `profileHome(profile)/desktop/chat-attachments/<sessionId>/` |
| `hermes-chat:upload-attachment-buffers` | invoke | `UploadHermesAttachmentBuffersPayload` | `UploadHermesAttachmentsResponse` | 拖拽场景（无路径）用 buffer 落盘 |
| `hermes-chat:remove-attachment` | invoke | `workspaceId: string`, `attachmentId: string`, `profile?: string` | `{ ok: true }` | `workspaceId` 仅为形状兼容，占位 |
| `hermes-chat:send-message` | invoke | `HermesChatSendPayload` | `{ response: string; sessionId?: string }` | `model_id` = `models.json` UUID；**发送前**同步到 `config.yaml` 的 `model:` 段（与条目不一致时 **restart Gateway**）；HTTP 体 `model` 为 API 注册名（`hermes-agent`），真实 LLM 由 Gateway 读 config；Main 打 `[Hermes Chat] 发送前模型路由` 日志；SSE 复用 `chat-*` |

**Events (Main → Renderer)：**（与 `hermesAPI` legacy chat 复用，不带 scope）

| Event | Payload | Notes |
|-------|---------|-------|
| `chat-chunk` | `string` | Stream token |
| `chat-done` | `sessionId?: string` | Gateway 首次持久化后的 session id |
| `chat-error` | `string` | |
| `chat-tool-progress` | `string` | Tool name |
| `chat-usage` | `HermesChatUsageEvent` | tokens / cost |

## Hermes memory (AIOSWorkspace)

| Channel | Direction | Args | Returns | Notes |
|---------|-----------|------|---------|-------|
| `write-memory-content` | invoke | `content: string`, `profile?: string` | `{ ok: boolean, error?: string }` | Overwrites `MEMORY.md` for profile (not append entry). Char limit enforced in Main. May emit `memory_save` audit. **team_v1.5.3** |

`MEMORY.md` saves from Renderer use `hermesAPI.writeMemoryContent`; `USER.md` / `SOUL.md` still use existing profile write paths.

---

## ShellView / MainPage workspace ids (Portal rename)

Renderer、Main、持久化状态统一使用下列标识（**不是** IPC channel 名）：

| 概念 | 当前值 | 说明 |
|------|--------|------|
| 静态 workspace / `View` | `portal` | 顶栏 Tab、默认首页；原 `aios-home` 已由 `main-page-state-migrate` 映射 |
| ShellView `layerId` / `ShellViewKind` | `portal` | `WebContentsHost`、`shellView.*`、`portal-view-coordinator` |
| Electron session 分区 | `persist:aios-home` | **未改名**（保留 NextAuth cookies）；TS 常量 `PORTAL_PARTITION` |
| 登录配置 URL 字段 | `aiosHomeUrl` | Auth / Endpoint 契约不变 |

Preload：`window.shellView` 的 `layerId` 传 `"portal"`。Main 懒创建见 `shell-view-ipc.ts` → `ensurePortalView()` → `refreshPortalView()`。

---

## AIOS Portal Runtime

Registered in `src/main/aios/aios-ipc.ts` (`registerAiosIpc`), exposed as `window.aiosRuntime` (`src/preload/aios-api.ts`). Types: `src/shared/aios/aios-contract.ts`.

| Channel | Direction | Args | Returns | Notes |
|---------|-----------|------|---------|-------|
| `aios:get-runtime-status` | invoke | — | runtime status rows | |
| `aios:get-runtime-snapshot` | invoke | — | `AiOsRuntimeSnapshot` | backend + frontend services |
| `aios:start` | invoke | — | void | Spawns Portal backend/frontend; requires installed monorepo |
| `aios:stop` | invoke | — | void | |
| `aios:restart` | invoke | — | void | |
| `aios:get-logs` | invoke | `serviceId`, `options?` | `AiOsLogEntry[]` | |
| `aios:doctor` | invoke | — | `AiOsDoctorReport` | |
| `aios:reconcile` | invoke | — | reconcile result | |
| `aios:check-ports` | invoke | — | `PortCheckResult[]` | |
| `aios:get-home-url` | invoke | — | `{ url: string }` | Embedded Portal Home URL |
| `aios:get-portal-info` | invoke | — | `AiOsPortalInfo` | **V5.3.4** — installed flag + effective/config/env roots |
| `aios:install` | invoke | options | — | **Preload 声明；Main 未注册**（后续单独实现） |

**`AiOsPortalInfo`（V5.3.4）：**

```typescript
interface AiOsPortalInfo {
  installed: boolean;
  portalRoot: string | null;       // effective monorepo root
  portalRuntimeRoot: string;
  envPortalRoot: string | null;    // process.env.COPILOT_PORTAL_ROOT
  configPortalRoot: string | null; // desktop-runtime.json portalSourceRoot
}
```

**Events (Main → Renderer):** `aios:runtime-changed` → `RuntimeStatusChangeEvent`（`onAiOsRuntimeChanged`）。

**Portal monorepo 根解析（Main，非 IPC）：** `src/main/runtime/portal-root-resolver.ts` — `resolveEffectivePortalMonorepoRoot()` 优先级：`COPILOT_PORTAL_ROOT` → `desktop-runtime.json` → filesystem（`runtime/portal/src`、legacy `ai-os-full`）。`buildCopilotRuntimeEnv()` 保留已有 env。

---

## Web Operator / aiosBrowser（V5.7 WebContentsView 核心）

Preload：`window.aiosBrowser`（`src/preload/browser-api.ts`）。Main：`src/main/browser/*`，IPC 注册于 `browser-ipc.ts`。

### Legacy channels（点号，保留）

| Channel | Returns | Notes |
|---------|---------|-------|
| `browser.open` | `BrowserOpenResult` | |
| `browser.back` / `browser.forward` / `browser.reload` | `BrowserActionResult` | |
| `browser.get_state` | `BrowserStateResult` | 扁平 inputs/buttons/links |
| `browser.screenshot` | `BrowserScreenshotResult` | base64 PNG |
| `browser.click` / `browser.type` | `BrowserActionResult` | main frame selector only |
| `browser.get_audit_log` | `BrowserAuditRecord[]` | 安全审计 |

### V5.7 channels（冒号，Frame / Snapshot / 结构化动作）

| Channel | Args | Returns |
|---------|------|---------|
| `browser:get-state` | — | `BrowserRuntimeState` |
| `browser:list-frames` | — | `BrowserFrameSnapshot[]` |
| `browser:snapshot` | `BrowserSnapshotOptions?` | `BrowserPageSnapshot` |
| `browser:find-element` | `BrowserElementTarget` | `BrowserElementSnapshot \| null` |
| `browser:click-element` | `BrowserElementTarget` | `BrowserStructuredActionResult` |
| `browser:type-element` | `{ target, text, options? }` | `BrowserStructuredActionResult` |
| `browser:select-option` | `{ target, value }` | `BrowserStructuredActionResult` |
| `browser:scroll` | `BrowserScrollOptions` | `BrowserStructuredActionResult` |
| `browser:screenshot-v2` | `BrowserScreenshotOptions?` | `BrowserStructuredScreenshotResult \| null` |
| `browser:action-logs` | `limit?` | `BrowserActionLogEntry[]` |
| `browser:clear-action-logs` | — | `{ ok: boolean }` |

**Events (Main → Renderer):**

| Event | Payload |
|-------|---------|
| `browser:state-changed` | `BrowserRuntimeState` |
| `browser:action-logged` | `BrowserActionLogEntry` |

**Shared DTO：** `src/shared/browser/browser-frame-contract.ts`、`browser-snapshot-contract.ts`、`browser-action-contract.ts`。

**Main 模块：** `browser-frame-inspector.ts`、`browser-dom-snapshot.ts`、`browser-element-locator.ts`、`browser-coordinate-resolver.ts`、`browser-action-log-store.ts`、`browser-v57-core.ts`（由 `BrowserController.v57` 委托）。

**Renderer：** `WebOperatorScreen` 右栏 — `BrowserStatePanel`、`PageStructurePanel`（`FrameTreePanel` + `ElementListPanel`）、`ScreenshotPanel`、`BrowserActionLog`（结构化 + 审计双 tab）。

**验收页：** `resources/test-pages/v57/`。

---

## Windows 安装注册表（非 IPC）

业务安装信息由 NSIS [`build/installer.nsh`](../build/installer.nsh) 写入，由 Main [`install-location-resolver.ts`](../src/main/enterprise/windows/install-location-resolver.ts) 读取。与 electron-builder 卸载项（`appId` / `nsis.guid`）分离。

| 键 | 用途 |
|---|---|
| `HKCU\Software\SMC\copilot`（primary） | 安装后写入 `InstallLocation`、`RuntimeRoot`、`BinDir`、`AppVersion`、`PreviousVersion` 等 |
| `HKLM\Software\SMC\copilot` | primary 的 HKLM 回退读取 |
| `HKCU\Software\SMC\Copilot` | legacy，仅兼容读取 / 卸载清理 |
| `HKCU\Software\SMC\CopilotSMC` | legacy |
| `HKCU\Software\SMC\HermesDesktop` | legacy |
| `HKCU\...\Uninstall\com.nousresearch.hermes` | legacy 卸载项 `InstallLocation` |

**解析顺序（`readRegistryInstallInfo`）**：primary HKCU → primary HKLM → legacy 键（存在且目录存在则采用）。`resolveInstallLocation().source` 为 `registry` 仅当命中 primary 键。

**默认路径（无注册表）**：`%LOCALAPPDATA%\Programs\SMC-Copilot`（dev-default 与 NSIS 首次安装一致）。

**V5.4.1**：`desktop-runtime.json` 身份字段由 migration schema **5**（`migrateV541InstallIdentity`）在应用启动时刷新，NSIS 升级不 patch 已有 JSON。

---

## Local Hermes config sync（V5.6.1）

**非新 IPC**：`setModelConfig` / `startGateway` / `sendMessage` 路径内调用 `syncGatewayModelSection(profile)`（`src/main/config.ts`），将扁平 `config.yaml` 顶层 `default`/`provider`/`base_url` 写入 Gateway 可读的 `model:` 段。若 sync 返回 `true` 且 Gateway 已在运行，则 `restartGateway(profile)`。

| Channel | Notes |
|---------|-------|
| `get-credential-pool` | 读 `~/.hermes/auth.json` → `credential_pool` |
| `set-credential-pool` | `(provider, entries[])` 写回同上 |

Preload：`window.hermesAPI.getCredentialPool` / `setCredentialPool`。Local Hermes Providers 页使用。

---

## Local Hermes Models UI（V5.6.3）

**无新 IPC**。Models 库 CRUD 复用既有 Preload `window.hermesAPI`：

| Preload 方法 | Main | 存储 |
|--------------|------|------|
| `listModels()` | `models.ts` | `~/.hermes/models.json` |
| `addModel(name, provider, model, baseUrl)` | 同上 | 同上 |
| `updateModel(id, fields)` | 同上 | 同上 |
| `removeModel(id)` | 同上 | 同上 |

Renderer：`screens/Hermes/pages/Models/HermesDefaultModelsSurface.tsx` 经 `hermesDefaultApi.models.*` 调用；custom provider 的 API key 经 `hermesDefaultApi.providers.setEnv`（profile `default`）。活跃 Gateway 模型由 Chat `hermesDefaultChat.setModelConfig` / `setModelConfig` 设置，Models 页不提供「Set active」。

---

See `copilot-desktop/AGENTS.md` §「新增 IPC」for the checklist when adding channels.
