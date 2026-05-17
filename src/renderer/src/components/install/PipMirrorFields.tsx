import { useEffect, useState } from "react";
import { useI18n } from "../useI18n";
import {
  PIP_MIRROR_PRESETS,
  resolvePipMirrorFromPreset,
  trustedHostFromPipIndexUrl,
  type PipMirrorPresetId,
} from "../../../../shared/enterprise/pip-mirror-presets";

export interface PipMirrorSelection {
  pipMirrorPreset: PipMirrorPresetId;
  pipIndexUrl: string;
  trustedHost: string;
}

interface PipMirrorFieldsProps {
  value: PipMirrorSelection;
  onChange: (next: PipMirrorSelection) => void;
}

export function createDefaultPipMirrorSelection(): PipMirrorSelection {
  const preset = resolvePipMirrorFromPreset("tsinghua");
  return {
    pipMirrorPreset: "tsinghua",
    pipIndexUrl: preset.pipIndexUrl,
    trustedHost: preset.trustedHost,
  };
}

export function PipMirrorFields({
  value,
  onChange,
}: PipMirrorFieldsProps): React.JSX.Element {
  const { t } = useI18n();
  const [customUrl, setCustomUrl] = useState(
    value.pipMirrorPreset === "custom" ? value.pipIndexUrl : "",
  );
  const [customHost, setCustomHost] = useState(
    value.pipMirrorPreset === "custom" ? value.trustedHost : "",
  );

  useEffect(() => {
    if (value.pipMirrorPreset !== "custom") return;
    setCustomUrl(value.pipIndexUrl);
    setCustomHost(value.trustedHost);
  }, [value.pipMirrorPreset, value.pipIndexUrl, value.trustedHost]);

  function applyPreset(presetId: PipMirrorPresetId): void {
    if (presetId === "custom") {
      onChange({
        pipMirrorPreset: "custom",
        pipIndexUrl: customUrl,
        trustedHost: customHost || trustedHostFromPipIndexUrl(customUrl),
      });
      return;
    }
    const resolved = resolvePipMirrorFromPreset(presetId);
    onChange({
      pipMirrorPreset: presetId,
      pipIndexUrl: resolved.pipIndexUrl,
      trustedHost: resolved.trustedHost,
    });
  }

  return (
    <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("install.pipMirrorTitle")}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t("install.pipMirrorDesc")}
        </p>
      </div>

      <select
        className="input w-full"
        value={value.pipMirrorPreset}
        onChange={(e) => applyPreset(e.target.value as PipMirrorPresetId)}
      >
        {PIP_MIRROR_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {t(`install.${preset.labelKey}`)}
          </option>
        ))}
      </select>

      {value.pipMirrorPreset === "custom" ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("install.pipMirrorUrl")}
            </label>
            <input
              type="url"
              className="input w-full"
              value={customUrl}
              onChange={(e) => {
                const pipIndexUrl = e.target.value;
                setCustomUrl(pipIndexUrl);
                onChange({
                  pipMirrorPreset: "custom",
                  pipIndexUrl,
                  trustedHost:
                    customHost || trustedHostFromPipIndexUrl(pipIndexUrl),
                });
              }}
              placeholder="https://pypi.company.internal/simple"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("install.pipMirrorTrustedHost")}
            </label>
            <input
              type="text"
              className="input w-full"
              value={customHost}
              onChange={(e) => {
                const trustedHost = e.target.value;
                setCustomHost(trustedHost);
                onChange({
                  pipMirrorPreset: "custom",
                  pipIndexUrl: customUrl,
                  trustedHost:
                    trustedHost || trustedHostFromPipIndexUrl(customUrl),
                });
              }}
              placeholder="pypi.company.internal"
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 break-all">{value.pipIndexUrl}</p>
      )}
    </div>
  );
}
