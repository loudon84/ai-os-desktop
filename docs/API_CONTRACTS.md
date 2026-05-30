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

## Hermes Default Chat (v5.6.4)

Local Hermes（固定 `default` profile）WebChat Surface 使用 `window.hermesDefaultChat`（Main 新 IPC），不依赖 `workspaceChat` / copilot-serve。

Main：`src/main/hermes-default-chat/hermes-default-chat-ipc.ts`  
Preload：`src/preload/hermes-default-chat-api.ts`  
契约：`src/shared/hermes-default-chat/hermes-default-chat-contract.ts`  
配置 YAML：`src/main/hermes-config/hermes-config-yaml.ts`  
Env / Key：`src/main/config.ts` `readEnv()` + `src/main/hermes-model-env.ts`  
架构约束：[`docs/ARCHITECTURE.md`](ARCHITECTURE.md) § **V5.6.4 Local Hermes Chat — 强制约束**

### WebOperator Hermes Panel（v5.7.4）

Renderer 公共组件：`src/renderer/src/components/hermes/`（`WebOperatorHermesChatPanel`）。  
消费方：`src/renderer/src/screens/WebOperator/HermesTaskPanel.tsx`。

| 规则 | 说明 |
|------|------|
| 传输 | **仅** `window.hermesDefaultChat` + `hermesAPI.getSessionMessages`（历史）；**禁止** Portal HTTP、`workspaceChat` |
| 模型 | **不传** `model_id`；**禁止** `getSessionModel` / `setSessionModel`；`resumeSessionId` 占位用 `draft_weboperator`（与全页 `draft_default` 隔离）→ Main 走全局默认 `config.yaml` overlay |
| Web 上下文 | `aiosBrowser.getFrameHtml` → `WebOperatorPageContext` → 首轮 `hermesDefaultChat.uploadAttachmentBuffers`（`web-context/*`）+ `buildTaskFirstMessage` / `buildWebContextPrefix` |
| 会话续聊 | v5.7.5：`window.webOperatorTaskSession` → `~/.hermes/desktop/web-operator-task-session.db`（`page_url` 唯一）；v5.7.4 legacy `localStorage` 键 `weboperator-hermes-panel-session-bindings` 保留文件但非主路径 |
| 历史消息 | `window.hermesAPI.getSessionMessages(sessionId)` | 恢复已有 Hermes session 时 |

PRD：[`prd/v5.7.4_sidepanel_hermes.md`](../prd/v5.7.4_sidepanel_hermes.md) · v5.7.5：[`prd/v5.7.5_hermes_integration.md`](../prd/v5.7.5_hermes_integration.md)

### WebOperator Task Session（v5.7.5）

Page Structure `[分析内容]` → `HermesTaskPanel` 按 `pageUrl` 解析/创建 Hermes 任务会话。

Main：`src/main/web-operator-task-session-store.ts` + `web-operator-task-session-ipc.ts`  
Preload：`src/preload/web-operator-task-session-api.ts`  
契约：`src/shared/web-operator/web-operator-task-session-contract.ts`  
DB：`~/.hermes/desktop/web-operator-task-session.db`（**非** Hermes `state.db`）

| Channel | Direction | Args | Returns | Notes |
|---------|-----------|------|---------|-------|
| `web-operator-task-session:resolve` | invoke | `{ pageUrl: string }` | `WebOperatorTaskSessionLookupResult` | `taskId = wot_` + sha256(pageUrl) 前 32 位 |
| `web-operator-task-session:upsert` | invoke | `WebOperatorTaskSessionUpsertInput` | `WebOperatorTaskSessionRecord` | 首次 `chat-done` 后写入 |
| `web-operator-task-session:remove` | invoke | `taskId: string` | `{ ok: true }` | |

Preload：`window.webOperatorTaskSession.resolve / upsert / remove`

### Preload：`window.hermesDefaultChat`（WebOperator 相关子集）

完整 API 见 `src/preload/hermes-default-chat-api.ts`。WebOperator Hermes 面板常用：

