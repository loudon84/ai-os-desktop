import { useEffect, useState } from "react";

export function WindowControls(): React.JSX.Element | null {
  const [isMaximized, setIsMaximized] = useState(false);

  const isMac = navigator.platform.toLowerCase().includes("mac");

  useEffect(() => {
    if (isMac) return;

    window.hermesAPI.windowControls
      .isMaximized()
      .then(setIsMaximized)
      .catch(() => setIsMaximized(false));
  }, [isMac]);

  if (isMac) {
    return null;
  }

  return (
    <div className="window-controls no-drag" aria-label="Window controls">
      <button
        type="button"
        className="window-control-button"
        aria-label="Minimize"
        onClick={() => void window.hermesAPI.windowControls.minimize()}
      >
        —
      </button>

      <button
        type="button"
        className="window-control-button"
        aria-label={isMaximized ? "Restore" : "Maximize"}
        onClick={async () => {
          await window.hermesAPI.windowControls.maximizeOrRestore();
          const next = await window.hermesAPI.windowControls.isMaximized();
          setIsMaximized(next);
        }}
      >
        {isMaximized ? "❐" : "□"}
      </button>

      <button
        type="button"
        className="window-control-button window-control-button--close"
        aria-label="Close"
        onClick={() => void window.hermesAPI.windowControls.close()}
      >
        ×
      </button>
    </div>
  );
}
