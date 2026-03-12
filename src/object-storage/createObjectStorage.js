import fs from "node:fs/promises";
import path from "node:path";

function sanitizeSegment(value, fallback = "unknown") {
  const raw = String(value || fallback).trim();
  const normalized = raw.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function normalizeObjectKey(objectKey) {
  return String(objectKey || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .join("/");
}

export function buildFieldRecordPhotoObjectKey({ companyId, ownerId, fieldRecordId, fileName }) {
  const scopeRoot = companyId
    ? ["companies", sanitizeSegment(companyId)]
    : ["owners", sanitizeSegment(ownerId, "owner")];

  return normalizeObjectKey([
    ...scopeRoot,
    "field-records",
    sanitizeSegment(fieldRecordId, "field-record"),
    sanitizeSegment(fileName, "asset.bin")
  ].join("/"));
}

export function resolveLocalUploadPath(uploadDir, objectKey) {
  const rootPath = path.resolve(uploadDir);
  const normalizedKey = normalizeObjectKey(objectKey);
  const targetPath = path.resolve(rootPath, normalizedKey);
  if (targetPath !== rootPath && !targetPath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error("INVALID_OBJECT_KEY");
  }
  return targetPath;
}

function createLocalVolumeStorage(config) {
  return {
    providerName: "LOCAL_VOLUME",
    async saveFieldRecordPhoto({ photoId, fieldRecordId, companyId, ownerId, fileName, data }) {
      const objectKey = buildFieldRecordPhotoObjectKey({
        companyId,
        ownerId,
        fieldRecordId,
        fileName
      });
      const filePath = resolveLocalUploadPath(config.uploadDir, objectKey);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, data);

      const publicUrl = `/uploads/${objectKey}`;
      return {
        storageProvider: "LOCAL_VOLUME",
        objectKey,
        publicUrl,
        url: publicUrl,
        fileName
      };
    }
  };
}

export function createObjectStorage(config) {
  const provider = String(config.objectStorageProvider || "LOCAL_VOLUME").toUpperCase();
  if (provider === "LOCAL_VOLUME") {
    return createLocalVolumeStorage(config);
  }

  throw new Error(`OBJECT_STORAGE_PROVIDER_NOT_IMPLEMENTED:${provider}`);
}
