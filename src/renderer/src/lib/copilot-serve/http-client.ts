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
    let message = text || `HTTP ${res.status}`;
    try {
      const body = JSON.parse(text) as { message?: string; detail?: string | { msg?: string } };
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (body.detail && typeof body.detail === "object" && "msg" in body.detail) {
        message = String(body.detail.msg);
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      /* keep raw text */
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
