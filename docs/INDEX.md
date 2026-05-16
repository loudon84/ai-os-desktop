# Project Index

## 项目定位

hermes-desktop 是基于 **Electron + React + TypeScript + TailwindCSS** 的 AI 助手桌面应用，用于安装、配置和与 Hermes Agent 聊天交互。遵循 Electron 三层进程隔离模型（Main / Preload / Renderer）。

- **版本**: 0.3.5 → **V1.2 Multi Profile Runtime 工程化增强**
- **appId**: com.nousresearch.hermes
- **productName**: Hermes Agent
- **仓库**: https://github.com/fathah/hermes-desktop

V1.1 在 V1.0 基础上新增 **Multi Profile Gateway Runtime**，将单 Gateway 桌面应用升级为 AI-OS Desktop 多智能体运行时控制台。

V1.2 在 V1.1 基础上增强 **Runtime 稳定性**：Gateway 崩溃检测/自动重启、端口冲突检测、启动超时、App 重启后状态恢复、日志收集与查看。

V1.2.1 在 V1.2 基础上新增 **Enterprise Install 企业级一键部署**：Deployment Config + Schema 校验、Runtime Bundle Manager（在线/离线/内嵌 + SHA-256）、Preflight Checker（20 项 P0/P1/P2 预检）、Hermes Agent Installer（Git/Bundle 双模式 + Venv）、Profile Runtime Bootstrapper（7 Profile + 端口递增）、Enterprise Installer 20 步流水线 + 13 IPC handler、Runtime Doctor（9 项诊断）、Install Lock/Marker/Log、安全策略（仅 127.0.0.1/无 UAC/HKLM/PATH/Token 不落盘）。

## 核心目录

| 目录 | 职责 | 是否允许修改 |
|---|---|---|
| `src/main/` | 主进程 — IPC 注册、Gateway 管理、配置读写、会话/记忆/技能管理、**Profile Runtime 多智能体运行时**、**V1.2: Gateway 日志收集/健康监管增强/运行时恢复**、**V1.2.1: Enterprise Install 企业级一键部署** | 需按任务范围 |
| `src/main/browser/` | Web Operator 模块 — BrowserViewManager/Controller/SecurityGuard/AuditLogger/ToolBridge/ToolServer | 按需扩展 |
| `src/preload/` | 预加载桥接层 — contextBridge 暴露 hermesAPI + aiosBrowser + **profileRuntime + profileEntry** | 谨慎修改，影响全进程通信 |
| `src/renderer/` | 渲染进程 — React UI 页面和组件 | 主要开发区 |
| `src/shared/` | 共享模块 — i18n 国际化 + browser IPC 契约类型 + **profile-runtime 契约类型/错误码** + **V1.2.1: enterprise 契约类型/常量/错误码** | 谨慎修改 |
| `resources/skills/` | 内置技能包 — web/web-operator/SKILL.md 等 | 按需扩展 |
| `resources/profiles/` | **V1.1 新增** Profile 配置模板 + SOUL.md | 按需扩展 |
| `tests/` | 测试文件 | 按需扩展 |
| `build/` | 构建资源（图标、entitlements、winget 模板） | 禁止随意修改 |
| `docs/` | 项目文档 | 按需更新 |

## 开发前必须阅读

1. docs/ARCHITECTURE.md — 架构总览与进程模型
2. docs/MODULES.md — 各模块职责与边界
3. docs/API_CONTRACTS.md — IPC 通信契约
4. docs/READING_GUIDE.md — 代码阅读顺序
5. wiki_core.md — 核心架构分析（含代码引用）

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Electron 39 + electron-vite 5 |
| UI | React 19 + TailwindCSS 4 + Lucide Icons |
| 语言 | TypeScript 5.9 |
| 数据库 | better-sqlite3（会话历史 + **profile-runtime.db 运行时控制面**） |
| 国际化 | i18next + react-i18next（4 语言） |
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
