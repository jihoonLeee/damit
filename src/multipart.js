import { config } from "./config.js";
import { HttpError } from "./http.js";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
]);

function decodeMultipartText(value) {
  return Buffer.from(value, "latin1").toString("utf8");
}

export async function parseMultipart(request) {
  const contentType = request.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

  if (!boundaryMatch) {
    throw new HttpError(400, "VALIDATION_ERROR", "올바르지 않은 요청 형식이에요");
  }

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const chunks = [];
  let totalLength = 0;
  const maxMultipartBodyBytes = Number.parseInt(String(config.maxMultipartBodyBytes), 10);
  const maxUploadFileBytes = Number.parseInt(String(config.maxUploadFileBytes), 10);
  const contentLength = Number.parseInt(String(request.headers["content-length"] ?? ""), 10);

  if (Number.isFinite(maxMultipartBodyBytes) && maxMultipartBodyBytes > 0 && Number.isFinite(contentLength) && contentLength > maxMultipartBodyBytes) {
    throw new HttpError(413, "REQUEST_TOO_LARGE", "업로드 요청이 너무 커요. 첨부를 줄여서 다시 시도해 주세요.");
  }

  for await (const chunk of request) {
    totalLength += chunk.length;
    if (Number.isFinite(maxMultipartBodyBytes) && maxMultipartBodyBytes > 0 && totalLength > maxMultipartBodyBytes) {
      throw new HttpError(413, "REQUEST_TOO_LARGE", "업로드 요청이 너무 커요. 첨부를 줄여서 다시 시도해 주세요.");
    }
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const raw = buffer.toString("latin1");
  const parts = raw.split(`--${boundary}`);
  const fields = {};
  const files = [];

  for (const part of parts) {
    if (!part || part === "--\r\n" || part === "--") {
      continue;
    }

    let normalized = part;
    if (normalized.startsWith("\r\n")) {
      normalized = normalized.slice(2);
    }
    if (normalized.endsWith("\r\n")) {
      normalized = normalized.slice(0, -2);
    }
    if (normalized.endsWith("--")) {
      normalized = normalized.slice(0, -2);
    }

    const splitIndex = normalized.indexOf("\r\n\r\n");
    if (splitIndex === -1) {
      continue;
    }

    const rawHeaders = normalized.slice(0, splitIndex);
    const bodyText = normalized.slice(splitIndex + 4);
    const headers = {};

    for (const line of rawHeaders.split("\r\n")) {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        continue;
      }
      const key = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();
      headers[key] = value;
    }

    const disposition = headers["content-disposition"] || "";
    const nameMatch = disposition.match(/name="([^"]+)"/i);
    const fileNameMatch = disposition.match(/filename="([^"]*)"/i);

    if (!nameMatch) {
      continue;
    }

    const name = nameMatch[1];

    if (fileNameMatch && fileNameMatch[1]) {
      const contentTypeHeader = headers["content-type"] || "application/octet-stream";
      const data = Buffer.from(bodyText, "latin1");
      files.push({
        fieldName: name,
        filename: fileNameMatch[1],
        contentType: contentTypeHeader,
        data
      });
      continue;
    }

    fields[name] = decodeMultipartText(bodyText);
  }

  for (const file of files) {
    if (!allowedMimeTypes.has(file.contentType)) {
      throw new HttpError(422, "VALIDATION_ERROR", "이미지 파일만 올릴 수 있어요", {
        photos: "INVALID_TYPE"
      });
    }
    if (Number.isFinite(maxUploadFileBytes) && maxUploadFileBytes > 0 && file.data.length > maxUploadFileBytes) {
      throw new HttpError(422, "VALIDATION_ERROR", "사진 한 장 최대 10MB까지 가능해요", {
        photos: "TOO_LARGE"
      });
    }
  }

  return { fields, files };
}
