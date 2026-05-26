import { useHermesDefault } from "../../context/HermesDefaultContext";

export default function HermesSkillsPage() {
  const { skills } = useHermesDefault();

  return (
    <div className="hermes-page">
      <header className="hermes-page__header">
        <h2>Skills</h2>
        <button type="button" className="hermes-btn-ghost" onClick={() => void skills.refresh()}>
          Refresh
        </button>
      </header>
      {skills.error ? <p className="hermes-page__error">{skills.error}</p> : null}
      <section>
        <h3>Installed</h3>
        <ul className="hermes-list">
          {skills.installed.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong> — {s.description}
              <button
                type="button"
                className="hermes-btn-ghost"
                onClick={() => void skills.uninstall(s.name).then(() => skills.refresh())}
              >
                Uninstall
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Bundled</h3>
        <ul className="hermes-list">
          {skills.bundled.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong> — {s.description}
              {!s.installed ? (
                <button
                  type="button"
                  className="hermes-btn-primary"
                  onClick={() => void skills.install(s.name).then(() => skills.refresh())}
                >
                  Install
                </button>
              ) : (
                <span className="hermes-muted"> installed</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
