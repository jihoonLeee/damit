import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import pg from "pg";

import { config } from "../../config.js";
import { applyPostgresMigrations, getPostgresMigrationStatus } from "../../db/postgres-migrator.js";
import { buildPostgresConnectionOptions } from "../../db/postgres-connection.js";
import { HttpError } from "../../http.js";
import { buildCustomerNotificationRuntime } from "../../notifications/customer-notification-runtime.js";

const { Pool } = pg;

function normalizeValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeValue(item)]));
  }
  return value;
}

function normalizeRow(row) {
  if (!row) {
    return row;
  }
  return normalizeValue(row);
}

function normalizeRows(rows = []) {
  return rows.map((row) => normalizeRow(row));
}

function normalizeProfileDisplayName(value, fallbackEmail = '') {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new HttpError(422, 'PROFILE_DISPLAY_NAME_REQUIRED', '표시 이름을 입력해주세요.');
  }
  if (normalized.length > 60) {
    throw new HttpError(422, 'PROFILE_DISPLAY_NAME_TOO_LONG', '표시 이름은 60자 이내로 입력해주세요.');
  }
  return normalized || String(fallbackEmail || '').split('@')[0];
}

function normalizeProfilePhoneNumber(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > 30) {
    throw new HttpError(422, 'PROFILE_PHONE_TOO_LONG', '연락처는 30자 이내로 입력해주세요.');
  }
  return normalized;
}

function mapInvitationRow(item) {
  return {
    id: item.id,
    email: item.email,
    role: item.role,
    status: item.status,
    expiresAt: item.expires_at,
    acceptedAt: item.accepted_at,
    lastSentAt: item.last_sent_at,
    createdAt: item.created_at
  };
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

function pickOpsValue(item, keys) {
  for (const key of keys) {
    if (item && item[key] != null) {
      return item[key];
    }
  }
  return null;
}

function sortOpsRowsDesc(items, keys) {
  return [...items].sort((left, right) => {
    const leftValue = pickOpsValue(left, keys);
    const rightValue = pickOpsValue(right, keys);
    return String(leftValue || '') < String(rightValue || '') ? 1 : -1;
  });
}

function isWithinOpsHours(value, hours) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return Date.now() - date.getTime() <= hours * 60 * 60 * 1000;
}

function isPastOpsTimestamp(value) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.getTime() < Date.now();
}

function maskOpsEmailAddress(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const [localPart, domain = ""] = normalized.split("@");
  if (!localPart || !domain) {
    return normalized || "-";
  }

  const visiblePrefix = localPart.slice(0, Math.min(localPart.length, 2));
  const hidden = "*".repeat(Math.max(localPart.length - visiblePrefix.length, 1));
  return `${visiblePrefix}${hidden}@${domain}`;
}

function summarizeOpsTokens(items, tokenKey, limit = 3) {
  const counts = new Map();
  for (const item of items) {
    const token = pickOpsValue(item, [tokenKey]) || 'UNKNOWN';
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([token, count]) => ({ token, count }));
}

function buildPostgresOpsSignals({ agreementRecords, customerConfirmationLinks, timelineEvents, loginChallenges, sessions }) {
  const sortedAgreements = sortOpsRowsDesc(agreementRecords || [], ['confirmed_at', 'created_at']);
  const latestAgreement = sortedAgreements[0] || null;
  const agreementStatuses = summarizeOpsTokens(agreementRecords || [], 'status');
  const recentAgreementCount7d = (agreementRecords || []).filter((item) => isWithinOpsHours(pickOpsValue(item, ['confirmed_at', 'created_at']), 24 * 7)).length;

  const sortedConfirmations = sortOpsRowsDesc(customerConfirmationLinks || [], ['updated_at', 'confirmed_at', 'viewed_at', 'created_at']);
  const latestConfirmation = sortedConfirmations[0] || null;
  const openConfirmations = (customerConfirmationLinks || []).filter((item) => ['ISSUED', 'VIEWED'].includes(item.status));
  const staleOpenConfirmations = openConfirmations.filter((item) => !isWithinOpsHours(pickOpsValue(item, ['updated_at', 'created_at']), 24));
  const recentConfirmedLinks7d = (customerConfirmationLinks || []).filter((item) => item.status === 'CONFIRMED' && isWithinOpsHours(pickOpsValue(item, ['confirmed_at', 'updated_at']), 24 * 7)).length;

  const sortedTimeline = sortOpsRowsDesc(timelineEvents || [], ['created_at']);
  const latestTimeline = sortedTimeline[0] || null;
  const recentTimelineCount24h = (timelineEvents || []).filter((item) => isWithinOpsHours(pickOpsValue(item, ['created_at']), 24)).length;
  const timelineEventMix = summarizeOpsTokens(timelineEvents || [], 'event_type');

  const sortedChallenges = sortOpsRowsDesc(loginChallenges || [], ['created_at']);
  const latestChallenge = sortedChallenges[0] || null;
  const recentChallengeCount24h = (loginChallenges || []).filter((item) => isWithinOpsHours(pickOpsValue(item, ['created_at']), 24)).length;
  const failedDeliveryCount24h = (loginChallenges || []).filter((item) => item.delivery_status === 'FAILED' && isWithinOpsHours(pickOpsValue(item, ['created_at']), 24)).length;
  const deliveryStatusMix = summarizeOpsTokens(loginChallenges || [], 'delivery_status');

  const activeSessions = (sessions || []).filter((item) => !item.revoked_at && !isPastOpsTimestamp(item.expires_at));
  const idleRiskSessions = activeSessions.filter((item) => {
    const lastSeenAt = pickOpsValue(item, ['last_seen_at', 'created_at']);
    if (!lastSeenAt) {
      return false;
    }
    const ageMs = Date.now() - new Date(lastSeenAt).getTime();
    return ageMs > Math.max(config.sessionIdleTimeoutSeconds * 1000 * 0.5, 60 * 60 * 1000);
  });
  const latestSession = sortOpsRowsDesc(activeSessions, ['last_seen_at', 'created_at'])[0] || null;

  return {
    agreements: {
      totalCount: agreementRecords?.length || 0,
      recentCount7d: recentAgreementCount7d,
      latestStatus: latestAgreement?.status || null,
      latestConfirmedAt: pickOpsValue(latestAgreement, ['confirmed_at', 'created_at']),
      topStatuses: agreementStatuses
    },
    customerConfirmations: {
      totalCount: customerConfirmationLinks?.length || 0,
      openCount: openConfirmations.length,
      staleOpenCount: staleOpenConfirmations.length,
      recentConfirmedCount7d: recentConfirmedLinks7d,
      latestStatus: latestConfirmation?.status || null,
      latestUpdatedAt: pickOpsValue(latestConfirmation, ['updated_at', 'confirmed_at', 'viewed_at', 'created_at'])
    },
    timeline: {
      totalCount: timelineEvents?.length || 0,
      recentCount24h: recentTimelineCount24h,
      latestEventType: latestTimeline?.event_type || null,
      latestEventAt: pickOpsValue(latestTimeline, ['created_at']),
      topEventTypes: timelineEventMix
    },
    auth: {
      challengeTotalCount: loginChallenges?.length || 0,
      recentChallengeCount24h,
      latestDeliveryStatus: latestChallenge?.delivery_status || null,
      latestChallengeAt: pickOpsValue(latestChallenge, ['created_at']),
      failedDeliveryCount24h,
      topDeliveryStatuses: deliveryStatusMix,
      activeSessionCount: activeSessions.length,
      idleRiskSessionCount: idleRiskSessions.length,
      latestSessionSeenAt: pickOpsValue(latestSession, ['last_seen_at', 'created_at'])
    }
  };
}

const POSTGRES_DATA_EXPLORER_DATASETS = {
  jobCases: {
    key: "jobCases",
    label: "Job Cases",
    description: "Current job cases and quote state.",
    tableName: "job_cases",
    countSql: "SELECT COUNT(*)::int AS count FROM job_cases",
    rowSql: "SELECT id, customer_label, site_label, current_status, original_quote_amount, revised_quote_amount, updated_at FROM job_cases ORDER BY updated_at DESC LIMIT $1",
    timestampKey: "updated_at",
    columns: ["id", "customer_label", "site_label", "current_status", "original_quote_amount", "revised_quote_amount", "updated_at"]
  },
  fieldRecords: {
    key: "fieldRecords",
    label: "Field Records",
    description: "Latest onsite records and link status.",
    tableName: "field_records",
    countSql: "SELECT COUNT(*)::int AS count FROM field_records",
    rowSql: "SELECT id, job_case_id, primary_reason, secondary_reason, note, status, created_at FROM field_records ORDER BY created_at DESC LIMIT $1",
    timestampKey: "created_at",
    columns: ["id", "job_case_id", "primary_reason", "secondary_reason", "note", "status", "created_at"]
  },
  agreementRecords: {
    key: "agreementRecords",
    label: "Agreements",
    description: "Agreement records and confirmation channels.",
    tableName: "agreement_records",
    countSql: "SELECT COUNT(*)::int AS count FROM agreement_records",
    rowSql: "SELECT id, job_case_id, status, confirmation_channel, confirmed_amount, confirmed_at, created_at FROM agreement_records ORDER BY COALESCE(confirmed_at, created_at) DESC LIMIT $1",
    timestampKey: "confirmed_at",
    columns: ["id", "job_case_id", "status", "confirmation_channel", "confirmed_amount", "confirmed_at", "created_at"]
  },
  customerConfirmations: {
    key: "customerConfirmations",
    label: "Customer Confirmations",
    description: "Issued customer confirmation links and recent status.",
    tableName: "customer_confirmation_links",
    countSql: "SELECT COUNT(*)::int AS count FROM customer_confirmation_links",
    rowSql: "SELECT id, job_case_id, status, expires_at, viewed_at, confirmed_at, updated_at FROM customer_confirmation_links ORDER BY COALESCE(updated_at, confirmed_at, viewed_at, created_at) DESC LIMIT $1",
    timestampKey: "updated_at",
    columns: ["id", "job_case_id", "status", "expires_at", "viewed_at", "confirmed_at", "updated_at"]
  },
  timelineEvents: {
    key: "timelineEvents",
    label: "Timeline",
    description: "Recent product timeline events.",
    tableName: "timeline_events",
    countSql: "SELECT COUNT(*)::int AS count FROM timeline_events",
    rowSql: "SELECT id, job_case_id, event_type, summary, created_at FROM timeline_events ORDER BY created_at DESC LIMIT $1",
    timestampKey: "created_at",
    columns: ["id", "job_case_id", "event_type", "summary", "created_at"]
  },
  users: {
    key: "users",
    label: "Users",
    description: "Accounts and recent login state.",
    tableName: "users",
    countSql: "SELECT COUNT(*)::int AS count FROM users",
    rowSql: "SELECT id, email, display_name, status, last_login_at, updated_at FROM users ORDER BY updated_at DESC LIMIT $1",
    timestampKey: "updated_at",
    columns: ["id", "email", "display_name", "status", "last_login_at", "updated_at"]
  },
  companies: {
    key: "companies",
    label: "Companies",
    description: "Registered companies and workspace status.",
    tableName: "companies",
    countSql: "SELECT COUNT(*)::int AS count FROM companies",
    rowSql: "SELECT id, name, status, created_at, updated_at FROM companies ORDER BY updated_at DESC LIMIT $1",
    timestampKey: "updated_at",
    columns: ["id", "name", "status", "created_at", "updated_at"]
  },
  memberships: {
    key: "memberships",
    label: "Memberships",
    description: "Company membership and role state.",
    tableName: "memberships",
    countSql: "SELECT COUNT(*)::int AS count FROM memberships",
    rowSql: "SELECT id, company_id, user_id, role, status, joined_at, updated_at FROM memberships ORDER BY updated_at DESC LIMIT $1",
    timestampKey: "updated_at",
    columns: ["id", "company_id", "user_id", "role", "status", "joined_at", "updated_at"]
  },
  auditLogs: {
    key: "auditLogs",
    label: "Audit Logs",
    description: "Recent operational audit entries.",
    tableName: "audit_logs",
    countSql: "SELECT COUNT(*)::int AS count FROM audit_logs",
    rowSql: "SELECT id, actor_type, action, resource_type, resource_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1",
    timestampKey: "created_at",
    columns: ["id", "actor_type", "action", "resource_type", "resource_id", "created_at"]
  }
};

