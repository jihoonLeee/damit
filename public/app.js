const CSRF_COOKIE_NAME = "faa_csrf";
const reviewMode = new URLSearchParams(window.location.search).get("review");

if (reviewMode) {
  document.body.classList.add(`review-${reviewMode}`);
}

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

const elements = {
  runtimeBadge: document.querySelector("#runtime-badge"),
  authBadge: document.querySelector("#auth-badge"),
  countsBadge: document.querySelector("#counts-badge"),
  workspaceTip: document.querySelector("#workspace-tip"),
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
  customerConfirmMeta: document.querySelector("#customer-confirm-meta"),
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
  saveAgreement: document.querySelector("#save-agreement"),
  fieldRecordsDetail: document.querySelector("#field-records-detail"),
  timeline: document.querySelector("#timeline")
};

const state = {
  filterStatus: "ALL",
  query: "",
  jobCases: [],
  currentFieldRecordId: null,
  selectedJobCaseId: null,
  selectedJobCaseDetail: null,
  latestConfirmationUrl: ""
};

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
  if (value == null || value === "") {
    return "-";
  }
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
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

function setDefaultConfirmedAt() {
  if (!elements.confirmedAt || elements.confirmedAt.value) {
    return;
  }
  const next = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  elements.confirmedAt.value = next;
}

function renderReviewState() {
  if (!reviewMode) {
    return;
  }
  window.requestAnimationFrame(() => {
    if (reviewMode === "agreement") {
      scrollToSection("agreement-card", false);
    }
    if (reviewMode === "copy") {
      scrollToSection("draft-card", false);
      setCopyHint("복사 버튼과 안내 문구를 실제 사용 기준으로 점검하는 화면입니다.", true);
    }
  });
}

function renderCustomerConfirmationState(detail) {
  const latest = detail?.latestCustomerConfirmationLink || null;
  elements.customerConfirmSummary.textContent = latest
    ? `최근 링크 상태: ${latest.status} · 만료 ${new Date(latest.expiresAt).toLocaleString("ko-KR")}`
    : "설명 초안과 금액이 준비되면 고객 확인 링크를 발급할 수 있습니다.";

  elements.customerConfirmMeta.textContent = latest
    ? [
        latest.viewedAt ? `열람 ${new Date(latest.viewedAt).toLocaleString("ko-KR")}` : "아직 고객이 링크를 열지 않았습니다.",
        latest.confirmedAt ? `확인 완료 ${new Date(latest.confirmedAt).toLocaleString("ko-KR")}` : "아직 확인 완료 기록이 없습니다."
      ].join(" · ")
    : "고객이 링크를 열거나 확인을 남기면 여기와 타임라인에 상태가 반영됩니다.";

  elements.customerConfirmUrl.value = state.latestConfirmationUrl || "";
  const hasUrl = Boolean(state.latestConfirmationUrl);
  elements.openConfirmLink.classList.toggle("hidden", !hasUrl);
  elements.openConfirmLink.href = hasUrl ? state.latestConfirmationUrl : "#";
}

function updateWorkspaceMeta(payload = null) {
  setMetaPill(elements.authBadge, "인증: 세션 로그인", "success");

  if (!payload) {
    setMetaPill(elements.runtimeBadge, "런타임: 확인 실패", "warning");
    setMetaPill(elements.countsBadge, "건수 정보: 확인 실패", "warning");
    elements.workspaceTip.textContent = "운영 상태를 다시 불러오지 못했습니다. 서버 연결 상태를 확인해 주세요.";
    return;
  }

  setMetaPill(elements.runtimeBadge, `런타임: ${payload.storageEngine || "unknown"}`, payload.storageEngine === "POSTGRES" ? "success" : "warning");
  setMetaPill(elements.countsBadge, `작업 ${payload.counts?.jobCases ?? 0}건 · 현장 기록 ${payload.counts?.fieldRecords ?? 0}건`, payload.counts?.jobCases ? "success" : "");
  elements.workspaceTip.textContent = payload.counts?.jobCases
    ? "현재 저장된 작업 건이 있습니다. 목록에서 바로 이어서 처리할 수 있습니다."
    : "아직 저장된 작업 건이 없습니다. 왼쪽의 현장 기록 입력부터 시작해 주세요.";
}

