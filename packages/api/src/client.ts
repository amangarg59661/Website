import type { ZodTypeAny, z } from "zod";
import { apiErrorSchema } from "@edss/validation/api";
import { ApiError } from "./error.js";

export type ApiClientConfig = {
  baseUrl: string;
  getAccessToken: () => string | null;
  onSessionExpired: () => void;
  triggerRefresh: () => Promise<boolean>;
};

let config: ApiClientConfig | null = null;

export function initApiClient(c: ApiClientConfig): void {
  config = c;
}

let refreshPromise: Promise<boolean> | null = null;

async function ensureRefreshed(): Promise<boolean> {
  if (!config) throw new Error("apiClient not initialised");
  if (!refreshPromise) {
    refreshPromise = config.triggerRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export type ApiFetchOptions<
  TSchema extends ZodTypeAny | undefined = undefined,
> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  schema?: TSchema;
  signal?: AbortSignal;
  skipAuth?: boolean;
  isRetry?: boolean;
};

export async function apiFetch<
  TSchema extends ZodTypeAny | undefined = undefined,
>(
  path: string,
  opts: ApiFetchOptions<TSchema> = {},
): Promise<TSchema extends ZodTypeAny ? z.infer<TSchema> : unknown> {
  if (!config) throw new Error("apiClient not initialised");
  const url = path.startsWith("http") ? path : `${config.baseUrl}${path}`;
  const method = opts.method ?? "GET";

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Request-Id": crypto.randomUUID(),
    ...(opts.headers ?? {}),
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const token = opts.skipAuth ? null : config.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: "omit",
      signal: opts.signal,
    });
  } catch (err) {
    if (opts.signal?.aborted) throw err;
    throw new ApiError("NETWORK_ERROR", "Network request failed.", 0);
  }

  if (res.status === 401 && !opts.skipAuth && !opts.isRetry) {
    const refreshed = await ensureRefreshed();
    if (refreshed) return apiFetch(path, { ...opts, isRetry: true });
    config.onSessionExpired();
    throw new ApiError("SESSION_EXPIRED", "Session expired.", 401);
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? "0");
    if (!opts.isRetry && retryAfter > 0 && retryAfter <= 5) {
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return apiFetch(path, { ...opts, isRetry: true });
    }
    throw new ApiError("RATE_LIMITED", "Too many requests.", 429, {
      retry_after: retryAfter,
    });
  }

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new ApiError(
        res.status >= 500 ? "SERVER_ERROR" : "UNKNOWN",
        `HTTP ${res.status}`,
        res.status,
      );
    }
    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success) throw ApiError.fromBody(parsed.data, res.status);
    throw new ApiError(
      res.status >= 500 ? "SERVER_ERROR" : "UNKNOWN",
      `HTTP ${res.status}`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as never;

  const data: unknown = await res.json();
  if (opts.schema) {
    const parsed = opts.schema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError(
        "INVALID_RESPONSE",
        "Response did not match contract.",
        res.status,
        {
          issues: parsed.error.issues,
        },
      );
    }
    return parsed.data as never;
  }
  return data as never;
}
