import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { HermesPanelPageContext } from "../../../components/hermes";

export type WebOperatorPageContextValue = {
  pageContext: HermesPanelPageContext | null;
  setPageContext: (ctx: HermesPanelPageContext | null) => void;
};

export const WebOperatorPageContextReact = createContext<WebOperatorPageContextValue | null>(
  null,
);

export function WebOperatorPageContextProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const [pageContext, setPageContextState] = useState<HermesPanelPageContext | null>(null);

  const setPageContext = useCallback((ctx: HermesPanelPageContext | null) => {
    setPageContextState(ctx);
  }, []);

  const value = useMemo(
    () => ({
      pageContext,
      setPageContext,
    }),
    [pageContext, setPageContext],
  );

  return (
    <WebOperatorPageContextReact.Provider value={value}>
      {children}
    </WebOperatorPageContextReact.Provider>
  );
}
