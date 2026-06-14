import type { HermesProfileDto } from "../../shared/genehub/genehub-contract";

let desktopDeviceId: string | null = null;
const serverProfileIds = new Map<string, string>();

export function setGeneHubDesktopDeviceId(id: string): void {
  desktopDeviceId = id;
}

export function getGeneHubDesktopDeviceId(): string | null {
  return desktopDeviceId;
}

export function setGeneHubServerProfileId(localKey: string, serverProfileId: string): void {
  serverProfileIds.set(localKey, serverProfileId);
}

export function resolveGeneHubServerProfileId(profile: HermesProfileDto): string {
  return (
    serverProfileIds.get(profile.profileId) ??
    serverProfileIds.get(profile.profileName) ??
    profile.profileId
  );
}

export function clearGeneHubSession(): void {
  desktopDeviceId = null;
  serverProfileIds.clear();
}
