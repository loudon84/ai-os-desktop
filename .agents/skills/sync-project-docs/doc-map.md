# 文档段落映射（sync-project-docs）

按变更类型定位应更新的段落。编辑前先 `Read` 目标文件，保持现有 Markdown 风格。

---

## AGENTS.md

| 段落 | 何时更新 | 典型内容 |
|---|---|---|
| 顶部版本表 | 版本号或里程碑变化 | `0.3.x（V3.x …）` |
| 架构三层 ASCII | 新 Preload 全局对象或后端依赖 | `window.*` 列表 |
| 硬性规则 | 新强制约束（如 IPC 流程） | bullet |
| 目录地图 | 新/改 `src/main|preload|renderer|shared` 目录职责 | 表格行 |
| Preload 暴露的全局 API | 新 API 文件或方法面变化 | 表格行 |
| 应用路由与 UI 结构 | splash/login/main 路由、MainPage 结构 | ASCII + bullet |
| 主界面视图表 | 新 workspace tab / screen | 表格 |
| 核心数据流 | 新端到端链路（聊天/Auth/Bootstrap 等） | 代码块流程 |
| 配置文件位置 | 新持久化路径 | 表格行 |
| 新增/修改功能 checklist | 新领域 checklist 条目 | 子节 |
| 主进程模块速查 | 新 main 模块 | 表格行 |
| 按功能跳转 | 新常见任务入口 | 表格行 |
| 版本特性索引 | 每个版本里程碑 | 表格行 |

---

## docs/INDEX.md

| 段落 | 何时更新 | 典型内容 |
|---|---|---|
| 顶部版本表 | 与 AGENTS 同步 | 版本字符串 |
| V1.x–V3.x 特性 bullet | 当前版本增量能力 | 新 bullet 或新 `**Vx.x**` 段 |
| 核心目录 | 新目录或职责变化 | 表格行 |
| 开发前必须阅读 |  rarely | 链接列表 |
| 技术栈 | 新依赖 | 表格行 |
| 禁止行为 | 新安全/架构禁令 | bullet |

---

## docs/READING_GUIDE.md

| 段落 | 何时更新 | 典型内容 |
|---|---|---|
| 第一阶段–第七阶段编号列表 | 新核心文件进入主阅读链 | 插入有序条目 |
| 功能阅读顺序各小节 | 新功能域（Auth、Bootstrap、Workspace 等） | 新 `### 阅读 X` + 编号路径 |
| 输出要求 | rarely | 保持不动 |

**功能阅读小节模板：**

```markdown
### 阅读 <Domain>

1. `src/renderer/...` — UI 入口
2. `src/preload/...` — Preload API
3. `src/main/...` — Main 逻辑
4. `src/main/*-ipc.ts` — IPC handler
5. `docs/API_CONTRACTS.md` — <相关 IPC 段>
```

---

## docs/ARCHITECTURE.md

| 段落 | 何时更新 | 典型内容 |
|---|---|---|
| 顶部版本行 | 版本 bump | `> 版本: …` |
| 架构概述 ASCII | 重大分层变化 | 图 |
| 进程模型 / 三层架构 | Renderer 禁则、Preload 桥、Main 职责变化 | bullet |
| 主界面布局 V2.x / V3.x 增量 | MainPage、Workspace、Auth 嵌入 | `### Vx.x 增量` |
| 核心模块 | 新 Shell/Feature 模块 | `### N. …` |
| IPC 契约（架构内摘要） | 新 IPC 类别 | 表格（摘要，详情在 API_CONTRACTS） |
| 数据流 | 新关键流程 | 编号步骤 |
| 目录结构 | 顶层目录变化 | tree |
| 配置路径 | 新配置文件 | 表格 |
| 版本历史 | 每次里程碑 | 新 `### 0.3.x` 段 |

---

## docs/API_CONTRACTS.md

| 段落 | 何时更新 | 典型内容 |
|---|---|---|
| 对应 `###` 小节表格 | 新/改/删 IPC channel | Channel / 参数 / 返回值 / 说明 |
| 类型结构代码块 | 新 request/response 类型 | TypeScript interface |
| Preload 实际通道 | browser/shellView 等 | 与 preload 源码一致 |
| Main → Renderer 事件 | 新 push 事件 | 事件名 + payload |
| 弃用 IPC | 标记 deprecated | 说明替代 channel |

**IPC 表行模板：**

```markdown
| `domain:action` | `{ ... }` | `ReturnType` | 一句话说明 |
```

**新增小节：** 与现有域对齐（安装、Startup Gate、Desktop Auth、ShellView、Web Operator…），勿 invent 新顶级结构除非新域。

---

## 变更类型 → 最低更新集

| 变更类型 | 必改 | 建议改 |
|---|---|---|
| 新 IPC | API_CONTRACTS | AGENTS checklist、INDEX 目录 |
| 新 screen + IPC | API_CONTRACTS、READING_GUIDE | AGENTS 按功能跳转、INDEX |
| 新 main 模块目录 | INDEX、AGENTS 目录地图 | READING_GUIDE、ARCHITECTURE 目录结构 |
| Auth / 启动门控 | API_CONTRACTS、AGENTS 路由 | ARCHITECTURE V3.x、INDEX V3.x |
| 版本 hotfix | INDEX、AGENTS 版本索引、ARCHITECTURE 版本历史 | READING_GUIDE |
| 仅 Renderer 样式 | 通常跳过 | — |
| 仅测试 | 通常跳过 | — |
