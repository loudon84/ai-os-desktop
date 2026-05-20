import { WebContentsHost } from "../shell/WebContentsHost";

export interface WebViewWorkspaceProps {
  layerId: string;
  className?: string;
}

export function WebViewWorkspace({
  layerId,
  className = "h-full w-full min-h-0",
}: WebViewWorkspaceProps): React.JSX.Element {
  return <WebContentsHost layerId={layerId} className={className} />;
}
