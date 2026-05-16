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

## 构建资源

- `build/` — 图标、entitlements、winget 模板

## 原因

这些文件影响全局行为：
- preload 层变更影响所有进程通信
- 主进程入口变更影响所有 IPC 注册
- Gateway 管理变更影响消息收发和进程生命周期
- 构建配置变更影响打包产物和自动更新
- i18n 配置变更影响所有语言的加载

任何修改需要明确理解影响范围并获得批准。
