import axios from "axios";

/** Axios default when the server returns an HTTP error status. */
const AXIOS_STATUS_MESSAGE = /^Request failed with status code \d+$/;

/**
 * Message we set on Axios errors (in the response interceptor) when there is no API body message,
 * so UI code can tell generic failures apart from real user-facing strings like "Network Error".
 */
const API_ERROR_FALLBACK_SENTINEL = "Error";

function extractMessageFromResponseData(data: unknown): string | null {
  if (data != null && typeof data === "object" && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    const message = record.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message.trim();
    }
    const errField = record.error;
    if (typeof errField === "string" && errField.trim().length > 0) {
      return errField.trim();
    }
  }
  if (typeof data === "string" && data.trim().length > 0) {
    return data.trim();
  }
  return null;
}

/**
 * Extract a user-facing message from axios/API errors.
 * - Prefer `response.data.message` (and common variants).
 * - Never surface Axios's "Request failed with status code …" line.
 * - Use `fallback` when the server did not send a message (default `"Error"`).
 */
export function getApiErrorMessage(error: unknown, fallback: string = API_ERROR_FALLBACK_SENTINEL): string {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;

  const fromBody = extractMessageFromResponseData(responseData);
  if (fromBody != null) {
    return fromBody;
  }

  if (error instanceof Error && typeof error.message === "string") {
    const msg = error.message.trim();
    if (msg.length === 0) {
      return fallback;
    }
    if (AXIOS_STATUS_MESSAGE.test(msg)) {
      return fallback;
    }
    // Sentinel from interceptor when HTTP error had no body message — use contextual fallback.
    if (msg === API_ERROR_FALLBACK_SENTINEL) {
      return fallback;
    }
    return msg;
  }

  return fallback;
}

/**
 * Normalize axios error `message` so bare `error.message` in catch blocks is never the generic status line.
 * Call from the axios response error interceptor only.
 */
export function applyFriendlyAxiosErrorMessage(error: unknown): void {
  if (!axios.isAxiosError(error)) {
    return;
  }
  const fromApi = extractMessageFromResponseData(error.response?.data);
  if (fromApi != null) {
    error.message = fromApi;
    return;
  }
  if (AXIOS_STATUS_MESSAGE.test(error.message)) {
    error.message = API_ERROR_FALLBACK_SENTINEL;
  }
}