| 方法 | IPC | 说明 |
|------|-----|------|
| `getModelConfig(profile?)` | `hermes-chat:get-model-config` | 全局默认模型展示 |
| `uploadAttachmentBuffers(payload)` | `hermes-chat:upload-attachment-buffers` | **v5.7.5** 页面上下文 buffer 落盘（`inject-web-context-attachments.ts`） |
| `uploadAttachments(payload)` | `hermes-chat:upload-attachments` | 本地文件路径上传 |
| `uploadDroppedAttachments(payload, files)` | 上述两者组合 | Local Hermes Chat 拖拽 |
| `sendMessage(payload)` | `hermes-chat:send-message` | 流式 SSE `chat-*` |
| `abort()` | `abort-chat` | 中止当前流 |
| `onChunk` / `onDone` / `onError` / `onToolProgress` / `onUsage` | 事件订阅 | 返回 unsubscribe |

---

### 强制约束（MUST）— Chat 调模型与 API Key

以下规则为 **强制**；实现或改 IPC/UI 时不得违反。

#### A. Models 页 vs Chat 页

| | Models 页 | Chat 页 |
|---|-----------|---------|
| **模型作用域** | 全局默认（`config.yaml` root + `model:`） | **仅当前 session** |
| **IPC** | `hermes-chat:set-model-config`（Set Default） | `hermes-chat:get/set-session-model`、`hermes-chat:send-message` |
| **写 root `default:`** | 允许（Set Default） | **禁止** |
| **写 `model:` 段** | 允许（Set Default 全量） | **仅**发送前 runtime overlay（见 C） |
| **写 `custom_providers`** | 允许（CRUD 后同步） | 允许**仅**凭证修复式同步（见 D），非改默认模型 |
| **Gateway restart** | Set Default / 模型 CRUD 后允许 | **禁止**（session 选模） |
| **Save as Default** | — | **禁止**（无 UI、无 IPC） |

#### B. Session 级模型解析（MUST）

存储：`profileHome(profile)/desktop/session-models.json`（`hermes-session-model-store.ts`）。

| 步骤 | 规则 |
|------|------|
| B1 | 新对话绑定键：`draft_default`，直至首条消息拿到真实 `sessionId` |
| B2 | 用户切换下拉 → `hermes-chat:set-session-model(sessionId, modelId)` |
| B3 | `hermes-chat:send-message` 解析模型：**先** `payload.model_id`，**再** `getSessionModel(resumeSessionId \|\| draft_default)` |
| B4 | 若发送带 `model_id` 且与 session 不一致，以 `model_id` 为准并 **回写** session 绑定 |
| B5 | `chat-done` 后：`migrateSessionModelBinding(draft_default, realSessionId)` |
| B6 | Renderer **必须**用 `window.hermesDefaultChat`；**禁止** `workspaceChat`、禁止 Renderer 读写在 `config.yaml` |

#### C. 发送前 Gateway `model:` overlay（MUST）

Hermes Gateway **忽略** HTTP body 中的 `provider` / `base_url` / `api_key` 用于选模；以 `config.yaml` 的 **`model.default`** 为准。

| 步骤 | 规则 |
|------|------|
| C1 | `sendMessageViaApi` 在 POST 前调用 `overlayGatewayModelSectionForSession(profile, saved)` |
| C2 | 写入：`model.provider`、`model.default`（= `SavedModel.model`）、`model.base_url` |
| C3 | **不得**修改 root `default:` |
| C4 | **不得**为 overlay restart Gateway |
| C5 | HTTP `body.model` 仍为 API Server 注册名（如 `hermes-agent`），**不是** LLM id |

#### D. API Key 必须从 `.env` 读取（MUST）

| 步骤 | 规则 |
|------|------|
| D1 | 密钥文件：`profileHome(profile)/.env`；Main **`readEnv(profile)`** 为唯一读取入口 |
| D2 | **禁止** Renderer / Preload 接收或持久化用户 API key 明文 |
| D3 | 解析顺序：`apiKeyLiteral` → `readEnv[apiKeyEnv]` → `URL_KEY_MAP(baseUrl)`（`hermes-model-env.ts`） |
| D4 | `models.json` 缺 `apiKeyEnv` 时，Main **必须** `ensureModelsApiKeyEnvPersisted()` 按 URL 推断并回写 |
| D5 | `buildCustomProviderEntry`：`key_env` = **裸**变量名（如 `DEEPSEEK_API_KEY`）；**禁止** `${DEEPSEEK_API_KEY}` |
| D6 | 同步 `custom_providers` 时 **必须**将 `readEnv()` 解析结果写入 `api_key` 字段 |
| D7 | `startGateway()` **必须**将 profile `.env` 注入 Gateway 子进程环境 |
| D8 | `set-env` 修改 `*_API_KEY` / `HF_TOKEN` 后 **必须** `restartGateway`（已有 `set-env` handler） |
| D9 | 首条 Chat 发送可触发一次性 `syncCustomProvidersFromModels`；若 YAML 变更且 Gateway 在跑，**允许** restart（凭证修复，非 session 选模） |

