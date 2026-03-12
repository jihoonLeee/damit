import { createId, nowIso } from "../../../store.js";

export const PRIMARY_REASONS = [
  "CONTAMINATION",
  "REMOVAL_TASK",
  "SPACE_ADDED",
  "LAYOUT_DIFFERENCE",
  "WASTE_OR_BELONGINGS"
];

export const SECONDARY_REASONS = [
  "NICOTINE",
  "MOLD",
  "STICKER_REMOVAL",
  "WASTE_DISPOSAL",
  "VERANDA_ADDED",
  "UTILITY_ROOM_ADDED",
  "STORAGE_ADDED",
  "LAYOUT_MISMATCH",
  "OTHER"
];

export const AGREEMENT_STATUSES = ["EXPLAINED", "AGREED", "ON_HOLD", "EXCLUDED"];
export const AGREEMENT_CHANNELS = ["IN_PERSON", "PHONE", "KAKAO_OR_SMS", "OTHER"];
export const LIST_STATUSES = ["ALL", "UNEXPLAINED", "EXPLAINED", "AGREED", "ON_HOLD", "EXCLUDED"];

const primaryLabels = {
  CONTAMINATION: "오염도 문제",
  REMOVAL_TASK: "제거 작업 추가",
  SPACE_ADDED: "공간 범위 추가",
  LAYOUT_DIFFERENCE: "구조/평수 차이",
  WASTE_OR_BELONGINGS: "폐기물/짐 문제"
};

const secondaryLabels = {
  NICOTINE: "니코틴 오염",
  MOLD: "곰팡이 제거",
  STICKER_REMOVAL: "스티커/보양지 제거",
  WASTE_DISPOSAL: "폐기물 정리",
  VERANDA_ADDED: "베란다 추가",
  UTILITY_ROOM_ADDED: "다용도실 추가",
  STORAGE_ADDED: "창고 추가",
  LAYOUT_MISMATCH: "구조 차이",
  OTHER: "기타"
};

const channelLabels = {
  IN_PERSON: "현장 대면",
  PHONE: "전화",
  KAKAO_OR_SMS: "카카오톡/문자",
  OTHER: "기타"
};

const statusLabels = {
  UNEXPLAINED: "미설명",
  EXPLAINED: "설명완료",
  AGREED: "합의완료",
  ON_HOLD: "보류",
  EXCLUDED: "작업 제외"
};

export function deriveJobCaseStatus(agreementRecords) {
  if (!agreementRecords || agreementRecords.length === 0) {
    return "UNEXPLAINED";
  }
  const latest = [...agreementRecords].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
  return latest.status;
}

export function createTimelineEvent(jobCaseId, eventType, summary, payloadJson) {
  return {
    id: createId("tl"),
    job_case_id: jobCaseId,
    event_type: eventType,
    summary,
    payload_json: payloadJson || null,
    created_at: nowIso()
  };
}

export function buildScopeComparison(fieldRecords) {
  const latest = fieldRecords[fieldRecords.length - 1];
  const baseScopeSummary = "기본 입주청소 범위는 일반 생활 오염 기준의 바닥, 주방, 욕실, 창틀 청소를 전제로 합니다.";
  const extraWorkSummary = fieldRecords.map((record) => `${labelSecondary(record.secondary_reason) || labelPrimary(record.primary_reason)}`).filter(Boolean).join(", ");
  const reasonWhyExtra = latest
    ? `${labelPrimary(latest.primary_reason)}로 분류되는 작업이라 사전 기본 범위를 넘어서는 별도 시간과 자재가 필요합니다.`
    : "현장 조건이 사전 가정과 달라 추가 작업이 필요합니다.";

  return {
    baseScopeSummary,
    extraWorkSummary: extraWorkSummary || "현장 추가 작업 확인 필요",
    reasonWhyExtra
  };
}

export function buildDraftMessage(jobCase, fieldRecords, scopeComparison) {
  const latest = fieldRecords[fieldRecords.length - 1];
  const parts = [
    `현장 확인 결과 ${jobCase.site_label}에서 ${labelSecondary(latest?.secondary_reason) || labelPrimary(latest?.primary_reason) || "추가 작업"}이 확인됐습니다.`,
    `추가 작업 항목은 ${scopeComparison.extra_work_summary}입니다.`,
    `${scopeComparison.reason_why_extra}`,
    `기존 견적 ${formatMoney(jobCase.original_quote_amount)}원에서 ${formatMoney(jobCase.revised_quote_amount)}원으로 변경이 필요합니다.`,
    "진행 원하시면 확인 부탁드립니다."
  ];

  return parts.join(" ");
}

export function summarizeAgreement(agreement) {
  const channelText = channelLabels[agreement.confirmation_channel] || agreement.confirmation_channel;
  const amountText = agreement.confirmed_amount == null ? "" : ` ${formatMoney(agreement.confirmed_amount)}원`;
  return `${channelText}으로${amountText} ${statusLabels[agreement.status] || agreement.status}`;
}

export function formatMoney(value) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

export function labelPrimary(value) {
  return primaryLabels[value] || value || "";
}

export function labelSecondary(value) {
  return secondaryLabels[value] || value || "";
}

export function toJobCaseListItem(jobCase, fieldRecords, agreementRecords) {
  const relatedRecords = fieldRecords.filter((record) => record.job_case_id === jobCase.id);
  const latestRecord = relatedRecords[relatedRecords.length - 1];
  const relatedAgreements = agreementRecords.filter((record) => record.job_case_id === jobCase.id);

  return {
    id: jobCase.id,
    customerLabel: jobCase.customer_label,
    siteLabel: jobCase.site_label,
    originalQuoteAmount: jobCase.original_quote_amount,
    revisedQuoteAmount: jobCase.revised_quote_amount,
    quoteDeltaAmount: jobCase.quote_delta_amount,
    primaryReason: latestRecord?.primary_reason || null,
    secondaryReason: latestRecord?.secondary_reason || null,
    currentStatus: deriveJobCaseStatus(relatedAgreements),
    hasAgreementRecord: relatedAgreements.length > 0,
    updatedAt: jobCase.updated_at
  };
}

