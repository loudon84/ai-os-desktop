import { join } from "path";
import { existsSync } from "fs";
import { resolveInstallLocation } from "../enterprise/windows/install-location-resolver";

let _cachedPaths: AiOsPaths | null = null;

export interface AiOsPaths {
  aiosRoot: string;
  backendDir: string;
  frontendDir: string;
  envFilePath: string;
  logsDir: string;
  dataDir: string;
}

export function getAiOsPaths(): AiOsPaths {
  if (_cachedPaths) return _cachedPaths;

  const location = resolveInstallLocation();
  const runtimeRoot = location.runtimeRoot;

  const aiosRoot = join(runtimeRoot, "ai-os-full");
  const logsDir = join(runtimeRoot, "logs");
  const dataDir = join(runtimeRoot, "data");

  _cachedPaths = {
    aiosRoot,
    backendDir: join(aiosRoot, "backend"),
    frontendDir: join(aiosRoot, "frontend"),
    envFilePath: join(aiosRoot, ".env.desktop.local"),
    logsDir,
    dataDir,
  };

  return _cachedPaths;
}

export function isAiOsInstalled(): boolean {
  const paths = getAiOsPaths();
  return existsSync(paths.aiosRoot) && existsSync(join(paths.aiosRoot, "package.json"));
}

export function clearPathCache(): void {
  _cachedPaths = null;
}
