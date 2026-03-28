const CSRF_COOKIE_NAME = "faa_csrf";
const BACKUP_WARNING_HOURS = 24;
const STALE_CONFIRMATION_HOURS = 24;
const QUIET_TIMELINE_HOURS = 24;
const searchParams = new URLSearchParams(window.location.search);
const reviewMode = searchParams.get("review");

const ACTION_LABELS = {
  OPS_BACKUP_CREATED: "수동 백업 생성",
  OPS_DATA_RESET: "운영 데이터 초기화",
  AUTH_LOGIN_CHALLENGE_ISSUED: "로그인 링크 발급",
  AUTH_LOGIN_VERIFIED: "로그인 완료",
  COMPANY_CONTEXT_SWITCHED: "업체 전환"
};

const RESOURCE_LABELS = {
  SYSTEM_BACKUP: "백업",
  SYSTEM_RUNTIME: "런타임",
  LOGIN_CHALLENGE: "로그인 링크",
  SESSION: "세션",
  COMPANY: "업체"
};

const CONFIRMATION_STATUS_LABELS = {
  ISSUED: "발급됨",
  VIEWED: "열람됨",
  CONFIRMED: "확인 완료",
  EXPIRED: "만료됨",
  REVOKED: "회수됨"
};

const TIMELINE_EVENT_LABELS = {
  FIELD_RECORD_CREATED: "현장 기록 저장",
  FIELD_RECORD_LINKED: "현장 기록 연결",
  JOB_CASE_CREATED: "작업 건 생성",
  QUOTE_UPDATED: "변경 견적 저장",
  DRAFT_MESSAGE_CREATED: "설명 초안 생성",
  AGREEMENT_RECORDED: "합의 기록 저장",
  CUSTOMER_CONFIRMATION_LINK_CREATED: "고객 확인 링크 발급",
  CUSTOMER_CONFIRMATION_VIEWED: "고객 확인 링크 열람",
  CUSTOMER_CONFIRMATION_ACKNOWLEDGED: "고객 확인 완료",
  CUSTOMER_CONFIRMATION_CONFIRMED: "고객 확인 완료"
};

const DATASET_META = {
  jobCases: { label: "작업 건", description: "현재 작업 건과 견적 상태를 읽기 전용으로 확인합니다." },
  fieldRecords: { label: "현장 기록", description: "최근 현장 기록과 연결 상태를 빠르게 확인합니다." },
  agreementRecords: { label: "합의 기록", description: "합의 상태와 채널, 금액 기록을 확인합니다." },
  customerConfirmations: { label: "고객 확인", description: "고객 확인 링크의 최근 상태를 확인합니다." },
  timelineEvents: { label: "타임라인", description: "최근 제품 이벤트와 작업 흐름을 확인합니다." },
  users: { label: "사용자", description: "계정과 최근 로그인 상태를 확인합니다." },
  loginChallenges: { label: "로그인 요청", description: "로그인 링크 발급과 메일 전달 상태를 확인합니다." },
  sessions: { label: "세션", description: "현재 세션 재고와 최근 활동 상태를 확인합니다." },
  memberships: { label: "멤버십", description: "업체 멤버십과 역할 상태를 확인합니다." },
  auditLogs: { label: "감사 로그", description: "최근 운영 액션을 확인합니다." }
};

let currentExplorerDataset = "jobCases";

const elements = {
  verdictBadge: document.querySelector("#ops-verdict-badge"),
  verdictTitle: document.querySelector("#ops-verdict-title"),
  verdictCopy: document.querySelector("#ops-verdict-copy"),
  generatedAt: document.querySelector("#ops-generated-at"),
  prioritySummary: document.querySelector("#ops-priority-summary"),
  priorityList: document.querySelector("#ops-priority-list"),
  handoffSummary: document.querySelector("#ops-handoff-summary"),
  handoffCopy: document.querySelector("#ops-handoff-copy"),
  handoffFocus: document.querySelector("#ops-handoff-focus"),
  handoffList: document.querySelector("#ops-handoff-list"),
  healthStatus: document.querySelector("#ops-health-status"),
  healthMeta: document.querySelector("#ops-health-meta"),
  backupStatus: document.querySelector("#ops-backup-status"),
  backupMeta: document.querySelector("#ops-backup-meta"),
  releaseStatus: document.querySelector("#ops-release-status"),
  releaseMeta: document.querySelector("#ops-release-meta"),
  storageEngine: document.querySelector("#ops-storage-engine"),
  storageMeta: document.querySelector("#ops-storage-meta"),
  agreementSignalStatus: document.querySelector("#ops-agreement-signal-status"),
  agreementSignalMeta: document.querySelector("#ops-agreement-signal-meta"),
  confirmationSignalStatus: document.querySelector("#ops-confirmation-signal-status"),
  confirmationSignalMeta: document.querySelector("#ops-confirmation-signal-meta"),
  timelineSignalStatus: document.querySelector("#ops-timeline-signal-status"),
  timelineSignalMeta: document.querySelector("#ops-timeline-signal-meta"),
  authSignalStatus: document.querySelector("#ops-auth-signal-status"),
  authSignalMeta: document.querySelector("#ops-auth-signal-meta"),
  alertSummary: document.querySelector("#ops-alert-summary"),
  alerts: document.querySelector("#ops-alerts"),
  snapshotList: document.querySelector("#ops-snapshot-list"),
  confirmations: document.querySelector("#ops-confirmations"),
  timelineEvents: document.querySelector("#ops-timeline-events"),
  authActivity: document.querySelector("#ops-auth-activity"),
  explorerGeneratedAt: document.querySelector("#ops-explorer-generated-at"),
  explorerDescription: document.querySelector("#ops-explorer-description"),
  explorerDatasets: document.querySelector("#ops-explorer-datasets"),
  explorerSelectedLabel: document.querySelector("#ops-explorer-selected-label"),
  explorerSelectedCount: document.querySelector("#ops-explorer-selected-count"),
  explorerTable: document.querySelector("#ops-explorer-table"),
  activity: document.querySelector("#ops-activity"),
  backups: document.querySelector("#ops-backups"),
  refresh: document.querySelector("#ops-refresh"),
  backupForm: document.querySelector("#ops-backup-form"),
  backupLabel: document.querySelector("#ops-backup-label"),
  backupSubmit: document.querySelector("#ops-backup-submit"),
  feedback: document.querySelector("#ops-feedback")
};

function redirectToLogin(reason = "session-expired") {
  const params = new URLSearchParams();
  params.set("reason", reason);
  const nextPath = `${window.location.pathname}${window.location.search || ""}`;
  if (nextPath.startsWith("/")) {
    params.set("next", nextPath);
  }
  window.location.href = `/login?${params.toString()}`;
}

function readCookie(name) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) || "";
}

function buildHeaders(extra = {}, method = "GET") {
  const headers = { ...extra };
  if (method !== "GET") {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }
  }
  return headers;
}

