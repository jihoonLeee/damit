import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";

import { config } from "../src/config.js";
import { createRepositoryBundle } from "../src/repositories/createRepositoryBundle.js";
import { resetDb, writeDb } from "../src/store.js";

async function withTempSqlite(callback) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "damit-field-record-parity-"));
  const previous = {
    rootDir: config.rootDir,
    publicDir: config.publicDir,
    dataDir: config.dataDir,
    uploadDir: config.uploadDir,
    backupDir: config.backupDir,
    dbFilePath: config.dbFilePath,
    storageEngine: config.storageEngine
  };

  config.rootDir = tempRoot;
  config.publicDir = path.join(tempRoot, "public");
  config.dataDir = path.join(tempRoot, "data");
  config.uploadDir = path.join(tempRoot, "data", "uploads");
  config.backupDir = path.join(tempRoot, "data", "backups");
  config.dbFilePath = path.join(tempRoot, "data", "app.sqlite");
  config.storageEngine = "SQLITE";

  try {
    await resetDb();
    await writeDb({
      jobCases: [
        {
          id: "jc_sql_1",
          owner_id: "owner_demo",
          company_id: "comp_1",
          created_by_user_id: "user_owner",
          assigned_user_id: null,
          visibility: "TEAM_SHARED",
          updated_by_user_id: "user_owner",
          customer_label: "Customer A",
          contact_memo: "memo",
          site_label: "Site A",
          original_quote_amount: 200000,
          revised_quote_amount: null,
          quote_delta_amount: null,
          current_status: "UNEXPLAINED",
          created_at: "2026-03-12T00:00:00.000Z",
          updated_at: "2026-03-12T00:00:00.000Z"
        }
      ],
      fieldRecords: [],
      fieldRecordPhotos: [],
      scopeComparisons: [],
      messageDrafts: [],
      agreementRecords: [],
      timelineEvents: [],
      auditLogs: []
    });
    await callback();
  } finally {
    Object.assign(config, previous);
  }
}

function createFakePool() {
  const calls = [];

  const client = {
    async query(sql, params = []) {
      const normalizedSql = String(sql).replace(/\s+/g, " ").trim();
      calls.push({ sql: normalizedSql, params });

      if (["BEGIN", "COMMIT", "ROLLBACK"].includes(normalizedSql)) {
        return { rows: [] };
      }

      if (normalizedSql.includes("SELECT * FROM field_records WHERE id = $1 LIMIT 1 FOR UPDATE")) {
        return {
          rows: [
            {
              id: "fr_pg_1",
              company_id: "comp_1",
              primary_reason: "CONTAMINATION",
              secondary_reason: "NICOTINE",
              status: "UNLINKED"
            }
          ]
        };
      }

      if (normalizedSql.includes("SELECT company_id FROM job_cases WHERE id = $1 LIMIT 1")) {
        return { rows: [{ company_id: "comp_1" }] };
      }

      if (normalizedSql.includes("SELECT * FROM job_cases WHERE id = $1 LIMIT 1 FOR UPDATE")) {
        return {
          rows: [
            {
              id: "jc_pg_1",
              company_id: "comp_1",
              original_quote_amount: 180000,
              current_status: "UNEXPLAINED"
            }
          ]
        };
      }

      if (normalizedSql.includes("INSERT INTO field_records")) return { rows: [] };
      if (normalizedSql.includes("INSERT INTO field_record_photos")) return { rows: [] };
      if (normalizedSql.includes("UPDATE field_records SET job_case_id = $2")) return { rows: [] };
      if (normalizedSql.includes("UPDATE job_cases SET updated_at = $2, updated_by_user_id = $3 WHERE id = $1")) return { rows: [] };

      if (normalizedSql.includes("INSERT INTO timeline_events")) {
        return {
          rows: [
            {
              id: "timeline_1",
              company_id: "comp_1",
              job_case_id: "jc_pg_1",
              actor_user_id: "user_owner",
              event_type: "FIELD_RECORD_LINKED",
              summary: "linked",
              payload_json: { fieldRecordId: "fr_pg_1" },
              created_at: "2026-03-12T01:10:00.000Z"
            }
          ]
        };
      }

      throw new Error(`Unhandled query in fake client: ${normalizedSql}`);
    },
    release() {
      return undefined;
    }
  };

  return {
    calls,
    async connect() {
      return client;
    },
    async query(sql, params = []) {
      return client.query(sql, params);
    },
    async end() {
      return undefined;
    }
  };
}

