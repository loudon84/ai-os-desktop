import { useTranslation } from "react-i18next";
import type { HermesExpertRun } from "../../../types/hermes-expert-runs";

type Props = {
  runs: HermesExpertRun[];
  selectedRunId: string | null;
  onSelect: (runId: string) => void;
};

export function ExpertRunList({ runs, selectedRunId, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <div className="hermes-run-layout">
      <ul className="hermes-run-list">
        {runs.map((run) => (
          <li key={run.runId}>
            <button
              type="button"
              className={`hermes-run-list-item${selectedRunId === run.runId ? " is-active" : ""}`}
              onClick={() => onSelect(run.runId)}
            >
              <strong>{run.title}</strong>
              <span>{run.runType}</span>
              <span className={`hermes-badge hermes-badge--${run.status}`}>{run.status}</span>
              <time>{new Date(run.startedAt).toLocaleString()}</time>
            </button>
          </li>
        ))}
      </ul>
      {selectedRunId ? (
        <div className="hermes-run-detail-placeholder">
          <p>{t("workspaces.hermes.expertRuns.detailPlaceholder")}</p>
        </div>
      ) : null}
    </div>
  );
}
