import type { InstallJob, InstallJobAction } from "../../shared/genehub/genehub-contract";
import { GeneHubError, isGeneHubError } from "../../shared/genehub/genehub-errors";
import * as genehubClient from "./genehub-client";
import { appendInstallLog } from "./genehub-install-log";
import { resolveHermesProfile } from "./hermes-profile-resolver";
import { validateGeneHubBundle } from "./skill-package-validator";
import { installGeneHubBundle, uninstallGeneHubSkill } from "./hermes-skill-writer";
import { reloadOrRestart } from "./hermes-restart-service";
import { listInstalledSkillRecords } from "./installed-skill-store";

async function reportStatus(
  jobId: string,
  geneSlug: string,
  status: InstallJob["status"],
  step: string,
  extra?: { errorCode?: string; errorMessage?: string; clientReport?: Record<string, unknown> },
): Promise<void> {
  appendInstallLog({
    jobId,
    geneSlug,
    step,
    status: status === "failed" ? "failed" : "info",
    message: extra?.errorMessage ?? step,
    errorCode: extra?.errorCode,
  });

  await genehubClient.updateJobStatus(jobId, {
    status,
    errorCode: extra?.errorCode,
    errorMessage: extra?.errorMessage,
    clientReport: extra?.clientReport ?? { step },
  });
}

export async function runInstallJob(jobId: string): Promise<void> {
  let job: InstallJob | null = null;
  let geneSlug = "";

  try {
    job = await genehubClient.claimJob(jobId);
    geneSlug = job.geneSlug;
    appendInstallLog({
      jobId,
      geneSlug,
      step: "claim",
      status: "info",
      message: "claim",
    });

    await reportStatus(jobId, geneSlug, "downloading", "download_start");
    const bundle = await genehubClient.downloadBundle(jobId);
    await reportStatus(jobId, geneSlug, "downloading", "download_complete", {
      clientReport: { fileCount: bundle.files.length },
    });

    const profile = resolveHermesProfile(job.profileId);
    await reportStatus(jobId, geneSlug, "validating", "validate_start");
    validateGeneHubBundle(bundle, profile.hermesHome);
    await reportStatus(jobId, geneSlug, "validating", "validate_complete");

    await reportStatus(jobId, geneSlug, "installing", "write_start");

    if (job.action === "uninstall") {
      await uninstallGeneHubSkill({
        hermesHome: profile.hermesHome,
        skillName: job.skillName || bundle.manifest.skillName,
        geneSlug: job.geneSlug,
        managedScriptPaths: bundle.scripts?.map((s) => s.relativePath),
      });
    } else {
      await installGeneHubBundle({
        hermesHome: profile.hermesHome,
        profileName: profile.profileName,
        jobId,
        bundle,
      });
    }

    await reportStatus(jobId, geneSlug, "installing", "restart_start");
    const restart = await reloadOrRestart(profile);
    if (!restart.ok) {
      throw new GeneHubError(
        "HERMES_RESTART_FAILED",
        restart.error ?? "Hermes restart failed",
      );
    }

    await reportStatus(jobId, geneSlug, "installed", "installed", {
      clientReport: { restartMode: restart.mode },
    });

    await genehubClient.syncInstalledSkills({
      profileId: profile.profileId,
      skills: listInstalledSkillRecords(profile.hermesHome),
    });
  } catch (err) {
    const errorCode = isGeneHubError(err) ? err.code : "GENEHUB_API_FAILED";
    const errorMessage = err instanceof Error ? err.message : String(err);
    await reportStatus(jobId, geneSlug || "unknown", "failed", "failed", {
      errorCode,
      errorMessage,
    });
    throw err;
  }
}

export async function runCreateAndInstall(input: {
  profileId?: string;
  geneSlug: string;
  action: InstallJobAction;
}): Promise<void> {
  const profile = resolveHermesProfile(input.profileId);
  const job = await genehubClient.createInstallJob({
    profileId: profile.profileId,
    geneSlug: input.geneSlug,
    action: input.action,
  });
  await runInstallJob(job.jobId);
}