function syncActionState() {
  const hasFieldRecord = Boolean(state.currentFieldRecordId);
  const hasSelectedJobCase = Boolean(state.selectedJobCaseId);
  const detail = state.selectedJobCaseDetail;
  const hasQuote = Boolean(detail && Number.isInteger(detail.revisedQuoteAmount));
  const hasDraft = Boolean(detail?.latestDraftMessage?.body);
  const hasConfirmationLink = Boolean(state.latestConfirmationUrl);

  elements.createJobCase.disabled = !hasFieldRecord;
  elements.saveQuote.disabled = !hasSelectedJobCase;
  elements.generateDraft.disabled = !hasSelectedJobCase || !hasQuote;
  elements.copyDraft.disabled = !hasDraft;
  elements.generateConfirmLink.disabled = !(hasSelectedJobCase && hasQuote && hasDraft);
  elements.copyConfirmLink.disabled = !hasConfirmationLink;
  elements.saveAgreement.disabled = !hasSelectedJobCase;
  elements.detailJump.classList.toggle("hidden", !hasSelectedJobCase);

  if (!hasFieldRecord) {
    elements.progressTitle.textContent = "1. 현장 사진과 사유를 먼저 기록하세요";
    elements.progressCopy.textContent = "사진 1장 이상과 사유를 남기면 다음 단계로 자연스럽게 이어집니다.";
    elements.nextActionHint.textContent = "현장 기록을 저장하면 새 작업 건을 만들거나 기존 작업 건에 연결할 수 있습니다.";
    return;
  }

  if (!hasSelectedJobCase) {
    elements.progressTitle.textContent = "2. 작업 건에 연결하세요";
    elements.progressCopy.textContent = "방금 저장한 기록을 새 작업 건에 붙이거나 기존 작업 건에 연결하면 상세 화면으로 이어집니다.";
    elements.nextActionHint.textContent = "새 작업 건 생성 또는 기존 작업 건 연결 중 하나를 완료해 주세요.";
    return;
  }

  if (!hasQuote) {
    elements.progressTitle.textContent = "3. 변경 견적을 입력하세요";
    elements.progressCopy.textContent = "기본 범위와 추가 작업을 비교하려면 먼저 변경 금액이 필요합니다.";
    elements.nextActionHint.textContent = "상세 화면에서 변경 견적을 저장하면 설명 초안 생성으로 이어집니다.";
    return;
  }

  if (!hasDraft) {
    elements.progressTitle.textContent = "4. 고객 설명 초안을 생성하세요";
    elements.progressCopy.textContent = "설명 문장을 만든 뒤 카카오톡이나 문자로 바로 복사해서 전달할 수 있습니다.";
    elements.nextActionHint.textContent = "설명 초안을 만든 뒤 고객 확인 링크 또는 합의 기록으로 이어가세요.";
    return;
  }

  elements.progressTitle.textContent = "5. 고객 확인과 합의를 기록하세요";
  elements.progressCopy.textContent = "고객 확인 링크 또는 합의 기록으로 설명 근거와 의사결정을 남겨 주세요.";
  elements.nextActionHint.textContent = hasConfirmationLink
    ? "고객 확인 링크 상태와 합의 기록을 함께 보면서 타임라인을 정리해 주세요."
    : "고객 확인 링크를 발급하거나 바로 합의 기록을 남길 수 있습니다.";
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
  const alignToEnd = targetId === "timeline-card";
  const nextTop = alignToEnd
    ? rect.bottom + window.scrollY - window.innerHeight + 24
    : rect.top + window.scrollY - jumpOffset;
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
        window.location.href = "/login";
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
    showFeedback(elements.fieldRecordFeedback, "운영 상태를 불러오지 못했습니다. 서버 연결을 확인해 주세요.", "error");
  }
}

async function loadJobCases() {
  const params = new URLSearchParams({
    status: state.filterStatus,
    query: state.query
  });
  const payload = await request(`/api/v1/job-cases?${params.toString()}`);
  state.jobCases = payload.items;
  renderJobCases();
  renderLinkCandidates();

  if (!state.selectedJobCaseId && state.jobCases.length > 0 && (reviewMode || window.innerWidth >= 1280)) {
    state.selectedJobCaseId = state.jobCases[0].id;
    renderJobCases();
    await loadJobCaseDetail(state.selectedJobCaseId);
  }
}

