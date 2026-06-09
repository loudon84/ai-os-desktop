import type {
  GeneHubBundle,
  GeneHubSkill,
  HermesProfileDto,
  InstallJob,
  InstallJobAction,
  InstalledSkillRecord,
} from "../../shared/genehub/genehub-contract";
import type { DesktopDeviceIdentity } from "../../shared/genehub/genehub-contract";
import { GeneHubError } from "../../shared/genehub/genehub-errors";
import { fetchGeneHubDescriptor } from "./genehub-backend-descriptor";
import { genehubFetch } from "./genehub-http";

async function requireDescriptor() {
  const result = await fetchGeneHubDescriptor();
  if (!result.ok || !result.descriptor) {
    throw new GeneHubError(
      result.error?.code === "GENEHUB_BACKEND_URL_MISSING"
        ? "GENEHUB_BACKEND_URL_MISSING"
        : result.error?.code === "GENEHUB_DESCRIPTOR_MISSING"
          ? "GENEHUB_DESCRIPTOR_MISSING"
          : "GENEHUB_BACKEND_UNREACHABLE",
      result.error?.message ?? "GeneHub descriptor unavailable",
    );
  }
  if (!result.descriptor.enabled) {
    throw new GeneHubError("GENEHUB_DISABLED", "GeneHub is disabled on server");
  }
  return result.descriptor;
}

function mapSkill(raw: Record<string, unknown>): GeneHubSkill {
  const permissions = (raw.permissions as Record<string, boolean> | undefined) ?? {};
  return {
    geneSlug: String(raw.gene_slug ?? raw.geneSlug ?? ""),
    geneVersion: String(raw.gene_version ?? raw.geneVersion ?? ""),
    skillName: String(raw.skill_name ?? raw.skillName ?? raw.gene_slug ?? ""),
    displayName: String(raw.display_name ?? raw.displayName ?? raw.skill_name ?? ""),
    description: String(raw.description ?? ""),
    category: raw.category ? String(raw.category) : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : undefined,
    installed: Boolean(raw.installed),
    installedVersion: raw.installed_version
      ? String(raw.installed_version)
      : raw.installedVersion
        ? String(raw.installedVersion)
        : undefined,
    updateAvailable: Boolean(raw.update_available ?? raw.updateAvailable),
    permissions: {
      canInstall: Boolean(permissions.can_install ?? permissions.canInstall ?? true),
      canUpdate: Boolean(permissions.can_update ?? permissions.canUpdate ?? false),
      canUninstall: Boolean(permissions.can_uninstall ?? permissions.canUninstall ?? false),
    },
  };
}

function mapJob(raw: Record<string, unknown>): InstallJob {
  return {
    jobId: String(raw.job_id ?? raw.jobId ?? raw.id ?? ""),
    profileId: String(raw.profile_id ?? raw.profileId ?? ""),
    geneSlug: String(raw.gene_slug ?? raw.geneSlug ?? ""),
    geneVersion: String(raw.gene_version ?? raw.geneVersion ?? ""),
    skillName: String(raw.skill_name ?? raw.skillName ?? ""),
    action: String(raw.action ?? "install") as InstallJobAction,
    status: String(raw.status ?? "pending") as InstallJob["status"],
    assignedAt: raw.assigned_at ? String(raw.assigned_at) : undefined,
    claimedAt: raw.claimed_at ? String(raw.claimed_at) : undefined,
    errorCode: raw.error_code ? String(raw.error_code) : undefined,
    errorMessage: raw.error_message ? String(raw.error_message) : undefined,
  };
}

function mapBundle(raw: Record<string, unknown>, jobId: string): GeneHubBundle {
  const manifestRaw = (raw.manifest as Record<string, unknown> | undefined) ?? {};
  const filesRaw = Array.isArray(raw.files) ? raw.files : [];
  const scriptsRaw = Array.isArray(raw.scripts) ? raw.scripts : [];

  const mapFile = (f: Record<string, unknown>) => ({
    relativePath: String(f.relative_path ?? f.relativePath ?? ""),
    content: String(f.content ?? ""),
    encoding: (f.encoding as "utf-8" | "base64" | undefined) ?? "utf-8",
  });

  return {
    jobId,
    manifest: {
      geneSlug: String(manifestRaw.gene_slug ?? manifestRaw.geneSlug ?? ""),
      geneVersion: String(manifestRaw.gene_version ?? manifestRaw.geneVersion ?? ""),
      skillName: String(manifestRaw.skill_name ?? manifestRaw.skillName ?? ""),
      manifestHash: manifestRaw.manifest_hash
        ? String(manifestRaw.manifest_hash)
        : manifestRaw.manifestHash
          ? String(manifestRaw.manifestHash)
          : undefined,
      bundleHash: manifestRaw.bundle_hash
        ? String(manifestRaw.bundle_hash)
        : manifestRaw.bundleHash
          ? String(manifestRaw.bundleHash)
          : undefined,
      signature: manifestRaw.signature ? String(manifestRaw.signature) : undefined,
      compatibility: manifestRaw.compatibility as GeneHubBundle["manifest"]["compatibility"],
    },
    files: filesRaw.map((f) => mapFile(f as Record<string, unknown>)),
    scripts: scriptsRaw.length
      ? scriptsRaw.map((f) => mapFile(f as Record<string, unknown>))
      : undefined,
  };
}

