import { useState } from "react";
import { useHermesDefault } from "../../context/HermesDefaultContext";

export default function HermesModelsPage() {
  const { models } = useHermesDefault();
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  return (
    <div className="hermes-page">
      <header className="hermes-page__header">
        <h2>Models</h2>
        <button type="button" className="hermes-btn-ghost" onClick={() => void models.refresh()}>
          Refresh
        </button>
      </header>
      {models.active ? (
        <p className="hermes-muted">
          Active: {models.active.provider} / {models.active.model}
        </p>
      ) : null}
      {models.error ? <p className="hermes-page__error">{models.error}</p> : null}
      <ul className="hermes-list">
        {models.models.map((m) => (
          <li key={m.id}>
            <strong>{m.name}</strong> — {m.provider}/{m.model}
            <button
              type="button"
              className="hermes-btn-primary"
              onClick={() =>
                void models.setActive(m.provider, m.model, m.baseUrl).then(() => models.refresh())
              }
            >
              Set active
            </button>
            <button
              type="button"
              className="hermes-btn-ghost"
              onClick={() => void models.remove(m.id).then(() => models.refresh())}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <section className="hermes-models-form">
        <h3>Add model</h3>
        <input className="hermes-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="hermes-input" placeholder="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} />
        <input className="hermes-input" placeholder="Model id" value={model} onChange={(e) => setModel(e.target.value)} />
        <input className="hermes-input" placeholder="Base URL" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
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
          Add
        </button>
      </section>
    </div>
  );
}