async function buildPostgresDataExplorer(pool, datasetKey = "jobCases", limit = 8) {
  const selectedConfig = POSTGRES_DATA_EXPLORER_DATASETS[datasetKey] || POSTGRES_DATA_EXPLORER_DATASETS.jobCases;
  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 20) : 8;

  const datasets = [];
  for (const item of Object.values(POSTGRES_DATA_EXPLORER_DATASETS)) {
    const [countResult, latestResult] = await Promise.all([
      pool.query(item.countSql),
      pool.query(item.rowSql, [1])
    ]);
    const latestRow = normalizeRow(latestResult.rows[0] || null);
    datasets.push({
      key: item.key,
      label: item.label,
      description: item.description,
      count: countResult.rows[0]?.count || 0,
      latestAt: latestRow?.[item.timestampKey] || null
    });
  }

  const [selectedCountResult, selectedRowsResult] = await Promise.all([
    pool.query(selectedConfig.countSql),
    pool.query(selectedConfig.rowSql, [safeLimit])
  ]);

  return {
    datasets,
    selected: {
      key: selectedConfig.key,
      label: selectedConfig.label,
      description: selectedConfig.description,
      tableName: selectedConfig.tableName,
      columns: selectedConfig.columns,
      count: selectedCountResult.rows[0]?.count || 0,
      rows: normalizeRows(selectedRowsResult.rows).map((row) => Object.fromEntries(selectedConfig.columns.map((column) => [column, row?.[column] ?? null])))
    },
    generatedAt: new Date().toISOString()
  };
}

function buildPostgresOpsActivity({ customerConfirmationLinks, timelineEvents, loginChallenges, limit }) {
  return {
    recentCustomerConfirmations: sortOpsRowsDesc(customerConfirmationLinks || [], ['updated_at', 'confirmed_at', 'viewed_at', 'created_at'])
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        jobCaseId: item.job_case_id || null,
        status: item.status,
        expiresAt: item.expires_at || null,
        updatedAt: pickOpsValue(item, ['updated_at', 'confirmed_at', 'viewed_at', 'created_at']),
        confirmedAt: item.confirmed_at || null
      })),
    recentTimelineEvents: sortOpsRowsDesc(timelineEvents || [], ['created_at'])
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        jobCaseId: item.job_case_id || null,
        eventType: item.event_type,
        summary: item.summary,
        createdAt: item.created_at
      })),
    recentAuthChallenges: sortOpsRowsDesc(loginChallenges || [], ['created_at'])
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        emailMasked: maskOpsEmailAddress(item.email),
        status: item.status,
        deliveryProvider: item.delivery_provider || null,
        deliveryStatus: item.delivery_status || null,
        expiresAt: item.expires_at || null,
        createdAt: item.created_at
      }))
  };
}

function buildLatestPostgresByJobCaseMap(items = [], timestampKeys = ['updated_at', 'created_at']) {
  const map = new Map();
  for (const item of sortOpsRowsDesc(items || [], timestampKeys)) {
    const jobCaseId = pickOpsValue(item, ['job_case_id', 'jobCaseId']);
    if (!jobCaseId || map.has(jobCaseId)) {
      continue;
    }
    map.set(jobCaseId, item);
  }
  return map;
}

function buildPostgresOpsFocusCaseDescriptor({ jobCase, latestDraft, latestAgreement, latestConfirmation, latestTimeline }) {
  const currentStatus = jobCase.current_status || jobCase.currentStatus || 'UNEXPLAINED';
  const revisedQuoteAmount = jobCase.revised_quote_amount ?? jobCase.revisedQuoteAmount ?? null;
  const hasQuote = revisedQuoteAmount != null && Number.isFinite(Number(revisedQuoteAmount));
  const hasDraft = Boolean(latestDraft?.body);
  const hasAgreementRecord = Boolean(latestAgreement?.id);
  const confirmationStatus = latestConfirmation?.status || null;
  const latestConfirmationAt = pickOpsValue(latestConfirmation, ['updated_at', 'confirmed_at', 'viewed_at', 'created_at']);
  const latestTimelineAt = pickOpsValue(latestTimeline, ['created_at']);
  const isTerminal = currentStatus === 'AGREED' || currentStatus === 'EXCLUDED';
  const isStaleConfirmation = confirmationStatus && ['ISSUED', 'VIEWED'].includes(confirmationStatus)
    ? !isWithinOpsHours(latestConfirmationAt, 24)
    : false;

  const descriptor = {
    jobCaseId: jobCase.id,
    customerLabel: jobCase.customer_label || '이름 없는 작업 건',
    siteLabel: jobCase.site_label || '',
    currentStatus,
    revisedQuoteAmount: hasQuote ? Number(revisedQuoteAmount) : null,
    hasDraft,
    hasAgreementRecord,
    latestConfirmationStatus: confirmationStatus,
    latestConfirmationUpdatedAt: latestConfirmationAt,
    latestTimelineEventType: latestTimeline?.event_type || null,
    latestTimelineAt,
    updatedAt: pickOpsValue(jobCase, ['updated_at', 'created_at']) || latestTimelineAt || latestConfirmationAt || null,
    focusTone: 'neutral',
    focusBadge: '기록 확인',
    focusReasonKey: 'record-check',
    focusTitle: '기록 확인이 필요한 작업 건입니다.',
    focusCopy: '진행을 다시 여는 단계는 아니고, 남은 기록이 빠지지 않았는지 확인하는 용도입니다.',
    focusWhyNow: '최근 흐름을 다시 보면서 기록 누락이 없는지만 짧게 확인하면 됩니다.',
    focusTargetId: 'timeline-card',
    score: 10
  };

  if (confirmationStatus === 'VIEWED' && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'warning',
      focusBadge: '열람됨',
      focusReasonKey: 'confirmation-viewed',
      focusTitle: '고객이 내용을 본 뒤 마지막 정리가 멈춘 작업 건입니다.',
      focusCopy: '고객 확인 카드와 합의 기록을 같이 보면, 지금 바로 정리해야 할 마지막 상태가 무엇인지 가장 빨리 보입니다.',
      focusWhyNow: '고객이 이미 링크를 열었으니, 지금 정리하면 왕복 연락을 줄일 수 있습니다.',
      focusTargetId: 'customer-confirm-card',
      score: 100
    };
  }

  if (isStaleConfirmation && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'warning',
      focusBadge: '응답 지연',
      focusReasonKey: 'confirmation-stale',
      focusTitle: '발급된 확인 링크가 오래 멈춘 작업 건입니다.',
      focusCopy: '고객 확인 링크는 발급됐지만 후속 정리가 멈춘 상태입니다. 링크 상태와 마지막 메모를 먼저 확인해 보세요.',
      focusWhyNow: '확인 흐름이 길어질수록 후속 연락 맥락이 흐려집니다. 지금 다시 보는 편이 안전합니다.',
      focusTargetId: 'customer-confirm-card',
      score: 92
    };
  }

  if (currentStatus === 'ON_HOLD') {
    return {
      ...descriptor,
      focusTone: 'warning',
      focusBadge: '답변 대기',
      focusReasonKey: 'on-hold-followup',
      focusTitle: '고객 답변을 기다리는 작업 건입니다.',
      focusCopy: '새 입력보다 마지막 반응과 보류 메모를 다시 확인하는 것이 우선입니다.',
      focusWhyNow: '보류 건은 다음 응답 시점을 놓치지 않는 것이 가장 중요합니다.',
      focusTargetId: 'agreement-card',
      score: 84
    };
  }

  if (!hasQuote && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'warning',
      focusBadge: '견적 병목',
      focusReasonKey: 'quote-missing',
      focusTitle: '변경 금액이 아직 비어 있는 작업 건입니다.',
      focusCopy: '견적이 비어 있으면 설명 초안과 고객 확인 흐름이 같이 밀립니다. 금액과 범위를 먼저 정리해 주세요.',
      focusWhyNow: '이 단계가 막히면 뒤 단계가 모두 멈춥니다.',
      focusTargetId: 'quote-card',
      score: 78
    };
  }

  if (hasQuote && !hasDraft && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'warning',
      focusBadge: '초안 필요',
      focusReasonKey: 'draft-missing',
      focusTitle: '설명 초안이 아직 없는 작업 건입니다.',
      focusCopy: '금액 정리는 끝났고, 이제 고객에게 보낼 설명 문장만 만들면 다음 단계로 넘어갈 수 있습니다.',
      focusWhyNow: '초안이 없으면 확인 링크 발급과 합의 기록도 자연스럽게 이어지지 않습니다.',
      focusTargetId: 'draft-card',
      score: 72
    };
  }

  if (hasDraft && !confirmationStatus && !hasAgreementRecord && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'neutral',
      focusBadge: '확인 전',
      focusReasonKey: 'confirm-link-needed',
      focusTitle: '설명은 준비됐지만 고객 확인 흐름이 아직 없는 작업 건입니다.',
      focusCopy: '고객 확인 링크를 발급하거나 합의 기록을 남기면 흐름이 마무리 단계로 넘어갑니다.',
      focusWhyNow: '이 단계는 짧게 처리할 수 있어서 지금 정리하면 전체 흐름이 빠르게 닫힙니다.',
      focusTargetId: 'customer-confirm-card',
      score: 66
    };
  }

  if (hasAgreementRecord && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'neutral',
      focusBadge: '상태 점검',
      focusReasonKey: 'status-review',
      focusTitle: '합의 기록은 있지만 최종 상태 확인이 더 필요한 작업 건입니다.',
      focusCopy: '합의 기록 카드와 고객 확인 상태를 함께 보면서 마지막 상태를 명확하게 정리해 주세요.',
      focusWhyNow: '이미 근거는 있으니, 최종 상태만 정리하면 흐름을 닫을 수 있습니다.',
      focusTargetId: 'agreement-card',
      score: 58
    };
  }

  return descriptor;
}

