import type { ApiErrorCode, ApiErrorBody } from "@edss/types";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly httpStatus: number;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ApiErrorCode,
    message: string,
    httpStatus: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }

  static fromBody(body: ApiErrorBody, httpStatus: number): ApiError {
    return new ApiError(body.code, body.message, httpStatus, body.details);
  }
}

const MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_CREDENTIALS: "Email or password incorrect.",
  INVALID_TOTP: "That code did not match. Try again.",
  SESSION_EXPIRED: "Your session ended. Please sign in again.",
  SESSION_REVOKED: "Signed out from another device.",
  CSRF_MISMATCH: "Session token mismatch. Refresh and retry.",
  RATE_LIMITED: "Too many attempts. Please wait.",
  FORBIDDEN: "You do not have permission for that.",
  NOT_FOUND: "Not found.",
  VALIDATION_FAILED: "Please check the highlighted fields.",
  INVALID_RESPONSE: "Something unexpected came back. We are investigating.",
  NETWORK_ERROR: "Network issue — check your connection.",
  SERVER_ERROR: "Server error. We are on it.",
  UNKNOWN: "Something went wrong.",
};

export function errorCodeToMessage(code: ApiErrorCode): string {
  return MESSAGES[code];
}
