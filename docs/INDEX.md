# SMC Copilot — Project Index

## 项目定位

**SMC Copilot**（包名 / 可执行文件：`smc-ai-copilot`）是基于 **Electron + React + TypeScript + TailwindCSS** 的 **AI-OS Desktop** 桌面壳：部署与运维 [Hermes Agent](https://github.com/loudon84/ai-os-hermes)，并提供多 Profile 运行时、跨 Profile 编排与 WebContentsView（Web Operator）内嵌能力。遵循 Electron 三层进程隔离模型（Main / Preload / Renderer）。

本仓库代码由 **hermes-desktop**（单运行时安装/配置/聊天）演进而来；Hermes Agent 仍为执行引擎，SMC Copilot 负责桌面壳、进程生命周期、SQLite 控制面与统一 UI。

| 项 | 值 |
|---|---|
| **产品名称** | SMC Copilot |
| **包名 / 可执行文件** | `smc-ai-copilot` |
| **版本** | 0.3.5（V1.9 Desktop Shell 加固） |
| **appId** | `com.smc.smc-ai-copilot` |
| **仓库** | https://github.com/loudon84/ai-os-desktop |
| **用户文档** | [README.md](../README.md) · [README.zh-CN.md](../README.zh-CN.md) |

**V1.0（hermes-desktop）**：单 Gateway 桌面 — 引导安装、提供商配置、流式聊天、会话/技能/记忆、消息 Gateway、Claw3D Office。

V1.1 在 V1.0 基础上新增 **Multi Profile Gateway Runtime**，将单 Gateway 桌面应用升级为 AI-OS Desktop 多智能体运行时控制台。

V1.2 在 V1.1 基础上增强 **Runtime 稳定性**：Gateway 崩溃检测/自动重启、端口冲突检测、启动超时、App 重启后状态恢复、日志收集与查看。

V1.2.1 在 V1.2 基础上新增 **Enterprise Install 企业级一键部署**：Deployment Config + Schema 校验、Runtime Bundle Manager（在线/离线/内嵌 + SHA-256）、Preflight Checker（20 项 P0/P1/P2 预检）、Hermes Agent Installer（Git/Bundle 双模式 + Venv）、Profile Runtime Bootstrapper（7 Profile + 端口递增）、Enterprise Installer 20 步流水线 + 13 IPC handler、Runtime Doctor（9 项诊断）、Install Lock/Marker/Log、安全策略（仅 127.0.0.1/无 UAC/HKLM/PATH/Token 不落盘）。

V1.4 在 V1.2.1 基础上完成 **Desktop Shell 布局重构** 与 **Windows NSIS 安装器加固**：
- **NSIS**：`customInit` VC++ Runtime 阻断检查；`customInstall` 写入 `runtime/installer-precheck.json` + `nsis-install.log`；Git/Python/uv/8642 端口仅提示不阻断
- **Desktop Shell**：`Layout.tsx` 编排层 + `DesktopShell` / `DesktopSidebar` / `WorkspaceOutlet` / `PageHeader` / `StatusBar` / `ModalLayer` / `DrawerLayer`
- **WindowControls**：`window.hermesAPI.windowControls` → IPC `window:*`（minimize/maximize/close/is-maximized）；Win/Linux 自定义标题栏按钮
- **RuntimeSetup**：读取 NSIS 预检结果卡片（`enterprise:get-installer-precheck`）

**V1.4.1（P0 hotfix + 安装加固）**：
- **窗口控制**：`registerWindowIpc()` 只注册一次；Win/Linux `frame: false` + 自定义 `WindowControls`（`hermesAPI.windowControls`）；非 `main` 屏顶栏 `layout-titlebar`
- **PyPI 镜像**：安装 UI 可选清华/阿里/腾讯/官方/自定义；默认 `https://pypi.tuna.tsinghua.edu.cn/simple`；写入 `desktop-runtime.json` → `pipMirror`
- **依赖安装**：`agent-deps-installer.ts` — `uv pip install --no-config`、优先 `requirements.txt`、wheelhouse 离线、`pip` 回退
- **NSIS**：`installer-precheck.json` 的 `windowsVersion` 从注册表读取（修复 `${__NSD_VERSION}` 打包错误）

**V1.9（Desktop Shell 加固）**：
- **启动顺序修复**：`buildAppMenu() → setupIPC() → createWindow() → 延迟注册 AIOS/Enterprise/ShellView IPC`，解决 mainWindow 为 null 导致 IPC handler 未注册的阻断
- **菜单接管**：删除 index.ts 内联 `buildMenu()`，统一使用 `shell-menu.ts` 的 `buildAppMenu`，含异常回退最小菜单
- **ShellViewManager 集成**：以 SVM 统一管理 aios-home View，URL 由 `getAiOsEnvConfig()` 动态决定，`AiOsWebContentsController` 标记 @deprecated
- **ShellView IPC**：新增 `shell:view:activate`、`shell:view:set-bounds`、`shell:view:hide` 三个 IPC 通道 + 参数校验
- **Preload API**：新增 `window.shellView`（activate/setBounds/hide），`window.smcShell` 标记 @deprecated
- **WebContentsHost**：通用 View 承载组件（activate+ResizeObserver+setBounds+卸载hide+错误降级UI），替换 `AiOsWebAppHost`
- **i18n**：新增 shellView 模块（en/zh-CN/es/pt-BR）

## 核心目录

| 目录 | 职责 | 是否允许修改 |
|---|---|---|
| `src/main/` | 主进程 — IPC 注册、Gateway 管理、配置读写、会话/记忆/技能管理、**Profile Runtime**、**Enterprise Install**、**AI-OS Runtime**、**Migrations**、**SSH** | 需按任务范围 |
| `src/main/window/` | **V1.4.1** 窗口控制 IPC — minimize/maximize/close/is-maximized | 按需扩展 |
| `src/main/enterprise/` | 企业安装、Doctor、installer-precheck-reader、agent-deps-installer、pip-mirror-config（31 个文件含 doctor/ 和 windows/ 子目录） | 按需扩展 |
| `src/main/aios/` | **AI-OS Runtime** — 配置/Doctor/健康/IPC/路径/端口/进程/协调/监管/WebContents 控制（10 个文件） | 按需扩展 |
| `src/main/migrations/` | **DB 迁移** — 迁移运行器 + 3 个迁移文件 | 按需扩展 |
| `src/main/update/` | **更新生命周期** — update-lifecycle.ts | 按需扩展 |
| `src/main/browser/` | Web Operator 模块 — BrowserViewManager/Controller/SecurityGuard/AuditLogger/ToolBridge/ToolServer（8 个文件） | 按需扩展 |
| `src/preload/` | 预加载桥接层 — contextBridge 暴露 **hermesAPI（90+ 方法，含 windowControls）+ aiosBrowser + profileRuntime + profileEntry + aiosRuntime + shellView**（7 个文件） | 谨慎修改，影响全进程通信 |
| `src/renderer/` | 渲染进程 — **components/layout/**、**components/install/PipMirrorFields**、**components/aios/**、**hooks/**、**types/desktop-shell.ts** | 主要开发区 |
| `src/shared/` | 共享模块 — i18n（4 语言 × 22 模块）+ browser/profile-runtime/enterprise/aios/shell 契约；**V1.9: `shell/shell-view-contract.ts`** | 谨慎修改 |
| `resources/skills/` | 内置技能包 — web/web-operator/SKILL.md 等 | 按需扩展 |
| `resources/profiles/` | **V1.1 新增** Profile 配置模板 + SOUL.md | 按需扩展 |
| `tests/` | 测试文件（16 个） | 按需扩展 |
| `build/` | 构建资源（**installer.nsh**、**nsis/Include/RuntimePrecheck.nsh**、**VCRuntimeCheck.nsh**、**winget/**） | NSIS 脚本按需更新 |
| `docs/` | 项目文档 | 按需更新 |

## 开发前必须阅读

1. docs/ARCHITECTURE.md — 架构总览与进程模型
2. docs/MODULES.md — 各模块职责与边界
3. docs/API_CONTRACTS.md — IPC 通信契约
4. docs/READING_GUIDE.md — 代码阅读顺序
5. AGENTS.md — Agent 编码速查指南

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Electron 39 + electron-vite 5 |
| UI | React 19 + TailwindCSS 4 + Lucide Icons |
| 语言 | TypeScript 5.9 |
| 数据库 | better-sqlite3（会话历史 + **profile-runtime.db 运行时控制面**） |
| 国际化 | i18next + react-i18next（4 语言 × 22 模块） |
| Markdown | react-markdown + remark-gfm + react-syntax-highlighter |
| 构建 | electron-vite + electron-builder |
| 测试 | Vitest + Testing Library |
| 更新 | electron-updater（GitHub Releases） |

## 禁止行为

- 不允许凭猜测新增 IPC channel
- 不允许绕过 preload 层直接访问 Node.js API
- 不允许修改主进程的 Gateway 启动/停止逻辑，除非明确理解进程管理
- 不允许在渲染进程直接 import Node.js 模块
- 不允许修改 i18n 的语言代码或回退链
- 不允许修改 electron-builder.yml 的 appId 和 publish 配置
