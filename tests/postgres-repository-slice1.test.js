import test from "node:test";
import assert from "node:assert/strict";

import { createRepositoryBundle } from "../src/repositories/createRepositoryBundle.js";

function createFakePool() {
  const calls = [];

  return {
    calls,
    async query(sql, params = []) {
      const normalizedSql = String(sql).replace(/\s+/g, " ").trim();
      calls.push({ sql: normalizedSql, params });

      if (normalizedSql.includes("FROM job_cases jc") && normalizedSql.includes("LEFT JOIN LATERAL") && normalizedSql.includes("ORDER BY jc.updated_at DESC")) {
        return {
          rows: [
            {
              id: "jc_1",
              customer_label: "김은정",
              site_label: "마포 래미안",
              original_quote_amount: 180000,
              revised_quote_amount: 230000,
              quote_delta_amount: 50000,
              updated_at: new Date("2026-03-12T01:02:03.000Z"),
              primary_reason: "CONTAMINATION",
              secondary_reason: "MOLD",
              current_status: "AGREED",
              has_agreement_record: true
            }
          ]
        };
      }

      if (normalizedSql.includes("SELECT jc.*") && normalizedSql.includes("FROM job_cases jc")) {
        return {
          rows: [
            {
              id: "jc_1",
              company_id: "comp_1",
              created_by_user_id: "user_owner",
              assigned_user_id: "user_staff",
              updated_by_user_id: "user_owner",
              visibility: "TEAM_SHARED",
              customer_label: "김은정",
              contact_memo: "문자 선호",
              site_label: "마포 래미안",
              original_quote_amount: 180000,
              revised_quote_amount: 230000,
              quote_delta_amount: 50000,
              current_status: "AGREED",
              created_at: new Date("2026-03-12T00:00:00.000Z"),
              updated_at: new Date("2026-03-12T01:02:03.000Z")
            }
          ]
        };
      }

      if (normalizedSql.includes("FROM field_records WHERE job_case_id = $1")) {
        return {
          rows: [
            {
              id: "fr_1",
              company_id: "comp_1",
              job_case_id: "jc_1",
              primary_reason: "CONTAMINATION",
              secondary_reason: "MOLD",
              note: "욕실 곰팡이 심함",
              status: "LINKED",
              created_at: new Date("2026-03-12T00:10:00.000Z")
            }
          ]
        };
      }

      if (normalizedSql.includes("FROM agreement_records WHERE job_case_id = $1")) {
        return {
          rows: [
            {
              id: "ar_1",
              company_id: "comp_1",
              job_case_id: "jc_1",
              created_by_user_id: "user_owner",
              status: "AGREED",
              confirmation_channel: "KAKAO_OR_SMS",
              confirmed_at: new Date("2026-03-12T00:40:00.000Z"),
              confirmed_amount: 230000,
              customer_response_note: "바로 진행 요청",
              created_at: new Date("2026-03-12T00:40:00.000Z")
            }
          ]
        };
      }

      if (normalizedSql.includes("FROM message_drafts WHERE job_case_id = $1")) {
        return {
          rows: [
            {
              id: "draft_1",
              job_case_id: "jc_1",
              company_id: "comp_1",
              created_by_user_id: "user_owner",
              tone: "CUSTOMER_MESSAGE",
              body: "현장 확인 결과 추가 작업이 필요합니다.",
              created_at: new Date("2026-03-12T00:20:00.000Z"),
              updated_at: new Date("2026-03-12T00:20:00.000Z")
            }
          ]
        };
      }

      if (normalizedSql.includes("FROM scope_comparisons WHERE job_case_id = $1")) {
        return {
          rows: [
            {
              id: "scope_1",
              job_case_id: "jc_1",
              base_scope_summary: "기본 청소 범위",
              extra_work_summary: "곰팡이 제거",
              reason_why_extra: "기본 범위 초과 오염",
              updated_at: new Date("2026-03-12T00:25:00.000Z")
            }
          ]
        };
      }

      if (normalizedSql.includes("FROM timeline_events WHERE job_case_id = $1")) {
        return {
          rows: [
            {
              id: "tl_1",
              company_id: "comp_1",
              job_case_id: "jc_1",
              actor_user_id: "user_owner",
              event_type: "AGREEMENT_RECORDED",
              summary: "카카오톡/문자로 합의완료",
              payload_json: { agreementId: "ar_1" },
              created_at: new Date("2026-03-12T00:40:00.000Z")
            }
          ]
        };
      }

      if (normalizedSql.includes("FROM field_record_photos")) {
        return {
          rows: [
            {
              id: "photo_1",
              field_record_id: "fr_1",
              storage_provider: "LOCAL_VOLUME",
              object_key: "uploads/photo_1.jpg",
              public_url: null,
              url: "/uploads/photo_1.jpg",
              sort_order: 0,
              created_at: new Date("2026-03-12T00:11:00.000Z")
            }
          ]
        };
      }

      if (normalizedSql.includes("FROM memberships") && normalizedSql.includes("JOIN companies")) {
        return {
          rows: [
            {
              membership_id: "membership_1",
              company_id: "comp_1",
              role: "OWNER",
              company_name: "다밋 클린"
            },
            {
              membership_id: "membership_2",
              company_id: "comp_2",
              role: "MANAGER",
              company_name: "다밋 파트너"
            }
          ]
        };
      }

      if (normalizedSql.includes("INSERT INTO audit_logs")) {
        return {
          rows: [
            {
              id: params[0],
              company_id: params[1],
              actor_user_id: params[2],
              actor_type: params[3],
              action: params[4],
              resource_type: params[5],
              resource_id: params[6],
              request_id: params[7],
              payload_json: JSON.parse(params[8]),
              created_at: new Date(params[9])
            }
          ]
        };
      }

      if (normalizedSql.includes("FROM audit_logs") && normalizedSql.includes("ORDER BY created_at DESC")) {
        return {
          rows: [
            {
              id: "audit_1",
              company_id: "comp_1",
              actor_user_id: "user_owner",
              actor_type: "USER",
              action: "JOB_CASE_UPDATED",
              resource_type: "JOB_CASE",
              resource_id: "jc_1",
              request_id: "req_1",
              payload_json: { revisedQuoteAmount: 230000 },
              created_at: new Date("2026-03-12T00:45:00.000Z")
            }
          ]
        };
      }

      throw new Error(`Unhandled query in fake pool: ${normalizedSql}`);
    },
    async end() {
      return undefined;
    }
  };
}

