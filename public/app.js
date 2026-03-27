const CSRF_COOKIE_NAME = "faa_csrf";
const searchParams = new URLSearchParams(window.location.search);
const pathname = window.location.pathname;
const reviewMode = searchParams.get("review");
const requestedCaseId = searchParams.get("caseId");
const navigationSource = searchParams.get("source");
const opsFocusReason = searchParams.get("reason");
const opsFocusTarget = searchParams.get("target");

function resolveWorkflowScreen(path) {
  switch (path) {
    case "/app/capture":
      return "capture";
    case "/app/quote":
      return "quote";
    case "/app/draft":
      return "draft";
    case "/app/confirm":
      return "confirm";
    default:
      return "overview";
  }
}

const workflowScreen = resolveWorkflowScreen(pathname);

function getWorkflowScreenTargetId() {
  switch (workflowScreen) {
    case "quote":
      return "quote-card";
    case "draft":
      return "draft-card";
    case "confirm":
      return "customer-confirm-card";
    default:
      return "";
  }
}

const workflowScreenConfig = {
  overview: {
    label: "전체 보기",
    path: "/app",
    heroEyebrow: "DAMIT WORKSPACE",
    heroTitle: "다밋 운영 워크스페이스",
    heroCopy: "현장 기록, 작업 건 연결, 변경 견적, 설명 초안, 고객 확인, 합의 기록을 한 화면에서 이어서 관리합니다. 기록이 먼저 남고 설명이 따라오도록 구성해, 현장 이후 후속 커뮤니케이션을 빠르게 마무리할 수 있습니다.",
    noteTitle: "전체 작업 화면",
    noteCopy: "기존 전체 워크스페이스입니다. 단계별 화면이 필요하면 위 경로에서 각 단계를 따로 열 수 있습니다."
  },
  capture: {
    label: "현장 기록",
    path: "/app/capture",
    heroEyebrow: "DAMIT CAPTURE",
    heroTitle: "현장 기록과 작업 건 연결",
    heroCopy: "현장 사진, 사유, 메모를 먼저 남기고 새 작업 건을 만들거나 기존 작업 건에 연결하는 intake 전용 화면입니다. 모바일과 현장 사용 기준으로 가장 먼저 열리도록 구성합니다.",
    noteTitle: "현장 기록 단계",
    noteCopy: "이 화면에서는 현장 기록과 작업 건 연결에만 집중합니다. 기록이 저장되고 연결되면 다음 단계로 넘어가면 됩니다."
  },
  quote: {
    label: "변경 견적",
    path: "/app/quote",
    heroEyebrow: "DAMIT QUOTE",
    heroTitle: "변경 견적과 범위 정리",
    heroCopy: "선택한 작업 건의 변경 금액과 추가 범위를 정리하는 단계 화면입니다. 금액이 먼저 정리되어야 설명 초안과 합의 흐름이 흔들리지 않습니다.",
    noteTitle: "변경 견적 단계",
    noteCopy: "이 화면에서는 금액과 범위를 먼저 분명히 합니다. 견적이 저장되면 다음은 고객 설명 준비입니다."
  },
  draft: {
    label: "설명 초안",
    path: "/app/draft",
    heroEyebrow: "DAMIT DRAFT",
    heroTitle: "고객 설명 초안 준비",
    heroCopy: "정리된 견적을 바탕으로 고객에게 보낼 설명 문장을 준비하는 단계 화면입니다. 실제 전달 가능한 문장을 빠르게 만드는 데 집중합니다.",
    noteTitle: "설명 초안 단계",
    noteCopy: "이 화면에서는 고객에게 바로 보낼 수 있는 초안을 준비합니다. 초안이 있으면 확인과 합의 단계로 이어가기 쉬워집니다."
  },
  confirm: {
    label: "확인과 합의",
    path: "/app/confirm",
    heroEyebrow: "DAMIT CONFIRM",
    heroTitle: "고객 확인과 합의 기록",
    heroCopy: "고객 확인 링크, 합의 상태, 확인 채널, 최종 금액을 정리하는 마무리 단계 화면입니다. 마지막 상태를 기록으로 남기는 데 집중합니다.",
    noteTitle: "확인과 합의 단계",
    noteCopy: "이 화면에서는 고객 확인과 합의 기록을 최신 상태로 남깁니다. 완료 후에는 기록 다시 보기와 내부 공유용으로 활용하면 됩니다."
  }
};

if (reviewMode) {
  document.body.classList.add(`review-${reviewMode}`);
}

document.body.classList.add(`workflow-screen-${workflowScreen}`);

const statusLabels = {
  ALL: "전체",
  UNEXPLAINED: "미설명",
  EXPLAINED: "설명 완료",
  AGREED: "합의 완료",
  ON_HOLD: "보류",
  EXCLUDED: "작업 제외"
};

const reasonLabels = {
  CONTAMINATION: "오염 심화",
  REMOVAL_TASK: "철거 또는 제거 작업",
  SPACE_ADDED: "추가 공간 포함",
  LAYOUT_DIFFERENCE: "구조 또는 범위 차이",
  WASTE_OR_BELONGINGS: "폐기물 또는 짐 정리",
  NICOTINE: "니코틴 오염",
  MOLD: "곰팡이 오염",
  STICKER_REMOVAL: "스티커/시트지 제거",
  WASTE_DISPOSAL: "폐기물 처리",
  VERANDA_ADDED: "베란다 추가",
  UTILITY_ROOM_ADDED: "다용도실 추가",
  STORAGE_ADDED: "창고 추가",
  LAYOUT_MISMATCH: "구조 불일치",
  OTHER: "기타"
};

const timelineLabels = {
  FIELD_RECORD_CREATED: "현장 기록이 저장되었습니다",
  FIELD_RECORD_LINKED: "현장 기록이 작업 건에 연결되었습니다",
  JOB_CASE_CREATED: "작업 건이 생성되었습니다",
  QUOTE_UPDATED: "변경 견적이 저장되었습니다",
  DRAFT_MESSAGE_CREATED: "설명 초안이 생성되었습니다",
  AGREEMENT_RECORDED: "합의 기록이 저장되었습니다",
  CUSTOMER_CONFIRMATION_ISSUED: "고객 확인 링크가 발급되었습니다",
  CUSTOMER_CONFIRMATION_VIEWED: "고객이 확인 링크를 열었습니다",
  CUSTOMER_CONFIRMATION_CONFIRMED: "고객 확인이 완료되었습니다"
};

const workflowSteps = [
  { key: "capture", label: "현장 기록" },
  { key: "link", label: "작업 건 연결" },
  { key: "quote", label: "변경 견적 정리" },
  { key: "draft", label: "고객 설명 준비" },
  { key: "confirm", label: "합의와 확인 기록" }
];

function buildWorkflowRouteHref(screenKey, jobCaseId = state?.selectedJobCaseId) {
  const config = workflowScreenConfig[screenKey] || workflowScreenConfig.overview;
  const params = new URLSearchParams(window.location.search);
  if (jobCaseId) {
    params.set("caseId", jobCaseId);
  } else {
    params.delete("caseId");
  }
  const query = params.toString();
  return query ? `${config.path}?${query}` : config.path;
}

function syncUrlState() {
  const params = new URLSearchParams(window.location.search);
  if (state.selectedJobCaseId) {
    params.set("caseId", state.selectedJobCaseId);
  } else {
    params.delete("caseId");
  }
  const next = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
  window.history.replaceState({}, "", next);
}

function syncWorkflowRouteLinks() {
  const links = [
    ["overview", elements.workflowRouteOverview],
    ["capture", elements.workflowRouteCapture],
    ["quote", elements.workflowRouteQuote],
    ["draft", elements.workflowRouteDraft],
    ["confirm", elements.workflowRouteConfirm]
  ];

  links.forEach(([screenKey, node]) => {
    if (!node) {
      return;
    }
    node.href = buildWorkflowRouteHref(screenKey);
    node.classList.toggle("is-active", workflowScreen === screenKey);
  });
}

function applyWorkflowScreenPresentation() {
  const config = workflowScreenConfig[workflowScreen] || workflowScreenConfig.overview;
  if (elements.heroEyebrow) {
    elements.heroEyebrow.textContent = config.heroEyebrow;
  }
  if (elements.heroTitle) {
    elements.heroTitle.textContent = config.heroTitle;
  }
  if (elements.heroCopy) {
    elements.heroCopy.textContent = config.heroCopy;
  }
  if (elements.screenNoteTitle) {
    elements.screenNoteTitle.textContent = config.noteTitle;
  }
  if (elements.screenNoteCopy) {
    elements.screenNoteCopy.textContent = config.noteCopy;
  }
  syncWorkflowRouteLinks();
}

const elements = {
  heroEyebrow: document.querySelector("#app-hero-eyebrow"),
  heroTitle: document.querySelector("#app-hero-title"),
  heroCopy: document.querySelector("#app-hero-copy"),
  screenNoteTitle: document.querySelector("#app-screen-note-title"),
  screenNoteCopy: document.querySelector("#app-screen-note-copy"),
  workflowRouteOverview: document.querySelector("#workflow-route-overview"),
  workflowRouteCapture: document.querySelector("#workflow-route-capture"),
  workflowRouteQuote: document.querySelector("#workflow-route-quote"),
  workflowRouteDraft: document.querySelector("#workflow-route-draft"),
  workflowRouteConfirm: document.querySelector("#workflow-route-confirm"),
  runtimeBadge: document.querySelector("#runtime-badge"),
  authBadge: document.querySelector("#auth-badge"),
  countsBadge: document.querySelector("#counts-badge"),
  workspaceTip: document.querySelector("#workspace-tip"),
  workspaceNextStep: document.querySelector("#workspace-next-step"),
  workspaceNextStepCopy: document.querySelector("#workspace-next-step-copy"),
  workspaceStateSummary: document.querySelector("#workspace-state-summary"),
  workspaceStateCopy: document.querySelector("#workspace-state-copy"),
  workspaceSelectionSummary: document.querySelector("#workspace-selection-summary"),
  workspaceSelectionCopy: document.querySelector("#workspace-selection-copy"),
  workspacePriorityList: document.querySelector("#workspace-priority-list"),
  workflowChips: Array.from(document.querySelectorAll(".workflow-banner .flow-chip")),
  fieldRecordForm: document.querySelector("#field-record-form"),
  saveFieldRecord: document.querySelector("#save-field-record"),
  fieldRecordFeedback: document.querySelector("#field-record-feedback"),
  resetFieldRecord: document.querySelector("#reset-field-record"),
  currentFieldRecordLabel: document.querySelector("#current-field-record-label"),
  nextActionHint: document.querySelector("#next-action-hint"),
  progressTitle: document.querySelector("#progress-title"),
  progressCopy: document.querySelector("#progress-copy"),
  jobCaseForm: document.querySelector("#job-case-form"),
  createJobCase: document.querySelector("#create-job-case"),
  linkJobCases: document.querySelector("#link-job-cases"),
  jobCaseSearch: document.querySelector("#job-case-search"),
  listQuery: document.querySelector("#list-query"),
  jobCases: document.querySelector("#job-cases"),
  detailPanel: document.querySelector("#detail-panel"),
  detailTitle: document.querySelector("#detail-title"),
  detailStatus: document.querySelector("#detail-status"),
  detailEmpty: document.querySelector("#detail-empty"),
  detailContent: document.querySelector("#detail-content"),
  detailFeedback: document.querySelector("#detail-feedback"),
  detailJump: document.querySelector("#detail-jump"),
  opsReturnCard: document.querySelector("#ops-return-card"),
  opsReturnBadge: document.querySelector("#ops-return-badge"),
  opsReturnTitle: document.querySelector("#ops-return-title"),
  opsReturnWhy: document.querySelector("#ops-return-why"),
  opsReturnCopy: document.querySelector("#ops-return-copy"),
  opsReturnMeta: document.querySelector("#ops-return-meta"),
  opsReturnSteps: document.querySelector("#ops-return-steps"),
  opsReturnAction: document.querySelector("#ops-return-action"),
  caseFocusStage: document.querySelector("#case-focus-stage"),
  caseFocusTitle: document.querySelector("#case-focus-title"),
  caseFocusCopy: document.querySelector("#case-focus-copy"),
  stageActionCard: document.querySelector("#stage-action-card"),
  stageActionBadge: document.querySelector("#stage-action-badge"),
  stageActionTitle: document.querySelector("#stage-action-title"),
  stageActionCopy: document.querySelector("#stage-action-copy"),
  stageActionCompletion: document.querySelector("#stage-action-completion"),
  stageActionPrimary: document.querySelector("#stage-action-primary"),
  stageActionSecondary: document.querySelector("#stage-action-secondary"),
  caseProgressCopy: document.querySelector("#case-progress-copy"),
  caseProgressList: document.querySelector("#case-progress-list"),
  metricOriginal: document.querySelector("#metric-original"),
  metricRevised: document.querySelector("#metric-revised"),
  metricDelta: document.querySelector("#metric-delta"),
  quoteForm: document.querySelector("#quote-form"),
  revisedQuoteAmount: document.querySelector("#revisedQuoteAmount"),
  saveQuote: document.querySelector("#save-quote"),
  scopeBase: document.querySelector("#scope-base"),
  scopeExtra: document.querySelector("#scope-extra"),
  scopeReason: document.querySelector("#scope-reason"),
  draftBody: document.querySelector("#draft-body"),
  copyHint: document.querySelector("#copy-hint"),
  copyDraft: document.querySelector("#copy-draft"),
  generateDraft: document.querySelector("#generate-draft"),
  customerConfirmSummary: document.querySelector("#customer-confirm-summary"),
  customerConfirmBadge: document.querySelector("#customer-confirm-badge"),
  customerConfirmMeta: document.querySelector("#customer-confirm-meta"),
  customerConfirmGuidance: document.querySelector("#customer-confirm-guidance"),
  customerConfirmUrl: document.querySelector("#customer-confirm-url"),
  openConfirmLink: document.querySelector("#open-confirm-link"),
  copyConfirmLink: document.querySelector("#copy-confirm-link"),
  generateConfirmLink: document.querySelector("#generate-confirm-link"),
  agreementForm: document.querySelector("#agreement-form"),
  agreementStatus: document.querySelector("#agreementStatus"),
  confirmationChannel: document.querySelector("#confirmationChannel"),
  confirmedAt: document.querySelector("#confirmedAt"),
  confirmedAmount: document.querySelector("#confirmedAmount"),
  customerResponseNote: document.querySelector("#customerResponseNote"),
  agreementStageNote: document.querySelector("#agreement-stage-note"),
  saveAgreement: document.querySelector("#save-agreement"),
  fieldRecordsDetail: document.querySelector("#field-records-detail"),
  timelineSummaryCopy: document.querySelector("#timeline-summary-copy"),
  timelineCountBadge: document.querySelector("#timeline-count-badge"),
  timelineRail: document.querySelector("#timeline-rail"),
  timeline: document.querySelector("#timeline")
};

