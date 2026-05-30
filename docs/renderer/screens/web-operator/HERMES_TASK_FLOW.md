# Hermes Task Flow

> Page Structure [分析内容] → Hermes Task 侧栏 → HermesTaskStartDialog → 遮罩策略 → WebContentsHost enabled=false 完整流程

## 流程总览

```
┌─────────────────────────────────────────────────────────────┐
│ PageStructurePanel                                          │
│   PageFrameHtmlInspector                                    │
│     [分析内容] 按钮                                         │
│       │                                                     │
│       ├─ 1. getFrameHtml() → BrowserFrameHtmlResult         │
│       ├─ 2. derivePageUrl() → stable pageUrl                │
│       ├─ 3. buildPageContextFromFrameHtml() → pageContext   │
│       ├─ 4. onAnalyzeContent() → 切换到 hermes-task 面板    │
│       └─ 5. requestHermesAnalysis({ pageUrl, pageContext }) │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ WebOperatorPageContext                                      │
│   analysisRequest = { requestId, pageUrl, pageContext, ... }│
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ HermesTaskPanel                                            │
│   useEffect([analysisRequest?.requestId])                   │
│     │                                                       │
│     ├─ webOperatorTaskSession.resolve({ pageUrl })          │
│     │                                                       │
│     ├─ 有已绑定 session ──→ action: "loading"               │
│     │   └─ loadSessionHistory(sessionId)                    │
│     │                                                       │
│     └─ 无已绑定 session ──→ openStartDialog()               │
│         └─ setTaskStartDialog(state)                        │
│         └─ setTaskStartDialogHandlers(handlers)             │
└─────────────────────────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
┌───────────────────┐  ┌──────────────────────────────────────┐
│ Dialog Confirm     │  │ Dialog Cancel                       │
│  action: "running" │  │  action: "pending"                  │
│  closeStartDialog  │  │  closeStartDialog                   │
└───────────────────┘  └──────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ WebOperatorHermesChatPanel                                  │
│   useWebOperatorHermesPanelChat({ task, pageContext, ... }) │
│     │                                                       │
│     ├─ autoRun effect → buildTaskFirstMessage()             │
│     ├─ sendInternal()                                       │
│     │   ├─ injectWebContextAttachments() → attachmentIds    │
│     │   ├─ buildWebContextPrefix() → context prefix         │
│     │   └─ hermesPanelApi.sendMessage() → SSE              │
│     │                                                       │
│     └─ onDone → onTaskSessionReady()                        │
│         └─ webOperatorTaskSession.upsert() 持久化           │
└─────────────────────────────────────────────────────────────┘
```

## 阶段详解

### 阶段 1：PageFrameHtmlInspector → requestHermesAnalysis

**触发**：用户在 PageStructurePanel 点击 [分析内容] 按钮

1. 若无已有 HTML result → 先调用 `fetchFrameHtml()`（`aiosBrowser.getFrameHtml()`）
2. `extractBodyInnerHtml(result.html)` 提取 body innerHTML
3. `derivePageUrl({ frame, frames, result })` 生成稳定 pageUrl
4. `buildPageContextFromFrameHtml({ frame, result, htmlExcerpt, pageUrl })` 构建 `HermesPanelPageContext`
5. `onAnalyzeContent?.()` → 通知父组件切换到 `hermes-task` 面板
6. `requestHermesAnalysis({ pageUrl, pageContext })` → 写入 context，生成 `analysisRequest`

### 阶段 2：HermesTaskPanel → resolve / dialog

**触发**：`analysisRequest?.requestId` 变化

1. 调用 `window.webOperatorTaskSession.resolve({ pageUrl })` 查找已有任务
2. **有 record**（已绑定 sessionId）：
   - 设置 `currentTask = { action: "loading", sessionId }`
   - `WebOperatorHermesChatPanel` 检测 `task.action === "loading"` → `loadSessionHistory(sessionId)`
3. **无 record**：
   - 调用 `openStartDialog()` → 设置 `taskStartDialog` + `taskStartDialogHandlers`
   - `WebOperatorTaskStartDialogHost` 检测 `taskStartDialog.requestId === analysisRequest.requestId` → 渲染 Dialog

### 阶段 3：HermesTaskStartDialog 遮罩策略

**Dialog 渲染**：`createPortal(jsx, document.body)`

**遮罩效果**：

| 层 | 效果 | 实现 |
|---|---|---|
| WebContentsView | 隐藏（不可交互） | `WebContentsHost enabled={enabled && !isTaskStartDialogOpen}` → `shellView.hide()` |
| DOM 背景 | 不可滚动 | `document.body.style.overflow = "hidden"` |
| 键盘 | Escape 被拦截 | `addEventListener("keydown", blockEscape, true)` |
| Dialog | 模态居中 | `role="dialog" aria-modal="true"` |

**Dialog 内容**：
- 当前页面内容摘要（只读 textarea，`buildPageContextSummary` 最多 100 字符）
- 用户提示词（可编辑 textarea）
- 技能选择（`hermesAPI.listInstalledSkills("default")` → select 下拉）
- 取消 / 确认分析 按钮

### 阶段 4：Dialog Confirm → Chat 发送

1. `handleDialogConfirm` → `setCurrentTask({ action: "running", ... })` + `closeStartDialog()`
2. `closeStartDialog` → `setTaskStartDialog(null)` + `setTaskStartDialogHandlers(null)`
3. `WebContentsHost` 恢复 `enabled=true`（原生层重新显示）
4. `useWebOperatorHermesPanelChat` 检测 `task.action === "running"` → autoRun effect：

#### autoRun 流程

1. `buildTaskFirstMessage({ pageUrl, pageContext, userPrompt, skill })` 构建首次消息：
   ```
   [页面来源]
   {pageUrl}
   
   [页面摘要]
   {pageContext.summary}
   
   [技能]
   {skill || "default"}
   
   [页面内容]
   {textExcerpt || htmlExcerpt}
   
   [用户补充要求]
   {userPrompt || "请分析当前页面内容…"}
   ```
2. `sendInternal(message, { forceFirstMessage: true, displayText })` 发送

#### sendInternal 流程

1. 首次消息且 `injectedRef.current === false` → `injectWebContextAttachments()`：
   - 上传 `web-context/body.html`（或 `body.txt`）+ `web-context/meta.json` 作为附件
   - 通过 `hermesPanelApi.uploadAttachmentBuffers()` 发送到 Gateway
2. 构建 payload message：`systemLead + ctxPrefix + [用户] + text`（非 task 模式）或 `systemLead + text`（task 模式）
3. `hermesPanelApi.sendMessage({ message, resumeSessionId, attachment_ids })` → SSE 流

### 阶段 5：SSE 流 → 结果持久化

1. `onChunk` → 追加 `streamingContent`
2. `onToolProgress` → 追加 `toolCalls`
3. `onDone` → 将 streaming 追加为 assistant message → `runState = "idle"` → 调用 `onTaskSessionReady`（task 模式）或 `setPanelSessionBinding`（draft 模式）
4. `onError` → 设置 error + `runState = "error"`

**持久化**：`webOperatorTaskSession.upsert({ taskId, pageUrl, sessionId, pageContext, skill })` 写入 SQLite（Main 侧 task_session 表）。

## Dialog Cancel 路径

Cancel 时 `handleDialogCancel` 设置 `currentTask = { action: "pending" }`，Chat 进入 pending 状态（composer disabled），用户可在 HermesTaskPanel 中继续对话或重新触发分析。
