import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHermesDefault } from "../../context/HermesDefaultContext";

export default function HermesModelsPage() {
  const { t } = useTranslation();
  const { models, runtime } = useHermesDefault();
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({
    name: "",
    provider: "",
    model: "",
    baseUrl: "",
  });

  const startEdit = (m: {
    id: string;
    name: string;
    provider: string;
    model: string;
    baseUrl: string;
  }) => {
    setEditingId(m.id);
    setEditFields({
      name: m.name,
      provider: m.provider,
      model: m.model,
      baseUrl: m.baseUrl,
    });
  };

  const saveEdit = async (id: string) => {
    await models.update(id, editFields);
    setEditingId(null);
    await models.refresh();
  };

  const handleSetActive = async (p: string, m: string, url: string) => {
    await models.setActive(p, m, url);
    await models.refresh();
    await runtime.refresh();
  };

  return (
    <div className="hermes-page">
      <header className="hermes-page__header">
        <h2>{t("workspaces.hermes.models.title")}</h2>
        <button type="button" className="hermes-btn-ghost" onClick={() => void models.refresh()}>
          {t("workspaces.hermes.common.refresh")}
        </button>
      </header>
      {models.active ? (
        <p className="hermes-muted">
          {t("workspaces.hermes.models.activeLabel", {
            provider: models.active.provider,
            model: models.active.model,
          })}
        </p>
      ) : null}
      {models.error ? <p className="hermes-page__error">{models.error}</p> : null}
      <ul className="hermes-list">
        {models.models.map((m) => (
          <li key={m.id}>
            {editingId === m.id ? (
              <div className="hermes-models-form hermes-models-form--inline">
                <input
                  className="hermes-input"
                  value={editFields.name}
                  onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                />
                <input
                  className="hermes-input"
                  value={editFields.provider}
                  onChange={(e) => setEditFields((f) => ({ ...f, provider: e.target.value }))}
                />
                <input
                  className="hermes-input"
                  value={editFields.model}
                  onChange={(e) => setEditFields((f) => ({ ...f, model: e.target.value }))}
                />
                <input
                  className="hermes-input"
                  value={editFields.baseUrl}
                  onChange={(e) => setEditFields((f) => ({ ...f, baseUrl: e.target.value }))}
                />
                <button
                  type="button"
                  className="hermes-btn-primary"
                  onClick={() => void saveEdit(m.id)}
                >
                  {t("workspaces.hermes.common.save")}
                </button>
                <button
                  type="button"
                  className="hermes-btn-ghost"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <strong>{m.name}</strong> — {m.provider}/{m.model}
                <button
                  type="button"
                  className="hermes-btn-primary"
                  onClick={() => void handleSetActive(m.provider, m.model, m.baseUrl)}
                >
                  {t("workspaces.hermes.models.setActive")}
                </button>
                <button
                  type="button"
                  className="hermes-btn-ghost"
                  onClick={() => startEdit(m)}
                >
                  {t("workspaces.hermes.models.edit")}
                </button>
                <button
                  type="button"
                  className="hermes-btn-ghost"
                  onClick={() => void models.remove(m.id).then(() => models.refresh())}
                >
                  Remove
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <section className="hermes-models-form">
        <h3>{t("workspaces.hermes.models.add")}</h3>
        <input
          className="hermes-input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="hermes-input"
          placeholder="Provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        />
        <input
          className="hermes-input"
          placeholder="Model id"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <input
          className="hermes-input"
          placeholder="Base URL"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
        <button
          type="button"
          className="hermes-btn-primary"
          onClick={() =>
            void models.add(name, provider, model, baseUrl).then(() => {
              setName("");
              setProvider("");
              setModel("");
              setBaseUrl("");
              return models.refresh();
            })
          }
        >
          {t("workspaces.hermes.models.add")}
        </button>
      </section>
    </div>
  );
}