const state = {
  filterStatus: "ALL",
  query: "",
  jobCases: [],
  currentFieldRecordId: null,
  selectedJobCaseId: requestedCaseId || null,
  selectedJobCaseDetail: null,
  selectedTimelineItems: [],
  latestConfirmationUrl: "",
  healthSnapshot: null
};

const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));

function setOpsTargetHighlight(targetId) {
  const focusableIds = [
    "quote-card",
    "draft-card",
    "customer-confirm-card",
    "agreement-card",
    "records-card",
    "timeline-card"
  ];

  for (const id of focusableIds) {
    const element = document.getElementById(id);
    if (!element) {
      continue;
    }
    element.classList.toggle("ops-focus-target", Boolean(targetId) && id === targetId);
  }
}

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

function buildAuthHeaders(extra = {}, method = "GET") {
  const headers = { ...extra };
  if (method !== "GET") {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }
  }
  return headers;
}

function formatMoney(value) {
  if (value == null || value === "" || !Number.isFinite(Number(value))) {
    return "-";
  }
  return `${new Intl.NumberFormat("ko-KR").format(Number(value))}원`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("ko-KR");
}

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function showFeedback(target, message, type = "") {
  if (!target) {
    return;
  }
  target.textContent = message;
  target.className = `feedback ${type}`.trim();
}

function setBusy(button, busy, busyLabel) {
  if (!button) {
    return;
  }
  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent;
  }
  button.disabled = busy;
  button.textContent = busy ? busyLabel : button.dataset.defaultLabel;
}

function setMetaPill(element, text, tone = "") {
  if (!element) {
    return;
  }
  element.textContent = text;
  element.className = `meta-pill ${tone}`.trim();
}

function setCopyHint(message, emphasized = false) {
  if (!elements.copyHint) {
    return;
  }
  elements.copyHint.textContent = message;
  elements.copyHint.className = emphasized ? "helper-text copy-hint-strong" : "helper-text";
}

function describeReason(item) {
  return reasonLabels[item.secondaryReason] || reasonLabels[item.primaryReason] || item.reasonSummary || "현장 기록을 확인해 주세요.";
}

function describeTimelineTitle(item) {
  return timelineLabels[item.eventType] || item.eventType || "작업 이력";
}

function hasStoredQuote(detail) {
  return typeof detail?.revisedQuoteAmount === "number" && Number.isFinite(detail.revisedQuoteAmount);
}

function getWorkflowStepIndex(stepKey) {
  return Math.max(workflowSteps.findIndex((step) => step.key === stepKey), 0);
}

function setDefaultConfirmedAt() {
  if (!elements.confirmedAt || elements.confirmedAt.value) {
    return;
  }
  const next = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  elements.confirmedAt.value = next;
}

function isTerminalStatus(status) {
  return status === "AGREED" || status === "EXCLUDED";
}

function getConfirmationBadgeState(detail) {
  const latest = detail?.latestCustomerConfirmationLink || null;
  if (!latest) {
    return {
      label: isTerminalStatus(detail?.currentStatus) ? "기록 확인용" : "미발급",
      tone: isTerminalStatus(detail?.currentStatus) ? "tone-good" : "tone-neutral"
    };
  }

  switch (latest.status) {
    case "CONFIRMED":
      return { label: "확인 완료", tone: "tone-good" };
    case "VIEWED":
      return { label: "열람됨", tone: "tone-warning" };
    case "ISSUED":
      return { label: "발급됨", tone: "tone-neutral" };
    case "REVOKED":
      return { label: "만료/회수", tone: "tone-neutral" };
    default:
      return { label: latest.status, tone: "tone-neutral" };
  }
}

function buildJobCardMetaPills(item) {
  const pills = [];

  if (isTerminalStatus(item.currentStatus)) {
    pills.push({ label: "흐름 종료", tone: "is-good" });
  } else if (item.currentStatus === "ON_HOLD") {
    pills.push({ label: "답변 대기", tone: "is-warning" });
  } else {
    pills.push({ label: "진행 중", tone: "" });
  }

  if (item.hasAgreementRecord) {
    pills.push({ label: "합의 기록 있음", tone: "is-good" });
  } else {
    pills.push({ label: "합의 기록 없음", tone: "is-warning" });
  }

  if (Number.isFinite(item.revisedQuoteAmount)) {
    pills.push({ label: "변경 금액 저장", tone: "" });
  } else {
    pills.push({ label: "금액 정리 필요", tone: "is-warning" });
  }

  return pills.slice(0, 3);
}

function getListActionLabel(item) {
  if (item.currentStatus === "AGREED") {
    return "합의와 확인 기록이 끝났습니다. 이제는 증빙과 내부 공유용으로 다시 보면 됩니다.";
  }
  if (item.currentStatus === "EXCLUDED") {
    return "작업 제외로 종료된 건입니다. 제외 사유와 메모를 다시 확인하는 용도로만 열면 됩니다.";
  }
  if (item.currentStatus === "ON_HOLD") {
    return "설명은 끝났고 보류 상태입니다. 고객의 최종 답변을 기다리고 있습니다.";
  }
  if (!Number.isFinite(item.revisedQuoteAmount)) {
    return "변경 금액을 아직 정리하지 않았습니다. 견적부터 정리해 주세요.";
  }
  if (!item.hasAgreementRecord) {
    return "설명은 준비됐습니다. 합의 상태를 기록해 주세요.";
  }
  return "고객 확인과 후속 기록이 남아 있습니다.";
}

function buildOpsPriorityBridgeItem() {
  if (navigationSource !== "ops" || !state.selectedJobCaseDetail || !opsFocusReason) {
    return null;
  }

  switch (opsFocusReason) {
    case "confirmation-viewed":
      return {
        title: "운영 우선 이유: 고객이 이미 내용을 봤습니다",
        copy: "고객 확인 카드와 합의 기록을 먼저 보면 마지막 상태를 가장 빠르게 정리할 수 있습니다.",
        toneClass: "is-warning"
      };
    case "confirmation-stale":
      return {
        title: "운영 우선 이유: 확인 링크 응답이 오래 멈췄습니다",
        copy: "링크 상태와 마지막 메모를 먼저 보고 후속 연락이 필요한지 판단해 주세요.",
        toneClass: "is-warning"
      };
    case "quote-missing":
      return {
        title: "운영 우선 이유: 견적 단계에서 병목이 생겼습니다",
        copy: "금액/범위 카드부터 열어 변경 금액을 먼저 저장하면 뒤 단계가 같이 풀립니다.",
        toneClass: "is-warning"
      };
    case "draft-missing":
      return {
        title: "운영 우선 이유: 설명 초안이 아직 없습니다",
        copy: "초안을 먼저 만들면 고객 확인과 합의 기록으로 자연스럽게 이어집니다.",
        toneClass: "is-warning"
      };
    case "confirm-link-needed":
      return {
        title: "운영 우선 이유: 고객 확인 단계가 아직 열리지 않았습니다",
        copy: "고객 확인 링크를 발급하거나 바로 합의 기록을 남기면 흐름이 마무리 단계로 넘어갑니다.",
        toneClass: "is-active"
      };
    case "on-hold-followup":
      return {
        title: "운영 우선 이유: 답변 대기 건을 다시 봐야 합니다",
        copy: "새 입력보다 마지막 반응과 보류 메모를 먼저 확인하는 것이 더 중요합니다.",
        toneClass: "is-warning"
      };
    case "status-review":
      return {
        title: "운영 우선 이유: 최종 상태를 한 번 더 분명히 해야 합니다",
        copy: "합의 기록과 고객 확인 상태를 같이 보며 마지막 상태를 정리해 주세요.",
        toneClass: "is-active"
      };
    default:
      return {
        title: "운영 콘솔에서 이어진 작업 건입니다",
        copy: "현재 병목이 있는 작업 건으로 판단돼 이 화면에 우선으로 넘어왔습니다.",
        toneClass: "is-active"
      };
  }
}

function buildOpsExecutionChecklist(reasonKey, targetId) {
  const targetLabelMap = {
    "quote-card": "변경 견적과 범위",
    "draft-card": "고객 설명 초안",
    "customer-confirm-card": "고객 확인 링크",
    "agreement-card": "합의 기록",
    "timeline-card": "타임라인"
  };

  const fallback = {
    first: targetLabelMap[targetId] || "현재 추천 카드",
    next: "관련 메모와 최근 상태를 함께 확인",
    doneWhen: "지금 막힌 이유가 해소됐는지 한 번 더 확인"
  };

  switch (reasonKey) {
    case "confirmation-viewed":
      return {
        first: "고객 확인 링크 상태 확인",
        next: "합의 기록에서 마지막 상태 저장",
        doneWhen: "열람 뒤 최종 상태가 남았으면 충분합니다."
      };
    case "confirmation-stale":
      return {
        first: "고객 확인 링크와 마지막 메모 확인",
        next: "후속 연락이 필요한지 판단",
        doneWhen: "대기 이유나 다음 액션이 분명해지면 충분합니다."
      };
    case "quote-missing":
      return {
        first: "변경 견적 금액 저장",
        next: "추가 작업 범위 문구 확인",
        doneWhen: "금액이 저장되어 다음 단계로 넘어갈 수 있으면 충분합니다."
      };
    case "draft-missing":
      return {
        first: "고객 설명 초안 생성",
        next: "복사 가능한 문장인지 확인",
        doneWhen: "고객에게 바로 보낼 수 있는 초안이 있으면 충분합니다."
      };
    case "confirm-link-needed":
      return {
        first: "고객 확인 링크 발급 또는 합의 기록 결정",
        next: "확인 경로와 바로 합의 중 더 맞는 흐름 선택",
        doneWhen: "확인 단계가 열리거나 합의 상태가 정리되면 충분합니다."
      };
    case "on-hold-followup":
      return {
        first: "보류 사유와 마지막 반응 확인",
        next: "후속 연락 또는 대기 유지 판단",
        doneWhen: "보류 이유와 다음 액션이 최신이면 충분합니다."
      };
    case "status-review":
      return {
        first: "합의 기록 상태 다시 확인",
        next: "고객 확인 카드와 서로 맞는지 확인",
        doneWhen: "최종 상태를 한 줄로 설명할 수 있으면 충분합니다."
      };
    case "timeline-followup":
      return {
        first: "최근 타임라인 이벤트 확인",
        next: "멈춘 카드가 어디인지 찾기",
        doneWhen: "다음 담당 행동이 분명하면 충분합니다."
      };
    default:
      return fallback;
  }
}

