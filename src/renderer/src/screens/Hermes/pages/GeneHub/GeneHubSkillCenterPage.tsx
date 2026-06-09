import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneHubRuntime } from "../../hooks/useGeneHubRuntime";
import { GeneHubConnectionCard } from "./components/GeneHubConnectionCard";
import { GeneHubSkillCard } from "./components/GeneHubSkillCard";
import { GeneHubInstallJobList } from "./components/GeneHubInstallJobList";
import { GeneHubInstalledSkillList } from "./components/GeneHubInstalledSkillList";
import { GeneHubInstallLogPanel } from "./components/GeneHubInstallLogPanel";

type TabKey = "available" | "installed" | "pending" | "logs";

export default function GeneHubSkillCenterPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("available");
  const {
    connection,
    authorizedSkills,
    pendingJobs,
    installLogs,
    loading,
    error,
    actionPending,
    refresh,
    probeConnection,
    initialize,
    syncInstalled,
    installSkill,
    updateSkill,
    uninstallSkill,
    installPendingJob,
  } = useGeneHubRuntime();

  return (
    <div className="hermes-page hermes-genehub-page">
      <header className="hermes-page__header">
        <h2>{t("workspaces.hermes.geneHub.title")}</h2>
        <button type="button" className="hermes-btn-ghost" disabled={loading} onClick={() => void refresh()}>
          {t("workspaces.hermes.common.refresh")}
        </button>
      </header>

      {loading ? <p className="hermes-muted">{t("workspaces.hermes.common.loading")}</p> : null}
      {error ? <p className="hermes-page__error">{error}</p> : null}

      <GeneHubConnectionCard
        connection={connection}
        actionPending={actionPending}
        onProbe={() => void probeConnection()}
        onInitialize={() => void initialize()}
        onSync={() => void syncInstalled()}
      />

      <nav className="hermes-skills-inner-tabs" aria-label="GeneHub sections">
        {(
          [
            ["available", t("workspaces.hermes.geneHub.tabAvailable")],
            ["installed", t("workspaces.hermes.geneHub.tabInstalled")],
            ["pending", t("workspaces.hermes.geneHub.tabPending")],
            ["logs", t("workspaces.hermes.geneHub.tabLogs")],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`hermes-skills-inner-tabs__btn${activeTab === key ? " is-active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "available" ? (
        <div className="hermes-genehub-grid">
          {authorizedSkills.filter((s) => !s.installed).length === 0 ? (
            <p className="hermes-muted">{t("workspaces.hermes.geneHub.emptyAvailable")}</p>
          ) : (
            authorizedSkills
              .filter((s) => !s.installed)
              .map((skill) => (
                <GeneHubSkillCard
                  key={skill.geneSlug}
                  skill={skill}
                  actionPending={actionPending}
                  onInstall={() => void installSkill(skill.geneSlug)}
                  onUpdate={() => void updateSkill(skill.geneSlug)}
                  onUninstall={() => void uninstallSkill(skill.geneSlug)}
                />
              ))
          )}
        </div>
      ) : null}

      {activeTab === "installed" ? (
        <GeneHubInstalledSkillList
          skills={authorizedSkills}
          actionPending={actionPending}
          onUpdate={(slug) => void updateSkill(slug)}
          onUninstall={(slug) => void uninstallSkill(slug)}
        />
      ) : null}

      {activeTab === "pending" ? (
        <GeneHubInstallJobList
          jobs={pendingJobs}
          actionPending={actionPending}
          onInstall={(jobId) => void installPendingJob(jobId)}
        />
      ) : null}

      {activeTab === "logs" ? <GeneHubInstallLogPanel logs={installLogs} /> : null}
    </div>
  );
}
