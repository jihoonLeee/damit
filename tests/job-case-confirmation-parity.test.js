import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";

import { config } from "../src/config.js";
import { createRepositoryBundle } from "../src/repositories/createRepositoryBundle.js";
import { resetDb } from "../src/store.js";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "damit-jobcase-confirmation-parity-"));
config.rootDir = tempRoot;
config.publicDir = path.join(tempRoot, "public");
config.dataDir = path.join(tempRoot, "data");
config.uploadDir = path.join(tempRoot, "data", "uploads");
config.backupDir = path.join(tempRoot, "data", "backups");
config.dbFilePath = path.join(tempRoot, "data", "app.sqlite");
config.storageEngine = "SQLITE";

function createFakePool() {
  const calls = [];
  const state = {
    jobCase: {
      id: "jc_pg_1",
      company_id: "comp_pg_1"
    },
    linksByHash: new Map(),
    latestByJobCaseId: new Map()
  };

  const client = {
    async query(sql, params = []) {
      const normalizedSql = String(sql).replace(/\s+/g, " ").trim();
      calls.push({ sql: normalizedSql, params });

      if (normalizedSql === "BEGIN" || normalizedSql === "COMMIT" || normalizedSql === "ROLLBACK") {
        return { rows: [] };
      }

      if (normalizedSql.startsWith("INSERT INTO job_cases (")) {
        return {
          rows: [
            {
              id: params[0],
              current_status: params[13],
              original_quote_amount: params[10],
              revised_quote_amount: params[11],
              quote_delta_amount: params[12],
              created_at: params[14],
              visibility: params[6]
            }
          ]
        };
      }

      if (normalizedSql.includes("SELECT * FROM job_cases WHERE id = $1 LIMIT 1 FOR UPDATE")) {
        return { rows: [state.jobCase] };
      }

      if (normalizedSql.startsWith("UPDATE customer_confirmation_links SET status = 'REVOKED'")) {
        const jobCaseId = params[0];
        const timestamp = params[1];
        for (const link of state.latestByJobCaseId.values()) {
          if (link.job_case_id === jobCaseId && ["ISSUED", "VIEWED"].includes(link.status)) {
            link.status = "REVOKED";
            link.revoked_at = timestamp;
            link.updated_at = timestamp;
          }
        }
        return { rows: [] };
      }

      if (normalizedSql.startsWith("INSERT INTO customer_confirmation_links (")) {
        const row = {
          id: params[0],
          company_id: params[1],
          job_case_id: params[2],
          token_hash: params[3],
          status: "ISSUED",
          expires_at: params[4],
          revoked_at: null,
          created_by_user_id: params[5],
          viewed_at: null,
          confirmed_at: null,
          confirmation_note: null,
          request_ip: null,
          user_agent: null,
          created_at: params[6],
          updated_at: params[6]
        };
        state.linksByHash.set(row.token_hash, row);
        state.latestByJobCaseId.set(row.job_case_id, row);
        return { rows: [] };
      }

      if (normalizedSql.startsWith("INSERT INTO customer_confirmation_events (")) {
        return { rows: [] };
      }

      if (normalizedSql.includes("SELECT * FROM customer_confirmation_links WHERE job_case_id = $1")) {
        return { rows: [state.latestByJobCaseId.get(params[0])].filter(Boolean) };
      }

      if (normalizedSql.includes("SELECT * FROM customer_confirmation_links WHERE token_hash = $1 LIMIT 1 FOR UPDATE")) {
        return { rows: [state.linksByHash.get(params[0])].filter(Boolean) };
      }

      if (normalizedSql.startsWith("UPDATE customer_confirmation_links SET status = $2,")) {
        const row = state.linksByHash.get([...state.linksByHash.keys()].find((key) => state.linksByHash.get(key).id === params[0]));
        row.status = params[1];
        row.viewed_at = params[2];
        row.request_ip = row.request_ip || params[3] || null;
        row.user_agent = row.user_agent || params[4] || null;
        row.updated_at = params[2];
        return { rows: [] };
      }

      if (normalizedSql.startsWith("UPDATE customer_confirmation_links SET status = 'CONFIRMED'")) {
        const row = state.linksByHash.get([...state.linksByHash.keys()].find((key) => state.linksByHash.get(key).id === params[0]));
        row.status = "CONFIRMED";
        row.viewed_at = row.viewed_at || params[1];
        row.confirmed_at = params[1];
        row.confirmation_note = params[2] || null;
        row.request_ip = params[3] || null;
        row.user_agent = params[4] || null;
        row.updated_at = params[1];
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

test("sqlite repository parity covers job case create and customer confirmation lifecycle", async () => {
  await resetDb();
  const bundle = createRepositoryBundle({ engine: "SQLITE" });

  const created = await bundle.jobCaseRepository.create({
    jobCase: {
      id: "jc_sqlite_1",
      owner_id: "owner_demo",
      company_id: "comp_sqlite_1",
      created_by_user_id: "user_owner",
      assigned_user_id: null,
      visibility: "TEAM_SHARED",
      updated_by_user_id: "user_owner",
      customer_label: "김민수",
      contact_memo: "문자 우선",
      site_label: "서초 리버뷰",
      original_quote_amount: 210000,
      revised_quote_amount: null,
      quote_delta_amount: null,
      current_status: "UNEXPLAINED",
      created_at: "2026-03-12T01:00:00.000Z",
      updated_at: "2026-03-12T01:00:00.000Z"
    }
  });

  const link = await bundle.customerConfirmationRepository.createLink({
    jobCaseId: "jc_sqlite_1",
    companyId: "comp_sqlite_1",
    createdByUserId: "user_owner",
    expiresInHours: 24
  });
  const latestIssued = await bundle.customerConfirmationRepository.getLatestByJobCaseId("jc_sqlite_1");
  const viewed = await bundle.customerConfirmationRepository.getViewByToken({
    token: link.token,
    requestIp: "127.0.0.1",
    userAgent: "sqlite-test-agent"
  });
  const confirmed = await bundle.customerConfirmationRepository.acknowledge({
    token: link.token,
    note: "추가 작업 내용 확인했습니다",
    requestIp: "127.0.0.1",
    userAgent: "sqlite-test-agent"
  });
  const latestConfirmed = await bundle.customerConfirmationRepository.getLatestByJobCaseId("jc_sqlite_1");

  assert.equal(created.currentStatus, "UNEXPLAINED");
  assert.equal(created.visibility, "TEAM_SHARED");
  assert.equal(link.status, "ISSUED");
  assert.ok(link.token);
  assert.equal(latestIssued.status, "ISSUED");
  assert.equal(viewed.status, "VIEWED");
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(confirmed.confirmationNote, "추가 작업 내용 확인했습니다");
  assert.equal(latestConfirmed.status, "CONFIRMED");
  assert.ok(latestConfirmed.confirmedAt);
});

test("postgres repository parity covers job case create and customer confirmation lifecycle", async () => {
  const pool = createFakePool();
  const bundle = createRepositoryBundle({ engine: "POSTGRES", pool });

  const created = await bundle.jobCaseRepository.create({
    jobCase: {
      id: "jc_pg_new",
      company_id: "comp_pg_1",
      owner_id: "owner_pg_1",
      created_by_user_id: "user_owner",
      assigned_user_id: null,
      updated_by_user_id: "user_owner",
      visibility: "TEAM_SHARED",
      customer_label: "박서준",
      contact_memo: "전화 선호",
      site_label: "송파 레이크",
      original_quote_amount: 320000,
      revised_quote_amount: null,
      quote_delta_amount: null,
      current_status: "UNEXPLAINED",
      created_at: "2026-03-12T02:00:00.000Z",
      updated_at: "2026-03-12T02:00:00.000Z"
    }
  });

  const link = await bundle.customerConfirmationRepository.createLink({
    jobCaseId: "jc_pg_1",
    companyId: "comp_pg_1",
    createdByUserId: "user_owner",
    expiresInHours: 48
  });
  const latestIssued = await bundle.customerConfirmationRepository.getLatestByJobCaseId("jc_pg_1");
  const viewed = await bundle.customerConfirmationRepository.getViewByToken({
    token: link.token,
    requestIp: "10.0.0.1",
    userAgent: "pg-test-agent"
  });
  const confirmed = await bundle.customerConfirmationRepository.acknowledge({
    token: link.token,
    note: "확인 완료",
    requestIp: "10.0.0.2",
    userAgent: "pg-test-agent"
  });

  assert.equal(created.id, "jc_pg_new");
  assert.equal(created.currentStatus, "UNEXPLAINED");
  assert.equal(link.status, "ISSUED");
  assert.equal(latestIssued.status, "ISSUED");
  assert.equal(viewed.status, "VIEWED");
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(confirmed.confirmationNote, "확인 완료");
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO job_cases")));
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO customer_confirmation_links")));
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO customer_confirmation_events")));
  assert.ok(pool.calls.some((call) => call.sql.includes("UPDATE customer_confirmation_links SET status = $2")));
  assert.ok(pool.calls.some((call) => call.sql.includes("UPDATE customer_confirmation_links SET status = 'CONFIRMED'")));
  assert.equal(pool.calls.filter((call) => call.sql === "BEGIN").length, 3);
  assert.equal(pool.calls.filter((call) => call.sql === "COMMIT").length, 3);

  await bundle.close();
});