function showFeedback(message, tone = "") {
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback ${tone}`.trim();
}

function setBusy(button, busy, busyLabel) {
  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent;
  }
  button.disabled = busy;
  button.textContent = busy ? busyLabel : button.dataset.defaultLabel;
}

async function refreshSession() {
  const csrfToken = readCookie(CSRF_COOKIE_NAME);
  const response = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
    headers: csrfToken ? { "x-csrf-token": csrfToken } : {}
  });
  if (!response.ok) {
    throw new Error("세션을 다시 이어오지 못했습니다.");
  }
}

async function request(url, options = {}, allowRetry = true) {
  const method = options.method || "GET";
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: buildHeaders(options.headers || {}, method)
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const code = payload?.error?.code;
    if ((response.status === 401 || response.status === 403) && allowRetry) {
      try {
        await refreshSession();
        return request(url, options, false);
      } catch {
        redirectToLogin("session-expired");
        throw new Error("세션이 만료되어 다시 로그인이 필요합니다.");
      }
    }
    if (code === "OPS_OWNER_REQUIRED" || code === "COMPANY_ROLE_FORBIDDEN") {
      window.location.href = "/home?reason=owner-required&next=/app/capture";
    }
    throw new Error(payload?.error?.message || "요청을 처리하지 못했습니다.");
  }

  return payload;
}

function formatBytes(value) {
  if (value == null) {
    return "-";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("ko-KR");
}

function formatRelativeTime(value) {
  if (!value) {
    return "기록 없음";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "시간 정보 없음";
  }
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (Math.abs(diffMinutes) < 1) {
    return "방금 전";
  }
  if (Math.abs(diffMinutes) < 60) {
    return `${diffMinutes}분 전`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return `${diffHours}시간 전`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}일 전`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeToken(value) {
  return String(value || "-").trim();
}

function formatAction(value) {
  const normalized = normalizeToken(value).toUpperCase();
  if (ACTION_LABELS[normalized]) {
    return ACTION_LABELS[normalized];
  }
  return normalized.split("_").filter(Boolean).join(" ");
}

function formatResource(value) {
  const normalized = normalizeToken(value).toUpperCase();
  if (RESOURCE_LABELS[normalized]) {
    return RESOURCE_LABELS[normalized];
  }
  return normalized.split("_").filter(Boolean).join(" ");
}

function formatConfirmationStatus(value) {
  const normalized = normalizeToken(value).toUpperCase();
  return CONFIRMATION_STATUS_LABELS[normalized] || normalized;
}

function formatTimelineEventType(value) {
  const normalized = normalizeToken(value).toUpperCase();
  return TIMELINE_EVENT_LABELS[normalized] || normalized;
}

function formatTopMix(items = [], formatter = (value) => value) {
  if (!items.length) {
    return "기록 없음";
  }
  return items.map((item) => `${formatter(item.token)} ${formatCount(item.count)}건`).join(" · ");
}

function formatEnabledState(value, labels = ["켜짐", "꺼짐"]) {
  return value ? labels[0] : labels[1];
}

function formatAuthDeliveryMode(value) {
  switch (String(value || "").toUpperCase()) {
    case "RESEND_LIVE":
      return "실메일 운영";
    case "RESEND_CONFIG_REQUIRED":
      return "실메일 설정 필요";
    case "FILE_PREVIEW":
      return "파일 미리보기";
    default:
      return "확인 필요";
  }
}

function formatAuthOperationalReadiness(value) {
  switch (String(value || "").toUpperCase()) {
    case "READY":
      return "운영 준비 완료";
    case "MAIL_CONFIG_REQUIRED":
      return "메일 설정 필요";
    case "HARDENING_REQUIRED":
      return "보안 강화 필요";
    case "PREVIEW_ONLY":
      return "미리보기 모드";
    default:
      return "확인 필요";
  }
}

function getDatasetLabel(key, fallback) {
  return DATASET_META[key]?.label || fallback || key;
}

function getDatasetDescription(key, fallback) {
  return DATASET_META[key]?.description || fallback || "핵심 운영 데이터를 읽기 전용으로 확인합니다.";
}

function resolveAppStagePath(reasonKey = "", targetId = "") {
  if (targetId === "quote-card" || reasonKey === "quote-missing") {
    return "/app/quote";
  }
  if (targetId === "draft-card" || reasonKey === "draft-missing") {
    return "/app/draft";
  }
  if (
    targetId === "customer-confirm-card"
    || targetId === "agreement-card"
    || targetId === "timeline-card"
    || reasonKey === "confirmation-viewed"
    || reasonKey === "confirmation-stale"
    || reasonKey === "confirm-link-needed"
    || reasonKey === "on-hold-followup"
    || reasonKey === "status-review"
    || reasonKey === "timeline-followup"
  ) {
    return "/app/confirm";
  }
  return "/app/capture";
}

function buildAppCaseHref(jobCaseId, reasonKey = "", targetId = "") {
  const params = new URLSearchParams();
  params.set("caseId", jobCaseId);
  params.set("source", "ops");
  if (reasonKey) {
    params.set("reason", reasonKey);
  }
  if (targetId) {
    params.set("target", targetId);
  }
  return `${resolveAppStagePath(reasonKey, targetId)}?${params.toString()}`;
}

function buildHandoffAction(label, href, tone = "secondary") {
  return `<a class="${tone === "primary" ? "primary-button" : "ghost-button"} landing-action" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
}

function formatFocusCaseHeadline(item) {
  const customer = normalizeToken(item?.customerLabel);
  const site = normalizeToken(item?.siteLabel);
  if (customer !== "-" && site !== "-") {
    return `${customer} · ${site}`;
  }
  if (customer !== "-") {
    return customer;
  }
  if (site !== "-") {
    return site;
  }
  return `작업 ${normalizeToken(item?.jobCaseId)}`;
}

function buildFocusCaseMeta(item) {
  const parts = [`작업 ${normalizeToken(item.jobCaseId)}`];
  const headline = formatFocusCaseHeadline(item);
  if (headline && !headline.startsWith("작업 ")) {
    parts.push(headline);
  }
  if (item.latestConfirmationStatus) {
    parts.push(`고객 확인 ${formatConfirmationStatus(item.latestConfirmationStatus)}`);
  }
  if (item.latestTimelineEventType) {
    parts.push(`최근 ${formatTimelineEventType(item.latestTimelineEventType)}`);
  }
  if (item.updatedAt) {
    parts.push(`업데이트 ${formatRelativeTime(item.updatedAt)}`);
  }
  return parts;
}

function buildFocusCasePriorityItem(item) {
  const urgency = describeFocusUrgency(item);
  return {
    tone: item.focusTone === "warning" ? "warning" : item.focusTone === "good" ? "good" : "neutral",
    title: `${urgency} · ${formatFocusCaseHeadline(item)}부터 확인하세요`,
    body: `${item.focusWhyNow || item.focusCopy || "지금 이 작업 건을 먼저 보면 운영 병목을 가장 빨리 줄일 수 있습니다."} 먼저 볼 카드: ${describeFocusFirstCheck(item)}`
  };
}

function buildFocusCaseHandoffItem(item) {
  const plan = buildFocusCasePlan(item);
  return {
    tone: item.focusTone === "warning" ? "warning" : item.focusTone === "good" ? "good" : "neutral",
    badge: item.focusBadge || "바로 확인",
    title: `${formatFocusCaseHeadline(item)}부터 보세요`,
    body: item.focusCopy || "이 작업 건의 현재 병목을 먼저 정리해 주세요.",
    whyNow: item.focusWhyNow || item.focusCopy || "운영 콘솔에서 이 작업 건이 가장 우선으로 올라왔습니다.",
    meta: buildFocusCaseMeta(item).join(" · "),
    plan,
    actions: [
      buildHandoffAction(
        "작업 화면에서 열기",
        buildAppCaseHref(item.jobCaseId, item.focusReasonKey, item.focusTargetId),
        "primary"
      ),
      buildHandoffAction("운영 콘솔 유지", "/ops")
    ]
  };
}

function describeFocusUrgency(item) {
  switch (item?.focusReasonKey) {
    case "confirmation-viewed":
      return "즉시";
    case "confirmation-stale":
    case "quote-missing":
    case "draft-missing":
      return "오늘 안에";
    case "confirm-link-needed":
    case "on-hold-followup":
    case "status-review":
      return "우선 확인";
    default:
      return "기록 확인";
  }
}

function formatCustomerNotificationReadiness(value) {
  switch (String(value || "").toUpperCase()) {
    case "READY":
      return "운영 준비 완료";
    case "KAKAO_CONFIG_REQUIRED":
      return "카카오 설정 필요";
    case "SMS_FALLBACK_CONFIG_REQUIRED":
      return "문자 fallback 설정 필요";
    case "MANUAL_ONLY":
      return "수동 전달";
    default:
      return "확인 필요";
  }
}

function formatCustomerNotificationChannel(value) {
  switch (String(value || "").toUpperCase()) {
    case "KAKAO_ALIMTALK":
      return "카카오 알림톡";
    case "SMS":
      return "문자";
    case "MANUAL_COPY":
      return "수동 전달";
    default:
      return value || "-";
  }
}

function describeFocusFirstCheck(item) {
  switch (item?.focusTargetId) {
    case "quote-card":
      return "변경 견적과 범위";
    case "draft-card":
      return "고객 설명 초안";
    case "customer-confirm-card":
      return "고객 확인 링크";
    case "agreement-card":
      return "합의 기록";
    case "timeline-card":
      return "타임라인";
    default:
      return "현재 추천 카드";
  }
}

function describeFocusDoneWhen(item) {
  switch (item?.focusReasonKey) {
    case "confirmation-viewed":
      return "열람 뒤 최종 상태가 기록되면 충분합니다.";
    case "confirmation-stale":
      return "후속 연락 필요 여부가 분명해지면 충분합니다.";
    case "quote-missing":
      return "변경 금액이 저장되면 충분합니다.";
    case "draft-missing":
      return "설명 초안이 생기면 충분합니다.";
    case "confirm-link-needed":
      return "확인 단계가 열리거나 합의 상태가 정리되면 충분합니다.";
    case "on-hold-followup":
      return "보류 이유와 다음 액션이 최신이면 충분합니다.";
    case "status-review":
      return "최종 상태를 한 줄로 설명할 수 있으면 충분합니다.";
    default:
      return "기록 누락이 없으면 충분합니다.";
  }
}

function buildFocusCasePlan(item) {
  return {
    urgency: describeFocusUrgency(item),
    first: describeFocusFirstCheck(item),
    doneWhen: describeFocusDoneWhen(item)
  };
}

function getReviewFocusTarget() {
  if (reviewMode === "handoff") {
    return document.querySelector(".ops-handoff-panel");
  }
  if (reviewMode === "signals") {
    return document.querySelector(".ops-signal-grid");
  }
  if (reviewMode === "auth") {
    return document.querySelector("#ops-auth-activity")?.closest(".ops-panel");
  }
  return null;
}

function applyReviewFocus() {
  const target = getReviewFocusTarget();
  if (!target) {
    return;
  }
  document.body.classList.add(`review-${reviewMode}`);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const top = Math.max(target.getBoundingClientRect().top + window.scrollY - 16, 0);
      window.scrollTo({ top, behavior: "auto" });
    });
  });
}

function getBackupState(snapshot) {
  const latestBackupAt = snapshot.backupSummary?.latestBackupAt || null;
  if (!latestBackupAt) {
    return {
      tone: "warning",
      title: "백업 없음",
      description: "아직 생성된 백업이 없습니다. 운영 데이터를 다루기 전에 최소 1회 백업을 권장합니다."
    };
  }

  const ageHours = (Date.now() - new Date(latestBackupAt).getTime()) / 3600000;
  if (ageHours >= BACKUP_WARNING_HOURS) {
    return {
      tone: "warning",
      title: "백업 갱신 필요",
      description: `${formatRelativeTime(latestBackupAt)} 마지막 백업 이후 새 백업이 없습니다. 중요한 변경 전후에는 수동 백업을 권장합니다.`
    };
  }

  return {
    tone: "good",
    title: "백업 최신 상태",
    description: `${formatRelativeTime(latestBackupAt)} 백업이 있어 현재 운영 상태를 되돌릴 수 있습니다.`
  };
}

function deriveAlerts(health, snapshot) {
  const alerts = [];
  const totalRecords = Number(snapshot.storage?.counts?.jobCases || 0)
    + Number(snapshot.storage?.counts?.fieldRecords || 0)
    + Number(snapshot.storage?.counts?.agreements || 0);
  const staleOpenCount = Number(snapshot.signals?.customerConfirmations?.staleOpenCount || 0);
  const timelineRecentCount = Number(snapshot.signals?.timeline?.recentCount24h || 0);
  const failedDeliveryCount = Number(snapshot.signals?.auth?.failedDeliveryCount24h || 0);
  const idleRiskSessionCount = Number(snapshot.signals?.auth?.idleRiskSessionCount || 0);

  if (health.status !== "ok") {
    alerts.push({
      tone: "critical",
      title: "서비스 헬스 체크 실패",
      body: `헬스 응답이 정상이 아닙니다. 현재 상태는 ${health.status}입니다.`
    });
  }

  const latestBackupAt = snapshot.backupSummary?.latestBackupAt || null;
  if (!latestBackupAt && totalRecords > 0) {
    alerts.push({
      tone: "warning",
      title: "운영 데이터가 있지만 백업이 없습니다",
      body: "작업 데이터가 있는데 최신 백업이 없습니다. 큰 변경 전에 수동 백업을 먼저 만드는 편이 안전합니다."
    });
  } else if (latestBackupAt) {
    const ageHours = (Date.now() - new Date(latestBackupAt).getTime()) / 3600000;
    if (ageHours >= BACKUP_WARNING_HOURS) {
      alerts.push({
        tone: "warning",
        title: "백업 갱신 필요",
        body: `${formatRelativeTime(latestBackupAt)} 이후 새 백업이 없습니다. 중요한 작업 전후에 다시 남기세요.`
      });
    }
  }

  if (staleOpenCount > 0) {
    alerts.push({
      tone: "warning",
      title: "지연된 고객 확인 링크가 있습니다",
      body: `${formatCount(staleOpenCount)}건의 링크가 ${STALE_CONFIRMATION_HOURS}시간 이상 열려 있습니다. 후속 연락 여부를 확인해 주세요.`
    });
  }

  if (failedDeliveryCount > 0) {
    alerts.push({
      tone: "warning",
      title: "최근 로그인 링크 전달 실패가 있습니다",
      body: `${formatCount(failedDeliveryCount)}건이 최근 24시간 안에 실패했습니다. 메일 설정과 전달 로그를 확인해 주세요.`
    });
  }

  if (idleRiskSessionCount > 0) {
    alerts.push({
      tone: "info",
      title: "조용한 세션이 남아 있습니다",
      body: `${formatCount(idleRiskSessionCount)}건의 세션이 오래 갱신되지 않았습니다. 공유 장치 사용 여부를 함께 보세요.`
    });
  }

  if (totalRecords > 0 && timelineRecentCount === 0) {
    alerts.push({
      tone: "info",
      title: "최근 24시간 타임라인이 조용합니다",
      body: `${QUIET_TIMELINE_HOURS}시간 동안 새 작업 이력이 없습니다. 실제로 조용한지, 기록 누락인지 함께 확인해 주세요.`
    });
  }

  if (!snapshot.release?.tag) {
    alerts.push({
      tone: "info",
      title: "배포 버전 메타데이터가 없습니다",
      body: "현재 노드가 어떤 릴리즈인지 표시되지 않습니다. 수동 배포 또는 메타 파일 누락 여부를 확인해 주세요."
    });
  }

  if (totalRecords === 0) {
    alerts.push({
      tone: "info",
      title: "아직 운영 데이터가 없습니다",
      body: "작업 건, 현장 기록, 합의 기록이 모두 비어 있습니다. 첫 운영 데이터를 쌓기 전 상태로 보입니다."
    });
  }

  if (snapshot.runtime?.storageEngine === "SQLITE") {
    alerts.push({
      tone: "info",
      title: "현재 저장 엔진은 SQLite입니다",
      body: "지금 운영 모드는 단일 노드 self-host에 맞춰져 있습니다. 백업과 복구 절차를 함께 관리하는 것이 중요합니다."
    });
  }

  if (snapshot.runtime?.mailProvider === "FILE") {
    alerts.push({
      tone: "info",
      title: "로그인 링크가 파일 미리보기 모드로 전달됩니다",
      body: "지금은 실제 메일함이 아니라 dev-emails 미리보기로 확인하는 상태입니다. 실운영 전환 전에는 Resend 설정이 필요합니다."
    });
  }

  if (snapshot.runtime?.mailProvider === "RESEND" && (!snapshot.runtime?.resendConfigured || !snapshot.runtime?.mailFromConfigured)) {
    alerts.push({
      tone: "warning",
      title: "실메일 설정이 아직 완성되지 않았습니다",
      body: "MAIL_PROVIDER는 RESEND지만 API 키 또는 발신 주소 설정이 빠져 있습니다. 실제 메일 로그인 smoke 전에 먼저 마쳐야 합니다."
    });
  }

  if (snapshot.runtime?.authDebugLinks) {
    alerts.push({
      tone: "warning",
      title: "디버그 로그인 링크가 아직 노출됩니다",
      body: "현재 모드는 디버그 링크 확인을 허용하고 있습니다. 실제 운영 모드로 올릴 때는 AUTH_DEBUG_LINKS=false를 유지하는 편이 좋습니다."
    });
  }

  if (!snapshot.runtime?.sentryConfigured) {
    alerts.push({
      tone: "warning",
      title: "장애 모니터링이 아직 비활성 상태입니다",
      body: "예상치 못한 5xx를 빠르게 잡으려면 SENTRY_DSN을 넣고 런타임 오류 수집을 켜 두는 편이 좋습니다."
    });
  }

  if (snapshot.runtime?.customerNotificationOperationalReadiness === "KAKAO_CONFIG_REQUIRED") {
    alerts.push({
      tone: "warning",
      title: "고객 알림 채널이 아직 수동 전달 상태입니다",
      body: "운영 기준 채널은 카카오 알림톡 우선이지만 provider 설정이 비어 있습니다. 현재는 확인 링크를 복사해 직접 보내야 합니다."
    });
  }

  if (snapshot.runtime?.customerNotificationOperationalReadiness === "SMS_FALLBACK_CONFIG_REQUIRED") {
    alerts.push({
      tone: "warning",
      title: "문자 fallback 설정이 아직 빠져 있습니다",
      body: "카카오 알림톡 우선 전략은 준비됐지만 실패 시 문자 fallback 경로가 비어 있습니다."
    });
  }

  if (!snapshot.runtime?.authEnforceTrustedOrigin) {
    alerts.push({
      tone: "warning",
      title: "신뢰 출처 검사가 비활성화되어 있습니다",
      body: "민감한 로그인/세션 쓰기 요청이 trusted-origin 강제 없이 열려 있습니다. 운영 모드에서는 AUTH_ENFORCE_TRUSTED_ORIGIN=true가 권장됩니다."
    });
  }

  return alerts.slice(0, 6);
}

function deriveVerdict(health, alerts) {
  if (health.status !== "ok") {
    return {
      tone: "critical",
      badge: "즉시 점검",
      title: "운영 상태에 즉시 확인이 필요한 항목이 있습니다.",
      copy: "헬스 체크가 정상 상태가 아니므로, 제품 흐름보다 먼저 서비스 연결 상태와 최근 변경사항부터 확인해 주세요."
    };
  }

  if (alerts.some((item) => item.tone === "warning" || item.tone === "critical")) {
    return {
      tone: "warning",
      badge: "주의 필요",
      title: "서비스는 살아 있지만, 운영자가 먼저 볼 신호가 있습니다.",
      copy: "백업, 고객 확인, 로그인 전달, 세션 상태 중 일부가 주의 상태입니다. 아래 체크 포인트를 먼저 확인해 주세요."
    };
  }

  return {
    tone: "good",
    badge: "운영 가능",
    title: "현재 노드는 안정적으로 운영 가능한 상태입니다.",
    copy: "핵심 상태, 흐름 신호, 최근 작업 이력이 모두 무리 없이 이어지고 있습니다. 중요한 변경 전후에는 백업만 유지해 주세요."
  };
}
function derivePriorityChecklist(health, snapshot, alerts) {
  const auth = snapshot.signals?.auth || {};
  const confirmation = snapshot.signals?.customerConfirmations || {};
  const primaryFocusCase = snapshot.focusCases?.[0] || null;
  const totalRecords = Number(snapshot.storage?.counts?.jobCases || 0)
    + Number(snapshot.storage?.counts?.fieldRecords || 0)
    + Number(snapshot.storage?.counts?.agreements || 0);
  const items = [];

  if (primaryFocusCase) {
    items.push(buildFocusCasePriorityItem(primaryFocusCase));
  }

  if (health.status !== "ok") {
    items.push({
      tone: "critical",
      title: "서비스 연결 상태부터 확인하세요",
      body: "헬스 체크가 정상이 아니므로, 기능 흐름보다 먼저 서버 상태와 최근 배포 변경을 점검해야 합니다."
    });
  }

  if (!snapshot.backupSummary?.latestBackupAt && totalRecords > 0) {
    items.push({
      tone: "warning",
      title: "수동 백업을 먼저 만들어 두세요",
      body: "운영 데이터는 있는데 최신 백업이 없습니다. 큰 수정 전에 백업부터 남기는 편이 안전합니다."
    });
  }

  if (Number(confirmation.staleOpenCount || 0) > 0) {
    items.push({
      tone: "warning",
      title: "열린 확인 링크부터 보세요",
      body: `${formatCount(confirmation.staleOpenCount)}건이 오래 열려 있습니다. 후속 연락 여부부터 확인하면 흐름이 빨라집니다.`
    });
  }

  if (Number(auth.failedDeliveryCount24h || 0) > 0) {
    items.push({
      tone: "warning",
      title: "로그인 링크 전달 실패를 먼저 확인하세요",
      body: `최근 24시간 동안 ${formatCount(auth.failedDeliveryCount24h)}건 실패했습니다. 메일 설정과 전달 로그를 확인해야 합니다.`
    });
  }

  if (Number(auth.idleRiskSessionCount || 0) > 0) {
    items.push({
      tone: "neutral",
      title: "오래된 세션을 점검해 주세요",
      body: `최근 활동이 없는 세션 ${formatCount(auth.idleRiskSessionCount)}건이 남아 있습니다. 공유 장치 사용 여부를 함께 보세요.`
    });
  }

  if (snapshot.runtime?.mailProvider === "FILE") {
    items.push({
      tone: "neutral",
      title: "아직 실메일 전환 전입니다",
      body: "현재 로그인 링크는 파일 미리보기 기준입니다. 실제 메일 전환 시점을 팀 안에서 먼저 맞춰 두는 편이 좋습니다."
    });
  }

  if (snapshot.runtime?.authDebugLinks) {
    items.push({
      tone: "warning",
      title: "디버그 로그인 링크를 먼저 꺼 주세요",
      body: "AUTH_DEBUG_LINKS가 아직 켜져 있습니다. 실제 운영 전환 직전에는 false로 고정하는 편이 안전합니다."
    });
  }

  if (!snapshot.runtime?.authEnforceTrustedOrigin) {
    items.push({
      tone: "warning",
      title: "신뢰 출처 강제를 먼저 켜 주세요",
      body: "로그인/세션 쓰기 요청은 동일 출처 브라우저에서만 허용되도록 운영 기본값을 맞추는 편이 좋습니다."
    });
  }

  if (!snapshot.release?.tag) {
    items.push({
      tone: "neutral",
      title: "현재 릴리즈 버전을 남겨 두세요",
      body: "운영 이슈를 추적하려면 지금 실행 중인 버전 식별자가 먼저 보여야 합니다."
    });
  }

  if (!items.length) {
    items.push({
      tone: "good",
      title: "즉시 처리할 경고는 없습니다",
      body: "현재는 백업 주기와 최근 흐름만 짧게 점검하면 충분한 상태입니다."
    });
  }

  return items.slice(0, 3);
}

function renderPriorityChecklist(health, snapshot, alerts) {
  if (!elements.priorityList) {
    return;
  }

  const items = derivePriorityChecklist(health, snapshot, alerts);
  elements.prioritySummary.textContent = items[0]?.tone === "good"
    ? "루틴 점검만 유지하면 됩니다"
    : `먼저 볼 항목 ${formatCount(items.length)}개`;

  elements.priorityList.innerHTML = items.map((item, index) => `
    <article class="ops-priority-item tone-${escapeHtml(item.tone)} ${index === 0 ? "is-primary" : ""}">
      <div class="ops-priority-topline">
        <span class="ops-badge tone-${escapeHtml(item.tone)}">${index === 0 ? "먼저" : `다음 ${index}`}</span>
      </div>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.body)}</p>
    </article>
  `).join("");
}

function deriveHandoffItems(snapshot) {
  const items = [];
  const primaryFocusCase = snapshot.focusCases?.[0] || null;
  const secondaryFocusCases = (snapshot.focusCases || []).slice(1);
  const timeline = snapshot.activity?.recentTimelineEvents || [];
  const auth = snapshot.signals?.auth || {};

  if (primaryFocusCase) {
    items.push(buildFocusCaseHandoffItem(primaryFocusCase));
  }

  for (const candidate of secondaryFocusCases) {
    if (items.length >= 2) {
      break;
    }
    items.push(buildFocusCaseHandoffItem(candidate));
  }

  const latestTimelineCase = timeline.find((item) => item.jobCaseId && (!primaryFocusCase || item.jobCaseId !== primaryFocusCase.jobCaseId));
  if (latestTimelineCase?.jobCaseId) {
    items.push({
      tone: "good",
      badge: "최근 흐름",
      title: `최근 움직인 작업 ${latestTimelineCase.jobCaseId}을 이어서 볼 수 있습니다`,
      body: `${formatTimelineEventType(latestTimelineCase.eventType)} 이후 바로 작업 화면으로 넘어가면 현재 단계와 다음 액션을 더 빨리 확인할 수 있습니다.`,
      whyNow: "최근 흐름이 막 생긴 상태라, 지금 이어서 보면 가장 빠르게 맥락을 따라갈 수 있습니다.",
      meta: `${formatRelativeTime(latestTimelineCase.createdAt)} · ${latestTimelineCase.summary || "최근 타임라인 이벤트"}`,
      actions: [
        buildHandoffAction("이 작업 건 열기", buildAppCaseHref(latestTimelineCase.jobCaseId, "timeline-followup", "timeline-card"), "primary")
      ]
    });
  }

  if (Number(auth.failedDeliveryCount24h || 0) > 0 || Number(auth.idleRiskSessionCount || 0) > 0) {
    items.push({
      tone: "warning",
      badge: "세션 점검",
      title: "마이페이지에서 로그인/세션부터 확인하세요",
      body: "로그인 전달 실패나 오래된 세션은 계정 화면에서 더 빠르게 정리할 수 있습니다.",
      whyNow: "계정 전달이나 세션이 흔들리면 작업 흐름보다 먼저 로그인 신뢰 상태를 확인하는 편이 안전합니다.",
      meta: `전달 실패 ${formatCount(auth.failedDeliveryCount24h)}건 · 오래된 세션 ${formatCount(auth.idleRiskSessionCount)}건`,
      actions: [
        buildHandoffAction("마이페이지 열기", "/account", "primary")
      ]
    });
  }

  if (!items.length) {
    items.push({
      tone: "good",
      badge: "바로 이동",
      title: "즉시 점검할 경로는 작업 화면입니다",
      body: "지금 특별히 막힌 운영 이슈가 없다면 작업 화면에서 현장 기록과 합의 흐름을 이어서 확인하는 편이 가장 좋습니다.",
      whyNow: "막힌 경고가 없으니 가장 큰 가치가 있는 화면은 작업 워크스페이스입니다.",
      meta: "운영 신호는 안정적입니다.",
      actions: [
        buildHandoffAction("작업 화면 열기", "/app/capture", "primary"),
        buildHandoffAction("운영 홈 보기", "/home")
      ]
    });
  }

  return items.slice(0, 3);
}

function renderHandoffItems(snapshot) {
  if (!elements.handoffList) {
    return;
  }

  const items = deriveHandoffItems(snapshot);
  const focusItem = items[0] || null;
  const secondaryItems = items.slice(1);
  elements.handoffSummary.textContent = items.length > 1
    ? `추천 경로 ${formatCount(items.length)}개`
    : "추천 경로 1개";
  elements.handoffCopy.textContent = items.length > 1
    ? "가장 먼저 볼 대상을 위에 따로 올렸습니다. 그 아래 경로는 보조 선택지로 이어집니다."
    : "지금 가장 먼저 열어볼 경로를 위에 한 장으로 좁혔습니다.";

  if (elements.handoffFocus) {
    if (focusItem) {
      elements.handoffFocus.classList.remove("hidden");
      elements.handoffFocus.innerHTML = `
        <article class="ops-handoff-focus-card tone-${escapeHtml(focusItem.tone)}">
          <div class="ops-handoff-focus-topline">
            <span class="ops-badge tone-${escapeHtml(focusItem.tone)}">가장 먼저</span>
            <span class="ops-handoff-meta">${escapeHtml(focusItem.meta)}</span>
          </div>
          <strong>${escapeHtml(focusItem.title)}</strong>
          <p class="ops-handoff-why">${escapeHtml(focusItem.whyNow || focusItem.body)}</p>
          <p>${escapeHtml(focusItem.body)}</p>
          <div class="ops-handoff-plan">
            <span class="ops-handoff-plan-pill">${escapeHtml(focusItem.plan.urgency)}</span>
            <span class="ops-handoff-plan-pill">먼저 ${escapeHtml(focusItem.plan.first)}</span>
            <span class="ops-handoff-plan-pill">완료 기준 ${escapeHtml(focusItem.plan.doneWhen)}</span>
          </div>
          <div class="ops-handoff-actions">${focusItem.actions.join("")}</div>
        </article>
      `;
    } else {
      elements.handoffFocus.classList.add("hidden");
      elements.handoffFocus.innerHTML = "";
    }
  }

  elements.handoffList.innerHTML = secondaryItems.length
    ? secondaryItems.map((item, index) => `
    <article class="ops-handoff-item tone-${escapeHtml(item.tone)} ${index === 0 ? "is-primary" : ""}">
      <div class="ops-handoff-topline">
        <span class="ops-badge tone-${escapeHtml(item.tone)}">${escapeHtml(item.badge)}</span>
        <span class="ops-handoff-meta">${escapeHtml(item.meta)}</span>
      </div>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.body)}</p>
      ${item.plan ? `
      <div class="ops-handoff-plan">
        <span class="ops-handoff-plan-pill">${escapeHtml(item.plan.urgency)}</span>
        <span class="ops-handoff-plan-pill">먼저 ${escapeHtml(item.plan.first)}</span>
        <span class="ops-handoff-plan-pill">완료 기준 ${escapeHtml(item.plan.doneWhen)}</span>
      </div>` : ""}
      <div class="ops-handoff-actions">${item.actions.join("")}</div>
    </article>
  `).join("")
    : '<div class="empty-state">추가 추천 경로는 없습니다. 위 카드부터 확인하면 됩니다.</div>';
}

function renderVerdict(health, snapshot, alerts) {
  const verdict = deriveVerdict(health, alerts);
  elements.verdictBadge.textContent = verdict.badge;
  elements.verdictBadge.className = `ops-badge tone-${verdict.tone}`;
  elements.verdictTitle.textContent = verdict.title;
  elements.verdictCopy.textContent = verdict.copy;
  elements.generatedAt.textContent = snapshot.generatedAt
    ? `최근 스냅샷 ${formatDateTime(snapshot.generatedAt)}`
    : `health 응답 ${formatDateTime(health.timestamp)}`;
}

function renderSummaryCards(health, snapshot) {
  const backupState = getBackupState(snapshot);
  const releaseTag = snapshot.release?.tag || "릴리즈 정보 없음";
  const releasePublishedAt = snapshot.release?.publishedAt || null;

  elements.healthStatus.textContent = health.status === "ok" ? "정상" : health.status;
  elements.healthMeta.textContent = `${health.service} · ${formatDateTime(health.timestamp)}`;

  elements.backupStatus.textContent = backupState.title;
  elements.backupMeta.textContent = backupState.description;

  elements.releaseStatus.textContent = releaseTag;
  elements.releaseMeta.textContent = releasePublishedAt
    ? `${formatDateTime(releasePublishedAt)} 배포`
    : "현재 배포 버전 메타데이터가 없습니다.";

  elements.storageEngine.textContent = snapshot.storage?.storageEngine || "unknown";
  elements.storageMeta.textContent = `작업 ${formatCount(snapshot.storage?.counts?.jobCases)}건 · 현장 ${formatCount(snapshot.storage?.counts?.fieldRecords)}건 · 합의 ${formatCount(snapshot.storage?.counts?.agreements)}건`;
}

function renderSignalCards(snapshot) {
  const agreement = snapshot.signals?.agreements || {};
  const confirmation = snapshot.signals?.customerConfirmations || {};
  const timeline = snapshot.signals?.timeline || {};
  const auth = snapshot.signals?.auth || {};

  elements.agreementSignalStatus.textContent = agreement.latestStatus
    ? `${formatConfirmationStatus(agreement.latestStatus)} 중심`
    : "합의 흐름 없음";
  elements.agreementSignalMeta.textContent = agreement.totalCount
    ? `최근 7일 ${formatCount(agreement.recentCount7d)}건 · 마지막 합의 ${formatDateTime(agreement.latestConfirmedAt)} · 상태 분포 ${formatTopMix(agreement.topStatuses, formatConfirmationStatus)}`
    : "아직 합의 기록이 없습니다. 실제 운영이 시작되면 이 카드가 최근 합의 흐름을 요약합니다.";

  elements.confirmationSignalStatus.textContent = confirmation.openCount > 0
    ? `열린 링크 ${formatCount(confirmation.openCount)}건`
    : confirmation.totalCount > 0
      ? "확인 흐름 안정"
      : "확인 링크 없음";
  elements.confirmationSignalMeta.textContent = confirmation.totalCount
    ? `최근 7일 확인 완료 ${formatCount(confirmation.recentConfirmedCount7d)}건 · 지연 링크 ${formatCount(confirmation.staleOpenCount)}건 · 마지막 상태 ${confirmation.latestStatus ? formatConfirmationStatus(confirmation.latestStatus) : '-'} / ${formatRelativeTime(confirmation.latestUpdatedAt)}`
    : "고객 확인 링크를 발급하면 여기서 열린 링크와 최근 확인 흐름을 함께 볼 수 있습니다.";

  elements.timelineSignalStatus.textContent = timeline.latestEventType
    ? formatTimelineEventType(timeline.latestEventType)
    : "최근 이력 없음";
  elements.timelineSignalMeta.textContent = timeline.totalCount
    ? `최근 24시간 ${formatCount(timeline.recentCount24h)}건 · 마지막 활동 ${formatRelativeTime(timeline.latestEventAt)} · 이벤트 분포 ${formatTopMix(timeline.topEventTypes, formatTimelineEventType)}`
    : "아직 기록된 타임라인이 없습니다. 작업 건이 움직이면 최근 이벤트와 패턴을 보여줍니다.";

  const latestDelivery = auth.latestDeliveryStatus || "기록 없음";
  const authReadiness = formatAuthOperationalReadiness(snapshot.runtime?.authOperationalReadiness);
  const authMode = formatAuthDeliveryMode(snapshot.runtime?.authDeliveryMode);
  elements.authSignalStatus.textContent = authReadiness;
  elements.authSignalMeta.textContent = auth.challengeTotalCount
    ? `전달 모드 ${authMode} · 디버그 링크 ${formatEnabledState(snapshot.runtime?.authDebugLinks, ["ON", "OFF"])} · 출처 검사 ${formatEnabledState(snapshot.runtime?.authEnforceTrustedOrigin, ["ON", "OFF"])} · 최근 전달 ${latestDelivery} / 세션 ${formatCount(auth.activeSessionCount)}건`
    : `전달 모드 ${authMode} · 디버그 링크 ${formatEnabledState(snapshot.runtime?.authDebugLinks, ["ON", "OFF"])} · 출처 검사 ${formatEnabledState(snapshot.runtime?.authEnforceTrustedOrigin, ["ON", "OFF"])} · 아직 로그인 요청 기록은 없습니다.`;
}


function renderAlerts(alerts) {
  elements.alertSummary.textContent = alerts.length === 0 ? "즉시 볼 경고 없음" : `${alerts.length}개 체크 포인트`;

  if (!alerts.length) {
    elements.alerts.innerHTML = '<div class="ops-alert-card tone-good"><strong>지금 바로 조치할 경고가 없습니다.</strong><p>핵심 운영 신호가 안정적인 상태입니다. 루틴 점검과 백업 주기만 유지해 주세요.</p></div>';
    return;
  }

  elements.alerts.innerHTML = alerts.map((item) => `
    <article class="ops-alert-card tone-${escapeHtml(item.tone)}">
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.body)}</p>
    </article>
  `).join("");
}

function renderSnapshotDetails(snapshot) {
  const releaseLabel = snapshot.release?.tag
    ? snapshot.release.publishedAt
      ? `${snapshot.release.tag} / ${formatDateTime(snapshot.release.publishedAt)}`
      : snapshot.release.tag
    : "릴리즈 정보 없음";
  const auth = snapshot.signals?.auth || {};

  elements.snapshotList.innerHTML = [
    ["App Base URL", snapshot.runtime?.appBaseUrl || "-"],
    ["Object Storage", snapshot.runtime?.objectStorageProvider || "-"],
    ["로그인 전달 모드", formatAuthDeliveryMode(snapshot.runtime?.authDeliveryMode)],
    ["메일 발신 주소", snapshot.runtime?.mailFromConfigured ? "설정됨" : "미설정"],
    ["Resend API", snapshot.runtime?.resendConfigured ? "설정됨" : "미설정"],
    ["Sentry", snapshot.runtime?.sentryConfigured ? "설정됨" : "미설정"],
    ["고객 알림 기본 채널", formatCustomerNotificationChannel(snapshot.runtime?.customerNotificationPrimary)],
    ["고객 알림 보조 채널", snapshot.runtime?.customerNotificationFallback ? formatCustomerNotificationChannel(snapshot.runtime?.customerNotificationFallback) : "없음"],
    ["카카오 BizMessage", snapshot.runtime?.kakaoConfigured ? snapshot.runtime?.kakaoBizMessageProvider || "설정됨" : "미설정"],
    ["SMS Provider", snapshot.runtime?.smsConfigured ? snapshot.runtime?.smsProvider || "설정됨" : "미설정"],
    ["고객 알림 준비도", formatCustomerNotificationReadiness(snapshot.runtime?.customerNotificationOperationalReadiness)],
    ["디버그 로그인 링크", formatEnabledState(snapshot.runtime?.authDebugLinks)],
    ["신뢰 출처 검사", formatEnabledState(snapshot.runtime?.authEnforceTrustedOrigin)],
    ["추가 허용 출처", snapshot.runtime?.trustedOriginCount ? `${formatCount(snapshot.runtime?.trustedOriginCount)}개` : "없음"],
    ["작업 건 수", formatCount(snapshot.storage?.counts?.jobCases)],
    ["현장 기록 수", formatCount(snapshot.storage?.counts?.fieldRecords)],
    ["합의 기록 수", formatCount(snapshot.storage?.counts?.agreements)],
    ["활성 세션 수", formatCount(auth.activeSessionCount)],
    ["최근 로그인 전달", auth.latestDeliveryStatus || "기록 없음"],
    ["배포 버전", releaseLabel]
  ].map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
}


function renderActivity(snapshot) {
  const items = snapshot.activity?.recentAuditLogs || [];
  if (!items.length) {
    elements.activity.innerHTML = '<div class="empty-state">표시할 최근 운영 활동이 없습니다. 백업 생성이나 운영성 액션이 생기면 여기에 보입니다.</div>';
    return;
  }

  elements.activity.innerHTML = items.map((item) => {
    const metaParts = [formatResource(item.resourceType)];
    if (item.resourceId) {
      metaParts.push(item.resourceId);
    }
    metaParts.push(formatDateTime(item.createdAt));
    return `
      <article class="ops-activity-item">
        <div class="ops-activity-topline">
          <strong>${escapeHtml(formatAction(item.action))}</strong>
          <span>${escapeHtml(formatRelativeTime(item.createdAt))}</span>
        </div>
        <p>${escapeHtml(metaParts.join(" / "))}</p>
      </article>
    `;
  }).join("");
}

function renderConfirmationFeed(snapshot) {
  const items = snapshot.activity?.recentCustomerConfirmations || [];
  if (!items.length) {
    elements.confirmations.innerHTML = '<div class="empty-state">표시할 고객 확인 흐름이 없습니다.</div>';
    return;
  }

  elements.confirmations.innerHTML = items.map((item) => {
    const meta = [
      item.jobCaseId ? `작업 ${item.jobCaseId}` : "작업 건 미연결",
      `만료 ${formatDateTime(item.expiresAt)}`,
      `최근 업데이트 ${formatRelativeTime(item.updatedAt)}`
    ];
    if (item.confirmedAt) {
      meta.push(`확인 완료 ${formatDateTime(item.confirmedAt)}`);
    }
    return `
      <article class="ops-feed-item">
        <div class="ops-feed-topline">
          <strong>${escapeHtml(formatConfirmationStatus(item.status))}</strong>
          <span>${escapeHtml(formatRelativeTime(item.updatedAt))}</span>
        </div>
        <p>${escapeHtml(meta.join(" / "))}</p>
      </article>
    `;
  }).join("");
}

function renderTimelineFeed(snapshot) {
  const items = snapshot.activity?.recentTimelineEvents || [];
  if (!items.length) {
    elements.timelineEvents.innerHTML = '<div class="empty-state">표시할 최근 작업 이력이 없습니다.</div>';
    return;
  }

  elements.timelineEvents.innerHTML = items.map((item) => {
    const meta = [
      item.jobCaseId ? `작업 ${item.jobCaseId}` : "작업 건 미연결",
      formatDateTime(item.createdAt)
    ];
    return `
      <article class="ops-feed-item">
        <div class="ops-feed-topline">
          <strong>${escapeHtml(formatTimelineEventType(item.eventType))}</strong>
          <span>${escapeHtml(formatRelativeTime(item.createdAt))}</span>
        </div>
        <p>${escapeHtml([item.summary, ...meta].join(" / "))}</p>
      </article>
    `;
  }).join("");
}

function renderAuthFeed(snapshot) {
  const items = snapshot.activity?.recentAuthChallenges || [];
  if (!items.length) {
    elements.authActivity.innerHTML = '<div class="empty-state">표시할 최근 로그인 요청이 없습니다.</div>';
    return;
  }

  elements.authActivity.innerHTML = items.map((item) => {
    const meta = [
      item.emailMasked,
      item.deliveryProvider || "전달 방식 없음",
      item.expiresAt ? `만료 ${formatDateTime(item.expiresAt)}` : "만료 정보 없음"
    ];
    return `
      <article class="ops-feed-item">
        <div class="ops-feed-topline">
          <strong>${escapeHtml(item.deliveryStatus || item.status || "상태 없음")}</strong>
          <span>${escapeHtml(formatRelativeTime(item.createdAt))}</span>
        </div>
        <p>${escapeHtml(meta.join(" / "))}</p>
      </article>
    `;
  }).join("");
}

function renderDataExplorer(explorer) {
  const datasets = explorer.datasets || [];
  const selected = explorer.selected || null;

  elements.explorerGeneratedAt.textContent = explorer.generatedAt
    ? `생성 시각 ${formatDateTime(explorer.generatedAt)}`
    : "생성 시각 없음";

  if (!selected) {
    elements.explorerDescription.textContent = "표시할 운영 데이터셋이 없습니다.";
    elements.explorerSelectedLabel.textContent = "선택된 데이터 없음";
    elements.explorerSelectedCount.textContent = "0행";
    elements.explorerDatasets.innerHTML = '<div class="empty-state">사용 가능한 데이터셋이 없습니다.</div>';
    elements.explorerTable.innerHTML = '<div class="empty-state">표시할 행이 없습니다.</div>';
    return;
  }

  elements.explorerDescription.textContent = getDatasetDescription(selected.key, selected.description);
  elements.explorerSelectedLabel.textContent = getDatasetLabel(selected.key, selected.label);
  elements.explorerSelectedCount.textContent = `${formatCount(selected.count)}행`;

  elements.explorerDatasets.innerHTML = datasets.map((item) => {
    const latestLabel = item.latestAt ? ` · ${formatRelativeTime(item.latestAt)}` : "";
    return `
      <button type="button" class="ops-dataset-chip ${item.key === selected.key ? "is-active" : ""}" data-dataset-key="${escapeHtml(item.key)}">
        <strong>${escapeHtml(getDatasetLabel(item.key, item.label))}</strong>
        <span>${escapeHtml(`${formatCount(item.count)}행${latestLabel}`)}</span>
      </button>
    `;
  }).join("");

  if (!selected.rows?.length) {
    elements.explorerTable.innerHTML = '<div class="empty-state">이 데이터셋에는 아직 행이 없습니다.</div>';
    return;
  }

  const header = selected.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("");
  const body = selected.rows.map((row) => `
    <tr>${selected.columns.map((column) => `<td>${escapeHtml(row[column] ?? "-")}</td>`).join("")}</tr>
  `).join("");

  elements.explorerTable.innerHTML = `
    <table class="ops-data-table">
      <thead><tr>${header}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function renderBackups(snapshot) {
  if (!snapshot.backups?.length) {
    elements.backups.innerHTML = '<div class="empty-state">아직 생성된 백업이 없습니다.</div>';
    return;
  }

  elements.backups.innerHTML = snapshot.backups.map((item, index) => `
    <article class="ops-backup-item ${index === 0 ? "is-latest" : ""}">
      <div class="ops-backup-topline">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="ops-badge tone-${index === 0 ? "good" : "neutral"}">${index === 0 ? "최신" : "보관"}</span>
      </div>
      <p>${escapeHtml(`${item.type} / ${formatBytes(item.sizeBytes)} / ${formatDateTime(item.updatedAt)}`)}</p>
      <span>${escapeHtml(item.relativePath)}</span>
    </article>
  `).join("");
}

