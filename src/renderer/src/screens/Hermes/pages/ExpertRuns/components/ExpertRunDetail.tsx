import { useTranslation } from "react-i18next";
import type { HermesExpertRun } from "../../../../../../../shared/hermes-experts/hermes-experts-contract";
import { ExpertRunTimeline } from "./ExpertRunTimeline";
import { ExpertRunMemberPanel } from "./ExpertRunMemberPanel";

type Props = {
  run: HermesExpertRun | null;
  events?: Array<{
    id: string;
    runId: string;
    eventType: string;
    sourceProfileId?: string;
    targetProfileId?: string;
    createdAt: string;
  }>;
  onCancel?: (runId: string) => void;
  onRetry?: (runId: string) => void;
};

export function ExpertRunDetail({ run, events = [], onCancel, onRetry }: Props) {
  const { t } = useTranslation();
  if (!run) {
    return <p className="hermes-muted">{t("workspaces.hermes.expertRuns.selectRun")}</p>;
  }

  const artifacts = run.artifacts ?? [];
  const canCancel = run.status === "running" || run.status === "dispatching" || run.status === "waiting_approval";
  const canRetry = run.status === "failed" || run.status === "cancelled" || run.status === "completed";

  return (
    <div className="hermes-run-detail">
      <header>
        <h3>{run.title}</h3>
        <span className={`hermes-badge hermes-badge--${run.status}`}>{run.status}</span>
      </header>
      <div className="hermes-run-detail__actions">
        {canCancel && onCancel ? (
          <button type="button" className="hermes-btn-ghost" onClick={() => onCancel(run.runId)}>
            {t("workspaces.hermes.expertRuns.cancel")}
          </button>
        ) : null}
        {canRetry && onRetry ? (
          <button type="button" className="hermes-btn-primary" onClick={() => onRetry(run.runId)}>
            {t("workspaces.hermes.expertRuns.retry")}
          </button>
        ) : null}
      </div>
      <p className="hermes-muted">{run.userPrompt}</p>
      {run.memberRuns && run.memberRuns.length > 0 ? (
        <ExpertRunMemberPanel memberRuns={run.memberRuns} />
      ) : null}
      <section>
        <h4>{t("workspaces.hermes.expertRuns.timeline")}</h4>
        <ExpertRunTimeline events={events} />
      </section>
      {artifacts.length > 0 ? (
        <section>
          <h4>{t("workspaces.hermes.expertRuns.artifacts")}</h4>
          <ul>
            {artifacts.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong>
                <span>{a.artifactType}</span>
                {a.previewText ? <pre>{a.previewText.slice(0, 500)}</pre> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {run.error ? (
        <p className="hermes-page__error">
          {run.error.code}: {run.error.message}
        </p>
      ) : null}
    </div>
  );
}
