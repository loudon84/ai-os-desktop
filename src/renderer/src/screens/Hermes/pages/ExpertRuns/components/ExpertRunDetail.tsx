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
  const canCancel =
    run.status === "running" || run.status === "dispatching" || run.status === "waiting_approval";
  const canRetry = run.status === "failed" || run.status === "cancelled" || run.status === "completed";

  const handlePreview = async (artifactId: string) => {
    if (typeof window.hermesExperts === "undefined") return;
    const res = await window.hermesExperts.previewRunArtifact(artifactId);
    if (res.ok && res.data?.text) alert(res.data.text.slice(0, 2000));
  };

  const handleDownload = async (artifactId: string) => {
    if (typeof window.hermesExperts === "undefined") return;
    await window.hermesExperts.downloadRunArtifact(artifactId);
  };

  const handleImport = async (artifact: { id: string }) => {
    if (typeof window.hermesExperts === "undefined" || !run.remoteTaskId) return;
    await window.hermesExperts.importRunArtifact({
      artifactId: artifact.id,
      taskId: run.remoteTaskId,
    });
  };

  return (
    <div className="hermes-run-detail">
      <header>
        <h3>{run.title}</h3>
        <span className={`hermes-badge hermes-badge--${run.status}`}>{run.status}</span>
      </header>
      {run.remoteTaskId ? (
        <p className="hermes-muted">
          {t("workspaces.hermes.expertRuns.taskId", { defaultValue: "Task" })}: {run.remoteTaskId}
        </p>
      ) : null}
      {run.catalogSlug ? (
        <p className="hermes-muted">
          {t("workspaces.hermes.experts.expertSlug", { defaultValue: "Slug" })}: {run.catalogSlug}
        </p>
      ) : null}
      {run.skillName ? (
        <p className="hermes-muted">
          {t("workspaces.hermes.experts.skillName", { defaultValue: "Skill" })}: {run.skillName}
        </p>
      ) : null}
      {run.catalogKind === "expert_team" ? (
        <p className="hermes-badge">
          {t("workspaces.hermes.expertRuns.teamResult", { defaultValue: "Team result" })}
        </p>
      ) : null}
      {run.invocationId ? (
        <p className="hermes-muted">
          {t("workspaces.hermes.expertRuns.invocationId", { defaultValue: "Invocation" })}:{" "}
          {run.invocationId}
        </p>
      ) : null}
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
      {run.responseText ? (
        <section className="hermes-run-detail__response">
          <h4>{t("workspaces.hermes.expertRuns.response", { defaultValue: "Response" })}</h4>
          <pre className="hermes-run-response-text">{run.responseText}</pre>
        </section>
      ) : null}
      {run.runType === "team" || (run.memberRuns && run.memberRuns.length > 0) ? (
        <ExpertRunMemberPanel memberRuns={run.memberRuns} teamEvents={events} />
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
                <div className="hermes-run-detail__artifact-actions">
                  <button type="button" className="hermes-btn-ghost" onClick={() => void handlePreview(a.id)}>
                    {t("workspaces.hermes.artifacts.preview", { defaultValue: "Preview" })}
                  </button>
                  <button type="button" className="hermes-btn-ghost" onClick={() => void handleDownload(a.id)}>
                    {t("workspaces.hermes.artifacts.download", { defaultValue: "Download" })}
                  </button>
                  {run.remoteTaskId ? (
                    <button type="button" className="hermes-btn-ghost" onClick={() => void handleImport(a)}>
                      {t("workspaces.hermes.artifacts.import", { defaultValue: "Import" })}
                    </button>
                  ) : null}
                </div>
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