function createPriorityItems(snapshot) {
  const items = [];
  const opsBridgeItem = buildOpsPriorityBridgeItem();

  if (opsBridgeItem) {
    items.push(opsBridgeItem);
  }

  items.push({
    title: snapshot.workspaceNextTitle,
    copy: snapshot.workspaceNextCopy,
    toneClass: snapshot.stageComplete ? "is-good" : "is-active"
  });

  switch (snapshot.stageKey) {
    case "capture":
      items.push({
        title: "현장 사진과 사유를 빠짐없이 남겨 주세요",
        copy: "첫 기록이 저장돼야 작업 건 연결과 견적 정리가 이어집니다.",
        toneClass: ""
      });
      break;
    case "link":
      items.push({
        title: "기존 작업 건에 연결하거나 새 작업 건을 만드세요",
        copy: "현장 기록과 작업 건이 연결돼야 이후 기록이 한 흐름으로 쌓입니다.",
        toneClass: ""
      });
      break;
    case "quote":
      items.push({
        title: "변경 금액과 범위를 먼저 정리하세요",
        copy: "금액이 저장돼야 설명 초안과 고객 확인 링크를 자연스럽게 만들 수 있습니다.",
        toneClass: ""
      });
      break;
    case "draft":
      items.push({
        title: "고객에게 보낼 설명 초안을 준비하세요",
        copy: "설명 초안을 만들고 복사해 보내면 고객 확인 링크 발급이 쉬워집니다.",
        toneClass: ""
      });
      break;
    default:
      items.push({
        title: snapshot.stageComplete ? "이 작업 건은 운영 흐름상 마무리됐습니다" : "고객 확인과 합의 기록을 마무리해 주세요",
        copy: snapshot.stageComplete
          ? "필요하면 기록을 다시 확인하고 내부 공유용으로만 활용하면 됩니다."
          : "확인 링크 상태와 합의 기록을 함께 남기면 나중에 다시 보기 쉬워집니다.",
        toneClass: snapshot.stageComplete ? "is-good" : ""
      });
  }

  return items.slice(0, 2);
}

function buildWorkflowSnapshot() {
  const detail = state.selectedJobCaseDetail;
  const hasSelectedJobCase = Boolean(state.selectedJobCaseId && detail);
  const hasFieldRecord = Boolean(state.currentFieldRecordId || detail?.fieldRecords?.length);
  const hasQuote = hasStoredQuote(detail);
  const hasDraft = Boolean(detail?.latestDraftMessage?.body);
  const hasConfirmationLink = Boolean(state.latestConfirmationUrl);
  const status = detail?.currentStatus || "UNEXPLAINED";

  const snapshot = {
    stageKey: "capture",
    stageComplete: false,
    progressTitle: "1. 현장 사진과 사유를 먼저 기록해 주세요",
    progressCopy: "사진 한 장 이상과 사유를 남기면 다음 단계로 자연스럽게 이어집니다.",
    nextAction: "현장 기록을 저장하면 새 작업 건을 만들거나 기존 작업 건에 연결할 수 있습니다.",
    workspaceNextTitle: "현장 기록을 먼저 저장하세요",
    workspaceNextCopy: "현장 기록이 없으면 작업 건 연결과 견적 정리 흐름이 시작되지 않습니다.",
    selectionTitle: "아직 선택된 작업 건이 없습니다",
    selectionCopy: "가운데 목록에서 작업 건을 선택하면 현재 상태와 다음 액션을 여기서 요약합니다.",
    focusTone: "tone-neutral",
    focusBadge: "준비 중",
    focusTitle: "현장 문제를 먼저 기록해 주세요.",
    focusCopy: "운영 흐름은 현장 기록 저장부터 시작됩니다.",
    agreementNote: "합의 기록은 금액, 채널, 메모를 함께 남길 때 나중에 다시 보기 쉽습니다.",
    caseProgressCopy: "아직 시작 단계입니다. 현장 기록이 저장되면 다음 단계가 열립니다.",
    priorityItems: []
  };

  if (!hasFieldRecord && !hasSelectedJobCase) {
    snapshot.priorityItems = createPriorityItems(snapshot);
    return snapshot;
  }

  if (!hasSelectedJobCase) {
    snapshot.stageKey = "link";
    snapshot.progressTitle = "2. 현장 기록을 작업 건에 연결해 주세요";
    snapshot.progressCopy = "새 작업 건을 만들거나 기존 작업 건을 연결하면 이후 기록이 한 흐름으로 쌓입니다.";
    snapshot.nextAction = "작업 건을 만들거나 선택해서 현장 기록과 연결해 주세요.";
    snapshot.workspaceNextTitle = "작업 건 연결이 다음 단계입니다";
    snapshot.workspaceNextCopy = "작업 건이 연결되면 변경 견적, 설명 초안, 합의 기록이 같은 타임라인에 남습니다.";
    snapshot.selectionTitle = "현장 기록은 저장됐지만 작업 건이 아직 없습니다";
    snapshot.selectionCopy = "왼쪽에서 새 작업 건을 만들거나 기존 작업 건에 연결해 주세요.";
    snapshot.focusTone = "tone-warning";
    snapshot.focusBadge = "연결 필요";
    snapshot.focusTitle = "이제 작업 건을 연결할 차례입니다.";
    snapshot.focusCopy = "고객명과 현장명을 정리해 두면 이후 기록과 검색이 쉬워집니다.";
    snapshot.agreementNote = "합의 기록은 작업 건이 연결된 뒤부터 남길 수 있습니다.";
    snapshot.caseProgressCopy = "현장 기록은 끝났습니다. 이제 작업 건 연결이 필요합니다.";
    snapshot.priorityItems = createPriorityItems(snapshot);
    return snapshot;
  }

  snapshot.selectionTitle = `${detail.customerLabel} · ${statusLabels[detail.currentStatus] || detail.currentStatus}`;
  snapshot.selectionCopy = `${detail.siteLabel || "현장 정보"} · ${getListActionLabel(detail)}`;

  if (status === "AGREED") {
    snapshot.stageKey = "confirm";
    snapshot.stageComplete = true;
    snapshot.progressTitle = "합의 완료 상태입니다";
    snapshot.progressCopy = "이 작업 건은 운영 흐름상 마무리됐습니다. 필요하면 기록 확인용으로 다시 볼 수 있습니다.";
    snapshot.nextAction = "추가 조치는 없습니다. 금액, 링크, 타임라인 기록만 다시 확인하면 됩니다.";
    snapshot.workspaceNextTitle = "이 작업 건은 완료된 상태입니다";
    snapshot.workspaceNextCopy = "합의가 끝났으므로 후속 기록 확인과 내부 공유 위주로 활용하면 됩니다.";
    snapshot.focusTone = "tone-good";
    snapshot.focusBadge = "완료";
    snapshot.focusTitle = "합의가 완료된 작업 건입니다.";
    snapshot.focusCopy = "고객 확인 링크, 합의 메모, 타임라인이 모두 남아 있는지 마지막으로 확인해 주세요.";
    snapshot.agreementNote = "합의 완료 후에는 기록 확인용으로 다시 열어볼 수 있습니다.";
    snapshot.caseProgressCopy = "운영 흐름이 마무리됐습니다. 추가 작업은 필수가 아닙니다.";
    snapshot.priorityItems = createPriorityItems(snapshot);
    return snapshot;
  }

  if (status === "EXCLUDED") {
    snapshot.stageKey = "confirm";
    snapshot.stageComplete = true;
    snapshot.progressTitle = "작업 제외로 종료된 상태입니다";
    snapshot.progressCopy = "이 작업 건은 작업 제외로 마무리됐습니다. 제외 사유와 메모를 다시 볼 수 있습니다.";
    snapshot.nextAction = "추가 조치는 없습니다. 제외 사유와 고객 반응만 다시 확인해 주세요.";
    snapshot.workspaceNextTitle = "작업 제외로 정리된 건입니다";
    snapshot.workspaceNextCopy = "필요하면 제외 사유와 메모를 내부 공유용으로만 다시 확인하면 됩니다.";
    snapshot.focusTone = "tone-neutral";
    snapshot.focusBadge = "종료";
    snapshot.focusTitle = "작업 제외 상태로 마무리됐습니다.";
    snapshot.focusCopy = "추가 진행보다는 기록 보관과 내부 공유 관점으로 확인하면 됩니다.";
    snapshot.agreementNote = "작업 제외 상태도 메모와 확인 채널을 남겨두면 나중에 분쟁 대응이 쉬워집니다.";
    snapshot.caseProgressCopy = "운영 흐름이 종료됐습니다. 기록 재확인만 남아 있습니다.";
    snapshot.priorityItems = createPriorityItems(snapshot);
    return snapshot;
  }

  if (!hasQuote) {
    snapshot.stageKey = "quote";
    snapshot.progressTitle = "3. 변경 견적과 범위를 정리해 주세요";
    snapshot.progressCopy = "현장 기록을 기준으로 변경 금액과 추가 범위를 정리하면 설명 초안이 자연스럽게 이어집니다.";
    snapshot.nextAction = "변경 금액을 저장하고 추가 작업 범위를 정리해 주세요.";
    snapshot.workspaceNextTitle = "변경 견적 정리가 다음 단계입니다";
    snapshot.workspaceNextCopy = "금액과 범위를 먼저 정리해야 설명 초안과 고객 확인 링크가 정확해집니다.";
    snapshot.focusTone = "tone-warning";
    snapshot.focusBadge = "금액 필요";
    snapshot.focusTitle = "변경 금액이 아직 없습니다.";
    snapshot.focusCopy = "현장 기록과 추가 범위를 기준으로 먼저 금액을 저장해 주세요.";
    snapshot.agreementNote = "합의 기록은 변경 금액이 정리된 뒤에 남기는 것이 좋습니다.";
    snapshot.caseProgressCopy = "작업 건 연결까지는 끝났습니다. 이제 견적 정리가 필요합니다.";
    snapshot.priorityItems = createPriorityItems(snapshot);
    return snapshot;
  }

  if (!hasDraft) {
    snapshot.stageKey = "draft";
    snapshot.progressTitle = "4. 고객 설명 초안을 준비해 주세요";
    snapshot.progressCopy = "금액은 저장됐습니다. 이제 고객에게 보낼 설명 문장을 만들 차례입니다.";
    snapshot.nextAction = "설명 초안을 생성해 고객에게 바로 복사해 보내세요.";
    snapshot.workspaceNextTitle = "초안 생성이 다음 단계입니다";
    snapshot.workspaceNextCopy = "고객에게 보낼 문장을 먼저 준비하면 확인 링크와 합의 기록이 훨씬 자연스럽습니다.";
    snapshot.focusTone = "tone-warning";
    snapshot.focusBadge = "초안 필요";
    snapshot.focusTitle = "고객에게 보낼 초안이 아직 없습니다.";
    snapshot.focusCopy = "고객이 이해하기 쉬운 문장을 먼저 만들고, 이후 확인 링크를 발급해 주세요.";
    snapshot.agreementNote = "설명 초안과 고객 메시지가 먼저 준비되면 합의 기록도 더 명확해집니다.";
    snapshot.caseProgressCopy = "금액 정리는 끝났고, 이제 초안만 만들면 됩니다.";
    snapshot.priorityItems = createPriorityItems(snapshot);
    return snapshot;
  }

  snapshot.stageKey = "confirm";
  snapshot.progressTitle = status === "ON_HOLD" ? "5. 보류 상태를 남기고 답변을 기다리세요" : "5. 고객 확인과 합의 기록을 남겨 주세요";
  snapshot.progressCopy = status === "ON_HOLD"
    ? "설명과 금액 전달은 끝났습니다. 이제 고객의 최종 답변이나 추가 메모를 기다리면 됩니다."
    : "설명 초안은 준비됐습니다. 고객 확인 링크를 보내거나 합의 기록을 남기면 흐름이 마무리됩니다.";
  snapshot.nextAction = hasConfirmationLink
    ? "고객 확인 링크 상태와 합의 기록을 함께 보면서 최종 상태를 남겨 주세요."
    : "고객 확인 링크를 발급하거나 바로 합의 기록을 남겨 주세요.";
  snapshot.workspaceNextTitle = status === "ON_HOLD" ? "보류 상태로 답변을 기다리세요" : "고객 확인과 합의 기록이 마지막 단계입니다";
  snapshot.workspaceNextCopy = status === "ON_HOLD"
    ? "필요하면 고객 답변 메모를 추가하고, 합의 완료로 바뀌면 기록을 마무리하면 됩니다."
    : hasConfirmationLink
      ? "링크 열람 여부와 확인 완료 여부를 보면서 최종 합의 상태를 기록해 주세요."
      : "고객에게 설명을 전달했다면 확인 링크를 보내거나 바로 합의 기록을 남겨 주세요.";
  snapshot.focusTone = status === "ON_HOLD" ? "tone-warning" : "tone-neutral";
  snapshot.focusBadge = status === "ON_HOLD" ? "보류" : "마무리";
  snapshot.focusTitle = status === "ON_HOLD" ? "답변을 기다리는 상태입니다." : "고객 확인과 합의 기록만 남았습니다.";
  snapshot.focusCopy = status === "ON_HOLD"
    ? "이미 설명은 끝났습니다. 고객 반응 메모와 최종 상태만 정리하면 됩니다."
    : hasConfirmationLink
      ? "링크 상태와 합의 메모를 함께 보면 진행 상황이 훨씬 명확해집니다."
      : "확인 링크 발급과 합의 기록 중 더 빠른 경로부터 마무리해 주세요.";
  snapshot.agreementNote = status === "ON_HOLD"
    ? "보류 상태도 채널과 메모를 남겨두면 다음 응대가 쉬워집니다."
    : "합의 상태, 채널, 금액, 메모를 함께 남기면 이후 다시 보기 쉽습니다.";
  snapshot.caseProgressCopy = status === "ON_HOLD"
    ? "보류 단계입니다. 최종 답변이 오면 상태만 업데이트하면 됩니다."
    : "거의 끝났습니다. 고객 확인 또는 합의 기록을 남기면 흐름이 마무리됩니다.";
  snapshot.priorityItems = createPriorityItems(snapshot);
  return snapshot;
}

