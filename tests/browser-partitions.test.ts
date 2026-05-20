import { describe, it, expect } from "vitest";
import {
  externalBrowserPartition,
  WEB_OPERATOR_PARTITION,
  AIOS_HOME_PARTITION,
} from "../src/shared/shell/browser-partitions";

describe("externalBrowserPartition", () => {
  it("maps layer id to per-tab persist partition", () => {
    expect(externalBrowserPartition("external-browser:abc-123")).toBe(
      "persist:external-browser-abc-123",
    );
  });

  it("accepts bare uuid suffix", () => {
    expect(externalBrowserPartition("abc-123")).toBe("persist:external-browser-abc-123");
  });
});

describe("partition constants", () => {
  it("exports canonical home and web-operator partitions", () => {
    expect(AIOS_HOME_PARTITION).toBe("persist:aios-desktop");
    expect(WEB_OPERATOR_PARTITION).toBe("persist:aios-external-web");
  });
});
