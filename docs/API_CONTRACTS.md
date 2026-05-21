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

See `copilot-desktop/AGENTS.md` §「新增 IPC」for the checklist when adding channels.
