export interface CopilotServeHttpConfig {
  baseUrl: string;
  token: string;
}

export async function copilotServeFetch<T>(
  config: CopilotServeHttpConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${config.baseUrl.replace(/\/$/, "")}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (config.token) {
    headers.set("X-Copilot-Desktop-Token", config.token);
  }

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
