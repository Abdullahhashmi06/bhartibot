export type AiErrorType =
  | "INVALID_API_KEY"
  | "EXPIRED_API_KEY"
  | "RATE_LIMIT"
  | "QUOTA_EXCEEDED"
  | "NETWORK_TIMEOUT"
  | "SERVICE_UNAVAILABLE"
  | "MALFORMED_RESPONSE"
  | "JSON_PARSE"
  | "PDF_EXTRACTION"
  | "RESUME_TOO_LARGE"
  | "MISSING_API_KEY"
  | "NO_CV"
  | "UNKNOWN";

export type AiFailureResult = {
  success: false;
  errorType: AiErrorType;
  message: string;
  retryable: boolean;
};

export type AiSuccessResult<T> = {
  success: true;
  data: T;
};

export type AiServiceResult<T> = AiSuccessResult<T> | AiFailureResult;

const USER_MESSAGES: Record<AiErrorType, string> = {
  INVALID_API_KEY: "The AI service API key is invalid.",
  EXPIRED_API_KEY: "The AI service API key has expired.",
  RATE_LIMIT: "AI rate limit exceeded. Please wait and try again.",
  QUOTA_EXCEEDED: "Daily AI quota exceeded.",
  NETWORK_TIMEOUT: "The AI request timed out. Check your connection and try again.",
  SERVICE_UNAVAILABLE: "The AI service is temporarily unavailable.",
  MALFORMED_RESPONSE: "The AI returned an unexpected response.",
  JSON_PARSE: "Could not parse the AI analysis result.",
  PDF_EXTRACTION: "Could not read text from this PDF.",
  RESUME_TOO_LARGE: "This resume is too large to analyze.",
  MISSING_API_KEY: "AI analysis is not configured on this server.",
  NO_CV: "No CV was uploaded for this applicant.",
  UNKNOWN: "AI analysis failed for an unknown reason.",
};

const RETRYABLE: Record<AiErrorType, boolean> = {
  INVALID_API_KEY: false,
  EXPIRED_API_KEY: false,
  RATE_LIMIT: true,
  QUOTA_EXCEEDED: false,
  NETWORK_TIMEOUT: true,
  SERVICE_UNAVAILABLE: true,
  MALFORMED_RESPONSE: true,
  JSON_PARSE: true,
  PDF_EXTRACTION: false,
  RESUME_TOO_LARGE: false,
  MISSING_API_KEY: false,
  NO_CV: false,
  UNKNOWN: true,
};

export class AiError extends Error {
  readonly errorType: AiErrorType;
  readonly retryable: boolean;
  readonly userMessage: string;
  readonly logDetail: string;

  constructor(
    errorType: AiErrorType,
    logDetail?: string,
    userMessage?: string
  ) {
    const message = userMessage ?? USER_MESSAGES[errorType];
    super(message);
    this.name = "AiError";
    this.errorType = errorType;
    this.retryable = RETRYABLE[errorType];
    this.userMessage = message;
    this.logDetail = logDetail ?? message;
  }

  toFailure(): AiFailureResult {
    return {
      success: false,
      errorType: this.errorType,
      message: this.userMessage,
      retryable: this.retryable,
    };
  }
}

function errorText(error: unknown): string {
  if (error instanceof AiError) return error.logDetail;
  if (error instanceof Error) {
    const nested = extractNestedApiMessage(error);
    return nested ? `${error.name}: ${nested}` : `${error.name}: ${error.message}`;
  }
  if (typeof error === "object" && error !== null) {
    const nested = extractNestedApiMessage(error);
    if (nested) return nested;
  }
  return String(error);
}

function extractNestedApiMessage(error: unknown): string | null {
  const err = error as {
    message?: string;
    error?: { message?: string; status?: string; code?: number };
    status?: string;
    code?: number;
  };

  const parts: string[] = [];
  if (err.error?.status) parts.push(err.error.status);
  if (err.status && typeof err.status === "string") parts.push(err.status);
  if (err.error?.message) parts.push(err.error.message);
  if (err.message) parts.push(err.message);
  if (typeof err.code === "number") parts.push(String(err.code));
  if (typeof err.error?.code === "number") parts.push(String(err.error.code));

  const combined = parts.join(" ").trim();
  return combined || null;
}