export async function registerDevice(
  identity: DesktopDeviceIdentity,
): Promise<{ deviceId: string }> {
  const descriptor = await requireDescriptor();
  try {
    const data = await genehubFetch<Record<string, unknown>>(descriptor, "/devices/register", {
      method: "POST",
      body: {
        device_name: identity.deviceName,
        device_fingerprint: identity.deviceFingerprint,
        os_type: identity.osType,
        os_version: identity.osVersion,
        app_version: identity.appVersion,
      },
    });
    return { deviceId: String(data.device_id ?? data.deviceId ?? identity.deviceFingerprint) };
  } catch (err) {
    if (err instanceof GeneHubError) {
      throw new GeneHubError("GENEHUB_DEVICE_REGISTER_FAILED", err.message);
    }
    throw err;
  }
}

export async function registerHermesProfile(
  profile: HermesProfileDto,
): Promise<{ profileId: string }> {
  const descriptor = await requireDescriptor();
  try {
    const data = await genehubFetch<Record<string, unknown>>(descriptor, "/hermes/profiles/register", {
      method: "POST",
      body: {
        profile_id: profile.profileId,
        profile_name: profile.profileName,
        hermes_home: profile.hermesHome,
        gateway_url: profile.gatewayUrl,
        gateway_port: profile.gatewayPort,
        runtime_version: profile.runtimeVersion,
        capabilities: profile.capabilities,
      },
    });
    return { profileId: String(data.profile_id ?? data.profileId ?? profile.profileId) };
  } catch (err) {
    if (err instanceof GeneHubError) {
      throw new GeneHubError("GENEHUB_PROFILE_REGISTER_FAILED", err.message);
    }
    throw err;
  }
}

export async function heartbeat(payload: {
  deviceFingerprint: string;
  profiles: Array<{ profileId: string; status: string }>;
}): Promise<{ ok: boolean; serverConfig?: Record<string, unknown> }> {
  const descriptor = await requireDescriptor();
  const data = await genehubFetch<Record<string, unknown>>(descriptor, "/heartbeat", {
    method: "POST",
    body: {
      device_fingerprint: payload.deviceFingerprint,
      profiles: payload.profiles.map((p) => ({
        profile_id: p.profileId,
        status: p.status,
      })),
    },
  });
  return {
    ok: true,
    serverConfig: (data.config as Record<string, unknown> | undefined) ?? data.server_config as Record<string, unknown> | undefined,
  };
}

export async function listAuthorizedSkills(profileId: string): Promise<GeneHubSkill[]> {
  const descriptor = await requireDescriptor();
  const data = await genehubFetch<{ skills?: unknown[] } | unknown[]>(
    descriptor,
    `/genehub/skills?profile_id=${encodeURIComponent(profileId)}`,
  );
  const list = Array.isArray(data) ? data : (data.skills ?? []);
  return list.map((item) => mapSkill(item as Record<string, unknown>));
}

export async function createInstallJob(input: {
  profileId: string;
  geneSlug: string;
  action: InstallJobAction;
}): Promise<InstallJob> {
  const descriptor = await requireDescriptor();
  const data = await genehubFetch<Record<string, unknown>>(descriptor, "/hermes/install-jobs", {
    method: "POST",
    body: {
      profile_id: input.profileId,
      gene_slug: input.geneSlug,
      action: input.action,
    },
  });
  return mapJob(data);
}

export async function listPendingJobs(profileId: string): Promise<InstallJob[]> {
  const descriptor = await requireDescriptor();
  const data = await genehubFetch<{ jobs?: unknown[] } | unknown[]>(
    descriptor,
    `/hermes/install-jobs/pending?profile_id=${encodeURIComponent(profileId)}`,
  );
  const list = Array.isArray(data) ? data : (data.jobs ?? []);
  return list.map((item) => mapJob(item as Record<string, unknown>));
}

export async function claimJob(jobId: string): Promise<InstallJob> {
  const descriptor = await requireDescriptor();
  const data = await genehubFetch<Record<string, unknown>>(
    descriptor,
    `/hermes/install-jobs/${encodeURIComponent(jobId)}/claim`,
    { method: "POST", body: {} },
  );
  return mapJob(data);
}

export async function downloadBundle(jobId: string): Promise<GeneHubBundle> {
  const descriptor = await requireDescriptor();
  try {
    const data = await genehubFetch<Record<string, unknown>>(
      descriptor,
      `/hermes/install-jobs/${encodeURIComponent(jobId)}/bundle`,
    );
    return mapBundle(data, jobId);
  } catch (err) {
    if (err instanceof GeneHubError) {
      throw new GeneHubError("GENEHUB_BUNDLE_DOWNLOAD_FAILED", err.message);
    }
    throw err;
  }
}

export async function updateJobStatus(
  jobId: string,
  payload: {
    status: InstallJob["status"];
    clientReport?: Record<string, unknown>;
    errorCode?: string;
    errorMessage?: string;
  },
): Promise<void> {
  const descriptor = await requireDescriptor();
  await genehubFetch(descriptor, `/hermes/install-jobs/${encodeURIComponent(jobId)}/status`, {
    method: "POST",
    body: {
      status: payload.status,
      client_report: payload.clientReport,
      error_code: payload.errorCode,
      error_message: payload.errorMessage,
    },
  });
}

export async function syncInstalledSkills(input: {
  profileId: string;
  skills: InstalledSkillRecord[];
}): Promise<void> {
  const descriptor = await requireDescriptor();
  await genehubFetch(descriptor, "/hermes/installed-skills/sync", {
    method: "POST",
    body: {
      profile_id: input.profileId,
      skills: input.skills.map((s) => ({
        gene_slug: s.geneSlug,
        gene_version: s.geneVersion,
        skill_name: s.skillName,
        installed_at: s.installedAt,
        source: s.source,
        job_id: s.jobId,
      })),
    },
  });
}
