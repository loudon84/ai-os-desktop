import type { PropsWithChildren } from "react";
import type { WebOperatorPanelDefinition } from "./web-operator-panels-contract";

export interface WebOperatorPanelCardProps extends PropsWithChildren {
  panel: WebOperatorPanelDefinition;
  focused: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

export function WebOperatorPanelCard({
  panel,
  focused,
  panelRef,
  children,
}: WebOperatorPanelCardProps): React.JSX.Element {
  return (
    <section
      ref={panelRef}
      data-panel-id={panel.id}
      className={[
        "web-operator-panels__card",
        `web-operator-panels__card--${panel.size}`,
        focused ? "web-operator-panels__card--focused" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="web-operator-panels__card-body">{children}</div>
    </section>
  );
}

