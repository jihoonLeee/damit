import crypto from "node:crypto";

export class HttpError extends Error {
  constructor(status, code, message, fieldErrors) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function json(response, status, data, extraHeaders = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  response.end(JSON.stringify(data));
}

export function notFound(response) {
  response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({
    error: {
      code: "NOT_FOUND",
      message: "요청한 리소스를 찾을 수 없어요",
      requestId: createRequestId()
    }
  }));
}

export async function readJsonBody(request) {
  const bodyText = await readTextBody(request);
  if (!bodyText) {
    return {};
  }
  return JSON.parse(bodyText);
}

export async function readTextBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createRequestId() {
  return `req_${crypto.randomBytes(6).toString("hex")}`;
}

export function sendError(response, requestId, error) {
  const status = error instanceof HttpError ? error.status : 500;
  const code = error instanceof HttpError ? error.code : "INTERNAL_ERROR";
  const message = error instanceof HttpError ? error.message : "잠시 후 다시 시도해주세요";
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

  json(response, status, payload);
}
