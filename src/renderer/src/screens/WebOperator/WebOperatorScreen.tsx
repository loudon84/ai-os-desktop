import { WebContentsHost } from "../../components/shell/WebContentsHost";
import { BrowserToolbar } from "./BrowserToolbar";
import { BrowserStatePanel } from "./BrowserStatePanel";
import { ScreenshotPanel } from "./ScreenshotPanel";
import { BrowserActionLog } from "./BrowserActionLog";
import "./web-operator.css";
import { WEB_OPERATOR_LAYER_ID } from "./web-operator-constants";

export function WebOperatorScreen(): React.JSX.Element {
  // View lifecycle: lazy create via shell:view:set-bounds (WebContentsHost) or
  // ShellBrowserViewAdapter on browser.open — never destroy/recreate on sidebar switch.

  return (
    <div className="web-operator-layout">
      <div className="web-operator-layout__main">
        <BrowserToolbar />
        <WebContentsHost
          layerId={WEB_OPERATOR_LAYER_ID}
          className="web-operator-layout__viewport"
        />
      </div>

      <div className="web-operator-layout__side">
        <BrowserStatePanel className="flex-1 overflow-hidden" />
        <div className="web-operator-layout__panel">
          <ScreenshotPanel />
        </div>
        <div className="web-operator-layout__panel web-operator-layout__panel--grow">
          <BrowserActionLog className="flex-1" />
        </div>
      </div>
    </div>
  );
}
