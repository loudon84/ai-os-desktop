# Architecture

## 整体设计架构

项目基于 **Electron + React + Vite (electron-vite)** 构建，严格遵循 Electron 三层进程隔离模型：

```
src/
├── main/        # 主进程 (Node.js 特权环境)
├── preload/     # 预加载桥接层 (contextBridge)
├── renderer/    # 渲染进程 (React UI)
└── shared/      # 共享类型/工具 (i18n)
```

## 三层进程模型

```
┌─────────────────────────────────────────────────┐
│              Renderer Process (React)            │
│  App.tsx → screens/ → components/               │
│  调用: window.hermesAPI.*                        │
└──────────────────────┬──────────────────────────┘
                       │ ipcRenderer.invoke()
┌──────────────────────┴──────────────────────────┐
│           Preload Bridge (contextBridge)         │
│  src/preload/index.ts                           │
│  暴露: window.hermesAPI + window.electron       │
└──────────────────────┬──────────────────────────┘
                       │ IPC (ipcMain.handle)
┌──────────────────────┴──────────────────────────┐
│            Main Process (Node.js)                │
│  index.ts → IPC 注册中心                        │
│  ├── hermes.ts      Gateway 管理 + 消息路由     │
│  ├── installer.ts   环境安装/检测               │
│  ├── config.ts      配置读写                    │
│  ├── sessions.ts    会话查询 (SQLite)            │
│  ├── models.ts      模型 CRUD                   │
│  ├── profiles.ts    配置档案管理                │
│  ├── memory.ts      记忆管理                    │
│  ├── soul.ts        人格管理                    │
│  ├── tools.ts       工具集管理                  │
│  ├── skills.ts      技能管理                    │
│  ├── cronjobs.ts    定时任务管理                │
│  ├── claw3d.ts      Claw3D/Office 管理          │
│  ├── sse-parser.ts  SSE 流解析                  │
│  ├── gateway-log-collector.ts V1.2 日志收集    │
│  ├── runtime-reconciler.ts   V1.2 状态恢复     │
│  ├── enterprise/   V1.2.1 企业级一键部署        │
│  │   ├── deployment-config.ts  配置加载        │
│  │   ├── deployment-schema.ts  Schema 校验     │
│  │   ├── checksum-verifier.ts  SHA-256 校验    │
│  │   ├── runtime-bundle-manager.ts Bundle 管理 │
│  │   ├── preflight-checker.ts  环境预检        │
│  │   ├── hermes-agent-source-installer.ts Agent│
│  │   ├── python-venv-installer.ts  Venv 管理   │
│  │   ├── enterprise-installer.ts  流水线编排    │
│  │   ├── install-lock.ts  安装锁              │
│  │   ├── install-marker.ts 安装标记           │
│  │   ├── install-log.ts  安装日志             │
│  │   └── doctor/  Runtime Doctor 9 项诊断      │
│  └── browser/       Web Operator 模块           │
│       ├── browser-view-manager.ts               │
│       ├── browser-controller.ts                 │
│       ├── browser-security.ts                   │
│       ├── browser-audit.ts                      │
│       ├── browser-ipc.ts                        │
│       ├── browser-tool-bridge.ts                │
│       └── browser-tool-server.ts                │
└──────────────────────┬──────────────────────────┘
                       │ HTTP SSE / child_process
┌──────────────────────┴──────────────────────────┐
│          Hermes Python Backend                   │
│  API Server: http://127.0.0.1:8642              │
│  CLI Fallback: hermes-agent chat                 │
└─────────────────────────────────────────────────┘
```

## 与 Gateway 的对接核心

### 双路由消息发送机制

`sendMessage()` 是公开入口，自动选择路径：

```
sendMessage()
  ├── isRemoteMode? → sendMessageViaApi() (远程 HTTPS)
  └── !isRemoteMode
      ├── isApiServerReady? (GET /health)
      │   ├── Ready → sendMessageViaApi() (本地 SSE 流)
      │   └── Not Ready → sendMessageViaCli() (child_process.spawn)
```

### 核心 HTTP 接口