test("postgres repository bundle supports injected pools and staff-scoped list reads", async () => {
  const pool = createFakePool();
  const bundle = createRepositoryBundle({ engine: "POSTGRES", pool });

  const items = await bundle.jobCaseRepository.listByScope({
    companyId: "comp_1",
    actorUserId: "user_staff",
    role: "STAFF",
    status: "AGREED",
    query: "은정",
    limit: 25
  });

  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    id: "jc_1",
    customerLabel: "김은정",
    siteLabel: "마포 래미안",
    originalQuoteAmount: 180000,
    revisedQuoteAmount: 230000,
    quoteDeltaAmount: 50000,
    primaryReason: "CONTAMINATION",
    secondaryReason: "MOLD",
    currentStatus: "AGREED",
    hasAgreementRecord: true,
    updatedAt: "2026-03-12T01:02:03.000Z"
  });

  assert.match(pool.calls[0].sql, /LEFT JOIN LATERAL/);
  assert.match(pool.calls[0].sql, /jc\.visibility = 'TEAM_SHARED'/);
  assert.deepEqual(pool.calls[0].params, ["comp_1", "user_staff", "AGREED", "%은정%", 25]);

  await bundle.close();
});

test("postgres repository detail reads return tenant-ready shape", async () => {
  const bundle = createRepositoryBundle({ engine: "POSTGRES", pool: createFakePool() });

  const detail = await bundle.jobCaseRepository.getDetailById("jc_1", {
    companyId: "comp_1",
    actorUserId: "user_staff",
    role: "STAFF"
  });
  const fieldRecords = await bundle.fieldRecordRepository.listByJobCaseId("jc_1");
  const photos = await bundle.fileAssetRepository.listByFieldRecordId("fr_1");

  assert.equal(detail.jobCase.id, "jc_1");
  assert.equal(detail.jobCase.visibility, "TEAM_SHARED");
  assert.equal(detail.fieldRecords[0].note, "욕실 곰팡이 심함");
  assert.equal(detail.agreements[0].confirmed_amount, 230000);
  assert.equal(detail.drafts[0].tone, "CUSTOMER_MESSAGE");
  assert.equal(detail.scopeComparisons[0].extra_work_summary, "곰팡이 제거");
  assert.deepEqual(detail.timelineEvents[0].payload_json, { agreementId: "ar_1" });
  assert.equal(fieldRecords[0].created_at, "2026-03-12T00:10:00.000Z");
  assert.equal(photos[0].url, "/uploads/photo_1.jpg");

  await bundle.close();
});

test("postgres auth company list maps memberships for beta company context", async () => {
  const bundle = createRepositoryBundle({ engine: "POSTGRES", pool: createFakePool() });

  const companies = await bundle.authRepository.listCompaniesForUser("user_owner");

  assert.deepEqual(companies, [
    {
      id: "comp_1",
      name: "다밋 클린",
      role: "OWNER",
      membershipId: "membership_1"
    },
    {
      id: "comp_2",
      name: "다밋 파트너",
      role: "MANAGER",
      membershipId: "membership_2"
    }
  ]);

  await bundle.close();
});

test("postgres audit repository appends and lists JSON payload logs", async () => {
  const bundle = createRepositoryBundle({ engine: "POSTGRES", pool: createFakePool() });

  const inserted = await bundle.auditLogRepository.append({
    companyId: "comp_1",
    actorUserId: "user_owner",
    actorType: "USER",
    action: "JOB_CASE_UPDATED",
    resourceType: "JOB_CASE",
    resourceId: "jc_1",
    requestId: "req_1",
    payloadJson: { revisedQuoteAmount: 230000 },
    createdAt: "2026-03-12T00:45:00.000Z"
  });
  const items = await bundle.auditLogRepository.listByCompany("comp_1", { limit: 20 });

  assert.equal(inserted.companyId, "comp_1");
  assert.deepEqual(inserted.payloadJson, { revisedQuoteAmount: 230000 });
  assert.equal(inserted.createdAt, "2026-03-12T00:45:00.000Z");
  assert.equal(items.length, 1);
  assert.equal(items[0].action, "JOB_CASE_UPDATED");
  assert.deepEqual(items[0].payloadJson, { revisedQuoteAmount: 230000 });

  await bundle.close();
});
