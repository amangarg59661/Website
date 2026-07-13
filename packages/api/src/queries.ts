import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { ZodTypeAny, z } from "zod";
import { apiFetch, type ApiFetchOptions } from "./client";
import { ApiError } from "./error";

/**
 * P-07 fix: retry predicate now only re-fires on transport-level errors.
 * NOT_FOUND, VALIDATION_FAILED, CSRF_MISMATCH, INVALID_RESPONSE, and
 * RATE_LIMITED are all deterministic outcomes; retrying wastes budget and
 * hides the real error state from the UI.
 */
const RETRYABLE_CODES = new Set(["NETWORK_ERROR", "SERVER_ERROR", "UNKNOWN"]);

export function useApiQuery<TSchema extends ZodTypeAny>(
  key: readonly unknown[],
  path: string,
  schema: TSchema,
  opts?: Omit<
    UseQueryOptions<z.infer<TSchema>, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<z.infer<TSchema>, ApiError>({
    queryKey: key,
    queryFn: ({ signal }) => apiFetch(path, { schema, signal }),
    retry: (n, err) => n < 2 && RETRYABLE_CODES.has(err.code),
    retryDelay: (n) => Math.min(1000 * 2 ** n + Math.random() * 500, 4000),
    staleTime: 30_000,
    gcTime: 300_000,
    ...opts,
  });
}

export function useApiMutation<TReq, TResp>(
  fn: (variables: TReq) => Promise<TResp>,
  opts?: UseMutationOptions<TResp, ApiError, TReq>,
) {
  return useMutation<TResp, ApiError, TReq>({
    mutationFn: fn,
    ...opts,
  });
}

export function makeMutationFn<TReq, TSchema extends ZodTypeAny>(
  path: string,
  method: NonNullable<ApiFetchOptions["method"]>,
  schema: TSchema,
): (body: TReq) => Promise<z.infer<TSchema>> {
  return (body: TReq) => apiFetch(path, { method, body, schema });
}
