import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { mkdtemp } from "node:fs/promises";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "damit-restore-rehearsal-"));
process.chdir(tempRoot);

const { config } = await import("../src/config.js");
const {
  createBackup,
  createUploadBackup,
  readDb,
  resetDb,
  restoreSqliteBackup,
  restoreUploadBackup,
  saveUpload,
  writeDb
} = await import("../src/store.js");

config.rootDir = tempRoot;
config.publicDir = path.join(tempRoot, "public");
config.dataDir = path.join(tempRoot, "data");
config.uploadDir = path.join(tempRoot, "data", "uploads");
config.backupDir = path.join(tempRoot, "data", "backups");
config.dbFilePath = path.join(tempRoot, "data", "app.sqlite");
config.storageEngine = "SQLITE";
config.objectStorageProvider = "LOCAL_VOLUME";
config.ownerId = "owner_restore";

const createdAt = "2026-03-12T12:00:00.000Z";
const upload = await saveUpload(
  {
    filename: "restore-proof.png",
    contentType: "image/png",
    data: Buffer.from([137, 80, 78, 71])
  },
  {
    ownerId: config.ownerId,
    companyId: "comp_restore",
    fieldRecordId: "fr_restore"
  }
);

await writeDb({
  jobCases: [
    {
      id: "jc_restore",
      owner_id: config.ownerId,
      company_id: "comp_restore",
      created_by_user_id: "user_restore",
      assigned_user_id: null,
      visibility: "TEAM_SHARED",
      updated_by_user_id: "user_restore",
      customer_label: "복구 리허설 고객",
      contact_memo: "복구 테스트",
      site_label: "복구 리허설 현장",
      original_quote_amount: 210000,
      revised_quote_amount: 250000,
      quote_delta_amount: 40000,
      current_status: "AGREED",
      created_at: createdAt,
      updated_at: createdAt
    }
  ],
  fieldRecords: [
    {
      id: "fr_restore",
      owner_id: config.ownerId,
      company_id: "comp_restore",
      created_by_user_id: "user_restore",
      job_case_id: "jc_restore",
      primary_reason: "CONTAMINATION",
      secondary_reason: "MOLD",
      note: "복구 리허설 메모",
      status: "LINKED",
      created_at: createdAt
    }
  ],
  fieldRecordPhotos: [
    {
      id: upload.id,
      field_record_id: "fr_restore",
      storage_provider: upload.storageProvider,
      object_key: upload.objectKey,
      public_url: upload.publicUrl,
      url: upload.url,
      sort_order: 0,
      created_at: createdAt
    }
  ],
  scopeComparisons: [],
  messageDrafts: [],
  agreementRecords: [
    {
      id: "ar_restore",
      job_case_id: "jc_restore",
      company_id: "comp_restore",
      created_by_user_id: "user_restore",
      status: "AGREED",
      confirmation_channel: "KAKAO_OR_SMS",
      confirmed_at: createdAt,
      confirmed_amount: 250000,
      customer_response_note: "복구 확인",
      created_at: createdAt
    }
  ],
  timelineEvents: [
    {
      id: "tl_restore",
      job_case_id: "jc_restore",
      company_id: "comp_restore",
      actor_user_id: "user_restore",
      event_type: "AGREEMENT_RECORDED",
      summary: "복구 리허설 타임라인",
      payload_json: { agreementId: "ar_restore" },
      created_at: createdAt
    }
  ],
  auditLogs: []
});

const dbBackup = await createBackup("restore-rehearsal");
const uploadBackup = await createUploadBackup("restore-rehearsal");

await resetDb();
await fs.rm(config.uploadDir, { recursive: true, force: true });
await fs.mkdir(config.uploadDir, { recursive: true });

const afterReset = await readDb();
assert.equal(afterReset.jobCases.length, 0);
assert.equal(afterReset.fieldRecordPhotos.length, 0);

const restoredDb = await restoreSqliteBackup(dbBackup.filePath);
const restoredUploads = await restoreUploadBackup(uploadBackup.directoryPath);
const restored = await readDb();
const uploadFilePath = path.join(config.uploadDir, upload.objectKey);
await fs.access(uploadFilePath);

assert.equal(restored.jobCases.length, 1);
assert.equal(restored.fieldRecords.length, 1);
assert.equal(restored.fieldRecordPhotos.length, 1);
assert.equal(restored.agreementRecords.length, 1);
assert.equal(restored.timelineEvents.length, 1);
assert.equal(restored.fieldRecords[0].note, "복구 리허설 메모");
assert.equal(restored.fieldRecordPhotos[0].object_key, upload.objectKey);

console.log(JSON.stringify({
  ok: true,
  tempRoot,
  dbBackup,
  uploadBackup,
  restoredDb,
  restoredUploads,
  verified: {
    jobCases: restored.jobCases.length,
    fieldRecords: restored.fieldRecords.length,
    fieldRecordPhotos: restored.fieldRecordPhotos.length,
    agreements: restored.agreementRecords.length,
    timelineEvents: restored.timelineEvents.length,
    uploadFilePath
  }
}, null, 2));