#### E. 传输与回退（MUST）

| 规则 | 说明 |
|------|------|
| E1 | 优先 `POST {gateway}/v1/chat/completions`（`hermes.ts` `sendMessageViaApi`） |
| E2 | CLI 回退 **仅**当 API 不可用 |
| E3 | Windows CLI：**必须** `getHermesPython()` + `-m hermes_cli.main`；**禁止** `hermes.exe`（无控制台） |
| E4 | **禁止**因 session 模型 ≠ 全局默认而强制 CLI |

---

### IPC 通道

| Channel | Direction | Args | Returns | Notes |
|---------|-----------|------|---------|-------|
| `hermes-chat:list-models` | invoke | `profile?: string` | `HermesChatModelListResponse` | 来自 `models.json` + `config.yaml` 默认模型标记 `is_current` |
| `hermes-chat:get-model-config` | invoke | `profile?: string` | `HermesChatModelConfig \| null` | 当前**全局**默认模型（Models Set Default） |
| `hermes-chat:set-model-config` | invoke | `profile?: string`, `{ model_id: string }` | `HermesChatModelConfig` | **仅 Models 页**；写 root + `model:` + `custom_providers`；Gateway restart |
| `hermes-chat:get-session-model` | invoke | `sessionId: string`, `profile?: string` | `HermesSessionModelBinding \| null` | 读 session 绑定（含 `apiKeyEnv` 元数据，非明文 key） |
| `hermes-chat:set-session-model` | invoke | `sessionId: string`, `modelId: string`, `profile?: string` | `HermesSessionModelBinding` | Chat 下拉；**不**改 root `default:` |
| `hermes-chat:upload-attachments` | invoke | `UploadHermesAttachmentsPayload` | `UploadHermesAttachmentsResponse` | `profileHome(profile)/desktop/chat-attachments/<sessionId>/` |
| `hermes-chat:upload-attachment-buffers` | invoke | `UploadHermesAttachmentBuffersPayload` | `UploadHermesAttachmentsResponse` | buffer 落盘（拖拽 / **WebOperator `web-context/*`**）；Preload：`hermesDefaultChat.uploadAttachmentBuffers` |
| `hermes-chat:remove-attachment` | invoke | `workspaceId: string`, `attachmentId: string`, `profile?: string` | `{ ok: true }` | `workspaceId` 占位 |
| `hermes-chat:send-message` | invoke | `HermesChatSendPayload` | `{ response: string; sessionId?: string }` | 遵守 § 强制约束 B–E；SSE `chat-*` |

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
| `browser:get-frame-html` | `BrowserFrameHtmlRequest` | `BrowserFrameHtmlResult` |
| `browser:action-logs` | `limit?` | `BrowserActionLogEntry[]` |
| `browser:clear-action-logs` | — | `{ ok: boolean }` |

**Events (Main → Renderer):**

| Event | Payload |
|-------|---------|
| `browser:state-changed` | `BrowserRuntimeState` |
| `browser:action-logged` | `BrowserActionLogEntry` |

**Shared DTO：** `src/shared/browser/browser-frame-contract.ts`、`browser-snapshot-contract.ts`、`browser-action-contract.ts`。

**`browser:get-frame-html`（V5.7.3 hotfix）：** 请求 `BrowserFrameHtmlRequest`（`frameId` / `framePath` + 可选 `selector`、`outer`、`maxLength`）。返回 `BrowserFrameHtmlResult` 含 `source`：`frame-document`（子 frame 内 `executeJavaScript`）或 `parent-srcdoc`（`about:srcdoc` + sandbox iframe 时由父 frame 读取 `iframe[srcdoc]`，不在子 frame 执行脚本）。错误码含 `FRAME_SCRIPT_BLOCKED`、`ELEMENT_NOT_FOUND` 等。

**Main 模块：** `browser-frame-inspector.ts`、`browser-dom-snapshot.ts`、`browser-element-locator.ts`、`browser-coordinate-resolver.ts`、`browser-action-log-store.ts`、`browser-v57-core.ts`（由 `BrowserController.v57` 委托）。