function statusFromError(error: unknown): number | undefined {
  const err = error as {
    status?: number | string;
    statusCode?: number;
    code?: number;
    response?: { status?: number };
    error?: { code?: number; status?: string };
  };

  const numericStatus =
    typeof err.status === "number"
      ? err.status
      : typeof err.statusCode === "number"
        ? err.statusCode
        : typeof err.code === "number"
          ? err.code
          : typeof err.error?.code === "number"
            ? err.error.code
            : err.response?.status;

  if (typeof numericStatus === "number") return numericStatus;

  const statusText = String(err.status ?? err.error?.status ?? "").toUpperCase();
  if (statusText.includes("UNAVAILABLE")) return 503;
  if (statusText.includes("RESOURCE_EXHAUSTED")) return 429;
  if (statusText.includes("INVALID_ARGUMENT") || statusText.includes("UNAUTHENTICATED")) {
    return 401;
  }

  return undefined;
}

/** Maps thrown errors (Gemini, network, parsing) to InternIQ AI error types. */
export function classifyAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;

  const text = errorText(error).toLowerCase();
  const status = statusFromError(error);

  if (
    text.includes("missing gemini_api_key") ||
    text.includes("gemini_api_key")
  ) {
    return new AiError("MISSING_API_KEY", errorText(error));
  }

  if (
    text.includes("unauthenticated") ||
    text.includes("permission denied") ||
    status === 401 ||
    status === 403
  ) {
    if (text.includes("expired")) {
      return new AiError("EXPIRED_API_KEY", errorText(error));
    }
    return new AiError("INVALID_API_KEY", errorText(error));
  }

  if (
    text.includes("api key not valid") ||
    text.includes("invalid api key") ||
    text.includes("api_key_invalid")
  ) {
    return new AiError("INVALID_API_KEY", errorText(error));
  }

  if (
    text.includes("expired") &&
    (text.includes("api key") || text.includes("api_key"))
  ) {
    return new AiError("EXPIRED_API_KEY", errorText(error));
  }

  if (
    status === 429 ||
    text.includes("rate limit") ||
    text.includes("resource_exhausted") ||
    text.includes("too many requests")
  ) {
    if (
      text.includes("quota") ||
      text.includes("daily") ||
      text.includes("billing")
    ) {
      return new AiError("QUOTA_EXCEEDED", errorText(error));
    }
    return new AiError("RATE_LIMIT", errorText(error));
  }

  if (
    text.includes("quota") ||
    text.includes("exceeded your current quota") ||
    text.includes("limit: 0")
  ) {
    return new AiError("QUOTA_EXCEEDED", errorText(error));
  }

  if (
    text.includes("timeout") ||
    text.includes("timed out") ||
    text.includes("etimedout") ||
    text.includes("econnreset") ||
    text.includes("fetch failed")
  ) {
    return new AiError("NETWORK_TIMEOUT", errorText(error));
  }

  if (
    status === 503 ||
    status === 502 ||
    status === 500 ||
    text.includes("unavailable") ||
    text.includes("internal error")
  ) {
    return new AiError("SERVICE_UNAVAILABLE", errorText(error));
  }

  if (text.includes("pdf") || text.includes("extract")) {
    return new AiError("PDF_EXTRACTION", errorText(error));
  }

  if (text.includes("too large") || text.includes("resume too large")) {
    return new AiError("RESUME_TOO_LARGE", errorText(error));
  }

  if (text.includes("json") || text.includes("parse")) {
    return new AiError("JSON_PARSE", errorText(error));
  }

  if (text.includes("empty response") || text.includes("malformed")) {
    return new AiError("MALFORMED_RESPONSE", errorText(error));
  }

  return new AiError("UNKNOWN", errorText(error));
}

export function failureFromError(error: unknown): AiFailureResult {
  return classifyAiError(error).toFailure();
}
