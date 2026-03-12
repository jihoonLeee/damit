import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";

import { config } from "../src/config.js";
import { createRepositoryBundle } from "../src/repositories/createRepositoryBundle.js";
import { resetDb, writeDb } from "../src/store.js";

function createFakePool() {
  const calls = [];
  const state = {
    job_cases: [{ id: "jc_1" }],
    field_records: [{ id: "fr_1" }],
    field_record_photos: [{ id: "photo_1", sort_order: 0, created_at: "2026-03-12T00:00:00.000Z" }],
    scope_comparisons: [{ id: "scope_1", updated_at: "2026-03-12T00:00:00.000Z" }],
    message_drafts: [{ id: "draft_1", created_at: "2026-03-12T00:00:00.000Z" }],
    agreement_records: [{ id: "agreement_1", created_at: "2026-03-12T00:00:00.000Z" }],
    timeline_events: [{ id: "timeline_1", created_at: "2026-03-12T00:00:00.000Z" }],
    audit_logs: [{ id: "audit_1", created_at: "2026-03-12T00:00:00.000Z" }],
    customer_confirmation_links: [{ id: "ccl_1", created_at: "2026-03-12T00:00:00.000Z" }],
    customer_confirmation_events: [{ id: "cce_1", created_at: "2026-03-12T00:00:00.000Z" }]
  };

  function tableKeyFromSql(sql) {
    if (sql.includes("FROM job_cases")) return "job_cases";
    if (sql.includes("FROM field_records")) return "field_records";
    if (sql.includes("FROM field_record_photos")) return "field_record_photos";
    if (sql.includes("FROM scope_comparisons")) return "scope_comparisons";
    if (sql.includes("FROM message_drafts")) return "message_drafts";
    if (sql.includes("FROM agreement_records")) return "agreement_records";
    if (sql.includes("FROM timeline_events")) return "timeline_events";
    if (sql.includes("FROM audit_logs")) return "audit_logs";
    if (sql.includes("FROM customer_confirmation_links")) return "customer_confirmation_links";
    if (sql.includes("FROM customer_confirmation_events")) return "customer_confirmation_events";
    return null;
  }

  const client = {
    async query(sql, params = []) {
      const normalizedSql = String(sql).replace(/\s+/g, " ").trim();
      calls.push({ sql: normalizedSql, params });

      if (normalizedSql === "BEGIN" || normalizedSql === "COMMIT" || normalizedSql === "ROLLBACK") {
        return { rows: [] };
      }

      if (normalizedSql.startsWith("TRUNCATE TABLE")) {
        for (const key of Object.keys(state)) {
          state[key] = [];
        }
        return { rows: [] };
      }

      if (normalizedSql.startsWith("SELECT COUNT(*)::int AS count FROM ")) {
        const table = normalizedSql.replace("SELECT COUNT(*)::int AS count FROM ", "").trim();
        return { rows: [{ count: state[table].length }] };
      }

      const tableKey = tableKeyFromSql(normalizedSql);
      if (tableKey) {
        return { rows: state[tableKey] };
      }

      throw new Error(`Unhandled query in fake pool: ${normalizedSql}`);
    },
    release() {
      return undefined;
    }
  };

  return {
    calls,
    state,
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

async function withTempSqlite(callback) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "damit-system-repo-"));
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
      jobCases: [{
        id: "jc_1",
        owner_id: "owner_demo",
        company_id: "comp_1",
        created_by_user_id: "user_owner",
        assigned_user_id: null,
        visibility: "TEAM_SHARED",
        updated_by_user_id: "user_owner",
        customer_label: "고객",
        contact_memo: null,
        site_label: "현장",
        original_quote_amount: 200000,
        revised_quote_amount: null,
        quote_delta_amount: null,
        current_status: "UNEXPLAINED",
        created_at: "2026-03-12T00:00:00.000Z",
        updated_at: "2026-03-12T00:00:00.000Z"
      }],
      fieldRecords: [{
        id: "fr_1",
        owner_id: "owner_demo",
        company_id: "comp_1",
        created_by_user_id: "user_owner",
        job_case_id: "jc_1",
        primary_reason: "CONTAMINATION",
        secondary_reason: "NICOTINE",
        note: "메모",
        status: "LINKED",
        created_at: "2026-03-12T00:00:00.000Z"
      }],
      fieldRecordPhotos: [],
      scopeComparisons: [],
      messageDrafts: [],
      agreementRecords: [],
      timelineEvents: [],
      auditLogs: []
    });
    await callback(tempRoot);
  } finally {
    Object.assign(config, previous);
  }
}

test("sqlite system repository supports storage summary, backup, and reset", async () => {
  await withTempSqlite(async () => {
    const bundle = createRepositoryBundle({ engine: "SQLITE" });

    const summaryBefore = await bundle.systemRepository.getStorageSummary();
    const backup = await bundle.systemRepository.createBackup("ops-test");
    const summaryAfterReset = await bundle.systemRepository.resetAllData();

    assert.equal(summaryBefore.storageEngine, "SQLITE");
    assert.equal(summaryBefore.counts.jobCases, 1);
    assert.match(backup.fileName, /sqlite-ops-test/);
    await fs.access(backup.filePath);
    assert.deepEqual(summaryAfterReset.counts, {
      jobCases: 0,
      fieldRecords: 0,
      agreements: 0
    });
  });
});

test("postgres system repository supports storage summary, logical backup, and operational reset", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "damit-pg-system-repo-"));
  const previous = {
    rootDir: config.rootDir,
    backupDir: config.backupDir,
    objectStorageProvider: config.objectStorageProvider
  };
  config.rootDir = tempRoot;
  config.backupDir = path.join(tempRoot, "backups");
  config.objectStorageProvider = "LOCAL_VOLUME";

  try {
    const pool = createFakePool();
    const bundle = createRepositoryBundle({ engine: "POSTGRES", pool });

    const summaryBefore = await bundle.systemRepository.getStorageSummary();
    const backup = await bundle.systemRepository.createBackup("ops-test");
    const backupPayload = JSON.parse(await fs.readFile(backup.filePath, "utf8"));
    const summaryAfterReset = await bundle.systemRepository.resetAllData();

    assert.equal(summaryBefore.storageEngine, "POSTGRES");
    assert.equal(summaryBefore.objectStorageProvider, "LOCAL_VOLUME");
    assert.equal(summaryBefore.counts.jobCases, 1);
    assert.match(backup.fileName, /postgres-ops-test/);
    assert.equal(backupPayload.storageEngine, "POSTGRES");
    assert.equal(backupPayload.tables.jobCases.length, 1);
    assert.ok(pool.calls.some((call) => call.sql.startsWith("TRUNCATE TABLE")));
    assert.deepEqual(summaryAfterReset.counts, {
      jobCases: 0,
      fieldRecords: 0,
      agreements: 0
    });

    await bundle.close();
  } finally {
    Object.assign(config, previous);
  }
});
