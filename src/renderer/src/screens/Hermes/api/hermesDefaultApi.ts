import { HERMES_DEFAULT_PROFILE } from "../constants";

const P = HERMES_DEFAULT_PROFILE;

export const hermesDefaultApi = {
  profile: {
    async getDefaultProfile() {
      const list = await window.hermesAPI.listProfiles();
      return list.find((p) => p.name === P || p.isDefault) ?? list[0] ?? null;
    },
    async listProfilesForDisplay() {
      return window.hermesAPI.listProfiles();
    },
  },

  runtime: {
    async status() {
      return window.hermesAPI.gatewayStatus();
    },
    async start() {
      return window.hermesAPI.startGateway();
    },
    async stop() {
      return window.hermesAPI.stopGateway();
    },
    async restart() {
      await window.hermesAPI.stopGateway();
      await new Promise((r) => setTimeout(r, 500));
      return window.hermesAPI.startGateway();
    },
    async logs(lines = 200) {
      const result = await window.hermesAPI.readLogs(undefined, lines);
      return result.content;
    },
    async home() {
      return window.hermesAPI.getHermesHome(P);
    },
    async doctor() {
      return window.hermesAPI.runHermesDoctor();
    },
    async version() {
      return window.hermesAPI.getHermesVersion();
    },
    async getModelConfig() {
      return window.hermesAPI.getModelConfig(P);
    },
  },

  chat: {
    sendMessage(input: {
      message: string;
      resumeSessionId?: string;
      history?: Array<{ role: string; content: string }>;
    }) {
      return window.hermesAPI.sendMessage(
        input.message,
        P,
        input.resumeSessionId,
        input.history,
      );
    },
    abort() {
      return window.hermesAPI.abortChat();
    },
    onChunk(callback: (chunk: string) => void) {
      return window.hermesAPI.onChatChunk(callback);
    },
    onDone(callback: (sessionId?: string) => void) {
      return window.hermesAPI.onChatDone(callback);
    },
    onError(callback: (error: string) => void) {
      return window.hermesAPI.onChatError(callback);
    },
    onToolProgress(callback: (tool: string) => void) {
      return window.hermesAPI.onChatToolProgress(callback);
    },
    onUsage(callback: Parameters<typeof window.hermesAPI.onChatUsage>[0]) {
      return window.hermesAPI.onChatUsage(callback);
    },
  },

  sessions: {
    list(limit = 50, offset = 0) {
      return window.hermesAPI.listCachedSessions(limit, offset);
    },
    sync() {
      return window.hermesAPI.syncSessionCache();
    },
    search(query: string, limit = 20) {
      return window.hermesAPI.searchSessions(query, limit);
    },
    messages(sessionId: string) {
      return window.hermesAPI.getSessionMessages(sessionId);
    },
    rename(sessionId: string, title: string) {
      return window.hermesAPI.updateSessionTitle(sessionId, title);
    },
  },

  skills: {
    installed() {
      return window.hermesAPI.listInstalledSkills(P);
    },
    bundled() {
      return window.hermesAPI.listBundledSkills();
    },
    read(skillPath: string) {
      return window.hermesAPI.getSkillContent(skillPath);
    },
    install(identifier: string) {
      return window.hermesAPI.installSkill(identifier, P);
    },
    uninstall(name: string) {
      return window.hermesAPI.uninstallSkill(name, P);
    },
  },

  memory: {
    read() {
      return window.hermesAPI.readMemory(P);
    },
    readSoul() {
      return window.hermesAPI.readSoul(P);
    },
    writeSoul(content: string) {
      return window.hermesAPI.writeSoul(content, P);
    },
    resetSoul() {
      return window.hermesAPI.resetSoul(P);
    },
    addMemoryEntry(content: string) {
      return window.hermesAPI.addMemoryEntry(content, P);
    },
    updateMemoryEntry(index: number, content: string) {
      return window.hermesAPI.updateMemoryEntry(index, content, P);
    },
    removeMemoryEntry(index: number) {
      return window.hermesAPI.removeMemoryEntry(index, P);
    },
    writeUserProfile(content: string) {
      return window.hermesAPI.writeUserProfile(content, P);
    },
  },

  tools: {
    list() {
      return window.hermesAPI.getToolsets(P);
    },
    setEnabled(key: string, enabled: boolean) {
      return window.hermesAPI.setToolsetEnabled(key, enabled, P);
    },
  },

  models: {
    list() {
      return window.hermesAPI.listModels();
    },
    add(name: string, provider: string, model: string, baseUrl: string) {
      return window.hermesAPI.addModel(name, provider, model, baseUrl);
    },
    update(id: string, fields: Record<string, string>) {
      return window.hermesAPI.updateModel(id, fields);
    },
    remove(id: string) {
      return window.hermesAPI.removeModel(id);
    },
    getActive() {
      return window.hermesAPI.getModelConfig(P);
    },
    setActive(provider: string, model: string, baseUrl: string) {
      return window.hermesAPI.setModelConfig(provider, model, baseUrl, P);
    },
  },

  providers: {
    getEnv() {
      return window.hermesAPI.getEnv(P);
    },
    setEnv(key: string, value: string) {
      return window.hermesAPI.setEnv(key, value, P);
    },
    getConfig(key: string) {
      return window.hermesAPI.getConfig(key, P);
    },
    setConfig(key: string, value: string) {
      return window.hermesAPI.setConfig(key, value, P);
    },
    getCredentialPool() {
      return window.hermesAPI.getCredentialPool();
    },
    setCredentialPool(provider: string, entries: Array<{ key: string; label: string }>) {
      return window.hermesAPI.setCredentialPool(provider, entries);
    },
    getConnectionConfig() {
      return window.hermesAPI.getConnectionConfig();
    },
  },
};