function buildOpsReturnContext(snapshot) {
  if (navigationSource !== "ops" || !state.selectedJobCaseDetail || !state.selectedJobCaseId) {
    return null;
  }

  const detail = state.selectedJobCaseDetail;
  const latestConfirmation = detail.latestCustomerConfirmationLink || null;
  const latestTimelineEvent = state.selectedTimelineItems?.[0] || null;
  const confirmationBadge = getConfirmationBadgeState(detail);
  const meta = [];

  if (latestTimelineEvent?.eventType) {
    meta.push(`최근 흐름 · ${describeTimelineTitle(latestTimelineEvent)}`);
  }
  if (latestConfirmation?.status) {
    meta.push(`고객 확인 · ${confirmationBadge.label}`);
  }
  if (detail.siteLabel) {
    meta.push(detail.siteLabel);
  }
  if (opsFocusReason) {
    const reasonLabelMap = {
      "confirmation-viewed": "운영 우선 · 고객 확인 열람",
      "confirmation-stale": "운영 우선 · 확인 응답 지연",
      "quote-missing": "운영 우선 · 견적 병목",
      "draft-missing": "운영 우선 · 초안 필요",
      "confirm-link-needed": "운영 우선 · 확인 단계 필요",
      "on-hold-followup": "운영 우선 · 답변 대기",
      "status-review": "운영 우선 · 상태 점검",
      "record-check": "운영 우선 · 기록 확인"
    };
    meta.unshift(reasonLabelMap[opsFocusReason] || "운영 우선");
  }

  const focusTargetId = opsFocusTarget || null;

  if (opsFocusReason === "confirmation-viewed") {
    return {
      tone: "tone-warning",
      badge: "열람됨",
      title: "고객이 내용을 본 뒤 마지막 정리가 멈춘 작업 건입니다.",
      whyNow: "고객이 이미 내용을 봤기 때문에, 지금 정리하면 연락 왕복을 크게 줄일 수 있습니다.",
      copy: "고객 확인 카드와 합의 기록을 같이 보면 지금 무엇을 확정해야 하는지 가장 빨리 보입니다.",
      meta,
      execution: buildOpsExecutionChecklist(opsFocusReason, focusTargetId || "customer-confirm-card"),
      actionLabel: "고객 확인 카드 보기",
      targetId: focusTargetId || "customer-confirm-card"
    };
  }

  if (opsFocusReason === "confirmation-stale") {
    return {
      tone: "tone-warning",
      badge: "응답 지연",
      title: "발급된 확인 링크가 오래 멈춘 작업 건입니다.",
      whyNow: "확인 흐름이 길어질수록 고객 맥락과 내부 메모가 함께 흐려질 수 있습니다.",
      copy: "확인 링크 상태와 마지막 메모를 먼저 보고, 후속 연락이 필요한지 빠르게 판단해 주세요.",
      meta,
      execution: buildOpsExecutionChecklist(opsFocusReason, focusTargetId || "customer-confirm-card"),
      actionLabel: "고객 확인 카드 보기",
      targetId: focusTargetId || "customer-confirm-card"
    };
  }

  if (opsFocusReason === "quote-missing") {
    return {
      tone: "tone-warning",
      badge: "견적 병목",
      title: "변경 금액이 비어 있어 전체 흐름이 멈춘 작업 건입니다.",
      whyNow: "이 단계가 비어 있으면 설명 초안, 고객 확인, 합의 기록이 모두 같이 밀립니다.",
      copy: "금액/범위 카드부터 열어 변경 금액을 먼저 저장해 주세요. 그다음부터는 흐름이 자연스럽게 이어집니다.",
      meta,
      execution: buildOpsExecutionChecklist(opsFocusReason, focusTargetId || "quote-card"),
      actionLabel: "금액/범위 카드 보기",
      targetId: focusTargetId || "quote-card"
    };
  }

  if (opsFocusReason === "draft-missing") {
    return {
      tone: "tone-warning",
      badge: "초안 필요",
      title: "금액은 정리됐지만 고객 설명이 아직 없는 작업 건입니다.",
      whyNow: "설명 문장이 없으면 고객 확인 링크와 합의 기록도 자연스럽게 이어지지 않습니다.",
      copy: "설명 초안을 먼저 만들고, 이후 고객 확인 또는 합의 기록으로 이어가면 가장 빠릅니다.",
      meta,
      execution: buildOpsExecutionChecklist(opsFocusReason, focusTargetId || "draft-card"),
      actionLabel: "설명 초안 보기",
      targetId: focusTargetId || "draft-card"
    };
  }

  if (opsFocusReason === "confirm-link-needed") {
    return {
      tone: "tone-neutral",
      badge: "확인 전",
      title: "설명은 준비됐지만 고객 확인 흐름이 아직 없는 작업 건입니다.",
      whyNow: "지금은 새 입력보다 마지막 확인 단계를 열어 주는 편이 더 중요합니다.",
      copy: "고객 확인 링크를 발급하거나 바로 합의 기록을 남기면 이 작업 건은 마무리 단계로 넘어갑니다.",
      meta,
      execution: buildOpsExecutionChecklist(opsFocusReason, focusTargetId || "customer-confirm-card"),
      actionLabel: "고객 확인 카드 보기",
      targetId: focusTargetId || "customer-confirm-card"
    };
  }

  if (opsFocusReason === "on-hold-followup") {
    return {
      tone: "tone-warning",
      badge: "답변 대기",
      title: "고객 답변을 기다리는 작업 건입니다.",
      whyNow: "지금은 새 작업보다 마지막 반응과 보류 메모를 다시 확인하는 것이 더 중요합니다.",
      copy: "합의 기록 카드에서 현재 상태와 메모를 먼저 보고, 다시 연락이 필요한지 짧게 판단해 주세요.",
      meta,
      execution: buildOpsExecutionChecklist(opsFocusReason, focusTargetId || "agreement-card"),
      actionLabel: "합의 기록 보기",
      targetId: focusTargetId || "agreement-card"
    };
  }

  if (opsFocusReason === "status-review") {
    return {
      tone: "tone-neutral",
      badge: "상태 점검",
      title: "합의 기록은 있지만 최종 상태 확인이 더 필요한 작업 건입니다.",
      whyNow: "근거는 이미 있으니, 지금은 마지막 상태만 분명하게 정리하면 됩니다.",
      copy: "합의 기록과 고객 확인 상태를 같이 보면서 최종 상태를 한 번 더 정리해 주세요.",
      meta,
      execution: buildOpsExecutionChecklist(opsFocusReason, focusTargetId || "agreement-card"),
      actionLabel: "합의 기록 보기",
      targetId: focusTargetId || "agreement-card"
    };
  }

  if (latestConfirmation?.status === "VIEWED") {
    return {
      tone: "tone-warning",
      badge: "확인 열람",
      title: "고객이 링크를 열었습니다. 마지막 상태만 남았습니다.",
      whyNow: "고객이 이미 내용을 본 상태라, 지금 기록을 정리하면 답변 왕복을 줄일 수 있습니다.",
      copy: "이 작업 건은 고객이 이미 내용을 확인해 먼저 열렸습니다. 고객 확인 카드와 합의 기록부터 보면 가장 빠릅니다.",
      meta,
      execution: buildOpsExecutionChecklist("confirmation-viewed", "customer-confirm-card"),
      actionLabel: "고객 확인 카드 보기",
      targetId: "customer-confirm-card"
    };
  }

  if (snapshot.stageComplete) {
    return {
      tone: snapshot.focusTone,
      badge: "근거 확인",
      title: "완료된 작업 건을 다시 확인하는 상태입니다.",
      whyNow: "추가 진행보다 기록 누락이 없는지 확인하는 단계입니다.",
      copy: "추가 진행보다 금액, 메모, 타임라인 근거가 모두 남아 있는지 빠르게 다시 보는 것이 우선입니다.",
      meta,
      execution: buildOpsExecutionChecklist(opsFocusReason, focusTargetId || "agreement-card"),
      actionLabel: "합의 기록 보기",
      targetId: focusTargetId || "agreement-card"
    };
  }

  if (snapshot.stageKey === "quote") {
    return {
      tone: "tone-warning",
      badge: "금액 먼저",
      title: "아직 변경 견적이 비어 있습니다.",
      whyNow: "금액이 비어 있으면 이후 설명과 합의 기록이 모두 같이 밀립니다.",
      copy: "현장 기록과 추가 범위를 기준으로 금액부터 저장하면 이후 흐름이 가장 빨라집니다.",
      meta,
      execution: buildOpsExecutionChecklist("quote-missing", focusTargetId || "quote-card"),
      actionLabel: "금액/범위 카드 보기",
      targetId: focusTargetId || "quote-card"
    };
  }

  if (snapshot.stageKey === "draft") {
    return {
      tone: "tone-warning",
      badge: "초안 필요",
      title: "금액 정리는 끝났고, 설명 초안만 남았습니다.",
      whyNow: "초안이 없으면 고객 확인 링크와 합의 기록도 다음 단계로 넘어가지 못합니다.",
      copy: "초안부터 만들면 고객 확인 링크와 합의 기록으로 자연스럽게 이어갈 수 있습니다.",
      meta,
      execution: buildOpsExecutionChecklist("draft-missing", focusTargetId || "draft-card"),
      actionLabel: "설명 초안 보기",
      targetId: focusTargetId || "draft-card"
    };
  }

  if (detail.currentStatus === "ON_HOLD") {
    return {
      tone: "tone-warning",
      badge: "답변 대기",
      title: "보류 상태입니다. 마지막 고객 반응부터 확인하세요.",
      whyNow: "지금은 새 작업보다 마지막 반응과 다음 응답 시점을 놓치지 않는 것이 더 중요합니다.",
      copy: "합의 기록 카드에서 메모와 상태를 함께 보면 다음 연락이 필요한지 더 빨리 판단할 수 있습니다.",
      meta,
      execution: buildOpsExecutionChecklist("on-hold-followup", focusTargetId || "agreement-card"),
      actionLabel: "합의 기록 보기",
      targetId: focusTargetId || "agreement-card"
    };
  }

  return {
    tone: "tone-neutral",
    badge: "마지막 확인",
    title: "운영 콘솔에서 이어진 작업 건입니다. 마지막 확인만 남았습니다.",
    whyNow: "지금은 새로운 입력보다 마지막 확인과 기록 정리가 더 중요한 상태입니다.",
    copy: latestConfirmation
      ? "고객 확인 카드와 합의 기록을 함께 보면 지금 상태를 가장 빠르게 이해할 수 있습니다."
      : "고객 확인 링크 발급과 합의 기록 저장 중 더 빠른 경로부터 마무리해 주세요.",
    meta,
    execution: buildOpsExecutionChecklist(opsFocusReason, focusTargetId || (latestConfirmation ? "customer-confirm-card" : "agreement-card")),
    actionLabel: latestConfirmation ? "고객 확인 카드 보기" : "합의 기록 보기",
    targetId: focusTargetId || (latestConfirmation ? "customer-confirm-card" : "agreement-card")
  };
}

