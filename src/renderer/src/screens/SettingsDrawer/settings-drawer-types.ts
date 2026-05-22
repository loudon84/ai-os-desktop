export type SettingsDrawerPanel =
  | "server"
  | "general"
  | "account"
  | "runtime"
  | "profiles"
  | "desktop";

export const SETTINGS_DRAWER_PANELS: SettingsDrawerPanel[] = [
  "server",
  "general",
  "account",
  "runtime",
  "profiles",
  "desktop",
];

const VALID_PANELS = new Set<string>(SETTINGS_DRAWER_PANELS);

export function isSettingsDrawerPanel(value: string | undefined): value is SettingsDrawerPanel {
  return value !== undefined && VALID_PANELS.has(value);
}
