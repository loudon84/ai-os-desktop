import { join } from "path";

/**
 * Resolve a compiled preload file path.
 *
 * electron-vite output convention:
 * - main:    out/main/**
 * - preload: out/preload/*.js
 *
 * Thus from compiled main files, `../preload/<file>` points to the preload bundle.
 */
export function resolveCompiledPreloadPath(fileName: string): string {
  return join(__dirname, "../preload", fileName);
}

