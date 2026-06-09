import { getRuntimeInstance } from "../profile-runtime-db";
import { getDeviceIdentity } from "./device-identity";
import { resolveHermesProfiles } from "./hermes-profile-resolver";
import * as genehubClient from "./genehub-client";
import { getGeneHubConfig, saveGeneHubConfig } from "./genehub-config";
import { markGeneHubInitialized, markGeneHubUninitialized } from "./genehub-connection";
import { listInstalledSkillRecords } from "./installed-skill-store";
import { runInstallJob } from "./skill-install-worker";
import { isGeneHubError } from "../../shared/genehub/genehub-errors";
import type { GeneHubInitializeResult } from "../../shared/genehub/genehub-contract";

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let pendingJobsTimer: ReturnType<typeof setInterval> | null = null;

export function stopGeneHubScheduler(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (pendingJobsTimer) {
    clearInterval(pendingJobsTimer);
    pendingJobsTimer = null;
  }
  markGeneHubUninitialized();
}

export async function initializeGeneHub(): Promise<GeneHubInitializeResult> {
  const config = getGeneHubConfig();
  if (!config.enabled) {
    return { ok: false, error: "GeneHub is disabled", errorCode: "GENEHUB_DISABLED" };
  }

  try {
    const identity = getDeviceIdentity();
    await genehubClient.registerDevice(identity);

    const profiles = resolveHermesProfiles();
    let profilesRegistered = 0;
    for (const profile of profiles) {
      await genehubClient.registerHermesProfile(profile);
      profilesRegistered += 1;
    }

    await sendHeartbeat(identity.deviceFingerprint, profiles.map((p) => p.profileId));

    let syncedProfiles = 0;
    for (const profile of profiles) {
      await genehubClient.syncInstalledSkills({
        profileId: profile.profileId,
        skills: listInstalledSkillRecords(profile.hermesHome),
      });
      syncedProfiles += 1;
    }

    markGeneHubInitialized();
    startGeneHubScheduler();

    return {
      ok: true,
      deviceRegistered: true,
      profilesRegistered,
      syncedProfiles,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      errorCode: isGeneHubError(err) ? err.code : "GENEHUB_API_FAILED",
    };
  }
}

async function sendHeartbeat(deviceFingerprint: string, profileIds: string[]): Promise<void> {
  const profiles = profileIds.map((profileId) => {
    const runtime = getRuntimeInstance(profileId);
    return {
      profileId,
      status: runtime?.status ?? "unknown",
    };
  });

  const result = await genehubClient.heartbeat({ deviceFingerprint, profiles });
  if (result.serverConfig) {
    const syncSeconds = Number(result.serverConfig.sync_interval_seconds ?? result.serverConfig.syncIntervalSeconds);
    const pendingSeconds = Number(
      result.serverConfig.pending_jobs_interval_seconds ?? result.serverConfig.pendingJobsIntervalSeconds,
    );
    if (syncSeconds > 0 || pendingSeconds > 0) {
      saveGeneHubConfig({
        heartbeatIntervalMs: syncSeconds > 0 ? syncSeconds * 1000 : undefined,
        pendingJobsIntervalMs: pendingSeconds > 0 ? pendingSeconds * 1000 : undefined,
      });
    }
  }
}

export function startGeneHubScheduler(): void {
  stopGeneHubScheduler();
  const config = getGeneHubConfig();
  if (!config.enabled) return;

  const identity = getDeviceIdentity();

  heartbeatTimer = setInterval(() => {
    void (async () => {
      try {
        const profiles = resolveHermesProfiles();
        await sendHeartbeat(
          identity.deviceFingerprint,
          profiles.map((p) => p.profileId),
        );
      } catch (err) {
        console.warn("[GENEHUB] heartbeat failed:", err);
      }
    })();
  }, config.heartbeatIntervalMs);

  pendingJobsTimer = setInterval(() => {
    void pollPendingJobs(config.autoInstallAssignedJobs);
  }, config.pendingJobsIntervalMs);
}

async function pollPendingJobs(autoInstall: boolean): Promise<void> {
  try {
    const profiles = resolveHermesProfiles();
    for (const profile of profiles) {
      const jobs = await genehubClient.listPendingJobs(profile.profileId);
      if (!autoInstall) continue;
      for (const job of jobs) {
        try {
          await runInstallJob(job.jobId);
        } catch (err) {
          console.warn("[GENEHUB] auto install failed:", err);
        }
      }
    }
  } catch (err) {
    console.warn("[GENEHUB] pending jobs poll failed:", err);
  }
}

export async function autoInitializeGeneHubIfReady(): Promise<void> {
  const config = getGeneHubConfig();
  if (!config.enabled) return;

  try {
    const result = await initializeGeneHub();
    if (!result.ok) {
      console.warn("[GENEHUB] auto-init skipped:", result.error);
    }
  } catch (err) {
    console.warn("[GENEHUB] auto-init failed:", err);
  }
}

export async function onGeneHubLoginSuccess(): Promise<void> {
  await autoInitializeGeneHubIfReady();
}

export function onGeneHubLogout(): void {
  stopGeneHubScheduler();
}
