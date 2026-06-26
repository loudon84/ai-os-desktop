import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHermesExpertsCatalog } from "../../context/HermesExpertsContext";
import type { HermesExpertTeam } from "../../types/hermes-expert-teams";
import { EXPERT_CATEGORIES } from "../Experts/mock/expert-mock-data";
import { ExpertTeamCard } from "./components/ExpertTeamCard";
import { ExpertTeamDetailModal } from "./components/ExpertTeamDetailModal";
import { useSummonExpert } from "../Experts/hooks/useSummonExpert";
import { useExpertInstall } from "../Experts/hooks/useExpertInstall";
import { ExpertInstallPlanDrawer } from "../Experts/components/ExpertInstallPlanDrawer";

export default function HermesExpertTeamsPage() {
  const { t } = useTranslation();
  const { teams, loading, error, refreshTeams } = useHermesExpertsCatalog();
  const { summonTeam } = useSummonExpert();
  const install = useExpertInstall();
  const [category, setCategory] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<HermesExpertTeam | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [installDrawerOpen, setInstallDrawerOpen] = useState(false);

  const load = useCallback(() => {
    void refreshTeams({ category, keyword });
  }, [refreshTeams, category, keyword]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = teams;
    if (category !== "all") {
      list = list.filter((team) => team.category === category);
    }
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter(
        (team) =>
          team.name.toLowerCase().includes(q) ||
          team.description.toLowerCase().includes(q) ||
          (team.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [teams, category, keyword]);

  return (
    <div className="hermes-page hermes-expert-teams-page">
      <header className="hermes-page__header">
        <div>
          <h2>{t("workspaces.nav.expertTeams")}</h2>
          <p className="hermes-page__subtitle">{t("workspaces.hermes.expertTeams.subtitle")}</p>
        </div>
        <button type="button" className="hermes-btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "hermes-spin" : undefined} />
          {t("workspaces.hermes.common.refresh")}
        </button>
      </header>

      <div className="hermes-experts-toolbar">
        <div className="hermes-search-field">
          <Search size={14} />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("workspaces.hermes.experts.search")}
          />
        </div>
      </div>

      <nav className="hermes-category-tabs" aria-label="Team categories">
        {EXPERT_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className={category === c.key ? "is-active" : undefined}
            onClick={() => setCategory(c.key)}
          >
            {t(c.labelKey, { defaultValue: c.key })}
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
        <p className="hermes-page__empty">{t("workspaces.hermes.expertTeams.empty")}</p>
      ) : (
        <div className="hermes-expert-grid">
          {filtered.map((team) => (
            <ExpertTeamCard
              key={team.teamId}
              team={team}
              onView={(item) => {
                setSelected(item);
                setModalOpen(true);
              }}
              onInstall={(team) => {
                setSelected(team);
                setInstallDrawerOpen(true);
                void install.previewTeam(team.teamId);
              }}
              onSummon={(team) => void summonTeam(team)}
            />
          ))}
        </div>
      )}

      <ExpertTeamDetailModal
        team={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onInstall={(team) => {
          setInstallDrawerOpen(true);
          void install.previewTeam(team.teamId);
        }}
        onSummon={(team) => void summonTeam(team)}
      />
      <ExpertInstallPlanDrawer
        plan={install.plan}
        open={installDrawerOpen}
        loading={install.loading}
        error={install.error}
        onClose={() => {
          setInstallDrawerOpen(false);
          install.clearPlan();
        }}
        onConfirm={() => {
          if (!selected) return;
          void install.installTeam(selected.teamId).then((result) => {
            if (result.ok) {
              setInstallDrawerOpen(false);
              install.clearPlan();
              load();
            }
          });
        }}
      />
    </div>
  );
}
