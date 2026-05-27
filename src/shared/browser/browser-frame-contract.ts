/** v5.7 — Frame tree DTOs for WebContentsView browser core. */

export interface BrowserRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BrowserFrameSnapshot {
  frameId: string;
  parentFrameId?: string;
  url: string;
  origin: string;
  name?: string;
  title?: string;
  depth: number;
  path: number[];
  sameOriginWithParent: boolean;
  childCount: number;
}

export interface BrowserFrameTarget {
  frameId?: string;
  framePath?: number[];
  urlIncludes?: string;
  name?: string;
  title?: string;
  index?: number;
}
