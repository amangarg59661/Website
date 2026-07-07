import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { ZodTypeAny, z } from "zod";
import { apiFetch, type ApiFetchOptions } from "./client.js";
import { ApiError } from "./error.js";

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
    retry: (n, err) =>
      n < 3 && err.code !== "SESSION_EXPIRED" && err.code !== "FORBIDDEN",
    retryDelay: (n) => Math.min(1000 * 2 ** n + Math.random() * 500, 8000),
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
