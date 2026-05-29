import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { HermesPanelPageContext } from "../../components/hermes";
import { buildPageContextSummary } from "./utils/page-context-summary";
import "./HermesTaskStartDialog.css";

type SkillOption = { label: string; value: string };

const DEFAULT_SKILL: SkillOption = { label: "default", value: "" };

export interface HermesTaskStartDialogProps {
  pageContext: HermesPanelPageContext;
  onConfirm: (input: { userPrompt: string; skill: string }) => void;
  onCancel: () => void;
}

export function HermesTaskStartDialog({
  pageContext,
  onConfirm,
  onCancel,
}: HermesTaskStartDialogProps): React.JSX.Element {
  const [userPrompt, setUserPrompt] = useState("");
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState<SkillOption[]>([DEFAULT_SKILL]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const blockEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("keydown", blockEscape, true);
    return () => document.removeEventListener("keydown", blockEscape, true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const installed = await window.hermesAPI.listInstalledSkills("default");
        if (cancelled) return;
        const options: SkillOption[] = [DEFAULT_SKILL];
        for (const item of installed ?? []) {
          const name = typeof item === "string" ? item : (item as { name?: string }).name;
          if (name && name !== "default") {
            options.push({ label: name, value: name });
          }
        }
        setSkills(options);
      } catch {
        if (!cancelled) setSkills([DEFAULT_SKILL]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = buildPageContextSummary(pageContext);

  return createPortal(
    <div
      className="hermes-task-start-dialog__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hermes-task-start-dialog-title"
    >
      <div className="hermes-task-start-dialog__panel">
        <h3 id="hermes-task-start-dialog-title" className="hermes-task-start-dialog__title">
          Hermes 分析任务
        </h3>

        <label className="hermes-task-start-dialog__field">
          <span className="hermes-task-start-dialog__label">当前页面内容</span>
          <textarea
            readOnly
            value={summary}
            rows={3}
            className="hermes-task-start-dialog__textarea"
          />
        </label>

        <label className="hermes-task-start-dialog__field">
          <span className="hermes-task-start-dialog__label">用户提示词（可选）</span>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={3}
            placeholder="补充分析要求…"
            className="hermes-task-start-dialog__textarea"
          />
        </label>

        <label className="hermes-task-start-dialog__field">
          <span className="hermes-task-start-dialog__label">技能</span>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="hermes-task-start-dialog__select"
          >
            {skills.map((opt) => (
              <option key={opt.value || "default"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="hermes-task-start-dialog__actions">
          <button type="button" onClick={onCancel} className="hermes-task-start-dialog__btn">
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ userPrompt: userPrompt.trim(), skill })}
            className="hermes-task-start-dialog__btn hermes-task-start-dialog__btn--primary"
          >
            确认分析
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
