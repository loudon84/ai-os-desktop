import { ipcMain } from "electron";
import type {
  ExpertCatalogQuery,
  ExpertRunFilter,
  ExpertTeamCatalogQuery,
  HermesExpertTrustStatus,
  InstallOptions,
  SummonExpertInput,
  SummonTeamInput,
} from "../../shared/hermes-experts/hermes-experts-contract";
import { isHermesExpertsError } from "../../shared/hermes-experts/hermes-experts-errors";
import {
  fetchExpertInstallPlan,
  fetchTeamInstallPlan,
  getExpert,
  getExpertTeam,
  listExpertCatalog,
  listExpertTeams,
} from "./expert-catalog-client";
import { installExpertById, installTeamById } from "./expert-installer";
import { initExpertRuntimeDb, listExpertRuns, getExpertRun, setExpertTrust } from "./expert-runtime-db";
import { summonExpert, cancelExpertRun } from "./expert-runtime";
import { summonTeam, retryExpertRun, dispatchTeamRun } from "./expert-team-runtime";
import { runExpertPreflight } from "./expert-preflight";
import {
  getExpertDesktopSyncStatus,
  registerExpertDesktop,
  startExpertDesktopHeartbeat,
  stopExpertDesktopHeartbeat,
} from "./expert-desktop-client";

function toError(err: unknown): { ok: false; error: string; errorCode: string } {
  if (isHermesExpertsError(err)) {
    return { ok: false, error: err.message, errorCode: err.code };
  }
  return {
    ok: false,
    error: err instanceof Error ? err.message : String(err),
    errorCode: "EXPERT_RUN_CANCEL_FAILED",
  };
}

export function registerHermesExpertsIpc(): void {
  initExpertRuntimeDb();
  startExpertDesktopHeartbeat();

  ipcMain.handle("hermes-experts:list-catalog", async (_, query?: ExpertCatalogQuery) =>
    listExpertCatalog(query),
  );

  ipcMain.handle("hermes-experts:get-expert", async (_, expertId: string) => getExpert(expertId));

  ipcMain.handle("hermes-experts:list-teams", async (_, query?: ExpertTeamCatalogQuery) =>
    listExpertTeams(query),
  );

  ipcMain.handle("hermes-experts:get-team", async (_, teamId: string) => getExpertTeam(teamId));

  ipcMain.handle("hermes-experts:preview-install-expert", async (_, expertId: string) => {
    try {
      const data = await fetchExpertInstallPlan(expertId);
      return { ok: true, data };
    } catch (err) {
      return toError(err);
    }
  });

  ipcMain.handle(
    "hermes-experts:install-expert",
    async (_, expertId: string, options?: InstallOptions) => {
      try {
        const plan = await fetchExpertInstallPlan(expertId);
        const data = await installExpertById(expertId, plan, options);
        return { ok: true, data };
      } catch (err) {
        return toError(err);
      }
    },
  );

  ipcMain.handle("hermes-experts:preview-install-team", async (_, teamId: string) => {
    try {
      const data = await fetchTeamInstallPlan(teamId);
      return { ok: true, data };
    } catch (err) {
      return toError(err);
    }
  });

  ipcMain.handle("hermes-experts:install-team", async (_, teamId: string, options?: InstallOptions) => {
    try {
      const plan = await fetchTeamInstallPlan(teamId);
      const data = await installTeamById(teamId, plan, options);
      return { ok: true, data };
    } catch (err) {
      return toError(err);
    }
  });

  ipcMain.handle("hermes-experts:summon-expert", async (_, input: SummonExpertInput) =>
    summonExpert(input),
  );

  ipcMain.handle("hermes-experts:summon-team", async (_, input: SummonTeamInput) =>
    summonTeam(input),
  );

  ipcMain.handle("hermes-experts:list-runs", async (_, filter?: ExpertRunFilter) =>
    listExpertRuns({
      status: filter?.status,
      limit: filter?.limit,
    }),
  );

  ipcMain.handle("hermes-experts:get-run", async (_, runId: string) => getExpertRun(runId));

  ipcMain.handle("hermes-experts:cancel-run", async (_, runId: string) => cancelExpertRun(runId));

  ipcMain.handle("hermes-experts:retry-run", async (_, runId: string) => retryExpertRun(runId));

  ipcMain.handle(
    "hermes-experts:set-trust",
    async (_, expertId: string, trustStatus: HermesExpertTrustStatus) => {
      try {
        setExpertTrust(expertId, trustStatus);
        return { ok: true };
      } catch (err) {
        return toError(err);
      }
    },
  );

  ipcMain.handle("hermes-experts:preflight", async (_, profileId: string, port?: number) => {
    return runExpertPreflight({ profileId, port });
  });

  ipcMain.handle(
    "hermes-experts:dispatch-team",
    async (
      _,
      input: { runId: string; teamId: string; leaderProfileId: string; userPrompt: string },
    ) => {
      try {
        await dispatchTeamRun(input);
        return { ok: true as const };
      } catch (err) {
        return toError(err);
      }
    },
  );

  ipcMain.handle("hermes-experts:get-desktop-sync-status", async () => ({
    ok: true as const,
    data: getExpertDesktopSyncStatus(),
  }));

  ipcMain.handle("hermes-experts:register-desktop", async () => {
    try {
      const data = await registerExpertDesktop();
      return { ok: true as const, data };
    } catch (err) {
      return toError(err);
    }
  });
}

export function shutdownHermesExpertsIpc(): void {
  stopExpertDesktopHeartbeat();
}
