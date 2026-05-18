import type { ShellViewBounds } from "./view-contract";

export const ShellViewChannels = {
  ACTIVATE: "shell:view:activate",
  SET_BOUNDS: "shell:view:set-bounds",
  HIDE: "shell:view:hide",
} as const;

export type ShellViewBoundsIPC = ShellViewBounds;

export interface ShellViewActivateRequest {
  layerId: string;
}

export interface ShellViewSetBoundsRequest {
  layerId: string;
  bounds: ShellViewBoundsIPC;
}

export interface ShellViewHideRequest {
  layerId: string;
}

export type ShellViewResponse = void;
