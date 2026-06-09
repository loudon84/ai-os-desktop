import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { profileHome } from "../utils";
import { safeWriteFile } from "../utils";

const CACHE_VERSION = "v6.4.1";
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export interface McpToolsCacheEntry {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export interface McpToolsCacheFile {
  version: string;
  lastSyncAt: string;
  server: {
    name: string;
    transport: "streamable_http";
    upstreamUrl: string;
  };
  tools: McpToolsCacheEntry[];
}

function cachePath(): string {
  return join(profileHome(), "desktop", "mcp-tools-cache.json");
}

export function readMcpToolsCache(): McpToolsCacheFile | null {
  const path = cachePath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as McpToolsCacheFile;
  } catch {
    return null;
  }
}

export function writeMcpToolsCache(payload: Omit<McpToolsCacheFile, "version">): McpToolsCacheFile {
  const file: McpToolsCacheFile = {
    version: CACHE_VERSION,
    ...payload,
  };
  safeWriteFile(cachePath(), JSON.stringify(file, null, 2));
  return file;
}

export function isMcpToolsCacheStale(cache: McpToolsCacheFile | null): boolean {
  if (!cache?.lastSyncAt) return true;
  const ts = Date.parse(cache.lastSyncAt);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > STALE_AFTER_MS;
}
