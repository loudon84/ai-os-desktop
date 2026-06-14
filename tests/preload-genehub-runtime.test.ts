import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("preload genehubRuntime exposure", () => {
  it("exposes genehubRuntime in contextIsolation branch", () => {
    const source = readFileSync(resolve("src/preload/index.ts"), "utf8");
    expect(source).toContain(
      'contextBridge.exposeInMainWorld("genehubRuntime", genehubRuntimeApi)',
    );
    expect(source).toContain("window.genehubRuntime = genehubRuntimeApi");
  });
});