function buildPostgresOpsFocusCases({ jobCases, messageDrafts, agreementRecords, customerConfirmationLinks, timelineEvents, limit }) {
  const latestDraftByJobCase = buildLatestPostgresByJobCaseMap(messageDrafts, ['updated_at', 'created_at']);
  const latestAgreementByJobCase = buildLatestPostgresByJobCaseMap(agreementRecords, ['confirmed_at', 'created_at']);
  const latestConfirmationByJobCase = buildLatestPostgresByJobCaseMap(customerConfirmationLinks, ['updated_at', 'confirmed_at', 'viewed_at', 'created_at']);
  const latestTimelineByJobCase = buildLatestPostgresByJobCaseMap(timelineEvents, ['created_at']);

  return (jobCases || [])
    .map((jobCase) => buildPostgresOpsFocusCaseDescriptor({
      jobCase,
      latestDraft: latestDraftByJobCase.get(jobCase.id) || null,
      latestAgreement: latestAgreementByJobCase.get(jobCase.id) || null,
      latestConfirmation: latestConfirmationByJobCase.get(jobCase.id) || null,
      latestTimeline: latestTimelineByJobCase.get(jobCase.id) || null
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
      const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, limit);
}

function getPostgresAuthDeliveryProvider() {
  return String(config.mailProvider || (config.nodeEnv === "production" ? "RESEND" : "FILE")).trim().toUpperCase();
}

function parsePostgresTrustedOrigins(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPostgresOpsRuntimeReadiness() {
  const mailProvider = getPostgresAuthDeliveryProvider();
  const trustedOrigins = parsePostgresTrustedOrigins(config.trustedOrigins);
  const mailFromConfigured = Boolean(String(config.mailFrom || "").trim());
  const resendConfigured = Boolean(String(config.resendApiKey || "").trim());
  const appBaseUrlConfigured = Boolean(String(config.appBaseUrl || "").trim());
  const authDebugLinks = Boolean(config.authDebugLinks);
  const authEnforceTrustedOrigin = Boolean(config.authEnforceTrustedOrigin);

  let authDeliveryMode = "FILE_PREVIEW";
  if (mailProvider === "RESEND") {
    authDeliveryMode = resendConfigured && mailFromConfigured ? "RESEND_LIVE" : "RESEND_CONFIG_REQUIRED";
  }

  let authOperationalReadiness = "PREVIEW_ONLY";
  if (mailProvider === "RESEND" && (!resendConfigured || !mailFromConfigured)) {
    authOperationalReadiness = "MAIL_CONFIG_REQUIRED";
  } else if (!authEnforceTrustedOrigin || authDebugLinks) {
    authOperationalReadiness = "HARDENING_REQUIRED";
  } else if (mailProvider === "RESEND" && resendConfigured && mailFromConfigured) {
    authOperationalReadiness = "READY";
  }

  return {
    mailProvider,
    mailFromConfigured,
    resendConfigured,
    sentryConfigured: Boolean(String(config.sentryDsn || "").trim()),
    sentryEnvironment: config.sentryEnvironment || config.nodeEnv,
    authDebugLinks,
    authEnforceTrustedOrigin,
    trustedOriginCount: trustedOrigins.length,
    trustedOriginsConfigured: trustedOrigins.length > 0,
    appBaseUrlConfigured,
    authDeliveryMode,
    authOperationalReadiness,
    ...buildCustomerNotificationRuntime(config)
  };
}

function toCompanySummary(row) {
  return {
    id: row.company_id,
    name: row.company_name,
    role: row.role,
    membershipId: row.membership_id
  };
}

function toAuditLog(row) {
  const normalized = normalizeRow(row);
  return {
    id: normalized.id,
    companyId: normalized.company_id,
    actorUserId: normalized.actor_user_id,
    actorType: normalized.actor_type,
    action: normalized.action,
    resourceType: normalized.resource_type,
    resourceId: normalized.resource_id,
    requestId: normalized.request_id,
    payloadJson: normalized.payload_json || null,
    createdAt: normalized.created_at
  };
}

function toJobCaseListItem(row) {
  const normalized = normalizeRow(row);
  return {
    id: normalized.id,
    customerLabel: normalized.customer_label,
    siteLabel: normalized.site_label,
    originalQuoteAmount: normalized.original_quote_amount,
    revisedQuoteAmount: normalized.revised_quote_amount,
    quoteDeltaAmount: normalized.quote_delta_amount,
    primaryReason: normalized.primary_reason || null,
    secondaryReason: normalized.secondary_reason || null,
    currentStatus: normalized.current_status || "UNEXPLAINED",
    hasAgreementRecord: Boolean(normalized.has_agreement_record),
    updatedAt: normalized.updated_at
  };
}

function toTimelineEvent(row) {
  const normalized = normalizeRow(row);
  return {
    id: normalized.id,
    job_case_id: normalized.job_case_id,
    company_id: normalized.company_id,
    actor_user_id: normalized.actor_user_id || null,
    event_type: normalized.event_type,
    summary: normalized.summary,
    payload_json: normalized.payload_json || null,
    created_at: normalized.created_at
  };
}

function createRepositoryId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function plusHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function plusMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function plusDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function plusSeconds(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function isPast(value) {
  return new Date(value).getTime() < Date.now();
}

function isSessionIdleExpired(session) {
  if (!session?.last_seen_at) {
    return false;
  }
  return Date.now() - new Date(session.last_seen_at).getTime() > config.sessionIdleTimeoutSeconds * 1000;
}

function toCustomerConfirmationLink(row, token) {
  const normalized = normalizeRow(row);
  if (!normalized) {
    return null;
  }

  const payload = {
    id: normalized.id,
    jobCaseId: normalized.job_case_id,
    companyId: normalized.company_id || null,
    createdByUserId: normalized.created_by_user_id || null,
    status: normalized.status,
    expiresAt: normalized.expires_at,
    viewedAt: normalized.viewed_at || null,
    confirmedAt: normalized.confirmed_at || null,
    confirmationNote: normalized.confirmation_note || null,
    requestIp: normalized.request_ip || null,
    userAgent: normalized.user_agent || null,
    revokedAt: normalized.revoked_at || null,
    createdAt: normalized.created_at,
    updatedAt: normalized.updated_at
  };

  if (token !== undefined) {
    payload.token = token;
  }

  return payload;
}

async function appendCustomerConfirmationEvent(client, { linkId, eventType, requestIp, userAgent, confirmationNote, createdAt }) {
  await client.query(
    `
      INSERT INTO customer_confirmation_events (
        id, link_id, event_type, request_ip, user_agent, confirmation_note, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      createRepositoryId("cce"),
      linkId,
      eventType,
      requestIp || null,
      userAgent || null,
      confirmationNote || null,
      createdAt || new Date().toISOString()
    ]
  );
}

async function getCustomerConfirmationRowForUpdate(client, tokenHash) {
  const result = await client.query(
    `SELECT * FROM customer_confirmation_links WHERE token_hash = $1 LIMIT 1 FOR UPDATE`,
    [tokenHash]
  );
  return normalizeRow(result.rows[0] || null);
}

async function assertAvailableCustomerConfirmation(client, row, codePrefix = "CUSTOMER_CONFIRMATION") {
  if (!row) {
    throw new HttpError(404, `${codePrefix}_NOT_FOUND`, "怨좉컼 ?뺤씤 留곹겕瑜?李얠쓣 ???놁뒿?덈떎.");
  }

  if (row.status === "REVOKED") {
    throw new HttpError(410, `${codePrefix}_REVOKED`, "?대? 痍⑥냼??怨좉컼 ?뺤씤 留곹겕?낅땲??");
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    if (row.status !== "EXPIRED") {
      const timestamp = new Date().toISOString();
      await client.query(
        `
          UPDATE customer_confirmation_links
          SET status = 'EXPIRED', updated_at = $2
          WHERE id = $1
        `,
        [row.id, timestamp]
      );
      await appendCustomerConfirmationEvent(client, {
        linkId: row.id,
        eventType: "EXPIRED",
        createdAt: timestamp
      });
    }

    throw new HttpError(410, `${codePrefix}_EXPIRED`, "怨좉컼 ?뺤씤 留곹겕媛 留뚮즺?섏뿀?듬땲??");
  }
}
function buildListByScopeQuery(scope = {}) {
  const params = [];
  const conditions = [];

  const pushParam = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (scope.companyId) {
    conditions.push(`jc.company_id = ${pushParam(scope.companyId)}`);
  }

  const role = String(scope.role || "OWNER").toUpperCase();
  if (role === "STAFF") {
    if (!scope.actorUserId) {
      conditions.push("1 = 0");
    } else {
      const actorUserId = pushParam(scope.actorUserId);
      conditions.push(`(
        jc.created_by_user_id = ${actorUserId}
        OR jc.assigned_user_id = ${actorUserId}
        OR jc.visibility = 'TEAM_SHARED'
      )`);
    }
  }

  const normalizedStatus = String(scope.status || "ALL").toUpperCase();
  if (normalizedStatus !== "ALL") {
    conditions.push(`COALESCE(latest_agreement.status, 'UNEXPLAINED') = ${pushParam(normalizedStatus)}`);
  }

  const normalizedQuery = String(scope.query || "").trim();
  if (normalizedQuery) {
    const pattern = pushParam(`%${normalizedQuery}%`);
    conditions.push(`(
      jc.customer_label ILIKE ${pattern}
      OR jc.site_label ILIKE ${pattern}
      OR COALESCE(jc.contact_memo, '') ILIKE ${pattern}
    )`);
  }

  const limit = Number.parseInt(scope.limit || 100, 10);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100;
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return {
    sql: `
      SELECT
        jc.id,
        jc.customer_label,
        jc.site_label,
        jc.original_quote_amount,
        jc.revised_quote_amount,
        jc.quote_delta_amount,
        jc.updated_at,
        latest_record.primary_reason,
        latest_record.secondary_reason,
        COALESCE(latest_agreement.status, 'UNEXPLAINED') AS current_status,
        (latest_agreement.id IS NOT NULL) AS has_agreement_record
      FROM job_cases jc
      LEFT JOIN LATERAL (
        SELECT fr.primary_reason, fr.secondary_reason
        FROM field_records fr
        WHERE fr.job_case_id = jc.id
        ORDER BY fr.created_at DESC
        LIMIT 1
      ) latest_record ON TRUE
      LEFT JOIN LATERAL (
        SELECT ar.id, ar.status
        FROM agreement_records ar
        WHERE ar.job_case_id = jc.id
        ORDER BY ar.created_at DESC
        LIMIT 1
      ) latest_agreement ON TRUE
      ${whereClause}
      ORDER BY jc.updated_at DESC
      LIMIT ${pushParam(safeLimit)}
    `,
    params
  };
}

function buildJobCaseAccessCondition(scope = {}, alias = "jc", startIndex = 0) {
  const params = [];
  const conditions = [];

  const pushParam = (value) => {
    params.push(value);
    return `$${startIndex + params.length}`;
  };

  if (scope.companyId) {
    conditions.push(`${alias}.company_id = ${pushParam(scope.companyId)}`);
  }

  const role = String(scope.role || "OWNER").toUpperCase();
  if (role === "STAFF") {
    if (!scope.actorUserId) {
      conditions.push("1 = 0");
    } else {
      const actorUserId = pushParam(scope.actorUserId);
      conditions.push(`(
        ${alias}.created_by_user_id = ${actorUserId}
        OR ${alias}.assigned_user_id = ${actorUserId}
        OR ${alias}.visibility = 'TEAM_SHARED'
      )`);
    }
  }

  return {
    params,
    sql: conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : ""
  };
}

async function withTransaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function loadJobCaseForWrite(client, jobCaseId) {
  const result = await client.query(
    `SELECT * FROM job_cases WHERE id = $1 LIMIT 1 FOR UPDATE`,
    [jobCaseId]
  );
  const jobCase = normalizeRow(result.rows[0] || null);
  if (!jobCase) {
    throw new Error(`Job case not found: ${jobCaseId}`);
  }
  return jobCase;
}

async function loadFieldRecordForWrite(client, fieldRecordId) {
  const result = await client.query(
    `SELECT * FROM field_records WHERE id = $1 LIMIT 1 FOR UPDATE`,
    [fieldRecordId]
  );
  const fieldRecord = normalizeRow(result.rows[0] || null);
  if (!fieldRecord) {
    throw new Error(`Field record not found: ${fieldRecordId}`);
  }
  return fieldRecord;
}

function maskDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return "";
  }

  return databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}


async function listRecentBackupsFromDirectory(limit = 10) {
  await fs.mkdir(config.backupDir, { recursive: true });
  const entries = await fs.readdir(config.backupDir, { withFileTypes: true });
  const items = await Promise.all(entries.map(async (entry) => {
    const targetPath = path.join(config.backupDir, entry.name);
    const stat = await fs.stat(targetPath);
    return {
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file",
      filePath: targetPath,
      relativePath: path.relative(config.rootDir, targetPath),
      sizeBytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
      fileCount: null
    };
  }));

  return items.sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1)).slice(0, limit);
}

async function exportOperationalSnapshot(pool) {
  const tableQueries = [
    ["jobCases", "SELECT * FROM job_cases ORDER BY created_at ASC"],
    ["fieldRecords", "SELECT * FROM field_records ORDER BY created_at ASC"],
    ["fieldRecordPhotos", "SELECT * FROM field_record_photos ORDER BY created_at ASC, sort_order ASC"],
    ["scopeComparisons", "SELECT * FROM scope_comparisons ORDER BY updated_at ASC"],
    ["messageDrafts", "SELECT * FROM message_drafts ORDER BY created_at ASC"],
    ["agreementRecords", "SELECT * FROM agreement_records ORDER BY created_at ASC"],
    ["timelineEvents", "SELECT * FROM timeline_events ORDER BY created_at ASC"],
    ["auditLogs", "SELECT * FROM audit_logs ORDER BY created_at ASC"],
    ["customerConfirmationLinks", "SELECT * FROM customer_confirmation_links ORDER BY created_at ASC"],
    ["customerConfirmationEvents", "SELECT * FROM customer_confirmation_events ORDER BY created_at ASC"]
  ];

  const snapshot = {};
  for (const [key, sql] of tableQueries) {
    const result = await pool.query(sql);
    snapshot[key] = normalizeRows(result.rows);
  }
  return snapshot;
}

async function listActiveMembershipRows(client, userId) {
  const result = await client.query(
    `
      SELECT
        memberships.id AS membership_id,
        memberships.company_id,
        memberships.role,
        companies.name AS company_name
      FROM memberships
      JOIN companies ON companies.id = memberships.company_id
      WHERE memberships.user_id = $1
        AND memberships.status = 'ACTIVE'
        AND companies.status = 'ACTIVE'
      ORDER BY memberships.created_at ASC
    `,
    [userId]
  );
  return normalizeRows(result.rows);
}
async function buildSessionPayloadFromClient(client, session) {
  const normalizedSession = normalizeRow(session);
  if (!normalizedSession || normalizedSession.revoked_at) {
    return null;
  }
  if (isPast(normalizedSession.expires_at) || isSessionIdleExpired(normalizedSession)) {
    return null;
  }

  const userResult = await client.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [normalizedSession.user_id]);
  const membershipResult = await client.query(`
      SELECT memberships.*, companies.name AS company_name
      FROM memberships
      JOIN companies ON companies.id = memberships.company_id
      WHERE memberships.id = $1
      LIMIT 1
    `, [normalizedSession.membership_id]);

  const user = normalizeRow(userResult.rows[0] || null);
  const membership = normalizeRow(membershipResult.rows[0] || null);
  if (!user || !membership) {
    return null;
  }

  return {
    sessionId: normalizedSession.id,
    userId: user.id,
    email: user.email,
    displayName: user.display_name,
    phoneNumber: user.phone_number,
    companyId: membership.company_id,
    companyName: membership.company_name,
    role: membership.role,
    membershipId: membership.id,
    expiresAt: normalizedSession.expires_at,
    lastSeenAt: normalizedSession.last_seen_at,
    companies: (await listActiveMembershipRows(client, user.id)).map((row) => toCompanySummary(row))
  };
}

async function createAuthSession(client, { userId, membershipId, companyId, createdAt = new Date().toISOString() }) {
  const sessionId = createRepositoryId('session');
  const refreshToken = crypto.randomBytes(24).toString('base64url');
  await client.query(`
      INSERT INTO sessions (
        id, user_id, company_id, membership_id, refresh_token_hash,
        last_seen_at, expires_at, revoked_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      sessionId,
      userId,
      companyId,
      membershipId,
      sha256(refreshToken),
      createdAt,
      plusSeconds(config.refreshSessionMaxAgeSeconds),
      null,
      createdAt
    ]);

  return {
    sessionId,
    refreshToken
  };
}

async function resolveInvitationForAuth(client, invitationToken, challengeEmail, userId) {
  if (!invitationToken) {
    return null;
  }

  const invitationResult = await client.query(
    `
      SELECT invitations.*, companies.name AS company_name
      FROM invitations
      JOIN companies ON companies.id = invitations.company_id
      WHERE invitations.token_hash = $1
      LIMIT 1
      FOR UPDATE
    `,
    [sha256(invitationToken)]
  );
  const invitation = normalizeRow(invitationResult.rows[0] || null);

  if (!invitation) {
    throw new HttpError(404, 'INVITATION_NOT_FOUND', '珥덈? ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.');
  }
  if (invitation.status !== 'ISSUED') {
    throw new HttpError(409, 'INVITATION_NOT_AVAILABLE', '?대? ?ъ슜?????녿뒗 珥덈??낅땲??');
  }
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    throw new HttpError(410, 'INVITATION_EXPIRED', '珥덈? 留곹겕媛 留뚮즺?섏뿀?듬땲??');
  }
  if (invitation.email !== challengeEmail) {
    throw new HttpError(403, 'INVITATION_EMAIL_MISMATCH', '珥덈?諛쏆? ?대찓?쇨낵 濡쒓렇???대찓?쇱씠 ?쇱튂?섏? ?딆뒿?덈떎.');
  }

  const membershipResult = await client.query(
    `SELECT * FROM memberships WHERE company_id = $1 AND user_id = $2 LIMIT 1 FOR UPDATE`,
    [invitation.company_id, userId]
  );
  const existingMembership = normalizeRow(membershipResult.rows[0] || null);
  const timestamp = new Date().toISOString();

  if (existingMembership && existingMembership.status === 'ACTIVE') {
    await client.query(`UPDATE invitations SET status = 'ACCEPTED', accepted_at = $1 WHERE id = $2`, [timestamp, invitation.id]);
    return {
      membershipId: existingMembership.id,
      companyId: invitation.company_id,
      companyName: invitation.company_name,
      role: existingMembership.role
    };
  }

  const membershipId = existingMembership?.id || createRepositoryId('membership');
  if (existingMembership) {
    await client.query(
      `
        UPDATE memberships
        SET role = $1, status = 'ACTIVE', invited_by_user_id = $2, joined_at = $3, updated_at = $4
        WHERE id = $5
      `,
      [invitation.role, invitation.invited_by_user_id, timestamp, timestamp, membershipId]
    );
  } else {
    await client.query(
      `
        INSERT INTO memberships (
          id, company_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, $7, $8)
      `,
      [membershipId, invitation.company_id, userId, invitation.role, invitation.invited_by_user_id, timestamp, timestamp, timestamp]
    );
  }

  await client.query(`UPDATE invitations SET status = 'ACCEPTED', accepted_at = $1 WHERE id = $2`, [timestamp, invitation.id]);
  return {
    membershipId,
    companyId: invitation.company_id,
    companyName: invitation.company_name,
    role: invitation.role
  };
}

export function createPostgresRepositoryBundle({
  databaseUrl,
  sslMode,
  sslRequire,
  sslCaPath,
  applicationName,
  maxPoolSize,
  pool: providedPool = null
}) {
  if (!databaseUrl && !providedPool) {
    throw new Error("DATABASE_URL is required for the Postgres repository bundle.");
  }

  const connectionOptions = providedPool
    ? null
    : buildPostgresConnectionOptions({
        databaseUrl,
        sslMode,
        sslRequire,
        sslCaPath,
        applicationName,
        maxPoolSize
      });
  const pool = providedPool || new Pool(connectionOptions);
  const ownsPool = !providedPool;

  return {
    engine: "POSTGRES",
    pool,
    systemRepository: {
      getStorageSummary: async () => {
        const counts = await Promise.all([
          pool.query("SELECT COUNT(*)::int AS count FROM job_cases"),
          pool.query("SELECT COUNT(*)::int AS count FROM field_records"),
          pool.query("SELECT COUNT(*)::int AS count FROM agreement_records")
        ]);

        return {
          storageEngine: "POSTGRES",
          objectStorageProvider: config.objectStorageProvider,
          databaseUrlMasked: maskDatabaseUrl(databaseUrl),
          backupDir: config.backupDir,
          updatedAt: new Date().toISOString(),
          counts: {
            jobCases: counts[0].rows[0]?.count || 0,
            fieldRecords: counts[1].rows[0]?.count || 0,
            agreements: counts[2].rows[0]?.count || 0
          }
        };
      },
      createBackup: async (label = "manual") => {
        await fs.mkdir(config.backupDir, { recursive: true });
        const safeLabel = String(label).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40) || "manual";
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `postgres-${safeLabel}-${stamp}.json`;
        const filePath = path.join(config.backupDir, fileName);
        const storage = await exportOperationalSnapshot(pool);
        const payload = {
          storageEngine: "POSTGRES",
          databaseUrlMasked: maskDatabaseUrl(databaseUrl),
          createdAt: new Date().toISOString(),
          tables: storage
        };
        await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
        return {
          fileName,
          filePath,
          relativePath: path.relative(config.rootDir, filePath)
        };
      },
      resetAllData: async () => {
        await withTransaction(pool, async (client) => {
          await client.query(`
            TRUNCATE TABLE
              customer_confirmation_events,
              customer_confirmation_links,
              audit_logs,
              timeline_events,
              agreement_records,
              message_drafts,
              scope_comparisons,
              field_record_photos,
              field_records,
              job_cases
            RESTART IDENTITY CASCADE
          `);
        });

        const counts = await Promise.all([
          pool.query("SELECT COUNT(*)::int AS count FROM job_cases"),
          pool.query("SELECT COUNT(*)::int AS count FROM field_records"),
          pool.query("SELECT COUNT(*)::int AS count FROM agreement_records")
        ]);

        return {
          storageEngine: "POSTGRES",
          counts: {
            jobCases: counts[0].rows[0]?.count || 0,
            fieldRecords: counts[1].rows[0]?.count || 0,
            agreements: counts[2].rows[0]?.count || 0
          }
        };
      },
      listRecentBackups: async (limit = 10) => listRecentBackupsFromDirectory(limit),
      getDataExplorer: async (datasetKey = "jobCases", limit = 8) => buildPostgresDataExplorer(pool, datasetKey, limit),
      getOpsSnapshot: async (limit = 5) => {
        const [
          jobCaseCount,
          fieldRecordCount,
          agreementCount,
          backups,
          auditResult,
          jobCaseResult,
          agreementResult,
          draftResult,
          confirmationResult,
          timelineResult,
          loginChallengeResult,
          sessionResult
        ] = await Promise.all([
          pool.query("SELECT COUNT(*)::int AS count FROM job_cases"),
          pool.query("SELECT COUNT(*)::int AS count FROM field_records"),
          pool.query("SELECT COUNT(*)::int AS count FROM agreement_records"),
          listRecentBackupsFromDirectory(limit),
          pool.query(`
            SELECT id, actor_type, action, resource_type, resource_id, created_at
            FROM audit_logs
            ORDER BY created_at DESC
            LIMIT $1
          `, [limit]),
          pool.query("SELECT id, customer_label, site_label, current_status, revised_quote_amount, updated_at, created_at FROM job_cases ORDER BY updated_at DESC"),
          pool.query("SELECT id, status, confirmed_at, created_at FROM agreement_records ORDER BY COALESCE(confirmed_at, created_at) DESC"),
          pool.query("SELECT id, job_case_id, body, updated_at, created_at FROM message_drafts ORDER BY COALESCE(updated_at, created_at) DESC"),
          pool.query("SELECT id, job_case_id, status, expires_at, viewed_at, confirmed_at, created_at, updated_at FROM customer_confirmation_links ORDER BY COALESCE(updated_at, confirmed_at, viewed_at, created_at) DESC"),
          pool.query("SELECT id, job_case_id, event_type, summary, created_at FROM timeline_events ORDER BY created_at DESC"),
          pool.query("SELECT id, email, status, delivery_provider, delivery_status, expires_at, created_at FROM login_challenges ORDER BY created_at DESC"),
          pool.query("SELECT id, user_id, company_id, last_seen_at, expires_at, revoked_at, created_at FROM sessions ORDER BY COALESCE(last_seen_at, created_at) DESC")
        ]);

        const jobCases = normalizeRows(jobCaseResult.rows);
        const agreements = normalizeRows(agreementResult.rows);
        const drafts = normalizeRows(draftResult.rows);
        const confirmations = normalizeRows(confirmationResult.rows);
        const timelineEvents = normalizeRows(timelineResult.rows);
        const loginChallenges = normalizeRows(loginChallengeResult.rows);
        const sessions = normalizeRows(sessionResult.rows);
        const signals = buildPostgresOpsSignals({
          agreementRecords: agreements,
          customerConfirmationLinks: confirmations,
          timelineEvents,
          loginChallenges,
          sessions
        });
        const activity = buildPostgresOpsActivity({
          customerConfirmationLinks: confirmations,
          timelineEvents,
          loginChallenges,
          limit
        });
        const focusCases = buildPostgresOpsFocusCases({
          jobCases,
          messageDrafts: drafts,
          agreementRecords: agreements,
          customerConfirmationLinks: confirmations,
          timelineEvents,
          limit
        });

        return {
          storage: {
            storageEngine: "POSTGRES",
            objectStorageProvider: config.objectStorageProvider,
            databaseUrlMasked: maskDatabaseUrl(databaseUrl),
            backupDir: config.backupDir,
            updatedAt: new Date().toISOString(),
            counts: {
              jobCases: jobCaseCount.rows[0]?.count || 0,
              fieldRecords: fieldRecordCount.rows[0]?.count || 0,
              agreements: agreementCount.rows[0]?.count || 0
            }
          },
          backups,
          backupSummary: {
            totalRecentBackups: backups.length,
            latestBackupName: backups[0]?.name || null,
            latestBackupAt: backups[0]?.updatedAt || null
          },
          signals,
          focusCases,
          activity: {
            recentAuditLogs: normalizeRows(auditResult.rows).map((entry) => ({
              id: entry.id,
              actorType: entry.actor_type,
              action: entry.action,
              resourceType: entry.resource_type,
              resourceId: entry.resource_id || null,
              createdAt: entry.created_at
            })),
            recentCustomerConfirmations: activity.recentCustomerConfirmations,
            recentTimelineEvents: activity.recentTimelineEvents,
            recentAuthChallenges: activity.recentAuthChallenges
          },
          runtime: {
            nodeEnv: config.nodeEnv,
            appBaseUrl: config.appBaseUrl || null,
            objectStorageProvider: config.objectStorageProvider,
            storageEngine: "POSTGRES",
            ...buildPostgresOpsRuntimeReadiness()
          },
          generatedAt: new Date().toISOString()
        };
      }
    },
    jobCaseRepository: {
      listByScope: async (scope = {}) => {
        const query = buildListByScopeQuery(scope);
        const result = await pool.query(query.sql, query.params);
        return result.rows.map((row) => toJobCaseListItem(row));
      },
      getDetailById: async (jobCaseId, scope = {}) => {
          const access = buildJobCaseAccessCondition(scope, "jc", 1);
        const jobCaseResult = await pool.query(
          `
            SELECT jc.*
            FROM job_cases jc
            WHERE jc.id = $1${access.sql}
            LIMIT 1
          `,
          [jobCaseId, ...access.params]
        );

        const jobCase = normalizeRow(jobCaseResult.rows[0] || null);
        if (!jobCase) {
          return null;
        }

        const [fieldRecords, agreements, drafts, scopeComparisons, timelineEvents] = await Promise.all([
          pool.query(`SELECT * FROM field_records WHERE job_case_id = $1 ORDER BY created_at ASC`, [jobCaseId]),
          pool.query(`SELECT * FROM agreement_records WHERE job_case_id = $1 ORDER BY created_at ASC`, [jobCaseId]),
          pool.query(`SELECT * FROM message_drafts WHERE job_case_id = $1 ORDER BY created_at ASC`, [jobCaseId]),
          pool.query(`SELECT * FROM scope_comparisons WHERE job_case_id = $1 ORDER BY updated_at ASC`, [jobCaseId]),
          pool.query(`SELECT * FROM timeline_events WHERE job_case_id = $1 ORDER BY created_at ASC`, [jobCaseId])
        ]);

        return {
          jobCase,
          fieldRecords: normalizeRows(fieldRecords.rows),
          agreements: normalizeRows(agreements.rows),
          drafts: normalizeRows(drafts.rows),
          scopeComparisons: normalizeRows(scopeComparisons.rows),
          timelineEvents: normalizeRows(timelineEvents.rows)
        };
      },
      create: async ({ jobCase }) => {
        const result = await pool.query(
          `
            INSERT INTO job_cases (
              id, company_id, owner_id, created_by_user_id, assigned_user_id, updated_by_user_id,
              visibility, customer_label, contact_memo, site_label, original_quote_amount,
              revised_quote_amount, quote_delta_amount, current_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING id, current_status, original_quote_amount, revised_quote_amount, quote_delta_amount, created_at, visibility
          `,
          [
            jobCase.id,
            jobCase.company_id,
            jobCase.owner_id || null,
            jobCase.created_by_user_id,
            jobCase.assigned_user_id || null,
            jobCase.updated_by_user_id || null,
            jobCase.visibility || "PRIVATE_ASSIGNED",
            jobCase.customer_label,
            jobCase.contact_memo || null,
            jobCase.site_label,
            jobCase.original_quote_amount,
            jobCase.revised_quote_amount ?? null,
            jobCase.quote_delta_amount ?? null,
            jobCase.current_status,
            jobCase.created_at,
            jobCase.updated_at
          ]
        );

        const saved = normalizeRow(result.rows[0]);
        return {
          id: saved.id,
          currentStatus: saved.current_status,
          originalQuoteAmount: saved.original_quote_amount,
          revisedQuoteAmount: saved.revised_quote_amount ?? null,
          quoteDeltaAmount: saved.quote_delta_amount ?? null,
          createdAt: saved.created_at,
          visibility: saved.visibility || "PRIVATE_ASSIGNED"
        };
      },
      saveQuoteRevision: async ({ jobCaseId, actorUserId, revisedQuoteAmount, scopeComparison, updatedAt }) => {
        return withTransaction(pool, async (client) => {
          const jobCase = await loadJobCaseForWrite(client, jobCaseId);
          const timestamp = updatedAt || new Date().toISOString();
          const quoteDeltaAmount = revisedQuoteAmount - jobCase.original_quote_amount;

          await client.query(
            `
              UPDATE job_cases
              SET revised_quote_amount = $2,
                  quote_delta_amount = $3,
                  updated_at = $4,
                  updated_by_user_id = $5
              WHERE id = $1
            `,
            [jobCaseId, revisedQuoteAmount, quoteDeltaAmount, timestamp, actorUserId || null]
          );

          const existingComparison = await client.query(
            `SELECT id FROM scope_comparisons WHERE job_case_id = $1 ORDER BY updated_at DESC LIMIT 1 FOR UPDATE`,
            [jobCaseId]
          );

          if (existingComparison.rows[0]?.id) {
            await client.query(
              `
                UPDATE scope_comparisons
                SET base_scope_summary = $2,
                    extra_work_summary = $3,
                    reason_why_extra = $4,
                    updated_at = $5
                WHERE id = $1
              `,
              [
                existingComparison.rows[0].id,
                scopeComparison.baseScopeSummary,
                scopeComparison.extraWorkSummary,
                scopeComparison.reasonWhyExtra,
                timestamp
              ]
            );
          } else {
            await client.query(
              `
                INSERT INTO scope_comparisons (
                  id, job_case_id, base_scope_summary, extra_work_summary, reason_why_extra, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6)
              `,
              [
                `scope_${crypto.randomUUID()}`,
                jobCaseId,
                scopeComparison.baseScopeSummary,
                scopeComparison.extraWorkSummary,
                scopeComparison.reasonWhyExtra,
                timestamp
              ]
            );
          }

          return {
            jobCaseId,
            originalQuoteAmount: jobCase.original_quote_amount,
            revisedQuoteAmount,
            quoteDeltaAmount,
            updatedAt: timestamp,
            scopeComparison: {
              baseScopeSummary: scopeComparison.baseScopeSummary,
              extraWorkSummary: scopeComparison.extraWorkSummary,
              reasonWhyExtra: scopeComparison.reasonWhyExtra
            }
          };
        });
      },
      upsertDraftMessage: async ({ jobCaseId, companyId, actorUserId, tone, body, timestamp }) => {
        return withTransaction(pool, async (client) => {
          await loadJobCaseForWrite(client, jobCaseId);
          const savedAt = timestamp || new Date().toISOString();
          const existingDraft = await client.query(
            `SELECT id, created_at FROM message_drafts WHERE job_case_id = $1 ORDER BY updated_at DESC LIMIT 1 FOR UPDATE`,
            [jobCaseId]
          );

          let draftId = existingDraft.rows[0]?.id || `draft_${crypto.randomUUID()}`;
          let createdAt = normalizeRow(existingDraft.rows[0])?.created_at || savedAt;

          if (existingDraft.rows[0]?.id) {
            await client.query(
              `
                UPDATE message_drafts
                SET tone = $2,
                    body = $3,
                    updated_at = $4,
                    created_by_user_id = COALESCE(created_by_user_id, $5)
                WHERE id = $1
              `,
              [draftId, tone, body, savedAt, actorUserId || null]
            );
          } else {
            await client.query(
              `
                INSERT INTO message_drafts (
                  id, job_case_id, created_by_user_id, tone, body, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              `,
              [draftId, jobCaseId, actorUserId || null, tone, body, savedAt, savedAt]
            );
          }

          await client.query(
            `UPDATE job_cases SET updated_at = $2, updated_by_user_id = $3 WHERE id = $1`,
            [jobCaseId, savedAt, actorUserId || null]
          );

          return {
            id: draftId,
            jobCaseId,
            tone,
            body,
            createdAt,
            updatedAt: savedAt
          };
        });
      },
      createAgreementRecord: async ({
        jobCaseId,
        companyId,
        actorUserId,
        status,
        confirmationChannel,
        confirmedAt,
        confirmedAmount,
        customerResponseNote,
        createdAt
      }) => {
        return withTransaction(pool, async (client) => {
          await loadJobCaseForWrite(client, jobCaseId);
          const timestamp = createdAt || new Date().toISOString();
          const agreementId = `agreement_${crypto.randomUUID()}`;
          const effectiveConfirmedAt = confirmedAt || timestamp;

          await client.query(
            `
              INSERT INTO agreement_records (
                id, company_id, job_case_id, created_by_user_id, status,
                confirmation_channel, confirmed_at, confirmed_amount, customer_response_note, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
            [
              agreementId,
              companyId || null,
              jobCaseId,
              actorUserId || null,
              status,
              confirmationChannel,
              effectiveConfirmedAt,
              confirmedAmount == null ? null : confirmedAmount,
              customerResponseNote || null,
              timestamp
            ]
          );

          await client.query(
            `
              UPDATE job_cases
              SET current_status = $2,
                  updated_at = $3,
                  updated_by_user_id = $4
              WHERE id = $1
            `,
            [jobCaseId, status, timestamp, actorUserId || null]
          );

          return {
            id: agreementId,
            jobCaseId,
            status,
            confirmationChannel,
            confirmedAt: effectiveConfirmedAt,
            confirmedAmount: confirmedAmount == null ? null : confirmedAmount,
            customerResponseNote: customerResponseNote || null,
            currentStatus: status,
            createdAt: timestamp
          };
        });
      }
    },
    fieldRecordRepository: {
      listByJobCaseId: async (jobCaseId) => {
        const result = await pool.query(
          `SELECT * FROM field_records WHERE job_case_id = $1 ORDER BY created_at ASC`,
          [jobCaseId]
        );
        return normalizeRows(result.rows);
      },
      getById: async (fieldRecordId, scope = {}) => {
        const conditions = ["id = $1"];
        const params = [fieldRecordId];
        if (scope.companyId) {
          params.push(scope.companyId);
          conditions.push(`company_id = $${params.length}`);
        }
        const result = await pool.query(
          `SELECT * FROM field_records WHERE ${conditions.join(" AND ")} LIMIT 1`,
          params
        );
        return normalizeRow(result.rows[0] || null);
      },
      createCapturedRecord: async ({ fieldRecord, photos }) => {
        return withTransaction(pool, async (client) => {
          await client.query(
            `
              INSERT INTO field_records (
                id, company_id, owner_id, created_by_user_id, job_case_id,
                primary_reason, secondary_reason, note, status, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
            [
              fieldRecord.id,
              fieldRecord.company_id,
              fieldRecord.owner_id || null,
              fieldRecord.created_by_user_id || null,
              fieldRecord.job_case_id || null,
              fieldRecord.primary_reason,
              fieldRecord.secondary_reason || null,
              fieldRecord.note || null,
              fieldRecord.status,
              fieldRecord.created_at
            ]
          );

          for (const photo of photos || []) {
            await client.query(
              `
                INSERT INTO field_record_photos (
                  id, field_record_id, storage_provider, object_key, public_url, url, sort_order, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              `,
              [
                photo.id,
                photo.field_record_id,
                photo.storage_provider,
                photo.object_key || null,
                photo.public_url || null,
                photo.url,
                photo.sort_order,
                photo.created_at
              ]
            );
          }

          return {
            id: fieldRecord.id,
            jobCaseId: fieldRecord.job_case_id || null,
            primaryReason: fieldRecord.primary_reason,
            secondaryReason: fieldRecord.secondary_reason,
            note: fieldRecord.note,
            status: fieldRecord.status,
            photos: (photos || []).map((photo) => ({
              id: photo.id,
              url: photo.public_url || photo.url
            })),
            createdAt: fieldRecord.created_at
          };
        });
      },
      linkToJobCase: async ({ fieldRecordId, jobCaseId, actorUserId, linkedAt }) => {
        return withTransaction(pool, async (client) => {
          const fieldRecord = await loadFieldRecordForWrite(client, fieldRecordId);
          if (fieldRecord.status === "LINKED") {
            throw new Error(`Field record already linked: ${fieldRecordId}`);
          }
          await loadJobCaseForWrite(client, jobCaseId);
          const timestamp = linkedAt || new Date().toISOString();

          await client.query(
            `
              UPDATE field_records
              SET job_case_id = $2,
                  status = 'LINKED'
              WHERE id = $1
            `,
            [fieldRecordId, jobCaseId]
          );
          await client.query(
            `
              UPDATE job_cases
              SET updated_at = $2,
                  updated_by_user_id = $3
              WHERE id = $1
            `,
            [jobCaseId, timestamp, actorUserId || null]
          );

          return {
            fieldRecordId,
            jobCaseId,
            status: "LINKED",
            linkedAt: timestamp,
            primaryReason: fieldRecord.primary_reason,
            secondaryReason: fieldRecord.secondary_reason
          };
        });
      }
    },
    customerConfirmationRepository: {
      createLink: async ({ jobCaseId, companyId, createdByUserId, expiresInHours = 72 }) => {
        return withTransaction(pool, async (client) => {
          const jobCase = await loadJobCaseForWrite(client, jobCaseId);
          const boundedHours = Number.isInteger(expiresInHours) ? Math.min(Math.max(expiresInHours, 1), 168) : 72;
          const timestamp = new Date().toISOString();
          const token = crypto.randomBytes(24).toString("base64url");
          const tokenHash = sha256(token);
          const linkId = createRepositoryId("ccl");
          const resolvedCompanyId = companyId || jobCase.company_id || null;
          const expiresAt = plusHours(boundedHours);

          await client.query(
            `
              UPDATE customer_confirmation_links
              SET status = 'REVOKED', revoked_at = $2, updated_at = $2
              WHERE job_case_id = $1 AND status IN ('ISSUED', 'VIEWED')
            `,
            [jobCaseId, timestamp]
          );

          await client.query(
            `
              INSERT INTO customer_confirmation_links (
                id, company_id, job_case_id, token_hash, status, expires_at, revoked_at,
                created_by_user_id, viewed_at, confirmed_at, confirmation_note, request_ip, user_agent, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, 'ISSUED', $5, NULL, $6, NULL, NULL, NULL, NULL, NULL, $7, $7)
            `,
            [linkId, resolvedCompanyId, jobCaseId, tokenHash, expiresAt, createdByUserId || null, timestamp]
          );

          await appendCustomerConfirmationEvent(client, {
            linkId,
            eventType: 'ISSUED',
            createdAt: timestamp
          });

          return toCustomerConfirmationLink({
            id: linkId,
            company_id: resolvedCompanyId,
            job_case_id: jobCaseId,
            created_by_user_id: createdByUserId || null,
            status: 'ISSUED',
            expires_at: expiresAt,
            revoked_at: null,
            viewed_at: null,
            confirmed_at: null,
            confirmation_note: null,
            request_ip: null,
            user_agent: null,
            created_at: timestamp,
            updated_at: timestamp
          }, token);
        });
      },
      getLatestByJobCaseId: async (jobCaseId) => {
        const result = await pool.query(
          `
            SELECT *
            FROM customer_confirmation_links
            WHERE job_case_id = $1
            ORDER BY created_at DESC
            LIMIT 1
          `,
          [jobCaseId]
        );
        return toCustomerConfirmationLink(result.rows[0] || null);
      },
      getViewByToken: async ({ token, requestIp, userAgent }) => {
        return withTransaction(pool, async (client) => {
          const row = await getCustomerConfirmationRowForUpdate(client, sha256(token));
          await assertAvailableCustomerConfirmation(client, row, 'CUSTOMER_CONFIRMATION');

          if (!row.viewed_at) {
            const timestamp = new Date().toISOString();
            const nextStatus = row.status === 'ISSUED' ? 'VIEWED' : row.status;
            await client.query(
              `
                UPDATE customer_confirmation_links
                SET status = $2,
                    viewed_at = $3,
                    request_ip = COALESCE(request_ip, $4),
                    user_agent = COALESCE(user_agent, $5),
                    updated_at = $3
                WHERE id = $1
              `,
              [row.id, nextStatus, timestamp, requestIp || null, userAgent || null]
            );
            await appendCustomerConfirmationEvent(client, {
              linkId: row.id,
              eventType: 'VIEWED',
              requestIp,
              userAgent,
              createdAt: timestamp
            });

            return toCustomerConfirmationLink({
              ...row,
              status: nextStatus,
              viewed_at: timestamp,
              request_ip: row.request_ip || requestIp || null,
              user_agent: row.user_agent || userAgent || null,
              updated_at: timestamp
            });
          }

          return toCustomerConfirmationLink(row);
        });
      },
      acknowledge: async ({ token, note, requestIp, userAgent }) => {
        return withTransaction(pool, async (client) => {
          const row = await getCustomerConfirmationRowForUpdate(client, sha256(token));
          await assertAvailableCustomerConfirmation(client, row, 'CUSTOMER_CONFIRMATION');

          if (row.confirmed_at || row.status === 'CONFIRMED') {
            throw new HttpError(409, 'CUSTOMER_CONFIRMATION_ALREADY_ACKNOWLEDGED', '?대? 怨좉컼 ?뺤씤???꾨즺??留곹겕?낅땲??');
          }

          const timestamp = new Date().toISOString();
          await client.query(
            `
              UPDATE customer_confirmation_links
              SET status = 'CONFIRMED',
                  viewed_at = COALESCE(viewed_at, $2),
                  confirmed_at = $2,
                  confirmation_note = $3,
                  request_ip = $4,
                  user_agent = $5,
                  updated_at = $2
              WHERE id = $1
            `,
            [row.id, timestamp, note || null, requestIp || null, userAgent || null]
          );

          await appendCustomerConfirmationEvent(client, {
            linkId: row.id,
            eventType: 'ACKNOWLEDGED',
            requestIp,
            userAgent,
            confirmationNote: note || null,
            createdAt: timestamp
          });

          return toCustomerConfirmationLink({
            ...row,
            status: 'CONFIRMED',
            viewed_at: row.viewed_at || timestamp,
            confirmed_at: timestamp,
            confirmation_note: note || null,
            request_ip: requestIp || null,
            user_agent: userAgent || null,
            updated_at: timestamp
          });
        });
      }
    },
    authRepository: {
      issueChallenge: async ({ email, token, requestIp, deliveryProvider, deliveryStatus }) => {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const recentResult = await pool.query(`SELECT created_at FROM login_challenges WHERE email = $1 ORDER BY created_at DESC LIMIT 1`, [normalizedEmail]);
        const recent = normalizeRow(recentResult.rows[0] || null);
        if (recent) {
          const elapsed = Date.now() - new Date(recent.created_at).getTime();
          if (elapsed < 60 * 1000) {
            throw new HttpError(429, 'AUTH_CHALLENGE_RATE_LIMITED', '?? ? ?? ??? ???.');
          }
        }

        const bucketStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const recentCountResult = await pool.query(`SELECT COUNT(*)::int AS count FROM login_challenges WHERE email = $1 AND created_at >= $2`, [normalizedEmail, bucketStart]);
        const recentCount = Number(recentCountResult.rows[0]?.count || 0);
        if (recentCount >= 5) {
          throw new HttpError(429, 'AUTH_CHALLENGE_RATE_LIMITED', '??? ?? ??? ?? ????. ?? ? ?? ??? ???.');
        }

        const userResult = await pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [normalizedEmail]);
        const user = normalizeRow(userResult.rows[0] || null);
        const challenge = {
          id: createRepositoryId('challenge'),
          userId: user?.id || null,
          email: normalizedEmail,
          tokenHash: sha256(token),
          status: 'ISSUED',
          expiresAt: plusMinutes(config.authChallengeTtlMinutes),
          consumedAt: null,
          requestIp: requestIp || null,
          deliveryProvider: deliveryProvider || 'PENDING',
          deliveryStatus: deliveryStatus || 'PENDING',
          createdAt: new Date().toISOString()
        };

        await pool.query(`
            UPDATE login_challenges
            SET status = 'SUPERSEDED'
            WHERE email = $1 AND status = 'ISSUED'
          `, [normalizedEmail]);

        await pool.query(`
            INSERT INTO login_challenges (
              id, user_id, email, token_hash, status, expires_at, consumed_at,
              request_ip, delivery_provider, delivery_status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            challenge.id,
            challenge.userId,
            challenge.email,
            challenge.tokenHash,
            challenge.status,
            challenge.expiresAt,
            challenge.consumedAt,
            challenge.requestIp,
            challenge.deliveryProvider,
            challenge.deliveryStatus,
            challenge.createdAt
          ]);

        return {
          id: challenge.id,
          email: challenge.email,
          expiresAt: challenge.expiresAt
        };
      },
      updateChallengeDelivery: async ({ challengeId, deliveryProvider, deliveryStatus }) => {
        await pool.query(`
          UPDATE login_challenges
          SET delivery_provider = $1,
              delivery_status = $2
          WHERE id = $3
        `, [deliveryProvider || null, deliveryStatus || null, challengeId]);
      },
      verifyChallenge: async ({ challengeId, token, displayName, companyName, invitationToken }) => {
        return withTransaction(pool, async (client) => {
          const tokenHash = sha256(token);
          const challengeResult = await client.query(
            `SELECT * FROM login_challenges WHERE id = $1 LIMIT 1 FOR UPDATE`,
            [challengeId]
          );
          const challenge = normalizeRow(challengeResult.rows[0] || null);
          if (!challenge) {
            throw new HttpError(404, 'AUTH_CHALLENGE_NOT_FOUND', '濡쒓렇??梨뚮┛吏瑜?李얠쓣 ???놁뒿?덈떎.');
          }
          if (challenge.status !== 'ISSUED') {
            throw new HttpError(409, 'AUTH_CHALLENGE_NOT_AVAILABLE', '?대? ?ъ슜?섏뿀嫄곕굹 ?ъ슜?????녿뒗 濡쒓렇??梨뚮┛吏?낅땲??');
          }
          if (challenge.token_hash !== tokenHash) {
            throw new HttpError(403, 'AUTH_CHALLENGE_INVALID', '濡쒓렇??寃利??좏겙???щ컮瑜댁? ?딆뒿?덈떎.');
          }
          if (new Date(challenge.expires_at).getTime() < Date.now()) {
            throw new HttpError(410, 'AUTH_CHALLENGE_EXPIRED', '濡쒓렇??梨뚮┛吏媛 留뚮즺?섏뿀?듬땲??');
          }

          const userResult = await client.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [challenge.email]);
          let user = normalizeRow(userResult.rows[0] || null);
          if (!user) {
            const timestamp = new Date().toISOString();
            user = {
              id: createRepositoryId('user'),
              email: challenge.email,
              display_name: String(displayName || challenge.email.split('@')[0]).trim(),
              phone_number: null,
              status: 'ACTIVE',
              last_login_at: null,
              created_at: timestamp,
              updated_at: timestamp
            };
            await client.query(
              `
                INSERT INTO users (
                  id, email, display_name, phone_number, status, last_login_at, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              `,
              [
                user.id,
                user.email,
                user.display_name,
                user.phone_number,
                user.status,
                user.last_login_at,
                user.created_at,
                user.updated_at
              ]
            );
          }

          const invitedMembership = await resolveInvitationForAuth(client, invitationToken, challenge.email, user.id);
          let memberships = await listActiveMembershipRows(client, user.id);

          if (!invitedMembership && memberships.length === 0 && !String(companyName || '').trim()) {
            throw new HttpError(409, 'AUTH_SETUP_REQUIRED', '?뚯궗 ?대쫫???낅젰??泥?濡쒓렇???ㅼ젙???꾨즺??二쇱꽭??', {
              companyName: 'REQUIRED'
            });
          }

          if (!invitedMembership && memberships.length === 0) {
            const timestamp = new Date().toISOString();
            const company = {
              id: createRepositoryId('company'),
              name: String(companyName).trim(),
              owner_user_id: user.id,
              plan_code: 'BASIC',
              status: 'ACTIVE',
              created_at: timestamp,
              updated_at: timestamp
            };
            const membership = {
              id: createRepositoryId('membership'),
              company_id: company.id,
              user_id: user.id,
              role: 'OWNER',
              status: 'ACTIVE',
              invited_by_user_id: user.id,
              joined_at: timestamp,
              created_at: timestamp,
              updated_at: timestamp
            };
            await client.query(
              `INSERT INTO companies (id, name, owner_user_id, plan_code, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [company.id, company.name, company.owner_user_id, company.plan_code, company.status, company.created_at, company.updated_at]
            );
            await client.query(
              `
                INSERT INTO memberships (
                  id, company_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `,
              [
                membership.id,
                membership.company_id,
                membership.user_id,
                membership.role,
                membership.status,
                membership.invited_by_user_id,
                membership.joined_at,
                membership.created_at,
                membership.updated_at
              ]
            );
            memberships = await listActiveMembershipRows(client, user.id);
          } else if (invitedMembership) {
            memberships = await listActiveMembershipRows(client, user.id);
          }

          const selectedMembership = invitedMembership
            ? memberships.find((item) => item.company_id === invitedMembership.companyId)
            : memberships[0];

          if (!selectedMembership) {
            throw new HttpError(500, 'AUTH_MEMBERSHIP_RESOLUTION_FAILED', '?쒖꽦 ?뚯궗 硫ㅻ쾭??쓣 ?뺤씤?섏? 紐삵뻽?듬땲??');
          }

          const timestamp = new Date().toISOString();
          const session = await createAuthSession(client, {
            userId: user.id,
            membershipId: selectedMembership.membership_id || selectedMembership.id,
            companyId: selectedMembership.company_id,
            createdAt: timestamp
          });
          await client.query(`UPDATE users SET last_login_at = $1, updated_at = $2 WHERE id = $3`, [timestamp, timestamp, user.id]);
          await client.query(`UPDATE login_challenges SET status = 'CONSUMED', consumed_at = $1 WHERE id = $2`, [timestamp, challenge.id]);

          return {
            sessionId: session.sessionId,
            refreshToken: session.refreshToken,
            user: {
              id: user.id,
              email: user.email,
              displayName: user.display_name
            },
            company: {
              id: selectedMembership.company_id,
              name: selectedMembership.company_name,
              role: selectedMembership.role
            },
            companies: memberships.map((row) => toCompanySummary(row))
          };
        });
      },
        getSessionContext: async (sessionId) => {
          return withTransaction(pool, async (client) => {
            const result = await client.query(`SELECT * FROM sessions WHERE id = $1 LIMIT 1 FOR UPDATE`, [sessionId]);
            const session = normalizeRow(result.rows[0] || null);
          if (!session || session.revoked_at) {
            return null;
          }
          if (isPast(session.expires_at) || isSessionIdleExpired(session)) {
            await client.query(`UPDATE sessions SET revoked_at = $1 WHERE id = $2`, [new Date().toISOString(), session.id]);
            return null;
          }

          const touchedAt = new Date().toISOString();
          await client.query(`UPDATE sessions SET last_seen_at = $1 WHERE id = $2`, [touchedAt, session.id]);
            return buildSessionPayloadFromClient(client, { ...session, last_seen_at: touchedAt });
          });
        },
        updateUserProfile: async ({ userId, displayName, phoneNumber }) => {
          const nextDisplayName = normalizeProfileDisplayName(displayName);
          const nextPhoneNumber = normalizeProfilePhoneNumber(phoneNumber);
          const updatedAt = new Date().toISOString();
          const result = await pool.query(
            `
              UPDATE users
              SET display_name = $1,
                  phone_number = $2,
                  updated_at = $3
              WHERE id = $4
              RETURNING id, email, display_name, phone_number, updated_at
            `,
            [nextDisplayName, nextPhoneNumber, updatedAt, userId]
          );
          const user = normalizeRow(result.rows[0] || null);
          if (!user) {
            throw new HttpError(404, 'USER_NOT_FOUND', '계정 정보를 찾을 수 없어요.');
          }
          return {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            phoneNumber: user.phone_number,
            updatedAt: user.updated_at
          };
        },
        listRecentChallengesByEmail: async (email, limit = 5) => {
          const normalizedEmail = String(email || "").trim().toLowerCase();
          if (!normalizedEmail) {
            return [];
          }
          const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 20) : 5;
          const result = await pool.query(
            `
              SELECT id, email, status, delivery_provider, delivery_status, expires_at, consumed_at, created_at
              FROM login_challenges
              WHERE email = $1
              ORDER BY created_at DESC
              LIMIT $2
            `,
            [normalizedEmail, safeLimit]
          );
          return normalizeRows(result.rows).map((item) => ({
            id: item.id,
            email: item.email,
            status: item.status,
            deliveryProvider: item.delivery_provider,
            deliveryStatus: item.delivery_status,
            expiresAt: item.expires_at,
            consumedAt: item.consumed_at,
            createdAt: item.created_at
          }));
        },
        refreshSessionByRefreshToken: async (refreshToken) => {
        return withTransaction(pool, async (client) => {
          const sessionResult = await client.query(`SELECT * FROM sessions WHERE refresh_token_hash = $1 LIMIT 1 FOR UPDATE`, [sha256(refreshToken)]);
          const session = normalizeRow(sessionResult.rows[0] || null);
          if (!session || session.revoked_at) {
            throw new HttpError(401, 'AUTH_REFRESH_INVALID', '???? ??? ???? ????.');
          }
          if (isPast(session.expires_at)) {
            await client.query(`UPDATE sessions SET revoked_at = $1 WHERE id = $2`, [new Date().toISOString(), session.id]);
            throw new HttpError(401, 'AUTH_REFRESH_EXPIRED', '???? ??? ??????. ?? ???? ???.');
          }
          if (isSessionIdleExpired(session)) {
            await client.query(`UPDATE sessions SET revoked_at = $1 WHERE id = $2`, [new Date().toISOString(), session.id]);
            throw new HttpError(401, 'AUTH_SESSION_IDLE_EXPIRED', '?? ???? ?? ??? ??????. ?? ???? ???.');
          }

          const rotatedAt = new Date().toISOString();
          const nextSession = await createAuthSession(client, {
            userId: session.user_id,
            membershipId: session.membership_id,
            companyId: session.company_id,
            createdAt: rotatedAt
          });
          await client.query(`UPDATE sessions SET revoked_at = $1 WHERE id = $2`, [rotatedAt, session.id]);
          const nextResult = await client.query(`SELECT * FROM sessions WHERE id = $1 LIMIT 1`, [nextSession.sessionId]);
          const context = await buildSessionPayloadFromClient(client, nextResult.rows[0] || null);
          if (!context) {
            throw new HttpError(401, 'AUTH_SESSION_INVALID', '??? ???? ????. ?? ???? ???.');
          }

          return {
            sessionId: nextSession.sessionId,
            refreshToken: nextSession.refreshToken,
            user: {
              id: context.userId,
              email: context.email,
              displayName: context.displayName
            },
            company: {
              id: context.companyId,
              name: context.companyName,
              role: context.role
            },
            companies: context.companies
          };
        });
      },
        revokeSession: async (sessionId) => {
          await pool.query(`UPDATE sessions SET revoked_at = $1 WHERE id = $2`, [new Date().toISOString(), sessionId]);
        },
        listSessionsByUser: async (userId) => {
          const result = await pool.query(
            `
              SELECT sessions.id, sessions.company_id, sessions.membership_id, sessions.last_seen_at, sessions.expires_at, sessions.revoked_at, sessions.created_at,
                     companies.name AS company_name, memberships.role
              FROM sessions
              JOIN memberships ON memberships.id = sessions.membership_id
              JOIN companies ON companies.id = sessions.company_id
              WHERE sessions.user_id = $1
              ORDER BY COALESCE(sessions.last_seen_at, sessions.created_at) DESC
            `,
            [userId]
          );
          return normalizeRows(result.rows).map((item) => ({
            id: item.id,
            companyId: item.company_id,
            companyName: item.company_name,
            role: item.role,
            membershipId: item.membership_id,
            lastSeenAt: item.last_seen_at,
            expiresAt: item.expires_at,
            revokedAt: item.revoked_at,
            createdAt: item.created_at
          }));
        },
        revokeOwnedSession: async ({ userId, sessionId }) => {
          return withTransaction(pool, async (client) => {
            const result = await client.query(
              `SELECT * FROM sessions WHERE id = $1 LIMIT 1 FOR UPDATE`,
              [sessionId]
            );
            const session = normalizeRow(result.rows[0] || null);
            if (!session || session.user_id !== userId) {
              throw new HttpError(404, 'AUTH_SESSION_NOT_FOUND', '세션 정보를 찾을 수 없어요.');
            }
            if (session.revoked_at) {
              return {
                id: session.id,
                revokedAt: session.revoked_at
              };
            }
            const revokedAt = new Date().toISOString();
            await client.query(`UPDATE sessions SET revoked_at = $1 WHERE id = $2`, [revokedAt, session.id]);
            return {
              id: session.id,
              revokedAt
            };
          });
        },
        revokeSessionByRefreshToken: async (refreshToken) => {
          await pool.query(`UPDATE sessions SET revoked_at = $1 WHERE refresh_token_hash = $2`, [new Date().toISOString(), sha256(refreshToken)]);
        },
      switchSessionCompany: async ({ sessionId, userId, companyId }) => {
        return withTransaction(pool, async (client) => {
          const sessionResult = await client.query(`SELECT * FROM sessions WHERE id = $1 LIMIT 1 FOR UPDATE`, [sessionId]);
          const session = normalizeRow(sessionResult.rows[0] || null);
          if (!session || session.user_id !== userId || session.revoked_at) {
            throw new HttpError(401, 'AUTH_SESSION_INVALID', '?몄뀡???좏슚?섏? ?딆뒿?덈떎.');
          }

          const membershipResult = await client.query(
            `
              SELECT memberships.*, companies.name AS company_name
              FROM memberships
              JOIN companies ON companies.id = memberships.company_id
              WHERE memberships.user_id = $1 AND memberships.company_id = $2 AND memberships.status = 'ACTIVE'
              LIMIT 1
            `,
            [userId, companyId]
          );
          const membership = normalizeRow(membershipResult.rows[0] || null);
          if (!membership) {
            throw new HttpError(403, 'COMPANY_ACCESS_DENIED', '?대떦 ?뚯궗???묎렐??沅뚰븳???놁뒿?덈떎.');
          }

          await client.query(
            `UPDATE sessions SET company_id = $1, membership_id = $2, last_seen_at = $3 WHERE id = $4`,
            [companyId, membership.id, new Date().toISOString(), sessionId]
          );

          return {
            company: {
              id: companyId,
              name: membership.company_name,
              role: membership.role
            },
            companies: (await listActiveMembershipRows(client, userId)).map((row) => toCompanySummary(row))
          };
        });
      },
        createInvitation: async ({ companyId, email, role, invitedByUserId }) => {
          const normalizedEmail = String(email || '').trim().toLowerCase();
          if (!normalizedEmail) {
            throw new HttpError(422, 'INVITATION_EMAIL_REQUIRED', '珥덈? ?대찓?쇱쓣 ?낅젰??二쇱꽭??');
          }
        if (!['MANAGER', 'STAFF'].includes(role)) {
          throw new HttpError(422, 'INVITATION_ROLE_INVALID', '珥덈? ??븷???щ컮瑜댁? ?딆뒿?덈떎.');
        }

        return withTransaction(pool, async (client) => {
          const companyResult = await client.query(`SELECT * FROM companies WHERE id = $1 LIMIT 1`, [companyId]);
          const company = normalizeRow(companyResult.rows[0] || null);
          if (!company) {
            throw new HttpError(404, 'COMPANY_NOT_FOUND', '?뚯궗瑜?李얠쓣 ???놁뒿?덈떎.');
          }

          const recentResult = await client.query(
            `
              SELECT * FROM invitations
              WHERE company_id = $1 AND email = $2 AND status = 'ISSUED'
              ORDER BY created_at DESC
              LIMIT 1
            `,
            [companyId, normalizedEmail]
          );
          const recent = normalizeRow(recentResult.rows[0] || null);
          if (recent && Date.now() - new Date(recent.created_at).getTime() < 5 * 60 * 1000) {
            throw new HttpError(429, 'INVITATION_RATE_LIMITED', '珥덈? ?붿껌???덈Т 留롮뒿?덈떎. ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??');
          }

          const invitationToken = crypto.randomBytes(24).toString('base64url');
          const invitation = {
            id: createRepositoryId('invite'),
            companyId,
            email: normalizedEmail,
            role,
            invitedByUserId,
            status: 'ISSUED',
            tokenHash: sha256(invitationToken),
            expiresAt: plusDays(7),
            acceptedAt: null,
            lastSentAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            companyName: company.name
          };

          await client.query(
            `
              INSERT INTO invitations (
                id, company_id, email, role, invited_by_user_id, status, token_hash,
                expires_at, accepted_at, last_sent_at, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `,
            [
              invitation.id,
              invitation.companyId,
              invitation.email,
              invitation.role,
              invitation.invitedByUserId,
              invitation.status,
              invitation.tokenHash,
              invitation.expiresAt,
              invitation.acceptedAt,
              invitation.lastSentAt,
              invitation.createdAt
            ]
          );

            return {
              id: invitation.id,
              email: invitation.email,
              role: invitation.role,
              companyId: invitation.companyId,
              companyName: invitation.companyName,
              expiresAt: invitation.expiresAt,
              invitationToken
            };
          });
        },
        reissueInvitation: async ({ companyId, invitationId, invitedByUserId }) => {
          return withTransaction(pool, async (client) => {
            const invitationResult = await client.query(
              `
                SELECT invitations.*, companies.name AS company_name
                FROM invitations
                JOIN companies ON companies.id = invitations.company_id
                WHERE invitations.id = $1 AND invitations.company_id = $2
                LIMIT 1
                FOR UPDATE
              `,
              [invitationId, companyId]
            );
            const invitation = normalizeRow(invitationResult.rows[0] || null);
            if (!invitation) {
              throw new HttpError(404, 'INVITATION_NOT_FOUND', '초대 정보를 찾을 수 없어요.');
            }
            if (invitation.status !== 'ISSUED') {
              throw new HttpError(409, 'INVITATION_NOT_ACTIVE', '다시 보낼 수 있는 초대 상태가 아닙니다.');
            }
            if (Date.now() - new Date(invitation.last_sent_at).getTime() < 60 * 1000) {
              throw new HttpError(429, 'INVITATION_RESEND_RATE_LIMITED', '방금 초대를 보냈습니다. 잠시 후 다시 시도해주세요.');
            }

            await client.query(`UPDATE invitations SET status = 'REVOKED' WHERE id = $1`, [invitation.id]);

            const invitationToken = crypto.randomBytes(24).toString('base64url');
            const nextInvitation = {
              id: createRepositoryId('invite'),
              companyId,
              email: invitation.email,
              role: invitation.role,
              invitedByUserId: invitedByUserId || invitation.invited_by_user_id,
              status: 'ISSUED',
              tokenHash: sha256(invitationToken),
              expiresAt: plusDays(7),
              acceptedAt: null,
              lastSentAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              companyName: invitation.company_name
            };

            await client.query(
              `
                INSERT INTO invitations (
                  id, company_id, email, role, invited_by_user_id, status, token_hash,
                  expires_at, accepted_at, last_sent_at, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              `,
              [
                nextInvitation.id,
                nextInvitation.companyId,
                nextInvitation.email,
                nextInvitation.role,
                nextInvitation.invitedByUserId,
                nextInvitation.status,
                nextInvitation.tokenHash,
                nextInvitation.expiresAt,
                nextInvitation.acceptedAt,
                nextInvitation.lastSentAt,
                nextInvitation.createdAt
              ]
            );

            return {
              id: nextInvitation.id,
              email: nextInvitation.email,
              role: nextInvitation.role,
              companyId: nextInvitation.companyId,
              companyName: nextInvitation.companyName,
              expiresAt: nextInvitation.expiresAt,
              invitationToken
            };
          });
        },
        revokeInvitation: async ({ companyId, invitationId }) => {
          return withTransaction(pool, async (client) => {
            const result = await client.query(
              `
                SELECT *
                FROM invitations
                WHERE id = $1 AND company_id = $2
                LIMIT 1
                FOR UPDATE
              `,
              [invitationId, companyId]
            );
            const invitation = normalizeRow(result.rows[0] || null);
            if (!invitation) {
              throw new HttpError(404, 'INVITATION_NOT_FOUND', '초대 정보를 찾을 수 없어요.');
            }
            if (invitation.status === 'ACCEPTED') {
              throw new HttpError(409, 'INVITATION_ALREADY_ACCEPTED', '이미 수락된 초대는 취소할 수 없습니다.');
            }
            if (invitation.status !== 'REVOKED') {
              await client.query(`UPDATE invitations SET status = 'REVOKED' WHERE id = $1`, [invitation.id]);
              invitation.status = 'REVOKED';
            }
            return mapInvitationRow(invitation);
          });
        },
        listMembershipsByCompany: async (companyId) => {
          const result = await pool.query(
            `
              SELECT memberships.id, memberships.role, memberships.status, memberships.joined_at,
                   users.email, users.display_name
            FROM memberships
            JOIN users ON users.id = memberships.user_id
            WHERE memberships.company_id = $1
            ORDER BY memberships.created_at ASC
          `,
          [companyId]
        );
        return normalizeRows(result.rows).map((item) => ({
          id: item.id,
          role: item.role,
          status: item.status,
          joinedAt: item.joined_at,
          email: item.email,
          displayName: item.display_name
        }));
      },
      listInvitationsByCompany: async (companyId) => {
        const result = await pool.query(
          `
            SELECT id, email, role, status, expires_at, accepted_at, last_sent_at, created_at
            FROM invitations
            WHERE company_id = $1
            ORDER BY created_at DESC
          `,
          [companyId]
        );
          return normalizeRows(result.rows).map((item) => ({
            id: item.id,
            email: item.email,
            role: item.role,
            status: item.status,
            expiresAt: item.expires_at,
            acceptedAt: item.accepted_at,
            lastSentAt: item.last_sent_at,
            createdAt: item.created_at
          }));
        },
        getSettlementSummaryByCompany: async (companyId) => {
          const { startIso, endIso } = getCurrentMonthRange();
          const [summaryResult, recentResult] = await Promise.all([
            pool.query(
              `
                SELECT
                  COALESCE(SUM(COALESCE(confirmed_amount, 0)), 0)::bigint AS total_confirmed_amount,
                  COUNT(*)::int AS agreement_count_total,
                  COALESCE(SUM(CASE WHEN confirmed_at >= $2 AND confirmed_at < $3 THEN COALESCE(confirmed_amount, 0) ELSE 0 END), 0)::bigint AS confirmed_amount_this_month,
                  COUNT(*) FILTER (WHERE confirmed_at >= $2 AND confirmed_at < $3)::int AS agreement_count_this_month,
                  MAX(confirmed_at) AS latest_confirmed_at
                FROM agreement_records
                WHERE company_id = $1
                  AND status = 'AGREED'
              `,
              [companyId, startIso, endIso]
            ),
            pool.query(
              `
                SELECT
                  ar.id AS agreement_id,
                  ar.job_case_id,
                  ar.status,
                  ar.confirmed_amount,
                  ar.confirmed_at,
                  jc.customer_label,
                  jc.site_label
                FROM agreement_records ar
                LEFT JOIN job_cases jc ON jc.id = ar.job_case_id
                WHERE ar.company_id = $1
                  AND ar.status = 'AGREED'
                ORDER BY COALESCE(ar.confirmed_at, ar.created_at) DESC
                LIMIT 5
              `,
              [companyId]
            )
          ]);

          const summary = normalizeRow(summaryResult.rows[0] || {});
          return {
            totalConfirmedAmount: Number(summary.total_confirmed_amount || 0),
            confirmedAmountThisMonth: Number(summary.confirmed_amount_this_month || 0),
            agreementCountTotal: Number(summary.agreement_count_total || 0),
            agreementCountThisMonth: Number(summary.agreement_count_this_month || 0),
            latestConfirmedAt: summary.latest_confirmed_at || null,
            recentAgreements: normalizeRows(recentResult.rows).map((item) => ({
              agreementId: item.agreement_id,
              jobCaseId: item.job_case_id,
              customerLabel: item.customer_label || "이름 없는 작업 건",
              siteLabel: item.site_label || "",
              confirmedAmount: Number(item.confirmed_amount || 0),
              confirmedAt: item.confirmed_at || null,
              status: item.status
            }))
          };
        },
        listCompaniesForUser: async (userId) => {
          return (await listActiveMembershipRows(pool, userId)).map((row) => toCompanySummary(row));
        }
    },
    auditLogRepository: {
      append: async (entry) => {
        const payloadJson = entry.payloadJson == null ? null : JSON.stringify(entry.payloadJson);
        const result = await pool.query(
          `
            INSERT INTO audit_logs (
              id, company_id, actor_user_id, actor_type, action,
              resource_type, resource_id, request_id, payload_json, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
            RETURNING *
          `,
          [
            entry.id || `audit_${crypto.randomUUID()}`,
            entry.companyId,
            entry.actorUserId || null,
            entry.actorType,
            entry.action,
            entry.resourceType,
            entry.resourceId || null,
            entry.requestId || null,
            payloadJson,
            entry.createdAt || new Date().toISOString()
          ]
        );
        return toAuditLog(result.rows[0]);
      },
      listByCompany: async (companyId, options = {}) => {
        const limit = Number.parseInt(options.limit || 100, 10);
        const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100;
        const result = await pool.query(
          `
            SELECT *
            FROM audit_logs
            WHERE company_id = $1
            ORDER BY created_at DESC
            LIMIT $2
          `,
          [companyId, safeLimit]
        );
        return result.rows.map((row) => toAuditLog(row));
      }
    },
    timelineEventRepository: {
      append: async ({ jobCaseId, companyId, actorUserId, eventType, summary, payloadJson, createdAt }) => {
        return withTransaction(pool, async (client) => {
          const jobCase = await loadJobCaseForWrite(client, jobCaseId);
          const payload = payloadJson == null ? null : JSON.stringify(payloadJson);
          const timestamp = createdAt || new Date().toISOString();
          const resolvedCompanyId = companyId || jobCase.company_id || null;

          const result = await client.query(
            `
              INSERT INTO timeline_events (
                id, company_id, job_case_id, actor_user_id, event_type, summary, payload_json, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
              RETURNING *
            `,
            [
              `timeline_${crypto.randomUUID()}`,
              resolvedCompanyId,
              jobCaseId,
              actorUserId || null,
              eventType,
              summary,
              payload,
              timestamp
            ]
          );

          await client.query(
            `
              UPDATE job_cases
              SET updated_at = $2,
                  updated_by_user_id = $3
              WHERE id = $1
            `,
            [jobCaseId, timestamp, actorUserId || null]
          );

          return toTimelineEvent(result.rows[0]);
        });
      }
    },
    fileAssetRepository: {
      listByFieldRecordId: async (fieldRecordId) => {
        const result = await pool.query(
          `
            SELECT *
            FROM field_record_photos
            WHERE field_record_id = $1
            ORDER BY sort_order ASC, created_at ASC
          `,
          [fieldRecordId]
        );
        return normalizeRows(result.rows);
      }
    },
    migrations: {
      apply: async () => applyPostgresMigrations({ databaseUrl, connectionOptions }),
      status: async () => getPostgresMigrationStatus(databaseUrl, { connectionOptions })
    },
    close: async () => {
      if (ownsPool) {
        await pool.end();
      }
    }
  };
}






