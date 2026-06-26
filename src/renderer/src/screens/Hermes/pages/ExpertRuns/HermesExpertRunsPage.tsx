import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHermesExpertsCatalog } from "../../context/HermesExpertsContext";
import type { HermesExpertRun, HermesExpertRunStatus } from "../../types/hermes-expert-runs";
import { ExpertRunList } from "./components/ExpertRunList";
import { useExpertRunEvents } from "./hooks/useExpertRuns";
import { ExpertRunDetail } from "./components/ExpertRunDetail";

const RUN_FILTERS: Array<{ key: HermesExpertRunStatus | "all"; labelKey: string }> = [
  { key: "all", labelKey: "workspaces.hermes.expertRuns.filterAll" },
  { key: "running", labelKey: "workspaces.hermes.expertRuns.filterRunning" },
  { key: "waiting_approval", labelKey: "workspaces.hermes.expertRuns.filterWaiting" },
  { key: "completed", labelKey: "workspaces.hermes.expertRuns.filterCompleted" },
  { key: "failed", labelKey: "workspaces.hermes.expertRuns.filterFailed" },
];

export default function HermesExpertRunsPage() {
  const { t } = useTranslation();
  const { runs, loading, error, refreshRuns } = useHermesExpertsCatalog();
  const [filter, setFilter] = useState<HermesExpertRunStatus | "all">("all");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const load = useCallback(() => {
    void refreshRuns(filter === "all" ? undefined : { status: filter });
  }, [refreshRuns, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return runs;
    return runs.filter((r) => r.status === filter);
  }, [runs, filter]);

  const selectedRun: HermesExpertRun | null =
    filtered.find((r) => r.runId === selectedRunId) ?? filtered[0] ?? null;

  const { run: runDetail, events } = useExpertRunEvents(selectedRun?.runId ?? null);
  const displayRun = runDetail ?? selectedRun;

  const handleCancel = useCallback((runId: string) => {
    if (typeof window.hermesExperts === "undefined") return;
    void window.hermesExperts.cancelExpertRun(runId).then(() => load());
  }, [load]);

  const handleRetry = useCallback((runId: string) => {
    if (typeof window.hermesExperts === "undefined") return;
    void window.hermesExperts.retryExpertRun(runId).then(() => load());
  }, [load]);

  return (
    <div className="hermes-page hermes-expert-runs-page">
      <header className="hermes-page__header">
        <div>
          <h2>{t("workspaces.nav.expertRuns")}</h2>
          <p className="hermes-page__subtitle">{t("workspaces.hermes.expertRuns.subtitle")}</p>
        </div>
        <button type="button" className="hermes-btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "hermes-spin" : undefined} />
          {t("workspaces.hermes.common.refresh")}
        </button>
      </header>

      <nav className="hermes-category-tabs" aria-label="Run filters">
        {RUN_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={filter === f.key ? "is-active" : undefined}
            onClick={() => setFilter(f.key)}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </nav>

      {error ? (
        <div className="hermes-page__error">
          <p>{error}</p>
          <button type="button" className="hermes-btn-ghost" onClick={load}>
            {t("workspaces.hermes.chat.retry")}
          </button>
        </div>
      ) : null}

      {loading && filtered.length === 0 ? (
        <p className="hermes-page__loading">{t("workspaces.hermes.common.loading")}</p>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <p className="hermes-page__empty">{t("workspaces.hermes.expertRuns.empty")}</p>
      ) : (
        <div className="hermes-run-layout">
          <ExpertRunList
            runs={filtered}
            selectedRunId={displayRun?.runId ?? null}
            onSelect={setSelectedRunId}
          />
          <ExpertRunDetail
            run={displayRun}
            events={events}
            onCancel={handleCancel}
            onRetry={handleRetry}
          />
        </div>
      )}
    </div>
  );
}
