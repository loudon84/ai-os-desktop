import { join, dirname } from "path";
import { existsSync } from "fs";
import { app } from "electron";
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

function isPortalMonorepoRoot(dir: string): boolean {
  if (!dir) return false;
  return (
    existsSync(join(dir, "package.json")) &&
    existsSync(join(dir, "backend")) &&
    existsSync(join(dir, "frontend"))
  );
}

function portalMonorepoCandidates(): string[] {
  const paths = resolveCopilotRuntimePaths();
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string | undefined): void => {
    if (!raw) return;
    const normalized = raw.trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  };

  add(process.env.COPILOT_PORTAL_ROOT);

  try {
    const appPath = app.getAppPath();
    add(appPath);
    add(dirname(appPath));
    add(join(appPath, ".."));
    add(join(appPath, "../.."));
  } catch {
    /* app not ready */
  }

  // out/main → copilot-desktop → smc-coworker-full (portal monorepo parent)
  add(join(__dirname, "../.."));
  add(join(__dirname, "../../.."));

  add(paths.portalSourceRoot);
  add(paths.portalRuntimeRoot);
  add(join(paths.runtimeRoot, "ai-os-full"));

  return out;
}

function resolvePortalMonorepoRoot(): string {
  for (const candidate of portalMonorepoCandidates()) {
    if (isPortalMonorepoRoot(candidate)) {
      return candidate;
    }
  }

  const paths = resolveCopilotRuntimePaths();
  return paths.portalSourceRoot;
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
  return isPortalMonorepoRoot(getAiOsPaths().aiosRoot);
}

export function clearPathCache(): void {
  _cachedPaths = null;
}
