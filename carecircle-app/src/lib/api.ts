import { enqueueOfflineAction } from "./offlineSync";

const BASE = "/api";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type JsonBody = unknown;

async function request<T>(method: string, path: string, body?: JsonBody): Promise<T> {
  const isOffline = typeof window !== "undefined" && typeof navigator !== "undefined" && !navigator.onLine;

  if (isOffline && method !== "GET") {
    await enqueueOfflineAction({
      url: `${BASE}${path}`,
      method,
      body,
      description: `${method} ${path}`,
    });
    return { success: true, offline: true, ...((body as object) || {}) } as unknown as T;
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new ApiError(res.status, errBody);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err: any) {
    if (!(err instanceof ApiError) && method !== "GET" && typeof window !== "undefined") {
      await enqueueOfflineAction({
        url: `${BASE}${path}`,
        method,
        body,
        description: `${method} ${path}`,
      });
      return { success: true, offline: true, ...((body as object) || {}) } as unknown as T;
    }
    throw err;
  }
}

export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body?: JsonBody) => request<T>("POST", path, body ?? null);
export const apiPut = <T>(path: string, body?: JsonBody) => request<T>("PUT", path, body ?? null);
export const apiPatch = <T>(path: string, body?: JsonBody) => request<T>("PATCH", path, body ?? null);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);