| 接口 | 方法 | 用途 |
|---|---|---|
| `/health` | GET | 健康检测，1500ms 超时 |
| `/v1/chat/completions` | POST | 流式聊天（SSE），OpenAI 兼容格式 |

### SSE 流解析

- 按 `\n\n` 分块，每块含 `event:` 和 `data:` 两行
- 自定义事件 `hermes.tool.progress` 用于工具调用进度推送
- 标准数据块提取 `delta.content` 和 `usage`（含 cost、rate limit）
- 响应头 `X-Hermes-Session-Id` 用于会话续接

### Gateway 生命周期

- **启动**: `startGateway()` spawn Python 进程执行 `hermes gateway`
- **健康轮询**: 每 15 秒检测一次，确认可用后停止
- **停止**: kill 进程引用 + 读取 `~/.hermes/gateway.pid` kill 残留
- **自动重启**: 修改 API Key / 模型配置 / 平台开关时触发

## 屏幕路由

App.tsx 管理应用生命周期路由：

```
splash → welcome → installing → setup → main(Layout)
```

| 屏幕 | 条件 | 说明 |
|---|---|---|
| SplashScreen | 启动时 | 品牌动画 |
| Welcome | 首次使用 | 安装/远程模式选择 |
| Install | 需要安装 | 执行 Hermes Agent 安装 |
| Setup | 安装完成 | API Key 配置向导 |
| Layout | 配置完成 | 主界面（14 个视图 + V1.1 新增 AI-OS/Experts/Runtime 分组） |

## 主布局导航

Layout.tsx 侧边栏包含 14 个视图 + V1.1 新增导航分组：

| 视图 | 路径 | 说明 |
|---|---|---|
| Chat | / | 聊天主界面 |
| Sessions | /sessions | 会话历史 |
| Agents | /agents | 配置档案 |
| Office | /office | Claw3D 可视化 |
| Models | /models | 模型管理 |
| Providers | /providers | API 密钥管理 |
| Skills | /skills | 技能管理 |
| Soul | /soul | 人格编辑 |
| Memory | /memory | 记忆管理 |
| Tools | /tools | 工具集开关 |
| Schedules | /schedules | 定时任务 |
| Gateway | /gateway | 消息平台配置 |
| Web Operator | /web-operator | Web Operator（三栏布局：Hermes任务面板/浏览器视口/状态面板） |
| Settings | /settings | 通用设置 |

### V1.1 新增导航分组

| 分组 | 视图 | 路径 | 说明 |
|---|---|---|---|
| AI-OS | AI-OS Workspace | /aios-workspace | default Profile 主控工作台 |
| Experts | Profile Workspace | /profile-workspace/:profileId | specialist 独立工作台（writer/coding/research/recruiters/finance/agenter） |
| Runtime | Profile Runtime | /profile-runtime | 运行时管理面板 |

## 国际化

支持 4 种语言，每种语言 20 个翻译模块：

| 语言代码 | 语言 |
|---|---|
| `en` | English（源语言/回退/默认） |
| `es` | Spanish |
| `pt-BR` | Portuguese (Brazil) |
| `zh-CN` | Chinese (Simplified) |

## 构建与打包

| 平台 | 格式 | 配置 |
|---|---|---|
| Windows | NSIS `.exe` 安装器 | oneClick, perMachine=false |
| macOS | `.dmg` | notarize=false |
| Linux | `.AppImage` / `.deb` / `.rpm` / `.snap` | vendor=Nous Research |

发布到 GitHub Releases（owner: fathah, repo: hermes-desktop）。

---

## V1.1 Multi Profile Runtime 架构

### 核心架构图

