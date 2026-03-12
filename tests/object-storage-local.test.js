import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { mkdtemp } from "node:fs/promises";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "object-storage-local-"));

const { buildFieldRecordPhotoObjectKey, createObjectStorage, resolveLocalUploadPath } = await import("../src/object-storage/createObjectStorage.js");

test("local volume provider builds company-scoped object metadata", async () => {
  const config = {
    objectStorageProvider: "LOCAL_VOLUME",
    uploadDir: path.join(tempRoot, "uploads")
  };
  const storage = createObjectStorage(config);
  const saved = await storage.saveFieldRecordPhoto({
    photoId: "photo_123",
    fieldRecordId: "fr_456",
    companyId: "co_789",
    ownerId: "owner_demo",
    fileName: "photo_123.png",
    data: Buffer.from([137, 80, 78, 71])
  });

  assert.equal(saved.storageProvider, "LOCAL_VOLUME");
  assert.equal(saved.objectKey, "companies/co_789/field-records/fr_456/photo_123.png");
  assert.equal(saved.publicUrl, "/uploads/companies/co_789/field-records/fr_456/photo_123.png");

  const filePath = resolveLocalUploadPath(config.uploadDir, saved.objectKey);
  const stat = await fs.stat(filePath);
  assert.equal(stat.isFile(), true);
});

test("object key falls back to owner scope when company is absent", () => {
  const objectKey = buildFieldRecordPhotoObjectKey({
    ownerId: "owner_demo",
    fieldRecordId: "fr_001",
    fileName: "photo_001.jpg"
  });

  assert.equal(objectKey, "owners/owner_demo/field-records/fr_001/photo_001.jpg");
});
