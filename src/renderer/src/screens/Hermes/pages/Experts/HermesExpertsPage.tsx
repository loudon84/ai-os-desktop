import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Wifi, WifiOff, Cloud, Info, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHermesDefault } from "../../context/HermesDefaultContext";
import { useHermesExpertsCatalog } from "../../context/HermesExpertsContext";
import type { ExpertGatewayDiagnostics } from "../../../../../../shared/hermes-experts/hermes-experts-contract";
import type { HermesExpert } from "../../types/hermes-experts";
import { EXPERT_CATEGORIES, FEATURED_SCENARIOS } from "./mock/expert-mock-data";
import { ExpertCard } from "./components/ExpertCard";
import { ExpertDetailDrawer } from "./components/ExpertDetailDrawer";
import {
  ExpertCatalogCallDrawer,
  type ExpertCatalogCallItem,
} from "./components/ExpertCatalogCallDrawer";

export default function HermesExpertsPage() {
  const { t } = useTranslation();
  const { setActiveNavItem } = useHermesDefault();
  const { experts, catalogSource, loading, error, refreshExperts } = useHermesExpertsCatalog();
  const [category, setCategory] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<HermesExpert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [callTarget, setCallTarget] = useState<ExpertCatalogCallItem | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [desktopSyncRegistered, setDesktopSyncRegistered] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ExpertGatewayDiagnostics | null>(null);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window.hermesExperts === "undefined") return;
    void window.hermesExperts.getDesktopSyncStatus().then((res) => {
      if (res.ok && res.data) setDesktopSyncRegistered(res.data.registered);
    });
    void window.hermesExperts.getExpertGatewayDiagnostics().then(setDiagnostics);
  }, [experts, catalogSource]);

  const load = useCallback(() => {
    void refreshExperts({ category, keyword });
  }, [refreshExperts, category, keyword]);

  const clearCache = useCallback(async () => {
    if (typeof window.hermesExperts === "undefined") return;
    await window.hermesExperts.clearExpertCatalogCache();
    setCacheNotice(t("workspaces.hermes.experts.catalogCacheCleared"));
    load();
  }, [load, t]);

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

  const openCall = (expert: HermesExpert) => {
    setCallTarget({
      slug: expert.catalogSlug ?? expert.expertSlug ?? expert.slug ?? expert.expertId,
      kind: "expert",
      displayName: expert.displayName,
      callableSkillCount: expert.callableSkillCount,
      starterPrompt: expert.starterPrompts[0]?.prompt,
    });
    setCallOpen(true);
  };

  return (
    <div className="hermes-page hermes-experts-page">
      <header className="hermes-page__header">
        <div>
          <h2>{t("workspaces.nav.experts")}</h2>
          <p className="hermes-page__subtitle">{t("workspaces.hermes.experts.subtitle")}</p>
        </div>
        <div className="hermes-page__header-actions">
          <span
            className={`hermes-connection-pill${catalogSource === "legacy_rest_fallback" ? " hermes-connection-pill--warn" : ""}`}
            title={
              diagnostics
                ? `${t("workspaces.hermes.experts.diagnosticsTitle")}: ${diagnostics.expertMcpRootUrl}\n${t(`workspaces.hermes.experts.source.${catalogSource}`, { defaultValue: catalogSource })}`
                : catalogSource
            }
          >
            {catalogSource === "remote" ? <Wifi size={14} /> : <WifiOff size={14} />}
            {t(`workspaces.hermes.experts.source.${catalogSource}`, { defaultValue: catalogSource })}
          </span>
          {diagnostics?.expertMcpRootUrl ? (
            <span className="hermes-connection-pill" title={diagnostics.expertMcpRootUrl}>
              <Info size={14} />
              Expert MCP
            </span>
          ) : null}
          <span className="hermes-connection-pill">
            <Cloud size={14} />
            {desktopSyncRegistered
              ? t("workspaces.hermes.experts.desktopSync.registered")
              : t("workspaces.hermes.experts.desktopSync.offline")}
          </span>
          <button type="button" className="hermes-btn-ghost" onClick={() => void clearCache()} disabled={loading}>
            <Trash2 size={14} />
            {t("workspaces.hermes.experts.clearCatalogCache")}
          </button>
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

      {cacheNotice ? <p className="hermes-muted">{cacheNotice}</p> : null}

      {catalogSource === "remote" && filtered.length === 0 && !loading ? (
        <p className="hermes-page__empty">{t("workspaces.hermes.experts.catalogEmpty")}</p>
      ) : null}

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

      {!loading && filtered.length === 0 && catalogSource !== "remote" ? (
        <p className="hermes-page__empty">{t("workspaces.hermes.experts.empty")}</p>
      ) : filtered.length > 0 ? (
        <div className="hermes-expert-grid">
          {filtered.map((expert) => (
            <ExpertCard
              key={expert.expertId}
              expert={expert}
              onView={(e) => {
                setSelected(e);
                setDrawerOpen(true);
              }}
              onSummon={openCall}
            />
          ))}
        </div>
      ) : null}

      <ExpertDetailDrawer
        expert={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSummon={openCall}
      />
      <ExpertCatalogCallDrawer
        catalogItem={callTarget}
        open={callOpen}
        onClose={() => setCallOpen(false)}
        onSuccess={() => {
          setDrawerOpen(false);
          setActiveNavItem("expertRuns");
        }}
      />
    </div>
  );
}
