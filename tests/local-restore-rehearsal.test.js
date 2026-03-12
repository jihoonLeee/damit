import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { mkdtemp } from "node:fs/promises";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "damit-restore-test-"));
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
config.ownerId = "owner_restore_test";

test("local restore rehearsal recovers sqlite data and uploaded files together", async () => {
  const createdAt = "2026-03-12T12:34:56.000Z";
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

  const dbBackup = await createBackup("restore-test");
  const uploadBackup = await createUploadBackup("restore-test");

  await resetDb();
  await fs.rm(config.uploadDir, { recursive: true, force: true });
  await fs.mkdir(config.uploadDir, { recursive: true });

  let snapshot = await readDb();
  assert.equal(snapshot.jobCases.length, 0);
  assert.equal(snapshot.fieldRecordPhotos.length, 0);

  const restoredDb = await restoreSqliteBackup(dbBackup.filePath);
  const restoredUploads = await restoreUploadBackup(uploadBackup.directoryPath);
  snapshot = await readDb();

  assert.equal(restoredDb.counts.jobCases, 1);
  assert.equal(restoredDb.counts.fieldRecords, 1);
  assert.equal(restoredDb.counts.agreements, 1);
  assert.equal(restoredUploads.fileCount, 1);
  assert.equal(snapshot.jobCases.length, 1);
  assert.equal(snapshot.fieldRecords.length, 1);
  assert.equal(snapshot.fieldRecordPhotos.length, 1);
  assert.equal(snapshot.fieldRecords[0].note, "복구 리허설 메모");

  const restoredUploadPath = path.join(config.uploadDir, upload.objectKey);
  await fs.access(restoredUploadPath);
});
