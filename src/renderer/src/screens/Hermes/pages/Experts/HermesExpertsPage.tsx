import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Wifi, WifiOff, Cloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHermesExpertsCatalog } from "../../context/HermesExpertsContext";
import type { HermesExpert } from "../../types/hermes-experts";
import { EXPERT_CATEGORIES, FEATURED_SCENARIOS } from "./mock/expert-mock-data";
import { ExpertCard } from "./components/ExpertCard";
import { ExpertDetailDrawer } from "./components/ExpertDetailDrawer";
import { ExpertInstallPlanDrawer } from "./components/ExpertInstallPlanDrawer";
import { useExpertInstall } from "./hooks/useExpertInstall";
import { useSummonExpert } from "./hooks/useSummonExpert";

export default function HermesExpertsPage() {
  const { t } = useTranslation();
  const { experts, catalogSource, loading, error, refreshExperts } = useHermesExpertsCatalog();
  const install = useExpertInstall();
  const { summonExpert } = useSummonExpert();
  const [category, setCategory] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<HermesExpert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [installTarget, setInstallTarget] = useState<HermesExpert | null>(null);
  const [installDrawerOpen, setInstallDrawerOpen] = useState(false);
  const [desktopSyncRegistered, setDesktopSyncRegistered] = useState(false);

  useEffect(() => {
    if (typeof window.hermesExperts === "undefined") return;
    void window.hermesExperts.getDesktopSyncStatus().then((res) => {
      if (res.ok && res.data) setDesktopSyncRegistered(res.data.registered);
    });
  }, []);

  const load = useCallback(() => {
    void refreshExperts({ category, keyword });
  }, [refreshExperts, category, keyword]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = experts;
    if (category !== "all") {
      list = list.filter((e) => e.category === category);
    }
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [experts, category, keyword]);

  const handleView = (expert: HermesExpert) => {
    setSelected(expert);
    setDrawerOpen(true);
  };

  const handleInstall = (expert: HermesExpert) => {
    setInstallTarget(expert);
    setInstallDrawerOpen(true);
    void install.previewExpert(expert.expertId);
  };

  const handleSummon = (expert: HermesExpert) => {
    void summonExpert(expert);
    setDrawerOpen(false);
  };

  const confirmInstall = () => {
    if (!installTarget) return;
    void install.installExpert(installTarget.expertId).then((result) => {
      if (result.ok) {
        setInstallDrawerOpen(false);
        install.clearPlan();
        load();
      }
    });
  };

  return (
    <div className="hermes-page hermes-experts-page">
      <header className="hermes-page__header">
        <div>
          <h2>{t("workspaces.nav.experts")}</h2>
          <p className="hermes-page__subtitle">{t("workspaces.hermes.experts.subtitle")}</p>
        </div>
        <div className="hermes-page__header-actions">
          <span className="hermes-connection-pill" title={catalogSource}>
            {catalogSource === "remote" ? <Wifi size={14} /> : <WifiOff size={14} />}
            {t(`workspaces.hermes.experts.source.${catalogSource}`, { defaultValue: catalogSource })}
          </span>
          <span className="hermes-connection-pill">
            <Cloud size={14} />
            {desktopSyncRegistered
              ? t("workspaces.hermes.experts.desktopSync.registered")
              : t("workspaces.hermes.experts.desktopSync.offline")}
          </span>
          <button type="button" className="hermes-btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "hermes-spin" : undefined} />
            {t("workspaces.hermes.common.refresh")}
          </button>
        </div>
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

      <nav className="hermes-category-tabs" aria-label="Expert categories">
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

      <div className="hermes-featured-scenarios">
        {FEATURED_SCENARIOS.map((s) => (
          <span key={s.key} className="hermes-scenario-chip">
            {t(s.labelKey, { defaultValue: s.key })}
          </span>
        ))}
      </div>

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
        <p className="hermes-page__empty">{t("workspaces.hermes.experts.empty")}</p>
      ) : (
        <div className="hermes-expert-grid">
          {filtered.map((expert) => (
            <ExpertCard
              key={expert.expertId}
              expert={expert}
              onView={handleView}
              onInstall={handleInstall}
              onSummon={handleSummon}
            />
          ))}
        </div>
      )}

      <ExpertDetailDrawer
        expert={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onInstall={handleInstall}
        onSummon={handleSummon}
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
        onConfirm={confirmInstall}
      />
    </div>
  );
}
