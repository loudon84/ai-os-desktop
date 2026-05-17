import {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { PipMirrorConfig } from "../../shared/enterprise/pip-mirror-presets";
import { resolveInstallLocation } from "./windows/install-location-resolver";
import { getRegistryInfo } from "./windows/install-location-resolver";

export type AgentSourceType = "local-zip" | "git-clone";

export interface AgentSourceConfig {
  sourceType: AgentSourceType;
  localZipPath?: string;
  gitUrl?: string;
  gitBranch?: string;
  gitShallow?: boolean;
  pipIndexUrl?: string;
  trustedHost?: string;
  pipMirrorPreset?: string;
}

export interface DesktopRuntimeConfig {
  installDir: string;
  runtimeRoot: string;
  binDir: string;
  agentDir: string;
  hermesHome: string;
  addToPath: boolean;
  agentSource?: AgentSourceConfig;
  pipMirror?: PipMirrorConfig;
}

const CONFIG_FILENAME = "desktop-runtime.json";

function getConfigFilePath(): string {
  const loc = resolveInstallLocation();
  return join(loc.runtimeRoot, CONFIG_FILENAME);
}

export function writeRuntimeConfig(config: DesktopRuntimeConfig): void {
  const configPath = getConfigFilePath();
  const configDir = dirname(configPath);

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const tmpPath = configPath + ".tmp";
  writeFileSync(tmpPath, JSON.stringify(config, null, 2), "utf-8");
  renameSync(tmpPath, configPath);
}

export function readRuntimeConfig(): DesktopRuntimeConfig | null {
  const configPath = getConfigFilePath();
  if (!existsSync(configPath)) return null;

  try {
    const raw = readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as DesktopRuntimeConfig;
  } catch {
    /* corrupted config */
  }

  return null;
}

export function verifyRegistryConsistency(): boolean {
  const config = readRuntimeConfig();
  if (!config) return true;

  const regInfo = getRegistryInfo();
  if (!regInfo.installLocation) return false;

  return config.installDir === regInfo.installLocation;
}

export function createDefaultRuntimeConfig(
  agentSource?: AgentSourceConfig,
  pipMirror?: PipMirrorConfig,
): DesktopRuntimeConfig {
  const loc = resolveInstallLocation();
  return {
    installDir: loc.installDir,
    runtimeRoot: loc.runtimeRoot,
    binDir: loc.binDir,
    agentDir: loc.agentDir,
    hermesHome: join(homedir(), ".hermes"),
    addToPath: true,
    agentSource,
    pipMirror,
  };
}

/** Merge partial config into existing desktop-runtime.json without clobbering user fields. */
export function mergeRuntimeConfig(
  partial: Partial<DesktopRuntimeConfig>,
): DesktopRuntimeConfig {
  const existing = readRuntimeConfig();
  const defaults = createDefaultRuntimeConfig();

  const merged: DesktopRuntimeConfig = {
    ...defaults,
    ...existing,
    ...partial,
    agentSource: partial.agentSource ?? existing?.agentSource ?? defaults.agentSource,
    pipMirror: partial.pipMirror ?? existing?.pipMirror ?? defaults.pipMirror,
    hermesHome: partial.hermesHome ?? existing?.hermesHome ?? defaults.hermesHome,
  };

  writeRuntimeConfig(merged);
  return merged;
}