function renderWorkflowBanner(snapshot) {
  const activeIndex = getWorkflowStepIndex(snapshot.stageKey);
  elements.workflowChips.forEach((chip, index) => {
    const isCompleted = snapshot.stageComplete ? index <= activeIndex : index < activeIndex;
    const isActive = !snapshot.stageComplete && index === activeIndex;
    chip.classList.toggle("completed", isCompleted);
    chip.classList.toggle("active", isActive);
  });
}

function renderPriorityList(items) {
  if (!elements.workspacePriorityList) {
    return;
  }
  elements.workspacePriorityList.innerHTML = items
    .map((item) => `
      <article class="workspace-priority-item ${item.toneClass}">
        <strong>${item.title}</strong>
        <p>${item.copy}</p>
      </article>
    `)
    .join("");
}

function renderCaseProgress(snapshot) {
  if (!elements.caseProgressList) {
    return;
  }
  const activeIndex = getWorkflowStepIndex(snapshot.stageKey);
  elements.caseProgressCopy.textContent = snapshot.caseProgressCopy;
  elements.caseProgressList.innerHTML = workflowSteps
    .map((step, index) => {
      const stepClass = snapshot.stageComplete
        ? index <= activeIndex ? "is-completed" : "is-upcoming"
        : index < activeIndex ? "is-completed" : index === activeIndex ? "is-active" : "is-upcoming";
      const stepBadge = stepClass === "is-completed" ? "완료" : stepClass === "is-active" ? "현재" : "대기";
      return `
        <article class="case-progress-item ${stepClass}">
          <div class="case-progress-topline">
            <span class="case-progress-index">${index + 1}</span>
            <span class="case-progress-badge ${stepClass}">${stepBadge}</span>
          </div>
          <strong>${step.label}</strong>
        </article>
      `;
    })
      .join("");
}

function setStageActionButton(button, action) {
  if (!button) {
    return;
  }
  if (!action) {
    button.classList.add("hidden");
    button.dataset.actionType = "";
    button.dataset.actionTarget = "";
    return;
  }
  button.classList.remove("hidden");
  button.textContent = action.label;
  button.dataset.actionType = action.type;
  button.dataset.actionTarget = action.target;
}

function buildStageRouteAction(label, screenKey) {
  return { label, type: "route", target: screenKey };
}

function buildStageScrollAction(label, targetId) {
  return { label, type: "scroll", target: targetId };
}

function buildStageActionSnapshot(snapshot) {
  if (!["quote", "draft", "confirm"].includes(workflowScreen)) {
    return null;
  }

  const detail = state.selectedJobCaseDetail;
  const hasSelectedJobCase = Boolean(state.selectedJobCaseId && detail);
  const hasQuote = hasStoredQuote(detail);
  const hasDraft = Boolean(detail?.latestDraftMessage?.body);
  const hasConfirmationLink = Boolean(state.latestConfirmationUrl);
  const status = detail?.currentStatus || "UNEXPLAINED";
  const terminal = isTerminalStatus(status);

  if (!hasSelectedJobCase) {
    return {
      badge: "작업 건 필요",
      tone: "tone-neutral",
      title: "먼저 작업 건을 선택해 주세요.",
      copy: "이 단계 화면은 선택된 작업 건 기준으로 열립니다. 목록에서 작업 건을 고르면 바로 이어서 처리할 수 있습니다.",
      completion: "작업 건이 선택되면 이 단계 카드와 CTA가 바로 활성화됩니다.",
      primary: buildStageScrollAction("작업 건 목록 보기", "job-cases"),
      secondary: buildStageRouteAction("현장 기록 단계로 가기", "capture")
    };
  }

  if (workflowScreen === "quote") {
    if (terminal) {
      return {
        badge: "완료",
        tone: "tone-good",
        title: "이 작업 건은 이미 마무리된 상태입니다.",
        copy: "지금은 견적 조정보다 확인과 합의 기록을 다시 보는 편이 더 적합합니다.",
        completion: "합의 메모와 타임라인이 남아 있으면 충분합니다.",
        primary: buildStageRouteAction("확인과 합의 단계로 이동", "confirm"),
        secondary: buildStageRouteAction("전체 보기로 돌아가기", "overview")
      };
    }

    if (!hasQuote) {
      return {
        badge: "금액 필요",
        tone: "tone-warning",
        title: "변경 금액을 먼저 저장해 주세요.",
        copy: "현장 기록과 추가 범위를 기준으로 금액을 먼저 정리해야 이후 설명 초안과 고객 확인이 정확해집니다.",
        completion: "변경 견적이 저장되고 범위 문장이 자연스럽게 읽히면 충분합니다.",
        primary: buildStageScrollAction("변경 견적 카드 보기", "quote-card"),
        secondary: buildStageRouteAction("현장 기록 단계로 돌아가기", "capture")
      };
    }

    return {
      badge: "정리됨",
      tone: "tone-good",
      title: "견적 정리는 끝났습니다.",
      copy: "이제 고객에게 보낼 설명 초안을 만들면 다음 확인 단계로 자연스럽게 이어집니다.",
      completion: "금액과 범위가 바로 설명 가능한 상태면 충분합니다.",
      primary: buildStageRouteAction("설명 초안 단계로 이동", "draft"),
      secondary: buildStageScrollAction("변경 견적 카드 다시 보기", "quote-card")
    };
  }

  if (workflowScreen === "draft") {
    if (terminal) {
      return {
        badge: "완료",
        tone: "tone-good",
        title: "이 작업 건은 이미 마무리된 상태입니다.",
        copy: "지금은 초안 생성보다 확인과 합의 기록을 다시 보는 편이 더 적합합니다.",
        completion: "합의 메모와 타임라인이 남아 있으면 충분합니다.",
        primary: buildStageRouteAction("확인과 합의 단계로 이동", "confirm"),
        secondary: buildStageRouteAction("전체 보기로 돌아가기", "overview")
      };
    }

    if (!hasQuote) {
      return {
        badge: "선행 단계 필요",
        tone: "tone-warning",
        title: "먼저 견적 정리부터 마쳐 주세요.",
        copy: "설명 초안은 변경 금액과 범위가 먼저 정리돼야 자연스럽고 정확하게 만들어집니다.",
        completion: "변경 금액이 저장되면 이 단계로 다시 넘어오면 됩니다.",
        primary: buildStageRouteAction("변경 견적 단계로 이동", "quote"),
        secondary: null
      };
    }

    if (!hasDraft) {
      return {
        badge: "초안 필요",
        tone: "tone-warning",
        title: "고객에게 보낼 문장을 먼저 만들어 주세요.",
        copy: "고객이 바로 이해할 수 있는 문장을 준비해 두면 확인 링크와 합의 기록이 훨씬 자연스럽습니다.",
        completion: "복사해서 바로 보낼 수 있는 초안이 있으면 충분합니다.",
        primary: buildStageScrollAction("설명 초안 카드 보기", "draft-card"),
        secondary: buildStageRouteAction("변경 견적 다시 보기", "quote")
      };
    }

    return {
      badge: "초안 준비됨",
      tone: "tone-good",
      title: "설명 초안이 준비됐습니다.",
      copy: "이제 고객 확인과 합의 단계로 넘어가 최종 상태를 남기면 됩니다.",
      completion: "초안이 있고 고객에게 바로 전달 가능한 문장이면 충분합니다.",
      primary: buildStageRouteAction("확인과 합의 단계로 이동", "confirm"),
      secondary: buildStageScrollAction("설명 초안 카드 다시 보기", "draft-card")
    };
  }

  if (terminal) {
    return {
      badge: status === "AGREED" ? "완료" : "종료",
      tone: status === "AGREED" ? "tone-good" : "tone-neutral",
      title: status === "AGREED" ? "합의가 완료된 작업 건입니다." : "작업 제외로 마무리된 작업 건입니다.",
      copy: "추가 조치보다 합의 메모, 고객 반응, 타임라인이 충분히 남아 있는지 다시 보는 용도로 활용하면 됩니다.",
      completion: "최종 상태를 한 줄로 설명할 수 있으면 충분합니다.",
      primary: buildStageScrollAction("합의 기록 다시 보기", "agreement-card"),
      secondary: buildStageScrollAction("타임라인 보기", "timeline-card")
    };
  }

  if (!hasQuote) {
    return {
      badge: "선행 단계 필요",
      tone: "tone-warning",
      title: "먼저 변경 견적부터 정리해 주세요.",
      copy: "확인과 합의 단계는 금액이 정리된 뒤에 들어오는 것이 가장 안정적입니다.",
      completion: "변경 금액이 저장되면 이 단계로 다시 오면 됩니다.",
      primary: buildStageRouteAction("변경 견적 단계로 이동", "quote"),
      secondary: null
    };
  }

  if (!hasDraft) {
    return {
      badge: "선행 단계 필요",
      tone: "tone-warning",
      title: "먼저 고객 설명 초안을 준비해 주세요.",
      copy: "확인 링크 발급이나 합의 기록 전에 초안이 있으면 고객과의 마지막 소통이 더 자연스럽습니다.",
      completion: "고객에게 바로 보낼 수 있는 문장이 준비되면 충분합니다.",
      primary: buildStageRouteAction("설명 초안 단계로 이동", "draft"),
      secondary: null
    };
  }

  if (status === "ON_HOLD") {
    return {
      badge: "보류",
      tone: "tone-warning",
      title: "답변을 기다리는 상태입니다.",
      copy: "보류 사유와 마지막 반응만 최신으로 남겨 두면 다음 응대가 훨씬 쉬워집니다.",
      completion: "지금 왜 기다리는지와 다음 액션을 한 줄로 설명할 수 있으면 충분합니다.",
      primary: buildStageScrollAction("합의 기록 카드 보기", "agreement-card"),
      secondary: buildStageScrollAction("타임라인 보기", "timeline-card")
    };
  }

  if (!hasConfirmationLink) {
    return {
      badge: "링크 필요",
      tone: "tone-warning",
      title: "고객 확인 링크 또는 합의 기록을 정리해 주세요.",
      copy: "설명은 끝났습니다. 고객이 직접 확인할 링크를 열거나, 이미 확인을 받았다면 합의 기록으로 바로 마무리하면 됩니다.",
      completion: "확인 경로가 열리거나 합의 상태가 최신으로 정리되면 충분합니다.",
      primary: buildStageScrollAction("고객 확인 카드 보기", "customer-confirm-card"),
      secondary: buildStageScrollAction("합의 기록 카드 보기", "agreement-card")
    };
  }

  return {
    badge: "마무리",
    tone: "tone-neutral",
    title: "고객 확인 상태와 합의 기록을 함께 정리해 주세요.",
    copy: "이미 확인 링크는 발급됐습니다. 이제 고객 반응, 마지막 메모, 합의 상태를 같은 흐름으로 정리하면 됩니다.",
    completion: "링크 상태와 합의 메모가 서로 맞고, 마지막 상태를 설명할 수 있으면 충분합니다.",
    primary: buildStageScrollAction("합의 기록 카드 보기", "agreement-card"),
    secondary: buildStageScrollAction("고객 확인 카드 보기", "customer-confirm-card")
  };
}

