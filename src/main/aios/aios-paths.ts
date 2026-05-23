import { join } from "path";
import { existsSync } from "fs";
import { resolveCopilotRuntimePaths } from "../runtime/runtime-paths";

let _cachedPaths: AiOsPaths | null = null;

export interface AiOsPaths {
  aiosRoot: string;
  backendDir: string;
  frontendDir: string;
  envFilePath: string;
  logsDir: string;
  dataDir: string;
}

function resolvePortalMonorepoRoot(): string {
  const paths = resolveCopilotRuntimePaths();
  const portalSource = paths.portalSourceRoot;
  const portalRuntime = paths.portalRuntimeRoot;

  if (existsSync(join(portalSource, "package.json"))) {
    return portalSource;
  }
  if (existsSync(join(portalRuntime, "package.json"))) {
    return portalRuntime;
  }

  const legacyRoot = join(paths.runtimeRoot, "ai-os-full");
  if (existsSync(join(legacyRoot, "package.json"))) {
    return legacyRoot;
  }

  return portalSource;
}

export function getAiOsPaths(): AiOsPaths {
  if (_cachedPaths) return _cachedPaths;

  const paths = resolveCopilotRuntimePaths();
  const aiosRoot = resolvePortalMonorepoRoot();
  const logsDir = join(paths.portalRuntimeRoot, "logs");
  const dataDir = join(paths.runtimeRoot, "data");

  _cachedPaths = {
    aiosRoot,
    backendDir: join(aiosRoot, "backend"),
    frontendDir: join(aiosRoot, "frontend"),
    envFilePath: join(paths.portalRuntimeRoot, ".env.local"),
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
