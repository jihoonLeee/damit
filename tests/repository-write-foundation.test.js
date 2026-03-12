import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";

import { config } from "../src/config.js";
import { createRepositoryBundle } from "../src/repositories/createRepositoryBundle.js";
import { resetDb, writeDb } from "../src/store.js";

function createFakePool() {
  const calls = [];

  const client = {
    async query(sql, params = []) {
      const normalizedSql = String(sql).replace(/\s+/g, " ").trim();
      calls.push({ sql: normalizedSql, params });

      if (normalizedSql === "BEGIN" || normalizedSql === "COMMIT" || normalizedSql === "ROLLBACK") {
        return { rows: [] };
      }

      if (normalizedSql.includes("SELECT * FROM job_cases WHERE id = $1 LIMIT 1 FOR UPDATE")) {
        return {
          rows: [
            {
              id: "jc_1",
              original_quote_amount: 180000,
              current_status: "UNEXPLAINED"
            }
          ]
        };
      }

      if (normalizedSql.includes("SELECT id FROM scope_comparisons WHERE job_case_id = $1")) {
        return { rows: [] };
      }

      if (normalizedSql.includes("SELECT id, created_at FROM message_drafts WHERE job_case_id = $1")) {
        return { rows: [] };
      }

      if (normalizedSql.includes("UPDATE job_cases SET revised_quote_amount = $2")) {
        return { rows: [] };
      }

      if (normalizedSql.includes("INSERT INTO scope_comparisons")) {
        return { rows: [] };
      }

      if (normalizedSql.includes("INSERT INTO message_drafts")) {
        return { rows: [] };
      }

      if (normalizedSql.includes("UPDATE job_cases SET updated_at = $2, updated_by_user_id = $3")) {
        return { rows: [] };
      }

      if (normalizedSql.includes("INSERT INTO agreement_records")) {
        return { rows: [] };
      }

      if (normalizedSql.includes("UPDATE job_cases SET current_status = $2")) {
        return { rows: [] };
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
    async end() {
      return undefined;
    }
  };
}

async function withTempSqlite(testContext, callback) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "damit-write-foundation-"));
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
          id: "jc_sqlite_1",
          owner_id: "owner_demo",
          company_id: "comp_1",
          created_by_user_id: "user_owner",
          assigned_user_id: null,
          visibility: "TEAM_SHARED",
          updated_by_user_id: "user_owner",
          customer_label: "김민지",
          contact_memo: "문자 선호",
          site_label: "잠실 트리지움",
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
      timelineEvents: []
    });

    await callback();
  } finally {
    Object.assign(config, previous);
  }
}

test("sqlite write foundation saves quote, draft, and agreement with expected shapes", async (t) => {
  await withTempSqlite(t, async () => {
    const bundle = createRepositoryBundle({ engine: "SQLITE" });

    const quote = await bundle.jobCaseRepository.saveQuoteRevision({
      jobCaseId: "jc_sqlite_1",
      actorUserId: "user_owner",
      revisedQuoteAmount: 260000,
      scopeComparison: {
        baseScopeSummary: "기본 입주청소 범위 기준",
        extraWorkSummary: "곰팡이 제거",
        reasonWhyExtra: "기본 범위를 넘는 오염입니다."
      },
      updatedAt: "2026-03-12T00:10:00.000Z"
    });

    const draft = await bundle.jobCaseRepository.upsertDraftMessage({
      jobCaseId: "jc_sqlite_1",
      companyId: "comp_1",
      actorUserId: "user_owner",
      tone: "CUSTOMER_MESSAGE",
      body: "현장 확인 결과 추가 작업이 필요합니다.",
      timestamp: "2026-03-12T00:20:00.000Z"
    });

    const agreement = await bundle.jobCaseRepository.createAgreementRecord({
      jobCaseId: "jc_sqlite_1",
      companyId: "comp_1",
      actorUserId: "user_owner",
      status: "AGREED",
      confirmationChannel: "KAKAO_OR_SMS",
      confirmedAt: "2026-03-12T00:30:00.000Z",
      confirmedAmount: 260000,
      customerResponseNote: "진행 동의",
      createdAt: "2026-03-12T00:30:00.000Z"
    });

    const detail = await bundle.jobCaseRepository.getDetailById("jc_sqlite_1", { companyId: "comp_1", role: "OWNER" });

    assert.equal(quote.quoteDeltaAmount, 60000);
    assert.equal(draft.tone, "CUSTOMER_MESSAGE");
    assert.equal(agreement.currentStatus, "AGREED");
    assert.equal(detail.jobCase.revised_quote_amount, 260000);
    assert.equal(detail.scopeComparisons.length, 1);
    assert.equal(detail.drafts.length, 1);
    assert.equal(detail.agreements.length, 1);
  });
});