```
Renderer (React UI)
  ├── AIOSWorkspaceScreen          ← default Profile 主控
  ├── ProfileWorkspaceScreen       ← specialist 独立工作台
  └── ProfileRuntimeScreen        ← 运行时管理面板
        │
        ├── window.profileRuntime  ← Preload API (17 方法)
        └── window.profileEntry    ← Preload API (5 方法)

Preload (contextBridge)
  ├── profileRuntime → ipcRenderer.invoke('profile-runtime:*')
  └── profileEntry   → ipcRenderer.invoke('profile-entry:*')

Main Process
  ├── profile-runtime-ipc.ts       ← IPC handler 注册 (V1.2: +getGatewayLogs/setAutoRestart)
  ├── profile-runtime-manager.ts   ← 生命周期编排 (V1.2: 端口冲突/启动超时/崩溃检测)
  ├── profile-runtime-db.ts        ← SQLite 控制面 (9 表, V1.2: runtime_instances +5 字段)
  ├── config-importer.ts           ← YAML 配置导入
  ├── hermes-local-adapter.ts      ← 本地 Gateway 适配器 (V1.2: stdio pipe + 日志收集 + exit code)
  ├── gateway-supervisor.ts        ← 健康监管 (V1.2: 自动重启/health_fail_count/restart_count)
  ├── gateway-log-collector.ts     ← V1.2 新增: Gateway stdout/stderr 日志收集与推送
  ├── runtime-reconciler.ts        ← V1.2 新增: App 重启后状态恢复
  ├── plugin-registry.ts           ← 适配器/能力注册表
  ├── delegation-capability.ts     ← 委托调用
  ├── skill-sync-capability.ts     ← 技能同步
  ├── session-share-capability.ts  ← 上下文共享
  └── web-operator-profile-bridge.ts ← Web Operator 溯源

SQLite Control Plane
  └── ~/.hermes/desktop/profile-runtime.db
        ├── profiles              ← 7 个 Profile 定义
        ├── runtime_instances     ← Gateway 运行状态 (V1.2: +restart_count/last_exit_code/last_crash_at/auto_restart/health_fail_count)
        ├── profile_entries       ← 页面入口路由
        ├── profile_capabilities  ← 能力开关
        ├── profile_skills        ← 技能注册
        ├── skill_sync_events     ← 技能同步事件
        ├── shared_contexts       ← 上下文共享记录
        ├── delegation_events     ← 委托调用事件
        └── audit_events          ← 全量审计

Gateway Instances
  ├── default  : 127.0.0.1:8642
  ├── writer    : 127.0.0.1:8643
  ├── coding    : 127.0.0.1:8644
  ├── research  : 127.0.0.1:8645
  ├── recruiters: 127.0.0.1:8646
  ├── finance   : 127.0.0.1:8647
  └── agenter   : 127.0.0.1:8648
```

### Profile 状态流转

```
not_deployed → starting → running → stopping → stopped
                              ↓                    ↓
                            failed ← ─────────── ┘
```

### 配置文件

- `~/.hermes/desktop/profile-runtime.yaml` — 运行时配置
- `~/.hermes/desktop/profile-runtime.db` — SQLite 控制面
- `~/.hermes/profiles/<name>/` — 各 Profile 独立目录
- `resources/profiles/profile-runtime.template.yaml` — 内置模板

---

## V1.2 Runtime 稳定性增强架构

### 新增模块

```
gateway-log-collector.ts
  ├── startCollecting(profileId, proc)  ← 绑定 stdout/stderr
  ├── stopCollecting(profileId)         ← 释放资源
  ├── getHistory(profileId, options?)   ← 历史查询 (limit/level/since)
  ├── onNewLog(profileId, callback)     ← 实时推送订阅
  └── clearHistory(profileId)           ← 清空缓冲

runtime-reconciler.ts
  ├── reconcile()                       ← 扫描所有 running 实例，校正状态
  └── isPortOccupied(port)              ← 端口占用检测 (net.createServer)

gateway-supervisor.ts (增强)
  ├── startSupervision(profileId, { autoRestart, maxRestartCount })  ← V1.2 选项
  ├── setAutoRestartHandler(handler)    ← 自动重启回调注入
  ├── resetRestartCount(profileId)      ← 成功启动后重置计数
  └── getSupervisionStatus(profileId)   ← 查询监管状态
```

### runtime_instances 新增字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `restart_count` | INTEGER | 0 | 自动重启累计次数 |
| `last_exit_code` | INTEGER | NULL | 最近一次退出码 |
| `last_crash_at` | TEXT | NULL | 最近崩溃时间 |
| `auto_restart` | INTEGER | 1 | 是否允许自动重启 (0/1) |
| `health_fail_count` | INTEGER | 0 | 连续健康检查失败次数 |

