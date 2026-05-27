import { useCallback, useEffect, useMemo, useState } from "react";
import { PROVIDERS } from "../../../../../constants";
import { STORAGE_KEYS } from "../../../constants";
import { hermesDefaultApi } from "../../../api/hermesDefaultApi";
import type {
  HermesChatModel,
  HermesChatModelConfig,
} from "../../../../../../../shared/hermes-default-chat/hermes-default-chat-contract";

export type ModelGroup = {
  provider: string;
  providerLabel: string;
  models: Array<{
    id: string;
    label: string;
    provider: string | null;
    base_url: string | null;
  }>;
};

function groupModels(models: HermesChatModel[]): ModelGroup[] {
  const map = new Map<string, ModelGroup>();
  for (const m of models) {
    const provider = m.provider ?? "other";
    if (!map.has(provider)) {
      map.set(provider, {
        provider,
        providerLabel: PROVIDERS.labels[provider] ?? provider,
        models: [],
      });
    }
    map.get(provider)!.models.push({
      id: m.id,
      label: m.label,
      provider: m.provider ?? null,
      base_url: m.base_url ?? null,
    });
  }
  return Array.from(map.values());
}

function readStoredChatModelId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chatPendingModelId);
    const id = raw?.trim();
    return id || null;
  } catch {
    return null;
  }
}

function writeStoredChatModelId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.chatPendingModelId, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.chatPendingModelId);
    }
  } catch {
    /* ignore quota */
  }
}

function resolvePendingFromList(
  models: HermesChatModel[],
): HermesChatModel | null {
  const storedId = readStoredChatModelId();
  if (storedId) {
    const match = models.find((m) => m.id === storedId);
    if (match) return match;
  }
  return models.find((m) => m.is_current) ?? null;
}

export function useHermesDefaultChatModels(gatewayReady: boolean): {
  models: HermesChatModel[];
  modelGroups: ModelGroup[];
  config: HermesChatModelConfig | null;
  displayModel: string;
  status: string | null;
  loading: boolean;
  reload: () => Promise<void>;
  pendingModel: HermesChatModel | null;
  selectModel: (model: HermesChatModel) => void;
  saveAsDefault: () => Promise<void>;
} {
  const [models, setModels] = useState<HermesChatModel[]>([]);
  const [config, setConfig] = useState<HermesChatModelConfig | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingModel, setPendingModel] = useState<HermesChatModel | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [list, cfg] = await Promise.all([
        hermesDefaultApi.chat.listModels(),
        hermesDefaultApi.chat.getModelConfig(),
      ]);
      setModels(list.models);
      setStatus(list.status ?? null);
      setConfig(cfg);
      setPendingModel(resolvePendingFromList(list.models));
    } catch {
      setModels([]);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, gatewayReady]);

  /** Session-only selection; does not write config.yaml or restart Gateway. */
  const selectModel = useCallback((model: HermesChatModel) => {
    setPendingModel(model);
    writeStoredChatModelId(model.id);
  }, []);

  const saveAsDefault = useCallback(async () => {
    if (!pendingModel) return;
    const saved = await hermesDefaultApi.chat.setModelConfig({
      provider: pendingModel.provider ?? "auto",
      model_id: pendingModel.id,
      model_label: pendingModel.label,
      base_url: pendingModel.base_url ?? null,
    });
    setConfig(saved);
    await reload();
  }, [pendingModel, reload]);

  const displayModel = useMemo(() => {
    if (pendingModel) return pendingModel.label;
    if (config?.model_label) return config.model_label;
    if (config?.model_id) return config.model_id;
    return "Model";
  }, [pendingModel, config]);

  return {
    models,
    modelGroups: groupModels(models),
    config,
    displayModel,
    status,
    loading,
    pendingModel,
    reload,
    selectModel,
    saveAsDefault,
  };
}

