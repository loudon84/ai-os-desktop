import { useContext } from "react";
import { WebOperatorPageContextReact } from "./WebOperatorPageContext";

export function useWebOperatorPageContext() {
  const ctx = useContext(WebOperatorPageContextReact);
  if (!ctx) {
    throw new Error("useWebOperatorPageContext must be used within WebOperatorPageContextProvider");
  }
  return ctx;
}