function renderSnapshot(health, snapshot) {
  const alerts = deriveAlerts(health, snapshot);
  renderVerdict(health, snapshot, alerts);
  renderPriorityChecklist(health, snapshot, alerts);
  renderHandoffItems(snapshot);
  renderSummaryCards(health, snapshot);
  renderSignalCards(snapshot);
  renderAlerts(alerts);
  renderSnapshotDetails(snapshot);
  renderConfirmationFeed(snapshot);
  renderTimelineFeed(snapshot);
  renderAuthFeed(snapshot);
  renderActivity(snapshot);
  renderBackups(snapshot);
  applyReviewFocus();
}

async function loadExplorer(datasetKey = currentExplorerDataset) {
  const explorer = await request(`/api/v1/admin/data-explorer?dataset=${encodeURIComponent(datasetKey)}&limit=8`);
  currentExplorerDataset = explorer.selected?.key || datasetKey;
  renderDataExplorer(explorer);
  return explorer;
}

async function loadOps() {
  const [health, snapshot, explorer] = await Promise.all([
    request("/api/v1/health"),
    request("/api/v1/admin/ops-snapshot"),
    request(`/api/v1/admin/data-explorer?dataset=${encodeURIComponent(currentExplorerDataset)}&limit=8`)
  ]);
  currentExplorerDataset = explorer.selected?.key || currentExplorerDataset;
  renderSnapshot(health, snapshot);
  renderDataExplorer(explorer);
}

