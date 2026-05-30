# Hermes 组件族

> `src/renderer/src/components/hermes/`

WebOperator 侧栏嵌入的 Hermes 聊天面板，用于对当前网页内容进行 AI 分析。

## WebOperatorHermesChatPanel

**文件**：`panel/WebOperatorHermesChatPanel.tsx`

侧栏聊天面板 UI，编排 header（上下文摘要 + 模型标签）、消息列表、工具调用卡片、输入框。

### Props

| 字段 | 类型 | 说明 |
|---|---|---|
| `pageContext` | `HermesPanelPageContext \| null` | 当前页面上下文（URL / title / summary / scopeKey / html / screenshot） |
| `task` | `HermesPanelTaskInput \| null` | 任务输入（taskId / pageUrl / pageContext / userPrompt / skill / action / sessionId） |
| `onTaskSessionReady` | `(input: HermesPanelTaskSessionReadyInput) => void` | 任务会话就绪回调 |
| `presetActions` | `HermesPanelPresetAction[]` | 预设快捷操作按钮 |
| `presetSystemPrompt` | `string` | 系统提示词前缀 |
| `className` | `string?` | 额外 className |

### 子组件

| 组件 | 文件 | 职责 |
|---|---|---|
| `WebOperatorHermesPanelComposer` | `panel/WebOperatorHermesPanelComposer.tsx` | 输入框 + 发送/取消按钮 |
| `WebOperatorHermesPanelMessageList` | `panel/WebOperatorHermesPanelMessageList.tsx` | 消息列表渲染（user / assistant / streaming） |
| `WebOperatorHermesPanelToolCard` | `panel/WebOperatorHermesPanelToolCard.tsx` | 工具调用进度卡片 |

## useWebOperatorHermesPanelChat

**文件**：`hooks/useWebOperatorHermesPanelChat.ts`

聊天状态机 Hook，封装消息收发、流式订阅、续会话、上下文注入、任务自动运行等完整逻辑。

### 参数

```ts
{
  pageContext: HermesPanelPageContext | null;
  task?: HermesPanelTaskInput | null;
  presetSystemPrompt?: string;
  persistenceScopeKey?: string | null;
  onTaskSessionReady?: (input: HermesPanelTaskSessionReadyInput) => void;
}
```

### 返回值

| 字段 | 类型 | 说明 |
|---|---|---|
| `messages` | `HermesPanelMessage[]` | 消息列表 |
| `streamingContent` | `string` | 当前流式内容 |
| `toolCalls` | `HermesPanelToolCall[]` | 工具调用列表 |
| `busy` | `boolean` | 是否正在发送/流式 |
| `error` | `string \| null` | 错误信息 |
| `restoring` | `boolean` | 是否正在加载历史 |
| `runState` | `HermesPanelRunState` | 运行状态（idle / creating / streaming / error / cancelled） |
| `sessionId` | `string \| null` | 当前会话 ID |
| `defaultModelLabel` | `string \| null` | 全局默认模型标签 |
| `send` | `(text: string) => Promise<void>` | 发送消息 |
| `cancel` | `() => Promise<void>` | 中断流式 |
| `clear` | `() => void` | 清空会话 |

### 关键流程

1. **首轮注入**：首次发送时 `injectWebContextAttachments` 将 `pageContext` 附件写入会话
2. **系统提示**：首轮消息前缀 `presetSystemPrompt` + `buildWebContextPrefix` 上下文
3. **续会话**：通过 `persistenceScopeKey` → `scopeKeyWebOperatorPage` → `getPanelSessionBinding` 恢复历史
4. **任务自动运行**：`task.action === "running"` 时自动构造首发消息并 `sendInternal`
5. **事件订阅**：`hermesPanelApi.onChunk` / `onDone` / `onError` / `onToolProgress` / `onUsage`

## hermesPanelApi

**文件**：`api/hermesPanelApi.ts`

`window.hermesDefaultChat` 的薄封装，固定 `profile = "default"`，**不**暴露 `model_id`（面板使用全局默认模型）。

| 方法 | 对应 IPC | 说明 |
|---|---|---|
| `getModelConfig()` | `hermesDefaultChat.getModelConfig` | 获取当前模型配置 |
| `uploadAttachmentBuffers(payload)` | `hermesDefaultChat.uploadAttachmentBuffers` | 上传上下文附件 |
| `sendMessage(input)` | `hermesDefaultChat.sendMessage` | 发送消息（SSE） |
| `abort()` | `hermesDefaultChat.abort` | 中断当前流式 |
| `onChunk(cb)` / `onDone(cb)` / `onError(cb)` / `onToolProgress(cb)` / `onUsage(cb)` | 事件订阅 | 流式事件 |

## 辅助库

| 文件 | 导出 | 职责 |
|---|---|---|
| `lib/web-operator-hermes-session-binding.ts` | `getPanelSessionBinding` / `setPanelSessionBinding` / `clearPanelSessionBinding` / `scopeKeyWebOperatorPage` | scopeKey → sessionId 持久化绑定 |
| `lib/inject-web-context-attachments.ts` | `injectWebContextAttachments` | 首轮上传 HTML/screenshot 附件到会话 |
| `lib/build-web-context-prefix.ts` | `buildWebContextPrefix` | 构造 `[网页上下文]` 前缀文本 |
| `lib/build-task-first-message.ts` | `buildTaskFirstMessage` | 构造任务首发 prompt（skill + pageUrl + userPrompt） |
| `lib/preset-actions.ts` | `DEFAULT_WEB_OPERATOR_PRESET_ACTIONS` | 默认预设操作列表 |
| `constants.ts` | `DEFAULT_PANEL_SYSTEM_PROMPT` / `HERMES_PANEL_DRAFT_SESSION_ID` / `HERMES_PANEL_DEFAULT_PROFILE` | 常量 |
| `types.ts` | 多个类型 | DTO 类型定义 |
