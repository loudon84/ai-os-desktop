---
name: sync-project-docs
description: >-
  在代码计划或功能实现完成后，根据 git diff 将变更同步到 AGENTS.md、docs/INDEX.md、
  docs/READING_GUIDE.md、docs/ARCHITECTURE.md、docs/API_CONTRACTS.md。
  在计划最后阶段、功能收尾、新增/修改 IPC、架构或路由变更后使用。
---

# Sync Project Docs

将本次代码变更反映到项目核心文档。目标：**增量、准确、可导航**，不是重写全书。

## 触发时机

- `.cursor/plans/*.plan.md` 全部 stage 标记 done
- 用户说「更新文档」「同步 AGENTS」「文档跟代码对齐」
- 新增/修改 IPC、Preload API、启动门控、模块目录、架构分层

## 工作流

```
1. 收集变更  →  git diff --stat + 读关键新文件
2. 分类影响  →  IPC / 架构 / 路由 / 模块 / 版本
3. 逐文档更新  →  见 doc-map.md
4. 自检  →  路径存在、channel 与代码一致、无重复矛盾
5. 汇报  →  列出每个文档改了什么
```

### Step 1：收集变更

```bash
git --no-pager diff --stat
git --no-pager diff --name-only
```

优先读：`src/main/index.ts`、相关 `*-ipc.ts`、`src/preload/*.ts`、`src/shared/**/*.ts`、新增 screen/module。

### Step 2：分类 checklist

复制并勾选：

```
变更分类:
- [ ] 新/改 IPC channel
- [ ] 新/改 Preload 全局 API（hermesAPI / desktopAuth / smcShell 等）
- [ ] 新/改 shared 契约类型
- [ ] 新/改 Main 模块或目录
- [ ] 新/改 Renderer 屏幕或路由
- [ ] 架构/进程边界变化
- [ ] 版本里程碑（V3.x / hotfix）
- [ ] 阅读路径变化（新文件应加入 READING_GUIDE）
```

### Step 3：逐文档更新

详细段落映射见 [doc-map.md](doc-map.md)。原则：

| 原则 | 说明 |
|---|---|
| 增量 | 只改与 diff 相关的表格行、bullet、版本段 |
| 对齐代码 | IPC 名、文件路径、全局 API 名必须与源码一致 |
| 单一事实源 | 完整 IPC 表在 `API_CONTRACTS.md`；AGENTS/INDEX 可摘要 + 链接 |
| 版本一致 | `AGENTS.md` 与 `docs/INDEX.md` 版本行保持一致 |

### Step 4：自检

- [ ] 文档中每个文件路径在仓库中存在（或标注 legacy）
- [ ] 每个 IPC channel 在 Main 有 handler、Preload 有封装
- [ ] 无「可能」「大概」；不确定标 `UNKNOWN` 并注明需读的文件
- [ ] 未删除 unrelated 历史版本段（除非用户要求整理）

### Step 5：汇报格式

```markdown
## 文档同步摘要

| 文档 | 更新内容 |
|---|---|
| AGENTS.md | … |
| docs/INDEX.md | … |
| docs/READING_GUIDE.md | … |
| docs/ARCHITECTURE.md | … |
| docs/API_CONTRACTS.md | … |

未改文档原因（若有）: …
```

## 快速决策树

**新增 IPC？** → 必改 `API_CONTRACTS.md`；AGENTS checklist + INDEX 目录表；READING_GUIDE 若新模块则加阅读链

**新 Preload API 对象？** → AGENTS「Preload 暴露的全局 API」+ ARCHITECTURE 进程模型段

**新 Main 子目录？** → INDEX「核心目录」+ AGENTS「目录地图」+ READING_GUIDE 功能阅读段

**启动/路由变化？** → AGENTS「应用路由」+ ARCHITECTURE 布局/数据流 + API_CONTRACTS Startup Gate

**版本 hotfix？** → INDEX 版本特性段 + AGENTS「版本特性索引」+ ARCHITECTURE「版本历史」首条

## 示例（精简）

**变更**：新增 `auth:get-endpoint-config` IPC + `auth-endpoint-config-store.ts`

| 文档 | 动作 |
|---|---|
| API_CONTRACTS.md | Desktop Auth 表增一行 channel |
| AGENTS.md | 目录地图 `src/main/auth/` 补 endpoint store；按功能跳转加一行 |
| INDEX.md | V3.3 段补 endpoint config 能力 |
| READING_GUIDE.md | 可选新增「阅读 Auth」小节 |
| ARCHITECTURE.md | 仅在架构边界变化时更新 |

## 禁止

- 不更新 `docs/MODULES.md`（除非用户明确要求）
- 不在文档中暴露 token/secret 字段
- 不用占位符假路径（`xxx.ts`）
- 不因文档同步而改业务代码
