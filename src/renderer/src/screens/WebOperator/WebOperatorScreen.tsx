import { useEffect } from "react";
import { WebContentsHost } from "../../components/shell/WebContentsHost";
import { BrowserToolbar } from "./BrowserToolbar";
import { BrowserStatePanel } from "./BrowserStatePanel";
import { ScreenshotPanel } from "./ScreenshotPanel";
import { BrowserActionLog } from "./BrowserActionLog";
import "./web-operator.css";
import { WEB_OPERATOR_LAYER_ID } from "./web-operator-constants";

const WEB_OPERATOR_HOME_URL = "about:blank";

export function WebOperatorScreen(): React.JSX.Element {
  useEffect(() => {
    void window.shellView
      .create(WEB_OPERATOR_LAYER_ID, "web-operator", WEB_OPERATOR_HOME_URL, {
        layer: "content",
        sandbox: true,
      })
      .catch(() => {
        // View may already exist from a prior visit or lazy IPC create
      });
  }, []);

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
