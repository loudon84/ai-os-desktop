# Do Not Touch Without Explicit Approval

## 全局配置

- `electron-builder.yml` — 打包配置（appId, publish, NSIS）
- `electron.vite.config.ts` — 构建配置（external, alias, plugins）
- `package.json` — 依赖版本、scripts
- `tsconfig.json` / `tsconfig.node.json` / `tsconfig.web.json` — TypeScript 配置

## 进程通信核心

- `src/preload/index.ts` — 预加载桥接层（所有 IPC 通信的咽喉）
- `src/preload/index.d.ts` — 类型声明（API 契约）
- `src/main/index.ts` — 主进程入口（IPC 注册中心）

## Gateway 管理

- `src/main/hermes.ts` — Gateway 启动/停止/消息路由（最核心模块）
- `src/main/sse-parser.ts` — SSE 解析器（聊天流依赖）

## 共享模块

- `src/shared/i18n/config.ts` — i18n 配置（语言代码、回退链）
- `src/shared/i18n/types.ts` — i18n 类型定义
- `src/shared/enterprise/enterprise-constants.ts` — V1.2.1 Enterprise 枚举/错误码/常量（32 错误码，20 InstallStage）
- `src/shared/enterprise/enterprise-schema.ts` — V1.2.1 Enterprise 数据结构类型（DeploymentConfig 31 字段）
- `src/shared/enterprise/enterprise-contract.ts` — V1.2.1 Enterprise API 契约（EnterpriseInstallAPI 13 方法）

## Enterprise Install 核心

- `src/main/enterprise/enterprise-installer.ts` — 安装流水线编排 + IPC 注册（影响全部 13 个 enterprise IPC 通道）
- `src/main/enterprise/deployment-schema.ts` — Deployment Schema 校验（影响配置合法性判断）
- `src/main/enterprise/preflight-checker.ts` — 环境预检（20 项检查影响安装阻断逻辑）

## 构建资源

- `build/` — 图标、entitlements、winget 模板

## 原因

这些文件影响全局行为：
- preload 层变更影响所有进程通信
- 主进程入口变更影响所有 IPC 注册
- Gateway 管理变更影响消息收发和进程生命周期
- 构建配置变更影响打包产物和自动更新
- i18n 配置变更影响所有语言的加载
- Enterprise 契约变更影响安装流水线和 IPC 通信
- 安装流水线变更影响企业部署完整性和安全性

任何修改需要明确理解影响范围并获得批准。