### 新增 IPC 通道

| 通道 | 方向 | 说明 |
|------|------|------|
| `profile-runtime:getGatewayLogs` | Renderer → Main | 查询 Gateway 日志 |
| `profile-runtime:setAutoRestart` | Renderer → Main | 设置自动重启开关 |
| `profile-runtime:onStatusChanged` | Main → Renderer | 状态变更推送 |

### 新增 Shared 类型

- `RuntimeReconcileResult` — 状态恢复结果
- `GatewayLogEntry` — 日志条目
- `GatewayLogQueryOptions` — 日志查询选项
- `GatewayLogLevel` — 日志级别
- `RuntimeStatusChangeEvent` — 状态变更事件
- `PROFILE_STARTUP_TIMEOUT` — 新增错误码

---

## V1.2.1 Enterprise Install 架构

### 安装流水线

```
NSIS Installer
  → Hermes Desktop App
    → Enterprise Install Screen
      → Preflight Checker (20 项)
      → Runtime Bundle Manager (下载/校验/解压)
      → Hermes Agent Source Installer (Git/Bundle)
      → Python Venv Installer (创建/复用 + 依赖)
      → Enterprise Config Provisioner (~/.hermes)
      → Profile Runtime Bootstrapper (7 Profile)
      → Install Lock / Marker / Log
      → Gateway Supervisor (启动 default)
      → Runtime Doctor (9 项诊断)
      → AI-OS Desktop
```

### 安装目录结构

```
%LOCALAPPDATA%\AIOS-Hermes\
  app\        Hermes Desktop.exe
  runtime\    python\ git\ uv\ wheels\
  agent\      hermes-agent\
  venv\       Scripts\python.exe
  logs\       install.log  gateway\*.log
  cache\      downloads\ extracted\ backups\

%USERPROFILE%\.hermes\
  config.yaml  .env  state.db  SOUL.md
  desktop\     profile-runtime.db  profile-runtime.yaml
  profiles\    writer\ coding\ research\ recruiters\ finance\ agenter\
```

### IPC 通道 (13 个)

| 通道 | 方向 | 说明 |
|------|------|------|
| `enterprise:get-deployment-config` | Renderer → Main | 获取 deployment 配置 |
| `enterprise:validate-deployment-config` | Renderer → Main | 校验 deployment 配置 |
| `enterprise:preflight` | Renderer → Main | 运行预检 |
| `enterprise:install` | Renderer → Main | 执行安装流水线 |
| `enterprise:install-cancel` | Renderer → Main | 取消安装 |
| `enterprise:update` | Renderer → Main | 更新 |
| `enterprise:repair` | Renderer → Main | 修复 |
| `enterprise:rollback` | Renderer → Main | 回滚 |
| `enterprise:get-install-marker` | Renderer → Main | 获取安装标记 |
| `enterprise:get-install-log` | Renderer → Main | 获取安装日志 |
| `enterprise:open-log-dir` | Renderer → Main | 打开日志目录 |
| `enterprise:run-doctor` | Renderer → Main | 运行诊断 |
| `enterprise:export-doctor` | Renderer → Main | 导出诊断报告 |
| `enterprise-install:progress` | Main → Renderer | 安装进度推送 |

### Shared 契约

```
src/shared/enterprise/
  enterprise-constants.ts  ← 枚举/错误码/常量 (32 错误码, 20 InstallStage)
  enterprise-schema.ts     ← 数据结构类型 (31 字段 DeploymentConfig, InstallMarker, DoctorReport...)
  enterprise-contract.ts   ← API 契约层 (EnterpriseInstallAPI 13 方法, Input/Result 类型)
```

### 安全约束

- Gateway 仅监听 127.0.0.1
- 不创建 Windows Service，不写 HKLM，不修改系统 PATH
- Token/API Key 不落盘（不进 deployment.json / install-marker / 日志）
- Release Bundle 必须校验 SHA-256
- Git PAT 通过环境变量注入，不写入文件或日志
- Profile Policy 安装后只读
