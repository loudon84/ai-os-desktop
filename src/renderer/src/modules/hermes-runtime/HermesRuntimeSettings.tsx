import { useState } from "react";
import {
  HERMES_RUNTIME_IMPLEMENTED_SECTIONS,
  type HermesRuntimeImplementedSection,
} from "./hermes-runtime-types";
import { HermesOverviewSection } from "./sections/HermesOverviewSection";
import { HermesInstallSection } from "./sections/HermesInstallSection";
import { HermesGatewaySection } from "./sections/HermesGatewaySection";
import { HermesDoctorSection } from "./sections/HermesDoctorSection";
import { HermesLogsSection } from "./sections/HermesLogsSection";
import { HermesConnectionSection } from "./sections/HermesConnectionSection";
import { useI18n } from "../../components/useI18n";

export interface HermesRuntimeSettingsProps {
  activeProfile: string;
}

function SectionBody({ section }: { section: HermesRuntimeImplementedSection }): React.JSX.Element {
  switch (section) {
    case "overview":
      return <HermesOverviewSection />;
    case "install":
      return <HermesInstallSection />;
    case "gateway":
      return <HermesGatewaySection />;
    case "doctor":
      return <HermesDoctorSection />;
    case "logs":
      return <HermesLogsSection />;
    case "connection":
      return <HermesConnectionSection />;
  }
}

export function HermesRuntimeSettings({
  activeProfile,
}: HermesRuntimeSettingsProps): React.JSX.Element {
  const { t } = useI18n();
  const [section, setSection] = useState<HermesRuntimeImplementedSection>("overview");

  return (
    <div className="flex h-full min-h-0">
      <nav className="w-36 shrink-0 border-r border-zinc-800 p-2 space-y-0.5 overflow-y-auto">
        {HERMES_RUNTIME_IMPLEMENTED_SECTIONS.map((id) => (
          <button
            key={id}
            type="button"
            className={`w-full rounded px-2 py-1.5 text-left text-xs ${
              section === id
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800"
            }`}
            onClick={() => setSection(id)}
          >
            {t(`runtimeSettings.${id}`)}
          </button>
        ))}
      </nav>
      <div className="min-w-0 flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-xs text-zinc-500">
          {t("runtimeSettings.profileLabel", { profile: activeProfile })}
        </p>
        <SectionBody section={section} />
      </div>
    </div>
  );
}
