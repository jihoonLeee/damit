import crypto from "node:crypto";

import { config } from "./config.js";
import { captureServerError } from "./observability/sentry.js";

export class HttpError extends Error {
  constructor(status, code, message, fieldErrors, headers) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.headers = headers || null;
  }
}

const BASE_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"
};

export function buildStandardHeaders(contentType, extraHeaders = {}) {
  return {
    "Content-Type": contentType,
    ...BASE_SECURITY_HEADERS,
    ...extraHeaders
  };
}

export function buildNoStoreHeaders(extraHeaders = {}) {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    ...extraHeaders
  };
}

export function json(response, status, data, extraHeaders = {}) {
  response.writeHead(status, buildStandardHeaders("application/json; charset=utf-8", extraHeaders));
  response.end(JSON.stringify(data));
}

export function jsonNoStore(response, status, data, extraHeaders = {}) {
  json(response, status, data, buildNoStoreHeaders(extraHeaders));
}

export function redirect(response, status, location) {
  response.writeHead(
    status,
    buildStandardHeaders(
      "text/plain; charset=utf-8",
      buildNoStoreHeaders({
        Location: location
      })
    )
  );
  response.end(`Redirecting to ${location}`);
}

export function notFound(response) {
  jsonNoStore(response, 404, {
    error: {
      code: "NOT_FOUND",
      message: "요청한 리소스를 찾을 수 없어요.",
      requestId: createRequestId()
    }
  });
}

export async function readJsonBody(request, options = {}) {
  const bodyText = await readTextBody(request, options);
  if (!bodyText) {
    return {};
  }
  return JSON.parse(bodyText);
}

export async function readTextBody(request, options = {}) {
  const maxBytes = Number.parseInt(String(options.maxBytes ?? config.maxJsonBodyBytes), 10);
  const contentLength = Number.parseInt(String(request.headers["content-length"] ?? ""), 10);
  if (Number.isFinite(maxBytes) && maxBytes > 0 && Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new HttpError(413, "REQUEST_TOO_LARGE", "요청 본문이 너무 커요. 내용을 줄여서 다시 시도해 주세요.");
  }

  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (Number.isFinite(maxBytes) && maxBytes > 0 && totalBytes > maxBytes) {
      throw new HttpError(413, "REQUEST_TOO_LARGE", "요청 본문이 너무 커요. 내용을 줄여서 다시 시도해 주세요.");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createRequestId() {
  return `req_${crypto.randomBytes(6).toString("hex")}`;
}

export function sendError(response, requestId, error, request = null) {
  const status = error instanceof HttpError ? error.status : 500;
  const code = error instanceof HttpError ? error.code : "INTERNAL_ERROR";
  const message = error instanceof HttpError ? error.message : "일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.";
  const payload = {
    error: {
      code,
      message,
      requestId
    }
  };

  if (error instanceof HttpError && error.fieldErrors) {
    payload.error.fieldErrors = error.fieldErrors;
  }

  if (!(error instanceof HttpError) || status >= 500) {
    if (!(error instanceof HttpError)) {
      console.error(error);
    }
    captureServerError(error, {
      channel: "http",
      requestId,
      status,
      code,
      request
    });
  }

  const extraHeaders = error instanceof HttpError && error.headers ? error.headers : {};
  jsonNoStore(response, status, payload, extraHeaders);
}