elements.refresh.addEventListener("click", async () => {
  setBusy(elements.refresh, true, "새로고침 중...");
  try {
    await loadOps();
    showFeedback("운영 스냅샷을 다시 불러왔습니다.", "success");
  } catch (error) {
    showFeedback(error.message, "error");
  } finally {
    setBusy(elements.refresh, false, "새로고침");
  }
});

elements.backupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(elements.backupSubmit, true, "백업 중...");
  try {
    const payload = await request("/api/v1/admin/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: elements.backupLabel.value || "ops-manual" })
    });
    showFeedback(`백업을 생성했습니다. ${payload.fileName}`, "success");
    elements.backupLabel.value = "";
    await loadOps();
  } catch (error) {
    showFeedback(error.message, "error");
  } finally {
    setBusy(elements.backupSubmit, false, "백업 만들기");
  }
});

elements.explorerDatasets.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-dataset-key]");
  if (!button) {
    return;
  }

  const datasetKey = button.dataset.datasetKey;
  if (!datasetKey || datasetKey === currentExplorerDataset) {
    return;
  }

  try {
    await loadExplorer(datasetKey);
    showFeedback(`${button.textContent.trim()} 데이터셋을 불러왔습니다.`, "success");
  } catch (error) {
    showFeedback(error.message, "error");
  }
});

loadOps().catch((error) => {
  showFeedback(error.message, "error");
});





