import { useEffect, useState } from "react";
import { useI18n } from "../../../components/useI18n";

interface ProfileRow {
  name: string;
  model: string;
  provider: string;
  isDefault: boolean;
  isActive: boolean;
  skillCount: number;
  gatewayRunning: boolean;
}

export function AgentsPanel(): React.JSX.Element {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);

  useEffect(() => {
    void window.hermesAPI.listProfiles().then(setProfiles).catch(() => setProfiles([]));
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-900 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-200 mb-3">
        {t("navigation.agents", { defaultValue: "Agents / Profiles" })}
      </h2>
      <ul className="flex-1 overflow-y-auto space-y-2">
        {profiles.map((p) => (
          <li
            key={p.name}
            className="rounded border border-gray-800 px-3 py-2 text-xs text-gray-300"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-gray-100">{p.name}</span>
              {p.isActive ? (
                <span className="text-emerald-400">{t("navigation.active", { defaultValue: "Active" })}</span>
              ) : null}
            </div>
            <p className="text-gray-500 mt-1">
              {p.provider} / {p.model} · {p.skillCount} skills
            </p>
            <p className="text-gray-500">
              Gateway: {p.gatewayRunning ? "running" : "stopped"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
