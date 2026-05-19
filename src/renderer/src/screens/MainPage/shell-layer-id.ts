import type { View } from "../../types/desktop-shell";

/** Resolves the ShellView layer id for navigation actions, or null if not a web view tab. */
export function resolveActiveShellLayerId(view: View): string | null {
  if (view === "web-operator") {
    return "web-operator";
  }

  if (typeof view === "string" && view.startsWith("external-browser:")) {
    return view;
  }

  return null;
}
