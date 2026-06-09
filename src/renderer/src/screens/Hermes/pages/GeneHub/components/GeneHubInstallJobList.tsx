import { useTranslation } from "react-i18next";
import type { InstallJob } from "../../../../../../../shared/genehub/genehub-contract";

type Props = {
  jobs: InstallJob[];
  actionPending: boolean;
  onInstall: (jobId: string) => void;
};

export function GeneHubInstallJobList({ jobs, actionPending, onInstall }: Props) {
  const { t } = useTranslation();

  if (jobs.length === 0) {
    return <p className="hermes-muted">{t("workspaces.hermes.geneHub.emptyPending")}</p>;
  }

  return (
    <ul className="hermes-list">
      {jobs.map((job) => (
        <li key={job.jobId} className="hermes-genehub-job-row">
          <div>
            <strong>{job.skillName || job.geneSlug}</strong>
            <span className="hermes-muted"> · {job.action} · {job.geneVersion}</span>
            <div className="hermes-muted">{job.status}</div>
            {job.errorMessage ? <div className="hermes-page__error">{job.errorMessage}</div> : null}
          </div>
          <button
            type="button"
            className="hermes-btn-primary"
            disabled={actionPending}
            onClick={() => onInstall(job.jobId)}
          >
            {t("workspaces.hermes.geneHub.install")}
          </button>
        </li>
      ))}
    </ul>
  );
}
