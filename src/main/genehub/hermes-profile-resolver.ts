import { existsSync } from "fs";
import { listProfiles, getRuntimeInstance } from "../profile-runtime-db";
import { profileHome } from "../utils";
import type { HermesProfileDto } from "../../shared/genehub/genehub-contract";
import { GeneHubError } from "../../shared/genehub/genehub-errors";

const DEFAULT_GATEWAY_PORT = 8642;

export function resolveHermesProfiles(): HermesProfileDto[] {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    const home = profileHome("default");
    if (!existsSync(home)) {
      throw new GeneHubError("HERMES_HOME_NOT_FOUND", `Hermes home not found: ${home}`);
    }
    return [buildProfileDto("default", "default", home)];
  }

  return profiles.map((profile) => {
    const name = profile.name;
    const home = profileHome(name === "default" ? undefined : name);
    return buildProfileDto(profile.id, name, home);
  });
}

export function resolveHermesProfile(profileIdOrName?: string): HermesProfileDto {
  const profiles = resolveHermesProfiles();
  if (!profileIdOrName) {
    const fallback = profiles.find((p) => p.profileName === "default") ?? profiles[0];
    if (!fallback) {
      throw new GeneHubError("HERMES_HOME_NOT_FOUND", "No Hermes profile available");
    }
    return fallback;
  }

  const match =
    profiles.find((p) => p.profileId === profileIdOrName) ??
    profiles.find((p) => p.profileName === profileIdOrName);
  if (!match) {
    throw new GeneHubError("HERMES_HOME_NOT_FOUND", `Hermes profile not found: ${profileIdOrName}`);
  }
  return match;
}

function buildProfileDto(
  profileId: string,
  profileName: string,
  hermesHome: string,
): HermesProfileDto {
  if (!existsSync(hermesHome)) {
    throw new GeneHubError("HERMES_HOME_NOT_FOUND", `Hermes home not found: ${hermesHome}`);
  }

  const runtime = getRuntimeInstance(profileId);
  const gatewayPort = runtime?.port ?? DEFAULT_GATEWAY_PORT;
  const gatewayUrl = runtime?.base_url ?? `http://127.0.0.1:${gatewayPort}`;

  return {
    profileName,
    profileId,
    hermesHome,
    gatewayUrl,
    gatewayPort,
    runtimeVersion: undefined,
    capabilities: {
      skills: true,
      scripts: true,
      reload: false,
    },
  };
}