test("postgres write foundation wraps quote, draft, and agreement changes in transactions", async () => {
  const pool = createFakePool();
  const bundle = createRepositoryBundle({ engine: "POSTGRES", pool });

  const quote = await bundle.jobCaseRepository.saveQuoteRevision({
    jobCaseId: "jc_1",
    actorUserId: "user_owner",
    revisedQuoteAmount: 240000,
    scopeComparison: {
      baseScopeSummary: "기본 입주청소 범위 기준",
      extraWorkSummary: "니코틴 제거",
      reasonWhyExtra: "기본 범위를 초과한 오염입니다."
    },
    updatedAt: "2026-03-12T00:10:00.000Z"
  });

  const draft = await bundle.jobCaseRepository.upsertDraftMessage({
    jobCaseId: "jc_1",
    companyId: "comp_1",
    actorUserId: "user_owner",
    tone: "CUSTOMER_MESSAGE",
    body: "현장 확인 결과 추가 작업이 필요합니다.",
    timestamp: "2026-03-12T00:20:00.000Z"
  });

  const agreement = await bundle.jobCaseRepository.createAgreementRecord({
    jobCaseId: "jc_1",
    companyId: "comp_1",
    actorUserId: "user_owner",
    status: "AGREED",
    confirmationChannel: "KAKAO_OR_SMS",
    confirmedAt: "2026-03-12T00:30:00.000Z",
    confirmedAmount: 240000,
    customerResponseNote: "진행 동의",
    createdAt: "2026-03-12T00:30:00.000Z"
  });

  assert.equal(quote.quoteDeltaAmount, 60000);
  assert.equal(draft.tone, "CUSTOMER_MESSAGE");
  assert.equal(agreement.currentStatus, "AGREED");
  assert.equal(pool.calls.filter((call) => call.sql === "BEGIN").length, 3);
  assert.equal(pool.calls.filter((call) => call.sql === "COMMIT").length, 3);
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO scope_comparisons")));
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO message_drafts")));
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO agreement_records")));

  await bundle.close();
});

test("sqlite audit repository stores and lists company-scoped entries", async (t) => {
  await withTempSqlite(t, async () => {
    const bundle = createRepositoryBundle({ engine: "SQLITE" });

    const inserted = await bundle.auditLogRepository.append({
      companyId: "comp_1",
      actorUserId: "user_owner",
      actorType: "USER",
      action: "JOB_CASE_QUOTE_UPDATED",
      resourceType: "JOB_CASE",
      resourceId: "jc_sqlite_1",
      requestId: "req_sqlite_1",
      payloadJson: { revisedQuoteAmount: 260000 },
      createdAt: "2026-03-12T00:40:00.000Z"
    });
    const items = await bundle.auditLogRepository.listByCompany("comp_1");

    assert.equal(inserted.companyId, "comp_1");
    assert.equal(items.length, 1);
    assert.equal(items[0].action, "JOB_CASE_QUOTE_UPDATED");
    assert.deepEqual(items[0].payloadJson, { revisedQuoteAmount: 260000 });
  });
});