function renderStageAction(snapshot) {
  if (!elements.stageActionCard) {
    return;
  }

  const action = buildStageActionSnapshot(snapshot);
  if (!action) {
    elements.stageActionCard.classList.add("hidden");
    setStageActionButton(elements.stageActionPrimary, null);
    setStageActionButton(elements.stageActionSecondary, null);
    return;
  }

  elements.stageActionCard.classList.remove("hidden");
  elements.stageActionBadge.textContent = action.badge;
  elements.stageActionBadge.className = `ops-badge ${action.tone}`;
  elements.stageActionTitle.textContent = action.title;
  elements.stageActionCopy.textContent = action.copy;
  elements.stageActionCompletion.textContent = action.completion;
  setStageActionButton(elements.stageActionPrimary, action.primary);
  setStageActionButton(elements.stageActionSecondary, action.secondary);
}

function renderOpsReturnContext(snapshot) {
  if (!elements.opsReturnCard) {
    return;
  }

  const context = buildOpsReturnContext(snapshot);
  if (!context) {
    elements.opsReturnCard.classList.add("hidden");
    setOpsTargetHighlight(null);
    return;
  }

  elements.opsReturnCard.classList.remove("hidden");
  elements.opsReturnBadge.textContent = context.badge;
  elements.opsReturnBadge.className = `ops-badge ${context.tone}`;
  elements.opsReturnTitle.textContent = context.title;
  if (elements.opsReturnWhy) {
    elements.opsReturnWhy.textContent = context.whyNow || "지금 먼저 보는 이유를 여기서 짧게 안내합니다.";
  }
  elements.opsReturnCopy.textContent = context.copy;
  elements.opsReturnMeta.innerHTML = context.meta
    .map((item) => `<span class="ops-return-meta-pill">${item}</span>`)
    .join("");
  if (elements.opsReturnSteps) {
    const execution = context.execution || buildOpsExecutionChecklist(opsFocusReason, context.targetId);
    elements.opsReturnSteps.innerHTML = `
      <div class="ops-return-step">
        <span class="ops-return-step-label">먼저</span>
        <strong>${execution.first}</strong>
      </div>
      <div class="ops-return-step">
        <span class="ops-return-step-label">다음</span>
        <strong>${execution.next}</strong>
      </div>
      <div class="ops-return-step">
        <span class="ops-return-step-label">완료 기준</span>
        <strong>${execution.doneWhen}</strong>
      </div>
    `;
  }
  elements.opsReturnAction.textContent = context.actionLabel;
  elements.opsReturnAction.dataset.target = context.targetId;
  setOpsTargetHighlight(context.targetId);
}

function renderWorkflowState() {
  const snapshot = buildWorkflowSnapshot();
  elements.progressTitle.textContent = snapshot.progressTitle;
  elements.progressCopy.textContent = snapshot.progressCopy;
  elements.nextActionHint.textContent = snapshot.nextAction;
  elements.workspaceNextStep.textContent = snapshot.workspaceNextTitle;
  elements.workspaceNextStepCopy.textContent = snapshot.workspaceNextCopy;
  elements.workspaceSelectionSummary.textContent = snapshot.selectionTitle;
  elements.workspaceSelectionCopy.textContent = snapshot.selectionCopy;
  elements.caseFocusStage.textContent = snapshot.focusBadge;
  elements.caseFocusStage.className = `ops-badge ${snapshot.focusTone}`;
  elements.caseFocusTitle.textContent = snapshot.focusTitle;
  elements.caseFocusCopy.textContent = snapshot.focusCopy;
  if (elements.agreementStageNote) {
    elements.agreementStageNote.textContent = snapshot.agreementNote;
  }
  renderStageAction(snapshot);
  renderWorkflowBanner(snapshot);
  renderPriorityList(snapshot.priorityItems);
  renderCaseProgress(snapshot);
  renderOpsReturnContext(snapshot);
}

function renderReviewState() {
  if (!reviewMode) {
    return;
  }
  const settleReviewFrame = () => {
    if (reviewMode === "agreement") {
      scrollToSection("agreement-card", false);
      return;
    }
    if (reviewMode === "copy") {
      scrollToSection("draft-card", false);
      setCopyHint("복사 버튼과 안내 문구를 실제 사용 기준으로 점검하는 화면입니다.", true);
      return;
    }
    if (reviewMode === "ops-return") {
      scrollToSection("ops-return-card", false);
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  window.scrollTo({ top: 0, behavior: "auto" });
  window.requestAnimationFrame(() => {
    settleReviewFrame();
    window.setTimeout(settleReviewFrame, 120);
  });
}

function renderCustomerConfirmationState(detail) {
  const latest = detail?.latestCustomerConfirmationLink || null;
  const isTerminal = isTerminalStatus(detail?.currentStatus);
  const badgeState = getConfirmationBadgeState(detail);
  const hasUrl = Boolean(state.latestConfirmationUrl);

  if (elements.customerConfirmBadge) {
    elements.customerConfirmBadge.textContent = badgeState.label;
    elements.customerConfirmBadge.className = `ops-badge ${badgeState.tone}`;
  }

  if (!detail) {
    elements.customerConfirmSummary.textContent = "작업 건을 선택하면 고객 확인 링크 상태를 여기서 바로 보여줍니다.";
    elements.customerConfirmMeta.textContent = "링크 발급, 고객 열람, 확인 완료 여부가 여기와 타임라인에 함께 반영됩니다.";
    elements.customerConfirmGuidance.textContent = "금액과 설명이 준비되면 확인 링크를 발급하고, 완료되면 기록 확인용으로만 다시 보면 됩니다.";
    elements.customerConfirmUrl.value = "";
    elements.openConfirmLink.classList.add("hidden");
    elements.openConfirmLink.href = "#";
    return;
  }

  if (!latest) {
    elements.customerConfirmSummary.textContent = isTerminal
      ? "이 작업 건은 이미 마무리된 상태입니다. 고객 확인 링크는 선택 사항이었고, 지금은 기록 확인용으로만 보면 됩니다."
      : "설명 초안과 금액이 준비되면 고객 확인 링크를 발급할 수 있습니다.";
    elements.customerConfirmMeta.textContent = isTerminal
      ? "별도 링크 이력은 없습니다. 합의 기록과 타임라인만 다시 확인하면 충분합니다."
      : "고객이 링크를 열거나 확인을 남기면 여기와 타임라인에 상태가 반영됩니다.";
    elements.customerConfirmGuidance.textContent = isTerminal
      ? "추가 조치는 없습니다. 필요하면 금액, 메모, 타임라인을 내부 공유용으로만 확인해 주세요."
      : "설명을 전달한 뒤 링크를 발급하면 고객이 실제로 확인했는지 흐름을 더 분명하게 남길 수 있습니다.";
  } else if (latest.status === "CONFIRMED") {
    elements.customerConfirmSummary.textContent = "고객 확인이 완료됐습니다. 링크 흐름은 끝났고, 이제는 증빙과 다시 보기 용도로만 남아 있습니다.";
    elements.customerConfirmMeta.textContent = [
      latest.viewedAt ? `열람 ${formatDateTime(latest.viewedAt)}` : "열람 시각 없음",
      latest.confirmedAt ? `확인 완료 ${formatDateTime(latest.confirmedAt)}` : "확인 완료 시각 없음"
    ].join(" · ");
    elements.customerConfirmGuidance.textContent = isTerminal
      ? "합의 완료 또는 작업 제외까지 끝났다면 추가 조치는 없습니다. 링크와 타임라인을 기록 확인용으로만 보시면 됩니다."
      : "확인 링크는 완료됐습니다. 이제 합의 상태와 메모를 마지막으로 정리하면 흐름이 닫힙니다.";
  } else if (latest.status === "VIEWED") {
    elements.customerConfirmSummary.textContent = "고객이 링크를 열람했습니다. 최종 확인 완료나 합의 상태만 정리하면 됩니다.";
    elements.customerConfirmMeta.textContent = [
      latest.viewedAt ? `열람 ${formatDateTime(latest.viewedAt)}` : "열람 시각 없음",
      `만료 ${formatDateTime(latest.expiresAt)}`
    ].join(" · ");
    elements.customerConfirmGuidance.textContent = "고객이 이미 내용을 봤습니다. 현장 통화나 메시지 답변을 받은 뒤 합의 기록만 이어서 남겨 주세요.";
  } else {
    elements.customerConfirmSummary.textContent = `최근 링크 상태: 발급됨 · 만료 ${formatDateTime(latest.expiresAt)}`;
    elements.customerConfirmMeta.textContent = "아직 고객 열람 기록이 없습니다. 링크를 보냈다면 열람 여부를 조금 더 지켜보면 됩니다.";
    elements.customerConfirmGuidance.textContent = "링크를 전달한 뒤에는 고객이 열었는지, 그리고 합의 상태가 어떻게 끝났는지를 이 카드와 타임라인에서 같이 확인합니다.";
  }

  elements.customerConfirmUrl.value = state.latestConfirmationUrl || "";
  elements.openConfirmLink.classList.toggle("hidden", !hasUrl);
  elements.openConfirmLink.href = hasUrl ? state.latestConfirmationUrl : "#";
}

function syncActionState() {
  const hasFieldRecord = Boolean(state.currentFieldRecordId);
  const detail = state.selectedJobCaseDetail;
  const hasSelectedJobCase = Boolean(state.selectedJobCaseId && detail);
  const hasQuote = hasStoredQuote(detail);
  const hasDraft = Boolean(detail?.latestDraftMessage?.body);
  const hasConfirmationLink = Boolean(state.latestConfirmationUrl);
  const terminal = isTerminalStatus(detail?.currentStatus);

  elements.createJobCase.disabled = !hasFieldRecord;
  elements.saveQuote.disabled = !hasSelectedJobCase || terminal;
  elements.revisedQuoteAmount.disabled = !hasSelectedJobCase || terminal;
  elements.generateDraft.disabled = !hasSelectedJobCase || !hasQuote || terminal;
  elements.copyDraft.disabled = !hasDraft;
  elements.generateConfirmLink.disabled = !(hasSelectedJobCase && hasQuote && hasDraft) || terminal;
  elements.copyConfirmLink.disabled = !hasConfirmationLink;
  elements.saveAgreement.disabled = !hasSelectedJobCase || terminal;
  elements.agreementStatus.disabled = !hasSelectedJobCase || terminal;
  elements.confirmationChannel.disabled = !hasSelectedJobCase || terminal;
  elements.confirmedAt.disabled = !hasSelectedJobCase || terminal;
  elements.confirmedAmount.disabled = !hasSelectedJobCase || terminal;
  elements.customerResponseNote.disabled = !hasSelectedJobCase || terminal;
  elements.detailJump.classList.toggle("hidden", !hasSelectedJobCase);

  if (terminal) {
    const terminalLabel = detail.currentStatus === "AGREED" ? "합의 완료" : "작업 제외";
    elements.nextActionHint.textContent = `${terminalLabel} 상태입니다. 지금 화면은 기록 다시 보기와 내부 공유용으로 사용하면 됩니다.`;
  }
}

function scrollDetailIntoView() {
  if (window.innerWidth <= 1280) {
    elements.detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function scrollToSection(targetId, smooth = true) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }
  const jumpOffset = window.innerWidth <= 720 ? (elements.detailJump?.offsetHeight || 0) + 16 : 12;
  const rect = target.getBoundingClientRect();
  const nextTop = rect.top + window.scrollY - jumpOffset;
  window.scrollTo({ top: Math.max(nextTop, 0), behavior: smooth ? "smooth" : "auto" });
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    textarea.remove();
  }

  if (!copied) {
    throw new Error("브라우저 복사 권한을 확인해 주세요.");
  }
}

async function refreshSessionCookie() {
  const response = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    credentials: "same-origin"
  });
  if (!response.ok) {
    throw new Error("세션을 다시 시작해 주세요.");
  }
}