function renderJobCases() {
  if (state.jobCases.length === 0) {
    elements.jobCases.innerHTML = '<div class="empty-state">아직 열린 작업 건이 없습니다. 왼쪽에서 현장 기록부터 시작해 주세요.</div>';
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
        <p>최근 이슈 · ${describeReason(item)}</p>
        <p>견적 · 원래 ${formatMoney(item.originalQuoteAmount)} / 변경 ${formatMoney(item.revisedQuoteAmount)}</p>
        <p>${item.hasAgreementRecord ? "합의 기록이 있습니다" : "아직 합의 기록이 없습니다"} · 최근 업데이트 ${new Date(item.updatedAt).toLocaleString("ko-KR")}</p>
      </article>
    `)
    .join("");

  elements.jobCases.querySelectorAll(".job-card").forEach((card) => {
    card.addEventListener("click", async () => {
      state.selectedJobCaseId = card.dataset.jobCaseId;
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
    elements.linkJobCases.innerHTML = '<p class="helper-text">현장 기록을 저장하면 연결 가능한 작업 건이 여기에 표시됩니다.</p>';
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
        showFeedback(elements.fieldRecordFeedback, "기존 작업 건에 연결했습니다.", "success");
        state.selectedJobCaseId = button.dataset.linkJobCaseId;
        await loadJobCases();
        await loadJobCaseDetail(state.selectedJobCaseId);
        scrollDetailIntoView();
      } catch (error) {
        showFeedback(elements.fieldRecordFeedback, error.message, "error");
      } finally {
        setBusy(button, false, "연결 중...");
      }
    });
  });
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
  state.latestConfirmationUrl = detail.latestCustomerConfirmationLink?.confirmationUrl || state.latestConfirmationUrl || "";

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
  elements.scopeBase.textContent = scopePayload.baseScopeSummary || "기본 포함 범위 요약이 아직 없습니다.";
  elements.scopeExtra.textContent = scopePayload.extraWorkSummary || "추가 작업 요약이 아직 없습니다.";
  elements.scopeReason.textContent = scopePayload.reasonWhyExtra || "";

  elements.draftBody.textContent = detail.latestDraftMessage?.body || "설명 초안을 아직 만들지 않았습니다.";
  setCopyHint("초안을 복사하면 카카오톡이나 문자로 바로 붙여 넣어 설명할 수 있습니다.", false);
  renderCustomerConfirmationState(detail);

  elements.fieldRecordsDetail.innerHTML = detail.fieldRecords.length === 0
    ? '<div class="empty-state">이 작업 건에 연결된 현장 기록이 아직 없습니다.</div>'
    : detail.fieldRecords.map((record) => `
        <article class="record-card">
          <strong>확인 사유 · ${reasonLabels[record.secondaryReason] || reasonLabels[record.primaryReason] || "사유 확인 필요"}</strong>
          <p>${record.note || "메모 없이 저장된 현장 기록입니다."}</p>
          <p>기록 시각 · ${new Date(record.createdAt).toLocaleString("ko-KR")}</p>
          <div class="record-photos">
            ${record.photos.map((photo) => `<img src="${photo.url}" alt="현장 기록 사진" />`).join("")}
          </div>
        </article>
      `).join("");

  elements.timeline.innerHTML = timeline.items.length === 0
    ? '<div class="empty-state">아직 남은 타임라인 항목이 없습니다.</div>'
    : timeline.items.map((item) => `
        <article class="timeline-item">
          <strong>${describeTimelineTitle(item)}</strong>
          <p>${item.summary || "요약 정보가 없습니다."}</p>
          <span>${new Date(item.createdAt).toLocaleString("ko-KR")}</span>
        </article>
      `).join("");

  syncActionState();
  renderReviewState();
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
    elements.currentFieldRecordLabel.textContent = `저장된 현장 기록: ${payload.id}`;
    showFeedback(elements.fieldRecordFeedback, "현장 기록을 저장했습니다.", "success");
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
    showFeedback(elements.fieldRecordFeedback, "새 작업 건을 만들고 현장 기록을 연결했습니다.", "success");
    await loadJobCases();
    await loadJobCaseDetail(jobCase.id);
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
        confirmedAmount: elements.confirmedAmount.value,
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

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", async () => {
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
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
  state.latestConfirmationUrl = "";
  elements.fieldRecordForm.reset();
  elements.jobCaseForm.reset();
  elements.currentFieldRecordLabel.textContent = "아직 저장된 현장 기록이 없습니다.";
  elements.detailTitle.textContent = "작업 건을 선택해 주세요";
  elements.detailStatus.textContent = "미선택";
  elements.detailStatus.className = "status-badge neutral";
  elements.detailContent.classList.add("hidden");
  elements.detailEmpty.classList.remove("hidden");
  setCopyHint("초안을 복사하면 카카오톡이나 문자로 바로 붙여 넣어 설명할 수 있습니다.", false);
  renderCustomerConfirmationState(null);
  showFeedback(elements.fieldRecordFeedback, "", "");
  showFeedback(elements.detailFeedback, "", "");
  renderLinkCandidates();
  renderJobCases();
  setDefaultConfirmedAt();
  syncActionState();
});

elements.detailJump.querySelectorAll("[data-target]").forEach((button) => {
  button.addEventListener("click", () => {
    scrollToSection(button.dataset.target);
  });
});

setDefaultConfirmedAt();
renderCustomerConfirmationState(null);
syncActionState();
loadHealth().catch(() => undefined);
loadJobCases().catch((error) => {
  showFeedback(elements.fieldRecordFeedback, error.message, "error");
});