test("sqlite field record repository and timeline repository preserve write parity", async () => {
  await withTempSqlite(async () => {
    const bundle = createRepositoryBundle({ engine: "SQLITE" });

    const created = await bundle.fieldRecordRepository.createCapturedRecord({
      fieldRecord: {
        id: "fr_sql_1",
        owner_id: "owner_demo",
        company_id: "comp_1",
        created_by_user_id: "user_owner",
        job_case_id: null,
        primary_reason: "CONTAMINATION",
        secondary_reason: "NICOTINE",
        note: "note",
        status: "UNLINKED",
        created_at: "2026-03-12T01:00:00.000Z"
      },
      photos: [
        {
          id: "photo_sql_1",
          field_record_id: "fr_sql_1",
          storage_provider: "LOCAL_VOLUME",
          object_key: "owners/owner_demo/field-records/fr_sql_1/photo_sql_1.png",
          public_url: "/uploads/owners/owner_demo/field-records/fr_sql_1/photo_sql_1.png",
          url: "/uploads/owners/owner_demo/field-records/fr_sql_1/photo_sql_1.png",
          sort_order: 0,
          created_at: "2026-03-12T01:00:00.000Z"
        }
      ]
    });

    const found = await bundle.fieldRecordRepository.getById("fr_sql_1", { companyId: "comp_1" });
    const linked = await bundle.fieldRecordRepository.linkToJobCase({
      fieldRecordId: "fr_sql_1",
      jobCaseId: "jc_sql_1",
      actorUserId: "user_owner",
      linkedAt: "2026-03-12T01:05:00.000Z"
    });
    const timeline = await bundle.timelineEventRepository.append({
      jobCaseId: "jc_sql_1",
      companyId: "comp_1",
      actorUserId: "user_owner",
      eventType: "FIELD_RECORD_LINKED",
      summary: "linked",
      payloadJson: { fieldRecordId: "fr_sql_1" },
      createdAt: "2026-03-12T01:10:00.000Z"
    });
    const detail = await bundle.jobCaseRepository.getDetailById("jc_sql_1", { companyId: "comp_1", role: "OWNER" });

    assert.equal(created.photos.length, 1);
    assert.equal(found.id, "fr_sql_1");
    assert.equal(linked.status, "LINKED");
    assert.equal(timeline.event_type, "FIELD_RECORD_LINKED");
    assert.equal(detail.fieldRecords[0].job_case_id, "jc_sql_1");
    assert.equal(detail.timelineEvents.length, 1);
  });
});

test("postgres field record and timeline repositories wrap write parity in transactions", async () => {
  const pool = createFakePool();
  const bundle = createRepositoryBundle({ engine: "POSTGRES", pool });

  const created = await bundle.fieldRecordRepository.createCapturedRecord({
    fieldRecord: {
      id: "fr_pg_1",
      company_id: "comp_1",
      owner_id: "owner_demo",
      created_by_user_id: "user_owner",
      job_case_id: null,
      primary_reason: "CONTAMINATION",
      secondary_reason: "NICOTINE",
      note: "note",
      status: "UNLINKED",
      created_at: "2026-03-12T01:00:00.000Z"
    },
    photos: [
      {
        id: "photo_pg_1",
        field_record_id: "fr_pg_1",
        storage_provider: "LOCAL_VOLUME",
        object_key: "companies/comp_1/field-records/fr_pg_1/photo_pg_1.png",
        public_url: "/uploads/companies/comp_1/field-records/fr_pg_1/photo_pg_1.png",
        url: "/uploads/companies/comp_1/field-records/fr_pg_1/photo_pg_1.png",
        sort_order: 0,
        created_at: "2026-03-12T01:00:00.000Z"
      }
    ]
  });
  const linked = await bundle.fieldRecordRepository.linkToJobCase({
    fieldRecordId: "fr_pg_1",
    jobCaseId: "jc_pg_1",
    actorUserId: "user_owner",
    linkedAt: "2026-03-12T01:05:00.000Z"
  });
  const timeline = await bundle.timelineEventRepository.append({
    jobCaseId: "jc_pg_1",
    companyId: "comp_1",
    actorUserId: "user_owner",
    eventType: "FIELD_RECORD_LINKED",
    summary: "linked",
    payloadJson: { fieldRecordId: "fr_pg_1" },
    createdAt: "2026-03-12T01:10:00.000Z"
  });

  assert.equal(created.photos[0].id, "photo_pg_1");
  assert.equal(linked.status, "LINKED");
  assert.equal(timeline.event_type, "FIELD_RECORD_LINKED");
  assert.equal(pool.calls.filter((call) => call.sql === "BEGIN").length, 3);
  assert.equal(pool.calls.filter((call) => call.sql === "COMMIT").length, 3);
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO field_records")));
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO field_record_photos")));
  assert.ok(pool.calls.some((call) => call.sql.includes("UPDATE field_records SET job_case_id = $2")));
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO timeline_events")));

  await bundle.close();
});
