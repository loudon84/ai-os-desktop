import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../../../components/useI18n";
import { getCachedVersion } from "../settings-shared";

export interface HermesAgentSectionProps {
  profile?: string;
}

export function HermesAgentSection({ profile }: HermesAgentSectionProps): React.JSX.Element {
  const { t } = useI18n();
  const [hermesHome, setHermesHome] = useState("");
  const [hermesVersion, setHermesVersion] = useState<string | null>(getCachedVersion);
  const [appVersion, setAppVersion] = useState("");
  const [doctorOutput, setDoctorOutput] = useState<string | null>(null);
  const [doctorRunning, setDoctorRunning] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);
  const [updateResultType, setUpdateResultType] = useState<"success" | "error" | null>(null);
  const [dumpOutput, setDumpOutput] = useState<string | null>(null);
  const [dumpRunning, setDumpRunning] = useState(false);

  const loadConfig = useCallback(async (): Promise<void> => {
    const [home, aVersion] = await Promise.all([
      window.hermesAPI.getHermesHome(profile),
      window.hermesAPI.getAppVersion(),
    ]);
    setHermesHome(home);
    setAppVersion(aVersion);

    window.hermesAPI.getHermesVersion().then((v) => {
      setHermesVersion(v);
      if (v) {
        try {
          localStorage.setItem("hermes-version-cache", v);
        } catch {
          /* ignore */
        }
      }
    });
  }, [profile]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function handleDoctor(): Promise<void> {
    setDoctorRunning(true);
    setDoctorOutput(null);
    const output = await window.hermesAPI.runHermesDoctor();
    setDoctorOutput(output);
    setDoctorRunning(false);
  }

  function refreshVersion(): void {
    window.hermesAPI.refreshHermesVersion().then((v) => {
      setHermesVersion(v);
      if (v) {
        try {
          localStorage.setItem("hermes-version-cache", v);
        } catch {
          /* ignore */
        }
      }
    });
  }

  async function handleUpdateHermes(): Promise<void> {
    setUpdating(true);
    setUpdateResult(null);
    const result = await window.hermesAPI.runHermesUpdate();
    setUpdating(false);
    if (result.success) {
      setUpdateResult(t("settings.updateSuccess"));
      setUpdateResultType("success");
      refreshVersion();
    } else {
      setUpdateResult(result.error || t("settings.updateFailed"));
      setUpdateResultType("error");
    }
  }

  const parsedVersion = (() => {
    if (!hermesVersion) return null;
    const v = hermesVersion;
    const version = v.match(/v([\d.]+)/)?.[1] || "";
    const date = v.match(/\(([\d.]+)\)/)?.[1] || "";
    const python = v.match(/Python:\s*([\d.]+)/)?.[1] || "";
    const sdk = v.match(/OpenAI SDK:\s*([\d.]+)/)?.[1] || "";
    const updateMatch = v.match(/Update available:\s*(.+?)(?:\s*—|$)/);
    const updateInfo = updateMatch?.[1]?.trim() || null;
    return { version, date, python, sdk, updateInfo };
  })();

  return (
    <section className="settings-section">
      <div className="settings-section-title">{t("settings.sections.hermesAgent")}</div>
      <div className="settings-hermes-info">
        <div className="settings-hermes-row">
          <div className="settings-hermes-detail">
            <span className="settings-hermes-label">{t("common.engine")}</span>
            {hermesVersion === null ? (
              <span className="skeleton skeleton-sm" />
            ) : (
              <span className="settings-hermes-value">
                {parsedVersion ? `v${parsedVersion.version}` : t("settings.notDetected")}
              </span>
            )}
          </div>
          <div className="settings-hermes-detail">
            <span className="settings-hermes-label">{t("common.released")}</span>
            {hermesVersion === null ? (
              <span className="skeleton skeleton-sm" />
            ) : (
              <span className="settings-hermes-value">{parsedVersion?.date || "—"}</span>
            )}
          </div>
          <div className="settings-hermes-detail">
            <span className="settings-hermes-label">{t("common.desktop")}</span>
            {!appVersion ? (
              <span className="skeleton skeleton-sm" />
            ) : (
              <span className="settings-hermes-value">
                {t("settings.version", { version: appVersion })}
              </span>
            )}
          </div>
          <div className="settings-hermes-detail">
            <span className="settings-hermes-label">Python</span>
            {hermesVersion === null ? (
              <span className="skeleton skeleton-sm" />
            ) : (
              <span className="settings-hermes-value">{parsedVersion?.python || "—"}</span>
            )}
          </div>
          <div className="settings-hermes-detail">
            <span className="settings-hermes-label">OpenAI SDK</span>
            {hermesVersion === null ? (
              <span className="skeleton skeleton-sm" />
            ) : (
              <span className="settings-hermes-value">{parsedVersion?.sdk || "—"}</span>
            )}
          </div>
          <div className="settings-hermes-detail">
            <span className="settings-hermes-label">{t("common.home")}</span>
            {!hermesHome ? (
              <span className="skeleton skeleton-md" />
            ) : (
              <span className="settings-hermes-value settings-hermes-path">{hermesHome}</span>
            )}
          </div>
        </div>
        {parsedVersion?.updateInfo ? (
          <div className="settings-hermes-update-badge">{parsedVersion.updateInfo}</div>
        ) : null}
        <div className="settings-hermes-actions">
          {parsedVersion?.updateInfo ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleUpdateHermes()}
              disabled={updating}
            >
              {updating ? t("settings.updating") : t("settings.updateEngine")}
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" disabled>
              {t("settings.latestVersion")}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void handleDoctor()}
            disabled={doctorRunning}
          >
            {doctorRunning ? t("settings.runningDiagnosis") : t("settings.runDiagnosis")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              setDumpRunning(true);
              setDumpOutput(null);
              const output = await window.hermesAPI.runHermesDump();
              setDumpOutput(output);
              setDumpRunning(false);
            }}
            disabled={dumpRunning}
          >
            {dumpRunning ? t("settings.running") : t("settings.debugDump")}
          </button>
        </div>
        {updateResult ? (
          <div className={`settings-hermes-result ${updateResultType || "error"}`}>
            {updateResult}
          </div>
        ) : null}
        {doctorOutput ? <pre className="settings-hermes-doctor">{doctorOutput}</pre> : null}
        {dumpOutput ? <pre className="settings-hermes-doctor">{dumpOutput}</pre> : null}
      </div>
    </section>
  );
}