**Renderer：** `WebOperatorScreen` 右栏 — `BrowserStatePanel`、`PageStructurePanel`（`FrameTreePanel` + `ElementListPanel`）、`ScreenshotPanel`、`BrowserActionLog`（结构化 + 审计双 tab）。

**验收页：** `resources/test-pages/v57/`。

---

## CRM Desktop Bridge（V5.7.1 + V5.7.6 Host Bridge）

CRM 页面运行在 WebOperator 的 WebContentsView 中，由专用 preload `src/preload/crm-bridge-preload.ts` 注入最小桥接 API（`view-registry` 已为 `web-operator` 设置 `defaultPreload`）：

- `window.CopilotDesktopCRM.emit(event)`：只允许在**真实用户点击**后的短时间窗口内提交（preload 本地校验），随后通过 IPC 进入 Main 二次校验。
- `window.CopilotDesktopCRM.emitReady(event)`：**V5.7.6** — 页面 `crm.page.ready` 专用通道，**不**校验用户手势。
- `crm-bridge:command`：Main 下发命令到 CRM 页面（preload 转发为 `window.postMessage`，由 CRM JSSDK 消费）。
- **V5.7.6 handoff**：Hermes 工具 `crm.open_form_with_json` → 保存 pending handoff → 跳转 CRM URL → CRM `emitReady` → Main 自动 `pushJson` + `runAction` → JSSDK ack 回传工具结果。

### Main IPC（invoke）

| Channel | Args | Returns |
|---------|------|---------|
| `crm-bridge:emit` | `CrmBridgeEmitInput` | `CrmBridgeResult` |
| `crm-bridge:list-events` | `limit?: number` | `CrmBridgeStoredEvent[]` |
| `crm-bridge:get-last-event` | — | `CrmBridgeStoredEvent \| null` |
| `crm-bridge:send-command` | `CrmDesktopCommand` | `CrmBridgeResult & { data?: unknown }`（**V5.7.6** 可等待 ack） |
| `crm-bridge:command-result` | `CrmDesktopCommandAck` | `CrmBridgeResult`（**V5.7.6** CRM JSSDK → preload → Main） |

### Main → Renderer event

| Event | Payload |
|-------|---------|
| `crm-bridge:on-event` | `CrmBridgeOnEventPayload` |

### Main → CRM WebContents event

| Event | Payload |
|-------|---------|
| `crm-bridge:command` | `CrmDesktopCommand`（含 `expectAck` / `timeoutMs` / `target.actionKey`） |

### Browser Tool Server（Hermes，`127.0.0.1:8765+`）

**V5.7.6** 新增 CRM 工具（`BrowserToolBridge` + `browser-tool-schema.ts`）：

| Tool | 说明 |
|------|------|
| `crm.get_context` | 返回最近一次 CRM bridge event |
| `crm.click_button` | 派发 `desktop.crm.clickButton`（expectAck） |
| `crm.run_action` | 派发 `desktop.crm.runAction`（expectAck） |
| `crm.push_json` | 派发 `desktop.crm.pushJson`（expectAck） |
| `crm.open_form_with_json` | 创建 handoff + 跳转 CRM URL，ready 后自动交付 |

**Shared DTO：** `src/shared/crm-bridge/*`。**Main 模块：** `crm-handoff-store.ts`、`crm-handoff-orchestrator.ts`、`crm-command-result-store.ts`。

**CRM JSSDK（页面侧）：** `resources/crm-bridge/hermes-crm-bridge-sdk.js`（全局 `window.CopilotCrm`）。

**Renderer 路由（`open-renderer-route`）：** Main `routeAction.route` 由 `Layout.tsx` 解析为 `src/shared/crm-bridge/crm-renderer-routes.ts` 中的路径，并切换到 workspace `crm-workbench`（本地 React，非 Portal WebView）。当前路径：

| `route` | 页面 |
|---------|------|
| `/crm/customer-ai` | 客户 AI 分析 |
| `/crm/quote-assistant` | 报价辅助 |
| `/crm/order-risk` | 订单风控 |

配置见 `resources/crm-bridge/crm-bridge.config.json`；UI 入口 `src/renderer/src/screens/Crm/CrmWorkbenchScreen.tsx`。

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
