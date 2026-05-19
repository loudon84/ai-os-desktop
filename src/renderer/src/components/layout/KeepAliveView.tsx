import type { ReactNode } from "react";

export interface KeepAliveViewProps {
  active: boolean;
  className?: string;
  children: ReactNode;
}

export function KeepAliveView({
  active,
  className = "",
  children,
}: KeepAliveViewProps): React.JSX.Element {
  return (
    <div
      className={className}
      aria-hidden={!active}
      style={{
        display: active ? "flex" : "none",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
