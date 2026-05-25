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

See `copilot-desktop/AGENTS.md` §「新增 IPC」for the checklist when adding channels.