async function request(url, options = {}, allowRetry = true) {
  const method = options.method || "GET";
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...buildAuthHeaders(options.headers || {}, method)
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && allowRetry) {
      try {
        await refreshSessionCookie();
        return request(url, options, false);
      } catch {
        redirectToLogin("session-expired");
        throw new Error("세션이 만료되었습니다.");
      }
    }
    throw new Error(payload?.error?.message || "요청을 처리하지 못했습니다.");
  }

  return payload;
}

async function loadHealth() {
  if (reviewMode) {
    return;
  }

  try {
    const payload = await request("/api/v1/health");
    if (payload?.status === "ok") {
      showFeedback(elements.fieldRecordFeedback, `운영 상태를 불러왔습니다. 현재 작업 건 ${payload.counts.jobCases}건입니다.`, "success");
      updateWorkspaceMeta(payload);
    }
  } catch {
    updateWorkspaceMeta(null);
    showFeedback(elements.fieldRecordFeedback, "운영 상태를 불러오지 못했습니다. 세션이나 서버 상태를 확인해 주세요.", "error");
  }
}

async function loadJobCases() {
  const params = new URLSearchParams({
    status: state.filterStatus,
    query: state.query
  });
  const payload = await request(`/api/v1/job-cases?${params.toString()}`);
  state.jobCases = payload.items;
  if (state.selectedJobCaseId && !state.jobCases.some((item) => item.id === state.selectedJobCaseId)) {
    state.selectedJobCaseId = null;
  }
  syncUrlState();
  syncWorkflowRouteLinks();
  renderJobCases();
  renderLinkCandidates();

  if (state.selectedJobCaseId && state.jobCases.length > 0) {
    renderJobCases();
    await loadJobCaseDetail(state.selectedJobCaseId);
    if (navigationSource === "ops" && !reviewMode) {
      showFeedback(elements.detailFeedback, "운영 콘솔에서 이어진 작업 건입니다. 여기서 기록과 합의 상태를 바로 확인할 수 있습니다.", "success");
    }
    return;
  }

  const shouldAutoselectFirstCase =
    !state.selectedJobCaseId
    && state.jobCases.length > 0
    && (workflowScreen !== "capture" || reviewMode || window.innerWidth >= 1280);

  if (shouldAutoselectFirstCase) {
    state.selectedJobCaseId = state.jobCases[0].id;
    syncUrlState();
    syncWorkflowRouteLinks();
    renderJobCases();
    await loadJobCaseDetail(state.selectedJobCaseId);
  }
}

function renderJobCases() {
  if (state.jobCases.length === 0) {
    elements.jobCases.innerHTML = '<div class="empty-state">조건에 맞는 작업 건이 없습니다. 첫 작업 건을 만들어 흐름을 시작해 주세요.</div>';
    return;
  }

  elements.jobCases.innerHTML = state.jobCases
    .map((item) => `
      <article class="job-card ${state.selectedJobCaseId === item.id ? "active" : ""}" data-job-case-id="${item.id}">
        <div class="job-card-header">
          <div>
            <strong>${item.customerLabel}</strong>
            <p>${item.siteLabel}</p>
          </div>
          <span class="status-badge ${item.currentStatus}">${statusLabels[item.currentStatus] || item.currentStatus}</span>
        </div>
        <div class="job-card-meta-row">
          ${buildJobCardMetaPills(item)
            .map((pill) => `<span class="job-card-meta-pill ${pill.tone}">${pill.label}</span>`)
            .join("")}
        </div>
        <p class="job-card-emphasis">${getListActionLabel(item)}</p>
        <p>최근 이슈 · ${describeReason(item)}</p>
        <p class="job-card-footnote">원래 ${formatMoney(item.originalQuoteAmount)} / 변경 ${formatMoney(item.revisedQuoteAmount)} · ${formatDateTime(item.updatedAt)}</p>
      </article>
    `)
    .join("");

  elements.jobCases.querySelectorAll(".job-card").forEach((card) => {
    card.addEventListener("click", async () => {
      state.selectedJobCaseId = card.dataset.jobCaseId;
      syncUrlState();
      syncWorkflowRouteLinks();
      renderJobCases();
      await loadJobCaseDetail(state.selectedJobCaseId);
      scrollDetailIntoView();
    });
  });
}

function renderLinkCandidates() {
  const query = elements.jobCaseSearch.value.trim().toLowerCase();
  const filtered = state.jobCases.filter((item) => !query || item.customerLabel.toLowerCase().includes(query) || item.siteLabel.toLowerCase().includes(query));

  if (!state.currentFieldRecordId) {
    elements.linkJobCases.innerHTML = '<p class="helper-text">현장 기록을 먼저 저장하면 여기서 기존 작업 건을 연결할 수 있습니다.</p>';
    return;
  }

  if (filtered.length === 0) {
    elements.linkJobCases.innerHTML = '<p class="helper-text">검색 조건에 맞는 작업 건이 없습니다.</p>';
    return;
  }

  elements.linkJobCases.innerHTML = filtered
    .map((item) => `
      <article class="job-card">
        <div class="job-card-header">
          <div>
            <strong>${item.customerLabel}</strong>
            <p>${item.siteLabel}</p>
          </div>
          <span class="status-badge ${item.currentStatus}">${statusLabels[item.currentStatus] || item.currentStatus}</span>
        </div>
        <button class="secondary-button" type="button" data-link-job-case-id="${item.id}">이 작업 건에 연결</button>
      </article>
    `)
    .join("");

  elements.linkJobCases.querySelectorAll("[data-link-job-case-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      setBusy(button, true, "연결 중...");
      try {
        await request(`/api/v1/field-records/${state.currentFieldRecordId}/link-job-case`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobCaseId: button.dataset.linkJobCaseId })
        });
        showFeedback(elements.fieldRecordFeedback, "현장 기록을 기존 작업 건에 연결했습니다.", "success");
        state.selectedJobCaseId = button.dataset.linkJobCaseId;
        syncUrlState();
        syncWorkflowRouteLinks();
        await loadJobCases();
        await loadJobCaseDetail(state.selectedJobCaseId);
        if (workflowScreen === "capture") {
          window.location.href = buildWorkflowRouteHref("quote", state.selectedJobCaseId);
          return;
        }
        scrollDetailIntoView();
      } catch (error) {
        showFeedback(elements.fieldRecordFeedback, error.message, "error");
      } finally {
        setBusy(button, false, "이 작업 건에 연결");
      }
    });
  });
}

function renderFieldRecords(records) {
  elements.fieldRecordsDetail.innerHTML = records.length === 0
    ? '<div class="empty-state">연결된 현장 기록이 아직 없습니다.</div>'
    : records.map((record) => `
        <article class="record-card">
          <div class="record-card-topline">
            <strong>현장 사유 · ${reasonLabels[record.secondaryReason] || reasonLabels[record.primaryReason] || "기타"}</strong>
            <span class="record-card-time">${formatDateTime(record.createdAt)}</span>
          </div>
          <p class="record-card-note">${record.note || "메모가 없습니다."}</p>
          <p class="record-card-meta">사진 ${record.photos.length}장</p>
          <div class="record-photos">
            ${record.photos.map((photo) => `<img src="${photo.url}" alt="현장 사진" />`).join("")}
          </div>
        </article>
      `).join("");
}

function renderTimeline(items) {
  elements.timeline.innerHTML = items.length === 0
    ? '<div class="empty-state">아직 남은 타임라인 이벤트가 없습니다.</div>'
    : items.map((item) => `
        <article class="timeline-item">
          <div class="timeline-item-topline">
            <strong>${describeTimelineTitle(item)}</strong>
            <span class="timeline-item-time">${formatDateTime(item.createdAt)}</span>
          </div>
          <p class="timeline-item-body">${item.summary || "요약 메모가 없습니다."}</p>
          <span class="timeline-item-meta">이벤트 코드 · ${item.eventType || "UNKNOWN"}</span>
        </article>
      `).join("");

  elements.timelineSummaryCopy.textContent = items.length === 0
    ? "최근 작업 흐름이 아직 없습니다. 첫 저장부터 타임라인이 차례대로 쌓입니다."
    : isTerminalStatus(state.selectedJobCaseDetail?.currentStatus)
      ? `완료된 작업 건의 근거 기록 ${items.length}건이 시간순으로 정리되어 있습니다.`
      : `최근 흐름 ${items.length}건이 시간순으로 정리되어 있습니다.`;
  elements.timelineCountBadge.textContent = `${items.length}건`;
  elements.timelineCountBadge.className = `status-badge ${items.length ? "EXPLAINED" : "neutral"}`;
  elements.timelineRail.classList.toggle("is-bounded", items.length > 5);
}

function fillAgreementForm(detail) {
  const latest = detail.latestAgreementRecord;
  elements.agreementStatus.value = latest?.status || (["EXPLAINED", "AGREED", "ON_HOLD", "EXCLUDED"].includes(detail.currentStatus) ? detail.currentStatus : "");
  elements.confirmationChannel.value = latest?.confirmationChannel || "";
  elements.confirmedAt.value = latest?.confirmedAt ? toDateTimeLocal(latest.confirmedAt) : "";
  elements.confirmedAmount.value = latest?.confirmedAmount ?? detail.revisedQuoteAmount ?? "";
  elements.customerResponseNote.value = latest?.customerResponseNote || "";
  setDefaultConfirmedAt();
}

async function loadJobCaseDetail(jobCaseId) {
  const [detail, timeline, scope] = await Promise.all([
    request(`/api/v1/job-cases/${jobCaseId}`),
    request(`/api/v1/job-cases/${jobCaseId}/timeline`),
    request(`/api/v1/job-cases/${jobCaseId}/scope-comparison`).catch(() => null)
  ]);

  state.selectedJobCaseDetail = {
    ...detail,
    scopeComparison: scope || detail.scopeComparison || null
  };
  state.selectedTimelineItems = timeline.items || [];
  state.latestConfirmationUrl = detail.latestCustomerConfirmationLink?.confirmationUrl || "";
  syncUrlState();
  syncWorkflowRouteLinks();

  elements.detailEmpty.classList.add("hidden");
  elements.detailContent.classList.remove("hidden");
  elements.detailTitle.textContent = detail.customerLabel;
  elements.detailStatus.textContent = statusLabels[detail.currentStatus] || detail.currentStatus;
  elements.detailStatus.className = `status-badge ${detail.currentStatus}`;
  elements.metricOriginal.textContent = formatMoney(detail.originalQuoteAmount);
  elements.metricRevised.textContent = formatMoney(detail.revisedQuoteAmount);
  elements.metricDelta.textContent = detail.quoteDeltaAmount == null ? "-" : `${detail.quoteDeltaAmount >= 0 ? "+" : ""}${formatMoney(detail.quoteDeltaAmount)}`;
  elements.revisedQuoteAmount.value = detail.revisedQuoteAmount ?? "";

  const scopePayload = state.selectedJobCaseDetail.scopeComparison || {};
  elements.scopeBase.textContent = scopePayload.baseScopeSummary || "기본 입주청소 범위를 기준으로 보시면 됩니다.";
  elements.scopeExtra.textContent = scopePayload.extraWorkSummary || "추가 작업이 아직 정리되지 않았습니다.";
  elements.scopeReason.textContent = scopePayload.reasonWhyExtra || "현장 기록과 변경 금액을 저장하면 범위 설명이 더 또렷해집니다.";

  elements.draftBody.textContent = detail.latestDraftMessage?.body || "설명 초안이 아직 없습니다. 변경 금액을 저장한 뒤 초안을 만들어 주세요.";
  setCopyHint("설명 초안을 복사하면 카카오톡이나 문자로 바로 전달할 수 있습니다.", false);
  renderCustomerConfirmationState(detail);
  renderFieldRecords(detail.fieldRecords);
  renderTimeline(timeline.items);
  fillAgreementForm(detail);
  renderWorkflowState();
  syncActionState();
  renderReviewState();

  const workflowTargetId = getWorkflowScreenTargetId();
  if (workflowTargetId && !reviewMode) {
    window.requestAnimationFrame(() => {
      scrollToSection(workflowTargetId, false);
    });
  }
}

