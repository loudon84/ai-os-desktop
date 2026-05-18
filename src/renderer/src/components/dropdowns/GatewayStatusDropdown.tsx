import { useState, useEffect } from "react";

interface GatewayStatusData {
  running: boolean;
  profile: string;
  mode: "local" | "remote" | "ssh";
  port?: number;
  lastError?: string;
}

interface GatewayStatusDropdownProps {
  visible: boolean;
  position: { x: number; y: number };
  data: GatewayStatusData;
  onClose: () => void;
}

export function GatewayStatusDropdown({
  visible,
  position,
  data,
  onClose,
}: GatewayStatusDropdownProps): React.JSX.Element | null {
  const [isLoading, setIsLoading] = useState(false);

  if (!visible) return null;

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await window.hermesAPI.startGateway();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await window.hermesAPI.stopGateway();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    try {
      await window.hermesAPI.stopGateway();
      await window.hermesAPI.startGateway();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <div
      className="gateway-status-dropdown"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      <div className="dropdown-content">
        <div className="dropdown-header">
          <span
            className={`status-indicator ${data.running ? "running" : "stopped"}`}
          />
          <span className="status-text">
            {data.running ? "Running" : "Stopped"}
          </span>
        </div>

        <div className="dropdown-info">
          <div className="info-row">
            <span className="info-label">Profile:</span>
            <span className="info-value">{data.profile}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Mode:</span>
            <span className="info-value">{data.mode}</span>
          </div>
          {data.port && (
            <div className="info-row">
              <span className="info-label">Port:</span>
              <span className="info-value">{data.port}</span>
            </div>
          )}
        </div>

        {data.lastError && (
          <div className="dropdown-error">
            <span className="error-label">Error:</span>
            <span className="error-text">{data.lastError}</span>
          </div>
        )}

        <div className="dropdown-actions">
          {data.running ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleStop}
                disabled={isLoading}
              >
                {isLoading ? "Stopping..." : "Stop"}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRestart}
                disabled={isLoading}
              >
                {isLoading ? "Restarting..." : "Restart"}
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleStart}
              disabled={isLoading}
            >
              {isLoading ? "Starting..." : "Start"}
            </button>
          )}
        </div>
      </div>

      {/* Backdrop to close on click outside */}
      <div
        className="dropdown-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
        }}
      />
    </div>
  );
}
