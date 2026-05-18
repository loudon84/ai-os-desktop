import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const getConnectionConfig = vi.fn();
const resolveRuntimeState = vi.fn();
const testRemoteConnection = vi.fn();
const startSshTunnel = vi.fn();
const isSshTunnelHealthy = vi.fn();

vi.mock("electron", () => ({
  app: { getVersion: () => "0.1.7" },
}));

vi.mock("../src/main/config", () => ({
  getConnectionConfig,
}));

vi.mock("../src/main/enterprise/runtime-state-resolver", () => ({
  resolveRuntimeState,
}));

vi.mock("../src/main/hermes", () => ({
  testRemoteConnection,
}));

vi.mock("../src/main/ssh-tunnel", () => ({
  startSshTunnel,
  isSshTunnelHealthy,
}));

describe("resolveStartupDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Case A: Update skip install - runtime ready + model configured", () => {
    it("should return main when runtimeReady=true and modelConfigured=true", async () => {
      getConnectionConfig.mockReturnValue({ mode: "local" });
      resolveRuntimeState.mockReturnValue({
        runtimeReady: true,
        modelConfigured: true,
        updateMode: true,
        installDir: "/test",
        agentPath: "/test/agent",
        agentSourceExists: true,
        venvExists: true,
        hermesCliExists: true,
        needsAgentInstall: false,
        needsModelSetup: false,
      });

      const { resolveStartupDecision } =
        await import("../src/main/startup/startup-decision");
      const decision = await resolveStartupDecision();

      expect(decision.nextScreen).toBe("main");
      expect(decision.skipAgentInstall).toBe(true);
      expect(decision.skipModelSetup).toBe(true);
      expect(decision.shouldVerifyInBackground).toBe(true);
      expect(decision.reason).toBe("runtime-ready-model-configured");
      expect(decision.connectionMode).toBe("local");
    });
  });

  describe("Case B: Runtime ready but model not configured", () => {
    it("should return setup when runtimeReady=true but modelConfigured=false", async () => {
      getConnectionConfig.mockReturnValue({ mode: "local" });
      resolveRuntimeState.mockReturnValue({
        runtimeReady: true,
        modelConfigured: false,
        updateMode: false,
        installDir: "/test",
        agentPath: "/test/agent",
        agentSourceExists: true,
        venvExists: true,
        hermesCliExists: true,
        needsAgentInstall: false,
        needsModelSetup: true,
      });

      const { resolveStartupDecision } =
        await import("../src/main/startup/startup-decision");
      const decision = await resolveStartupDecision();

      expect(decision.nextScreen).toBe("setup");
      expect(decision.skipAgentInstall).toBe(true);
      expect(decision.skipModelSetup).toBe(false);
      expect(decision.shouldVerifyInBackground).toBe(true);
      expect(decision.reason).toBe("runtime-ready-model-missing");
    });
  });

  describe("Case C: Runtime not ready", () => {
    it("should return welcome when runtimeReady=false", async () => {
      getConnectionConfig.mockReturnValue({ mode: "local" });
      resolveRuntimeState.mockReturnValue({
        runtimeReady: false,
        modelConfigured: false,
        updateMode: false,
        installDir: "/test",
        agentPath: "/test/agent",
        agentSourceExists: false,
        venvExists: false,
        hermesCliExists: false,
        needsAgentInstall: true,
        needsModelSetup: true,
      });

      const { resolveStartupDecision } =
        await import("../src/main/startup/startup-decision");
      const decision = await resolveStartupDecision();

      expect(decision.nextScreen).toBe("welcome");
      expect(decision.skipAgentInstall).toBe(false);
      expect(decision.skipModelSetup).toBe(false);
      expect(decision.shouldVerifyInBackground).toBe(false);
      expect(decision.reason).toBe("runtime-missing");
    });
  });

  describe("Remote mode", () => {
    it("should return main when remote connection is ok", async () => {
      getConnectionConfig.mockReturnValue({
        mode: "remote",
        remoteUrl: "http://remote.test:8642",
        apiKey: "test-key",
      });
      testRemoteConnection.mockResolvedValue(true);

      const { resolveStartupDecision } =
        await import("../src/main/startup/startup-decision");
      const decision = await resolveStartupDecision();

      expect(decision.nextScreen).toBe("main");
      expect(decision.connectionMode).toBe("remote");
      expect(decision.skipAgentInstall).toBe(true);
      expect(decision.skipModelSetup).toBe(true);
      expect(decision.reason).toBe("remote-ready");
      expect(decision.runtime).toBeNull();
    });

    it("should return welcome when remote connection fails", async () => {
      getConnectionConfig.mockReturnValue({
        mode: "remote",
        remoteUrl: "http://remote.test:8642",
        apiKey: "test-key",
      });
      testRemoteConnection.mockResolvedValue(false);

      const { resolveStartupDecision } =
        await import("../src/main/startup/startup-decision");
      const decision = await resolveStartupDecision();

      expect(decision.nextScreen).toBe("welcome");
      expect(decision.connectionMode).toBe("remote");
      expect(decision.reason).toBe("remote-unreachable");
      expect(decision.error).toContain("Cannot reach remote Hermes");
    });
  });

  describe("SSH mode", () => {
    it("should return main when SSH tunnel is healthy", async () => {
      getConnectionConfig.mockReturnValue({
        mode: "ssh",
        ssh: {
          host: "test.example.com",
          port: 22,
          username: "test",
          keyPath: "/path/to/key",
          remotePort: 8642,
          localPort: 18642,
        },
      });
      startSshTunnel.mockResolvedValue(undefined);
      isSshTunnelHealthy.mockResolvedValue(true);

      const { resolveStartupDecision } =
        await import("../src/main/startup/startup-decision");
      const decision = await resolveStartupDecision();

      expect(decision.nextScreen).toBe("main");
      expect(decision.connectionMode).toBe("ssh");
      expect(decision.skipAgentInstall).toBe(true);
      expect(decision.skipModelSetup).toBe(true);
      expect(decision.reason).toBe("ssh-ready");
      expect(decision.runtime).toBeNull();
    });

    it("should return welcome when SSH tunnel fails", async () => {
      getConnectionConfig.mockReturnValue({
        mode: "ssh",
        ssh: {
          host: "test.example.com",
          port: 22,
          username: "test",
          keyPath: "/path/to/key",
          remotePort: 8642,
          localPort: 18642,
        },
      });
      startSshTunnel.mockRejectedValue(new Error("Connection refused"));

      const { resolveStartupDecision } =
        await import("../src/main/startup/startup-decision");
      const decision = await resolveStartupDecision();

      expect(decision.nextScreen).toBe("welcome");
      expect(decision.connectionMode).toBe("ssh");
      expect(decision.reason).toBe("ssh-unreachable");
      expect(decision.error).toBe("Connection refused");
    });

    it("should return welcome when SSH tunnel is not healthy", async () => {
      getConnectionConfig.mockReturnValue({
        mode: "ssh",
        ssh: {
          host: "test.example.com",
          port: 22,
          username: "test",
          keyPath: "/path/to/key",
          remotePort: 8642,
          localPort: 18642,
        },
      });
      startSshTunnel.mockResolvedValue(undefined);
      isSshTunnelHealthy.mockResolvedValue(false);

      const { resolveStartupDecision } =
        await import("../src/main/startup/startup-decision");
      const decision = await resolveStartupDecision();

      expect(decision.nextScreen).toBe("welcome");
      expect(decision.connectionMode).toBe("ssh");
      expect(decision.reason).toBe("ssh-unreachable");
    });
  });
});