elements.fieldRecordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData();
  const photos = document.querySelector("#photos").files;
  Array.from(photos).forEach((file) => formData.append("photos[]", file));
  formData.append("primaryReason", document.querySelector("#primaryReason").value);
  formData.append("secondaryReason", document.querySelector("#secondaryReason").value);
  formData.append("note", document.querySelector("#note").value);

  setBusy(elements.saveFieldRecord, true, "저장 중...");
  try {
    const payload = await request("/api/v1/field-records", { method: "POST", body: formData });
    state.currentFieldRecordId = payload.id;
    elements.currentFieldRecordLabel.textContent = `현재 현장 기록: ${payload.id}`;
    showFeedback(elements.fieldRecordFeedback, "현장 기록을 저장했습니다. 이제 작업 건을 만들거나 연결해 주세요.", "success");
    renderLinkCandidates();
    syncActionState();
  } catch (error) {
    showFeedback(elements.fieldRecordFeedback, error.message, "error");
  } finally {
    setBusy(elements.saveFieldRecord, false, "현장 기록 저장");
  }
});

elements.jobCaseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.currentFieldRecordId) {
    showFeedback(elements.fieldRecordFeedback, "먼저 현장 기록을 저장해 주세요.", "error");
    return;
  }

  const payload = {
    customerLabel: document.querySelector("#customerLabel").value,
    contactMemo: document.querySelector("#contactMemo").value,
    siteLabel: document.querySelector("#siteLabel").value,
    originalQuoteAmount: Number(document.querySelector("#originalQuoteAmount").value)
  };

  setBusy(elements.createJobCase, true, "생성 중...");
  try {
    const jobCase = await request("/api/v1/job-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    await request(`/api/v1/field-records/${state.currentFieldRecordId}/link-job-case`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobCaseId: jobCase.id })
    });
    state.selectedJobCaseId = jobCase.id;
    syncUrlState();
    syncWorkflowRouteLinks();
    showFeedback(elements.fieldRecordFeedback, "작업 건을 만들고 현장 기록까지 연결했습니다.", "success");
    await loadJobCases();
    await loadJobCaseDetail(jobCase.id);
    if (workflowScreen === "capture") {
      window.location.href = buildWorkflowRouteHref("quote", jobCase.id);
      return;
    }
    scrollDetailIntoView();
  } catch (error) {
    showFeedback(elements.fieldRecordFeedback, error.message, "error");
  } finally {
    setBusy(elements.createJobCase, false, "새 작업 건 만들고 연결");
  }
});

elements.quoteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedJobCaseId) {
    showFeedback(elements.detailFeedback, "먼저 작업 건을 선택해 주세요.", "error");
    return;
  }

  setBusy(elements.saveQuote, true, "저장 중...");
  try {
    await request(`/api/v1/job-cases/${state.selectedJobCaseId}/quote`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisedQuoteAmount: Number(elements.revisedQuoteAmount.value) })
    });
    showFeedback(elements.detailFeedback, "변경 견적을 저장했습니다.", "success");
    await loadJobCases();
    await loadJobCaseDetail(state.selectedJobCaseId);
    scrollToSection("quote-card");
  } catch (error) {
    showFeedback(elements.detailFeedback, error.message, "error");
  } finally {
    setBusy(elements.saveQuote, false, "금액 저장");
  }
});

elements.generateDraft.addEventListener("click", async () => {
  if (!state.selectedJobCaseId) {
    showFeedback(elements.detailFeedback, "먼저 작업 건을 선택해 주세요.", "error");
    return;
  }

  setBusy(elements.generateDraft, true, "생성 중...");
  try {
    await request(`/api/v1/job-cases/${state.selectedJobCaseId}/draft-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tone: "CUSTOMER_MESSAGE" })
    });
    showFeedback(elements.detailFeedback, "설명 초안을 생성했습니다.", "success");
    await loadJobCases();
    await loadJobCaseDetail(state.selectedJobCaseId);
    scrollToSection("draft-card");
  } catch (error) {
    showFeedback(elements.detailFeedback, error.message, "error");
  } finally {
    setBusy(elements.generateDraft, false, "설명 초안 생성");
  }
});

elements.copyDraft.addEventListener("click", async () => {
  const draft = state.selectedJobCaseDetail?.latestDraftMessage?.body;
  if (!draft) {
    showFeedback(elements.detailFeedback, "복사할 설명 초안이 아직 없습니다.", "error");
    return;
  }

  try {
    await copyTextToClipboard(draft);
    setCopyHint("설명 초안을 복사했습니다. 카카오톡이나 문자 입력창에 바로 붙여 넣을 수 있습니다.", true);
    elements.copyDraft.textContent = "복사됨";
    window.setTimeout(() => {
      elements.copyDraft.textContent = elements.copyDraft.dataset.defaultLabel || "초안 복사";
    }, 1400);
    showFeedback(elements.detailFeedback, "설명 초안을 복사했습니다.", "success");
  } catch {
    setCopyHint("브라우저에서 자동 복사가 막혀 있을 수 있습니다. 초안 본문을 직접 선택해 복사해 주세요.", true);
    showFeedback(elements.detailFeedback, "브라우저 복사 권한을 허용해 주세요.", "error");
  }
});

elements.generateConfirmLink.addEventListener("click", async () => {
  if (!state.selectedJobCaseId) {
    showFeedback(elements.detailFeedback, "먼저 작업 건을 선택해 주세요.", "error");
    return;
  }

  setBusy(elements.generateConfirmLink, true, "발급 중...");
  try {
    const payload = await request(`/api/v1/job-cases/${state.selectedJobCaseId}/customer-confirmation-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInHours: 72 })
    });
    state.latestConfirmationUrl = payload.confirmationUrl;
    await loadJobCaseDetail(state.selectedJobCaseId);
    state.latestConfirmationUrl = payload.confirmationUrl;
    renderCustomerConfirmationState(state.selectedJobCaseDetail);
    showFeedback(elements.detailFeedback, "고객 확인 링크를 발급했습니다.", "success");
    scrollToSection("customer-confirm-card");
  } catch (error) {
    showFeedback(elements.detailFeedback, error.message, "error");
  } finally {
    setBusy(elements.generateConfirmLink, false, "확인 링크 발급");
    syncActionState();
  }
});

elements.copyConfirmLink.addEventListener("click", async () => {
  if (!state.latestConfirmationUrl) {
    showFeedback(elements.detailFeedback, "먼저 고객 확인 링크를 발급해 주세요.", "error");
    return;
  }

  try {
    await copyTextToClipboard(state.latestConfirmationUrl);
    elements.copyConfirmLink.textContent = "복사됨";
    window.setTimeout(() => {
      elements.copyConfirmLink.textContent = elements.copyConfirmLink.dataset.defaultLabel || "링크 복사";
    }, 1400);
    showFeedback(elements.detailFeedback, "고객 확인 링크를 복사했습니다.", "success");
  } catch {
    showFeedback(elements.detailFeedback, "브라우저에서 링크 복사 권한을 허용해 주세요.", "error");
  }
});

elements.agreementForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedJobCaseId) {
    showFeedback(elements.detailFeedback, "먼저 작업 건을 선택해 주세요.", "error");
    return;
  }

  setBusy(elements.saveAgreement, true, "저장 중...");
  try {
    await request(`/api/v1/job-cases/${state.selectedJobCaseId}/agreement-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: elements.agreementStatus.value,
        confirmationChannel: elements.confirmationChannel.value,
        confirmedAt: elements.confirmedAt.value ? new Date(elements.confirmedAt.value).toISOString() : undefined,
        confirmedAmount: elements.confirmedAmount.value === "" ? undefined : Number(elements.confirmedAmount.value),
        customerResponseNote: elements.customerResponseNote.value
      })
    });
    showFeedback(elements.detailFeedback, "합의 기록을 저장했습니다.", "success");
    await loadJobCases();
    await loadJobCaseDetail(state.selectedJobCaseId);
    scrollToSection("agreement-card");
  } catch (error) {
    showFeedback(elements.detailFeedback, error.message, "error");
  } finally {
    setBusy(elements.saveAgreement, false, "합의 기록 저장");
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    filterButtons.forEach((chip) => chip.classList.toggle("active", chip === button));
    state.filterStatus = button.dataset.status;
    await loadJobCases();
  });
});

elements.listQuery.addEventListener("input", async () => {
  state.query = elements.listQuery.value;
  await loadJobCases();
});

elements.jobCaseSearch.addEventListener("input", () => {
  renderLinkCandidates();
});

elements.resetFieldRecord.addEventListener("click", () => {
  state.currentFieldRecordId = null;
  state.selectedJobCaseId = null;
  state.selectedJobCaseDetail = null;
  state.selectedTimelineItems = [];
  state.latestConfirmationUrl = "";
  elements.fieldRecordForm.reset();
  elements.jobCaseForm.reset();
  elements.currentFieldRecordLabel.textContent = "아직 저장된 현장 기록이 없습니다.";
  elements.detailTitle.textContent = "작업 건을 선택해 주세요";
  elements.detailStatus.textContent = "미선택";
  elements.detailStatus.className = "status-badge neutral";
  elements.detailContent.classList.add("hidden");
  elements.detailEmpty.classList.remove("hidden");
  elements.scopeBase.textContent = "기본 범위 요약을 불러오는 중입니다.";
  elements.scopeExtra.textContent = "추가 작업 요약을 불러오는 중입니다.";
  elements.scopeReason.textContent = "";
  elements.draftBody.textContent = "설명 초안을 아직 만들지 않았습니다.";
  elements.metricOriginal.textContent = "-";
  elements.metricRevised.textContent = "-";
  elements.metricDelta.textContent = "-";
  elements.fieldRecordsDetail.innerHTML = "";
  elements.timeline.innerHTML = "";
  elements.timelineSummaryCopy.textContent = "최근 작업 흐름과 확인 흔적을 시간순으로 보여줍니다.";
  elements.timelineCountBadge.textContent = "0건";
  elements.timelineCountBadge.className = "status-badge neutral";
  elements.timelineRail.classList.remove("is-bounded");
  setCopyHint("설명 초안을 복사하면 카카오톡이나 문자로 바로 전달할 수 있습니다.", false);
  renderCustomerConfirmationState(null);
  showFeedback(elements.fieldRecordFeedback, "", "");
  showFeedback(elements.detailFeedback, "", "");
  renderLinkCandidates();
  renderJobCases();
  syncUrlState();
  syncWorkflowRouteLinks();
  elements.agreementForm.reset();
  setDefaultConfirmedAt();
  syncActionState();
});

elements.detailJump.querySelectorAll("[data-target]").forEach((button) => {
  button.addEventListener("click", () => {
    scrollToSection(button.dataset.target);
  });
});

if (elements.opsReturnAction) {
  elements.opsReturnAction.addEventListener("click", () => {
    const targetId = elements.opsReturnAction.dataset.target;
    if (targetId) {
      scrollToSection(targetId);
    }
  });
}

[elements.stageActionPrimary, elements.stageActionSecondary].forEach((button) => {
  if (!button) {
    return;
  }
  button.addEventListener("click", () => {
    const actionType = button.dataset.actionType;
    const actionTarget = button.dataset.actionTarget;
    if (!actionType || !actionTarget) {
      return;
    }
    if (actionType === "scroll") {
      scrollToSection(actionTarget);
      return;
    }
    if (actionType === "route") {
      window.location.href = buildWorkflowRouteHref(actionTarget);
    }
  });
});

applyWorkflowScreenPresentation();
setDefaultConfirmedAt();
renderCustomerConfirmationState(null);
renderWorkflowState();
syncActionState();
loadHealth().catch(() => undefined);
loadJobCases().catch((error) => {
  showFeedback(elements.fieldRecordFeedback, error.message, "error");
});
