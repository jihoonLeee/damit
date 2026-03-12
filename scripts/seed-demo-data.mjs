import fs from "node:fs/promises";
import path from "node:path";

import { config } from "../src/config.js";
import { ensureStorage, resetDb, writeDb } from "../src/store.js";

function createSvg(background, title, subtitle) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="320" viewBox="0 0 400 320">
  <rect width="400" height="320" fill="${background}" rx="24" />
  <rect x="24" y="24" width="352" height="272" rx="20" fill="#ffffff" opacity="0.92" />
  <text x="40" y="96" fill="#0f172a" font-size="28" font-family="Pretendard, Arial" font-weight="700">${title}</text>
  <text x="40" y="138" fill="#475569" font-size="20" font-family="Pretendard, Arial">${subtitle}</text>
</svg>`;
}

await ensureStorage();
await resetDb();

await fs.mkdir(config.uploadDir, { recursive: true });
await fs.writeFile(path.join(config.uploadDir, "review-photo-1.svg"), createSvg("#dbeafe", "니코틴 오염", "거실 벽면"), "utf8");
await fs.writeFile(path.join(config.uploadDir, "review-photo-2.svg"), createSvg("#dcfce7", "베란다 추가", "창고/베란다"), "utf8");

const db = {
  jobCases: [
    {
      id: "jc_demo_1",
      owner_id: config.ownerId,
      customer_label: "송파 힐스테이트 1203호",
      contact_memo: "당근 문의 고객",
      site_label: "송파 힐스테이트 1203호",
      original_quote_amount: 250000,
      revised_quote_amount: 320000,
      quote_delta_amount: 70000,
      current_status: "AGREED",
      created_at: "2026-03-11T09:00:00.000Z",
      updated_at: "2026-03-11T09:20:00.000Z"
    }
  ],
  fieldRecords: [
    {
      id: "fr_demo_1",
      owner_id: config.ownerId,
      job_case_id: "jc_demo_1",
      primary_reason: "CONTAMINATION",
      secondary_reason: "NICOTINE",
      note: "거실 벽면과 주방 상판 니코틴 오염 심함",
      status: "LINKED",
      created_at: "2026-03-11T09:03:00.000Z"
    },
    {
      id: "fr_demo_2",
      owner_id: config.ownerId,
      job_case_id: "jc_demo_1",
      primary_reason: "SPACE_ADDED",
      secondary_reason: "VERANDA_ADDED",
      note: "베란다와 창고 공간 추가 확인",
      status: "LINKED",
      created_at: "2026-03-11T09:05:00.000Z"
    }
  ],
  fieldRecordPhotos: [
    {
      id: "photo_demo_1",
      field_record_id: "fr_demo_1",
      url: "/uploads/review-photo-1.svg",
      sort_order: 0,
      created_at: "2026-03-11T09:03:00.000Z"
    },
    {
      id: "photo_demo_2",
      field_record_id: "fr_demo_2",
      url: "/uploads/review-photo-2.svg",
      sort_order: 0,
      created_at: "2026-03-11T09:05:00.000Z"
    }
  ],
  scopeComparisons: [
    {
      id: "sc_demo_1",
      job_case_id: "jc_demo_1",
      base_scope_summary: "기본 입주청소 범위는 일반 생활 오염 기준의 바닥, 주방, 욕실, 창틀 청소를 전제로 합니다.",
      extra_work_summary: "니코틴 오염 제거, 베란다 추가, 창고 추가",
      reason_why_extra: "사전 기본 범위를 넘어서는 오염 제거와 공간 추가가 확인돼 별도 시간과 자재가 필요합니다.",
      updated_at: "2026-03-11T09:10:00.000Z"
    }
  ],
  messageDrafts: [
    {
      id: "draft_demo_1",
      job_case_id: "jc_demo_1",
      tone: "CUSTOMER_MESSAGE",
      body: "현장 확인 결과 송파 힐스테이트 1203호에서 니코틴 오염과 베란다 추가 작업이 확인됐습니다. 추가 작업 항목은 니코틴 오염 제거, 베란다 추가, 창고 추가입니다. 사전 기본 범위를 넘어서는 오염 제거와 공간 추가가 확인돼 별도 시간과 자재가 필요합니다. 기존 견적 250,000원에서 320,000원으로 변경이 필요합니다. 진행 원하시면 확인 부탁드립니다.",
      created_at: "2026-03-11T09:12:00.000Z",
      updated_at: "2026-03-11T09:12:00.000Z"
    }
  ],
  agreementRecords: [
    {
      id: "ar_demo_1",
      job_case_id: "jc_demo_1",
      status: "AGREED",
      confirmation_channel: "KAKAO_OR_SMS",
      confirmed_at: "2026-03-11T09:15:00.000Z",
      confirmed_amount: 320000,
      customer_response_note: "추가 비용 안내 후 진행 동의",
      created_at: "2026-03-11T09:15:00.000Z"
    }
  ],
  timelineEvents: [
    {
      id: "tl_demo_1",
      job_case_id: "jc_demo_1",
      event_type: "FIELD_RECORD_LINKED",
      summary: "니코틴 오염 연결",
      payload_json: { fieldRecordId: "fr_demo_1" },
      created_at: "2026-03-11T09:06:00.000Z"
    },
    {
      id: "tl_demo_2",
      job_case_id: "jc_demo_1",
      event_type: "QUOTE_UPDATED",
      summary: "변경 견적 +70000원",
      payload_json: { revisedQuoteAmount: 320000 },
      created_at: "2026-03-11T09:10:00.000Z"
    },
    {
      id: "tl_demo_3",
      job_case_id: "jc_demo_1",
      event_type: "DRAFT_CREATED",
      summary: "고객 설명 초안 생성",
      payload_json: { draftId: "draft_demo_1" },
      created_at: "2026-03-11T09:12:00.000Z"
    },
    {
      id: "tl_demo_4",
      job_case_id: "jc_demo_1",
      event_type: "AGREEMENT_RECORDED",
      summary: "카카오톡/문자로 320,000원 합의완료",
      payload_json: { agreementId: "ar_demo_1" },
      created_at: "2026-03-11T09:15:00.000Z"
    }
  ]
};

await writeDb(db);
console.log("Demo seed complete.");
