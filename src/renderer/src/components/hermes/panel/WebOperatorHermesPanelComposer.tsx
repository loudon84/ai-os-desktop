import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Send, Square } from "lucide-react";

export function WebOperatorHermesPanelComposer({
  busy,
  disabled,
  onSend,
  onCancel,
  placeholder = "输入消息…（Enter 发送，Shift+Enter 换行）",
}: {
  busy: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onCancel: () => void;
  placeholder?: string;
}): React.JSX.Element {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  const submit = useCallback(() => {
    const t = value.trim();
    if (!t || busy || disabled) return;
    onSend(t);
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
  }, [busy, disabled, onSend, value]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    <div className="web-operator-hermes-panel__composer">
      <textarea
        ref={taRef}
        className="web-operator-hermes-panel__textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={busy || disabled}
        rows={2}
      />
      <div className="web-operator-hermes-panel__composer-actions">
        {busy ? (
          <button type="button" className="web-operator-hermes-panel__btn" onClick={onCancel}>
            <Square size={14} style={{ display: "inline", verticalAlign: "middle" }} /> 停止
          </button>
        ) : null}
        <button
          type="button"
          className="web-operator-hermes-panel__btn web-operator-hermes-panel__btn--primary"
          onClick={submit}
          disabled={busy || disabled || !value.trim()}
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" style={{ display: "inline" }} />
          ) : (
            <Send size={14} style={{ display: "inline", verticalAlign: "middle" }} />
          )}{" "}
          发送
        </button>
      </div>
    </div>
  );
}
