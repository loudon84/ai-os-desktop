export function sortTabsByOrder<T extends { id: string }>(
  tabs: T[],
  order: string[],
): T[] {
  const index = new Map(order.map((id, i) => [id, i]));
  return [...tabs].sort((a, b) => {
    const ai = index.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = index.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}

export function isDraggableTabId(id: string): boolean {
  return (
    id.startsWith("profile-workspace:") || id.startsWith("external-browser:")
  );
}

export const FIXED_TAB_IDS = ["aios-home", "aios-workspace", "web-operator"] as const;
