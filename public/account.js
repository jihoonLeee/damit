const feedback = document.querySelector("#account-feedback");
const roleBadge = document.querySelector("#account-role-badge");
const emailMeta = document.querySelector("#account-email");
const summaryTitle = document.querySelector("#account-summary-title");
const summaryCopy = document.querySelector("#account-summary-copy");
const attentionList = document.querySelector("#account-attention-list");
const profileCard = document.querySelector("#account-profile-card");
const profileForm = document.querySelector("#account-profile-form");
const profileDisplayName = document.querySelector("#account-profile-display-name");
const profilePhone = document.querySelector("#account-profile-phone");
const profileSubmit = document.querySelector("#account-profile-submit");
const profileFeedback = document.querySelector("#account-profile-feedback");
const companyName = document.querySelector("#account-company-name");
const companyMeta = document.querySelector("#account-company-meta");
const securityStatus = document.querySelector("#account-security-status");
const securityMeta = document.querySelector("#account-security-meta");
const loginSignal = document.querySelector("#account-login-signal");
const loginSignalCopy = document.querySelector("#account-login-signal-copy");
const internalStatus = document.querySelector("#account-internal-status");
const internalMeta = document.querySelector("#account-internal-meta");
const settlementSection = document.querySelector("#account-settlement-section");
const settlementCopy = document.querySelector("#account-settlement-copy");
const settlementTotalAmount = document.querySelector("#account-settlement-total-amount");
const settlementMonthAmount = document.querySelector("#account-settlement-month-amount");
const settlementTotalCount = document.querySelector("#account-settlement-total-count");
const settlementMonthCount = document.querySelector("#account-settlement-month-count");
const settlementTotalCopy = document.querySelector("#account-settlement-total-copy");
const settlementMonthCopy = document.querySelector("#account-settlement-month-copy");
const settlementTotalCountCopy = document.querySelector("#account-settlement-total-count-copy");
const settlementMonthCountCopy = document.querySelector("#account-settlement-month-count-copy");
const settlementLatestMeta = document.querySelector("#account-settlement-latest-meta");
const settlementRecent = document.querySelector("#account-settlement-recent");
const companySwitcher = document.querySelector("#account-company-switcher");
const switchButton = document.querySelector("#account-switch-button");
const companyNote = document.querySelector("#account-company-note");
const memberships = document.querySelector("#account-memberships");
const invitations = document.querySelector("#account-invitations");
const invitationHistoryBlock = document.querySelector("#account-invitation-history-block");
const invitationHistoryCopy = document.querySelector("#account-invitation-history-copy");
const invitationHistory = document.querySelector("#account-invitation-history");
const currentSessionList = document.querySelector("#account-current-session");
const otherSessionsList = document.querySelector("#account-other-sessions");
const endedSessionsBlock = document.querySelector("#account-ended-sessions-block");
const endedSessionsSummaryCopy = document.querySelector("#account-ended-sessions-summary-copy");
const endedSessionsList = document.querySelector("#account-ended-sessions");
const sessionsCopy = document.querySelector("#account-sessions-copy");
const sessionsFeedback = document.querySelector("#account-sessions-feedback");
const sessionCurrentCount = document.querySelector("#account-session-current-count");
const sessionOtherCount = document.querySelector("#account-session-other-count");
const sessionEndedCount = document.querySelector("#account-session-ended-count");
const sessionCurrentCopy = document.querySelector("#account-session-current-copy");
const sessionOtherCopy = document.querySelector("#account-session-other-copy");
const sessionEndedCopy = document.querySelector("#account-session-ended-copy");
const loginActivity = document.querySelector("#account-login-activity");
const activityFeed = document.querySelector("#account-activity-feed");
const securityList = document.querySelector("#account-security-list");
const adminCard = document.querySelector("#account-admin-card");
const returnBanner = document.querySelector("#account-return-banner");
const logoutButton = document.querySelector("#account-logout-button");
const invitePanel = document.querySelector("#account-invite-panel");
const inviteCopy = document.querySelector("#account-invite-copy");
const inviteForm = document.querySelector("#account-invite-form");
const inviteEmail = document.querySelector("#account-invite-email");
const inviteRole = document.querySelector("#account-invite-role");
const inviteSubmit = document.querySelector("#account-invite-submit");
const inviteFeedback = document.querySelector("#account-invite-feedback");
const inviteResult = document.querySelector("#account-invite-result");

const state = {
  overview: null,
  csrfToken: "",
  inviteResult: null,
  inviteSubmitting: false,
  profileSubmitting: false
};

function readCookie(name) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
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

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "-";
  }
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

function isPast(value) {
  return Boolean(value) && new Date(value).getTime() < Date.now();
}

function isEndedSession(item) {
  return Boolean(item.revokedAt) || Boolean(item.isExpired) || isPast(item.expiresAt);
}

function roleTone(role) {
  switch (role) {
    case "OWNER":
      return "tone-good";
    case "MANAGER":
    case "STAFF":
      return "tone-neutral";
    default:
      return "tone-warning";
  }
}

function setFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

function setProfileFeedback(message, type = "") {
  profileFeedback.textContent = message;
  profileFeedback.className = `feedback ${type}`.trim();
}

function setInviteFeedback(message, type = "") {
  inviteFeedback.textContent = message;
  inviteFeedback.className = `feedback ${type}`.trim();
}

function setSessionsFeedback(message, type = "") {
  sessionsFeedback.textContent = message;
  sessionsFeedback.className = `feedback ${type}`.trim();
}

function renderAttentionList(items = []) {
  if (!items.length) {
    attentionList.classList.add("hidden");
    attentionList.innerHTML = "";
    return;
  }

  attentionList.classList.remove("hidden");
  attentionList.innerHTML = items
    .map((item) => `<div class="account-attention-item">${escapeHtml(item)}</div>`)
    .join("");
}

function renderSettlementSummary(summary, company, role) {
  if (!company || role !== "OWNER") {
    settlementSection.classList.add("hidden");
    settlementRecent.className = "home-list empty-state";
    settlementRecent.textContent = "";
    return;
  }

  settlementSection.classList.remove("hidden");

  if (!summary || !summary.agreementCountTotal) {
    settlementCopy.textContent = `${company.name} 기준 최종 합의 금액이 아직 쌓이지 않았습니다. 작업 화면에서 합의 기록이 저장되면 여기서 회사 단위로 다시 볼 수 있습니다.`;
    settlementTotalAmount.textContent = formatMoney(0);
    settlementMonthAmount.textContent = formatMoney(0);
    settlementTotalCount.textContent = "0";
    settlementMonthCount.textContent = "0";
    settlementTotalCopy.textContent = "아직 누적된 최종 합의 금액이 없습니다.";
    settlementMonthCopy.textContent = "이번 달에 확정된 합의 금액이 아직 없습니다.";
    settlementTotalCountCopy.textContent = "누적 합의 건수가 아직 없습니다.";
    settlementMonthCountCopy.textContent = "이번 달 합의 건수가 아직 없습니다.";
    settlementLatestMeta.textContent = "아직 최근 합의 내역이 없습니다.";
    settlementRecent.className = "home-list empty-state";
    settlementRecent.innerHTML = '아직 합의 완료로 기록된 작업 건이 없습니다. <a class="inline-link" href="/app/capture">작업 화면</a>에서 합의 기록을 저장하면 여기서 누적 금액과 최근 내역을 함께 볼 수 있습니다.';
    return;
  }

  settlementCopy.textContent = `${company.name}의 최종 합의 금액을 누적과 이번 달 기준으로 함께 보여줍니다. 큰 흐름은 여기서 확인하고, 상세 조정은 작업 화면으로 이어가면 됩니다.`;
  settlementTotalAmount.textContent = formatMoney(summary.totalConfirmedAmount);
  settlementMonthAmount.textContent = formatMoney(summary.confirmedAmountThisMonth);
  settlementTotalCount.textContent = String(summary.agreementCountTotal || 0);
  settlementMonthCount.textContent = String(summary.agreementCountThisMonth || 0);
  settlementTotalCopy.textContent = "지금까지 OWNER 기준으로 최종 합의된 금액 합계입니다.";
  settlementMonthCopy.textContent = "이번 달 안에 확정된 합의 금액만 따로 모아 보여줍니다.";
  settlementTotalCountCopy.textContent = "최종 합의까지 닫힌 전체 작업 건 수입니다.";
  settlementMonthCountCopy.textContent = "이번 달에 새로 마감된 합의 건수입니다.";
  settlementLatestMeta.textContent = summary.latestConfirmedAt
    ? `가장 최근 합의 · ${formatDateTime(summary.latestConfirmedAt)}`
    : "최근 합의 시각이 아직 없습니다.";

  if (!summary.recentAgreements?.length) {
    settlementRecent.className = "home-list empty-state";
    settlementRecent.textContent = "최근 합의 내역이 아직 없습니다.";
    return;
  }

  settlementRecent.className = "home-list";
  settlementRecent.innerHTML = summary.recentAgreements
    .map((item) => `
      <article class="home-list-item">
        <strong>${escapeHtml(item.customerLabel || "이름 없는 작업 건")}</strong>
        <p>${escapeHtml(item.siteLabel || "현장 정보 없음")}</p>
        <span>${escapeHtml(`${formatMoney(item.confirmedAmount)} · ${formatDateTime(item.confirmedAt)}`)}</span>
        <p class="helper-text">상태 · ${escapeHtml(item.status || "AGREED")}</p>
        <div class="account-list-actions">
          <a class="ghost-button account-inline-button" href="/app/confirm?caseId=${encodeURIComponent(item.jobCaseId)}">작업 건 보기</a>
        </div>
      </article>
    `)
    .join("");
}

function redirectToLogin(reason = "session-expired", nextPath = "/account") {
  const params = new URLSearchParams();
  params.set("reason", reason);
  params.set("next", nextPath);
  window.location.href = `/login?${params.toString()}`;
}

async function request(url, options = {}, allowRetry = true) {
  const method = options.method || "GET";
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (method !== "GET") {
    const csrfToken = state.csrfToken || readCookie("faa_csrf");
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }
  }

  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && allowRetry) {
      try {
        await request("/api/v1/auth/refresh", { method: "POST" }, false);
        return request(url, options, false);
      } catch {
        redirectToLogin("session-expired");
        throw new Error("세션이 만료되어 다시 로그인해야 합니다.");
      }
    }
    const error = new Error(payload?.error?.message || "요청을 처리하지 못했습니다.");
    error.code = payload?.error?.code;
    throw error;
  }

  state.csrfToken = readCookie("faa_csrf");
  return payload;
}

function renderReturnBanner(reason) {
  if (!reason) {
    returnBanner.classList.add("hidden");
    returnBanner.innerHTML = "";
    return;
  }

  let title = "";
  let copy = "";
  if (reason === "system-admin-required") {
    title = "시스템 관리자 화면은 내부 관리자 계정에서만 볼 수 있습니다.";
    copy = "현재 계정에서는 마이페이지, 작업 화면, 운영 콘솔만 계속 사용할 수 있습니다.";
  } else if (reason === "company-switched") {
    title = "회사 컨텍스트가 전환되었습니다.";
    copy = "현재 마이페이지 정보와 작업/운영 동선이 새 회사 기준으로 다시 정렬되었습니다.";
  } else if (reason === "logged-out") {
    title = "로그아웃되었습니다.";
    copy = "다시 로그인하면 현재 회사와 세션 상태를 이어서 확인할 수 있습니다.";
  } else {
    title = "마이페이지로 돌아왔습니다.";
    copy = "현재 계정과 회사, 팀, 세션 보안 상태를 다시 확인할 수 있습니다.";
  }

  returnBanner.classList.remove("hidden");
  returnBanner.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p>`;
}

function renderMemberships(items = []) {
  if (!items.length) {
    memberships.className = "home-list empty-state";
    memberships.textContent = "현재 회사에 연결된 활성 멤버가 아직 없습니다.";
    return;
  }

  memberships.className = "home-list";
  memberships.innerHTML = items.map((item) => `
    <article class="home-list-item">
      <strong>${escapeHtml(item.displayName || item.email)}</strong>
      <p>${escapeHtml(item.email)}</p>
      <span>${escapeHtml(`${item.role} · ${item.status}`)}</span>
    </article>
  `).join("");
}

function invitationStatusLabel(item) {
  if (item.status === "ACCEPTED") {
    return "합류 완료";
  }
  if (item.status === "REVOKED") {
    return "초대 종료";
  }
  return "응답 대기";
}

function invitationMetaCopy(item) {
  if (item.status === "ACCEPTED") {
    return `합류 시각 ${formatDateTime(item.acceptedAt)}`;
  }
  if (item.status === "REVOKED") {
    return `종료 기준 ${formatDateTime(item.lastSentAt || item.createdAt)}`;
  }
  if (item.lastSentAt && item.createdAt && item.lastSentAt !== item.createdAt) {
    return `최근 재전송 ${formatDateTime(item.lastSentAt)} · 만료 ${formatDateTime(item.expiresAt)}`;
  }
  return `처음 발송 ${formatDateTime(item.createdAt)} · 만료 ${formatDateTime(item.expiresAt)}`;
}

function invitationHintCopy(item) {
  if (item.status === "ACCEPTED") {
    return "이미 합류한 팀원입니다. 여기서는 더 이상 조치할 필요가 없습니다.";
  }
  if (item.status === "REVOKED") {
    return "취소된 초대입니다. 필요하면 같은 이메일로 새 초대를 다시 만들면 됩니다.";
  }
  return item.lastSentAt && item.createdAt && item.lastSentAt !== item.createdAt
    ? "다시 보낸 초대가 아직 응답 대기 중입니다."
    : "첫 초대가 아직 응답 대기 중입니다.";
}

function invitationStatusLabelDisplay(item) {
  if (item.status === "ACCEPTED") {
    return "합류 완료";
  }
  if (item.status === "REVOKED") {
    return "초대 종료";
  }
  return "응답 대기";
}

function invitationMetaCopyDisplay(item) {
  if (item.status === "ACCEPTED") {
    return `합류 완료 · ${formatDateTime(item.acceptedAt)}`;
  }
  if (item.status === "REVOKED") {
    return `초대 종료 · ${formatDateTime(item.lastSentAt || item.createdAt)}`;
  }
  if (item.lastSentAt && item.createdAt && item.lastSentAt !== item.createdAt) {
    return `최근 재전송 · ${formatDateTime(item.lastSentAt)} / 만료 ${formatDateTime(item.expiresAt)}`;
  }
  return `처음 발송 · ${formatDateTime(item.createdAt)} / 만료 ${formatDateTime(item.expiresAt)}`;
}

function invitationHintCopyDisplay(item) {
  if (item.status === "ACCEPTED") {
    return "이미 합류한 초대입니다. 추가 조치는 필요 없습니다.";
  }
  if (item.status === "REVOKED") {
    return "취소된 초대입니다. 필요하면 새 초대를 보내면 됩니다.";
  }
  return item.lastSentAt && item.createdAt && item.lastSentAt !== item.createdAt
    ? "다시 보낸 초대가 아직 응답 대기 중입니다."
    : "첫 초대가 아직 응답 대기 중입니다.";
}

function renderInvitationActions(item) {
  if (item.status !== "ISSUED") {
    return "";
  }

  return `
    <div class="account-list-actions">
      <button class="ghost-button account-inline-button" type="button" data-invitation-action="reissue" data-invitation-id="${escapeHtml(item.id)}">다시 보내기</button>
      <button class="ghost-button account-inline-button" type="button" data-invitation-action="revoke" data-invitation-id="${escapeHtml(item.id)}">초대 취소</button>
    </div>
  `;
}

function renderInvitationCard(item) {
  return `
    <article class="home-list-item">
      <strong>${escapeHtml(item.email)}</strong>
      <p>${escapeHtml(`${item.role} · ${invitationStatusLabel(item)}`)}</p>
      <span>${escapeHtml(invitationMetaCopy(item))}</span>
      <p class="helper-text">${escapeHtml(invitationHintCopy(item))}</p>
      ${renderInvitationActions(item)}
    </article>
  `;
}

function renderInvitationCardDisplay(item) {
  return `
    <article class="home-list-item">
      <strong>${escapeHtml(item.email)}</strong>
      <p>${escapeHtml(`${item.role} · ${invitationStatusLabelDisplay(item)}`)}</p>
      <span>${escapeHtml(invitationMetaCopyDisplay(item))}</span>
      <p class="helper-text">${escapeHtml(invitationHintCopyDisplay(item))}</p>
      ${renderInvitationActions(item)}
    </article>
  `;
}

function renderInvitationSection(title, copy, items) {
  return `
    <section class="account-list-section">
      <div class="account-subsection-header">
        <strong>${escapeHtml(title)}</strong>
        <span class="helper-text">${escapeHtml(copy)}</span>
      </div>
      <div class="home-list">${items.map((item) => renderInvitationCardDisplay(item)).join("")}</div>
    </section>
  `;
}

function renderInvitations(items = [], role = "") {
  if (role !== "OWNER") {
    invitations.className = "home-list empty-state";
    invitations.textContent = "초대 관리는 OWNER 권한에서만 확인할 수 있습니다.";
    invitationHistoryBlock.classList.add("hidden");
    invitationHistory.open = false;
    return;
  }

  if (!items.length) {
    invitations.className = "home-list empty-state";
    invitations.textContent = "아직 보낸 초대가 없습니다. 위에서 팀 초대를 바로 시작할 수 있습니다.";
    invitationHistoryBlock.classList.add("hidden");
    invitationHistory.open = false;
    return;
  }

  const pending = items.filter((item) => item.status === "ISSUED");
  const closed = items.filter((item) => item.status !== "ISSUED");
  if (pending.length) {
    invitations.className = "stack";
    invitations.innerHTML = renderInvitationSection("응답 대기 중인 초대", `${pending.length}건의 초대가 아직 열려 있습니다.`, pending);
  } else {
    invitations.className = "home-list empty-state";
    invitations.textContent = "현재 응답 대기 중인 초대는 없습니다.";
  }

  if (!closed.length) {
    invitationHistoryBlock.classList.add("hidden");
    invitationHistory.open = false;
    invitationHistory.className = "home-list empty-state";
    invitationHistory.textContent = "닫힌 초대 기록이 없습니다.";
    return;
  }

  invitationHistoryBlock.classList.remove("hidden");
  invitationHistoryCopy.textContent = `${closed.length}건의 초대가 합류 완료 또는 종료 상태입니다. 필요할 때만 펼쳐서 확인할 수 있습니다.`;
  invitationHistory.className = "home-list";
  invitationHistory.innerHTML = closed.map((item) => renderInvitationCardDisplay(item)).join("");
}

function sessionStateLabel(item) {
  if (item.isCurrent) {
    return "현재 사용 중";
  }
  if (item.revokedAt) {
    return "직접 종료됨";
  }
  if (item.isExpired || isPast(item.expiresAt)) {
    return "만료됨";
  }
  if (item.isIdleRisk) {
    return "활성 상태지만 오래됨";
  }
  return "다른 활성 세션";
}

function sessionHintCopy(item, options = {}) {
  if (options.current) {
    if (item.isIdleRisk) {
      return "현재 세션이 오래 유지되고 있습니다. 계속 사용할 세션이면 괜찮지만, 공용 기기라면 로그아웃으로 정리하는 편이 안전합니다.";
    }
    return "현재 세션은 여기서 종료하지 않고 화면 하단 로그아웃 버튼으로 정리합니다.";
  }
  if (item.revokedAt) {
    return `직접 종료한 세션입니다. 종료 시각 ${formatDateTime(item.revokedAt)} 기준으로 기록만 남습니다.`;
  }
  if (item.isExpired || isPast(item.expiresAt)) {
    return "자동 만료된 세션입니다. 현재 위험은 아니고 기록 확인용으로만 보면 됩니다.";
  }
  if (item.isIdleRisk) {
    return "최근 활동이 오래 없어 자동 만료 직전일 수 있습니다. 계속 쓰지 않는 세션이면 지금 종료하는 편이 안전합니다.";
  }
  return "현재 살아 있는 다른 세션입니다. 필요 없으면 이 화면에서 바로 종료할 수 있습니다.";
}

function renderSessionCard(item, options = {}) {
  const action = options.current || options.ended
    ? `<p class="helper-text">${escapeHtml(sessionHintCopy(item, options))}</p>`
    : `
      <div class="account-list-actions">
        <button class="ghost-button account-inline-button" type="button" data-session-action="revoke" data-session-id="${escapeHtml(item.id)}">이 세션 종료</button>
      </div>
    `;

  return `
    <article class="home-list-item">
      <strong>${escapeHtml(item.companyName || "회사 정보 없음")}</strong>
      <p>${escapeHtml(`${item.role || "-"} · ${sessionStateLabel(item)}`)}</p>
      <span>${escapeHtml(`최근 활동 ${formatDateTime(item.lastSeenAt || item.createdAt)} · 만료 ${formatDateTime(item.expiresAt)}`)}</span>
      ${options.current || options.ended ? action : `<p class="helper-text">${escapeHtml(sessionHintCopy(item, options))}</p>${action}`}
    </article>
  `;
}

function sessionStateLabelDisplay(item) {
  if (item.isCurrent) {
    return "현재 사용 중";
  }
  if (item.revokedAt) {
    return "직접 종료됨";
  }
  if (item.isExpired || isPast(item.expiresAt)) {
    return "자동 만료됨";
  }
  if (item.isIdleRisk) {
    return "오래 유지됨";
  }
  return "다른 활성 세션";
}

function sessionHintCopyDisplay(item, options = {}) {
  if (options.current) {
    if (item.isIdleRisk) {
      return "현재 세션이 오래 유지되고 있습니다. 공용 기기라면 로그아웃을 권장합니다.";
    }
    return "현재 브라우저에서 쓰는 세션입니다. 종료는 하단 로그아웃으로 진행합니다.";
  }
  if (item.revokedAt) {
    return `직접 종료한 세션입니다. ${formatDateTime(item.revokedAt)} 기준 기록만 남아 있습니다.`;
  }
  if (item.isExpired || isPast(item.expiresAt)) {
    return "자동으로 만료된 세션입니다. 현재 위험 상태는 아닙니다.";
  }
  if (item.isIdleRisk) {
    return "오래 유지된 세션입니다. 계속 쓸 계획이 없으면 지금 종료하는 편이 안전합니다.";
  }
  return "현재 살아 있는 다른 세션입니다. 필요 없으면 바로 종료할 수 있습니다.";
}

function renderSessionCardDisplay(item, options = {}) {
  const action = options.current || options.ended
    ? `<p class="helper-text">${escapeHtml(sessionHintCopyDisplay(item, options))}</p>`
    : `
      <div class="account-list-actions">
        <button class="ghost-button account-inline-button" type="button" data-session-action="revoke" data-session-id="${escapeHtml(item.id)}">이 세션 종료</button>
      </div>
    `;

  return `
    <article class="home-list-item">
      <strong>${escapeHtml(item.companyName || "회사 정보 없음")}</strong>
      <p>${escapeHtml(`${item.role || "-"} · ${sessionStateLabelDisplay(item)}`)}</p>
      <span>${escapeHtml(`최근 활동 ${formatDateTime(item.lastSeenAt || item.createdAt)} / 만료 ${formatDateTime(item.expiresAt)}`)}</span>
      ${options.current || options.ended ? action : `<p class="helper-text">${escapeHtml(sessionHintCopyDisplay(item, options))}</p>${action}`}
    </article>
  `;
}

function renderSessions(items = []) {
  const current = items.find((item) => item.isCurrent) || null;
  const others = items.filter((item) => !item.isCurrent && !isEndedSession(item));
  const ended = items.filter((item) => !item.isCurrent && isEndedSession(item));
  const idleRiskCount = others.filter((item) => item.isIdleRisk).length + (current?.isIdleRisk ? 1 : 0);

  sessionCurrentCount.textContent = current ? "1" : "0";
  sessionOtherCount.textContent = String(others.length);
  sessionEndedCount.textContent = String(ended.length);

  sessionCurrentCopy.textContent = current
    ? current.isIdleRisk
      ? "현재 세션이 오래 유지되고 있어요."
      : "이 브라우저에서 계속 사용 중인 세션입니다."
    : "현재 세션을 확인하지 못했습니다.";
  sessionOtherCopy.textContent = others.length
    ? idleRiskCount
      ? `${others.length}개의 다른 활성 세션 중 ${idleRiskCount}개가 오래 유지되고 있습니다.`
      : `${others.length}개의 다른 활성 세션이 열려 있습니다.`
    : "다른 활성 세션은 없습니다.";
  sessionEndedCopy.textContent = ended.length
    ? `최근 종료되었거나 만료된 세션 ${ended.length}건입니다.`
    : "최근 종료 세션은 없습니다.";

  sessionsCopy.textContent = current
    ? others.length
      ? idleRiskCount
        ? "현재 세션은 유지하고, 오래되었거나 필요 없는 다른 활성 세션만 정리하면 됩니다."
        : "현재 세션은 유지하고, 다른 활성 세션만 필요에 따라 종료할 수 있습니다."
      : "현재 세션 하나만 유지되고 있습니다. 별도로 정리할 세션은 없습니다."
    : "현재 세션 정보를 다시 확인해야 합니다.";

  if (!current) {
    currentSessionList.className = "home-list empty-state";
    currentSessionList.textContent = "현재 세션을 확인하지 못했습니다.";
  } else {
    currentSessionList.className = "home-list";
    currentSessionList.innerHTML = renderSessionCardDisplay(current, { current: true });
  }

  if (!others.length) {
    otherSessionsList.className = "home-list empty-state";
    otherSessionsList.textContent = "다른 활성 세션은 없습니다.";
  } else {
    otherSessionsList.className = "home-list";
    otherSessionsList.innerHTML = others.map((item) => renderSessionCardDisplay(item)).join("");
  }

  if (!ended.length) {
    endedSessionsBlock.classList.add("hidden");
    endedSessionsBlock.open = false;
    endedSessionsList.className = "home-list empty-state";
    endedSessionsList.textContent = "최근 종료되거나 만료된 세션은 없습니다.";
    endedSessionsSummaryCopy.textContent = "만료되거나 직접 종료한 세션이 생기면 이곳에 기록으로 남습니다.";
  } else {
    endedSessionsBlock.classList.remove("hidden");
    endedSessionsSummaryCopy.textContent = `${ended.length}건의 종료된 세션이 있습니다. 필요할 때만 펼쳐서 기록을 확인할 수 있습니다.`;
    endedSessionsList.className = "home-list";
    endedSessionsList.innerHTML = ended.map((item) => renderSessionCardDisplay(item, { ended: true })).join("");
  }
}

function loginActivityTitle(item) {
  if (item.deliveryStatus === "FAILED") {
    return "로그인 링크 전달 실패";
  }
  if (item.status === "CONSUMED") {
    return "로그인 완료";
  }
  if (item.status === "SUPERSEDED") {
    return "새 링크 발급으로 교체됨";
  }
  if (isPast(item.expiresAt)) {
    return "만료된 로그인 링크";
  }
  return "로그인 링크 발급됨";
}

function loginActivityMeta(item) {
  const parts = [
    `발급 ${formatDateTime(item.createdAt)}`,
    item.deliveryProvider ? `전달 ${item.deliveryProvider}/${item.deliveryStatus || "-"}` : null
  ].filter(Boolean);
  if (item.status === "CONSUMED" && item.consumedAt) {
    parts.push(`사용 ${formatDateTime(item.consumedAt)}`);
  } else if (item.expiresAt) {
    parts.push(`만료 ${formatDateTime(item.expiresAt)}`);
  }
  return parts.join(" · ");
}

function renderLoginActivity(items = []) {
  if (!items.length) {
    loginActivity.className = "home-list empty-state";
    loginActivity.textContent = "최근 로그인 링크 기록이 아직 없습니다.";
    loginSignal.textContent = "기록 없음";
    loginSignal.className = "ops-badge tone-neutral";
    loginSignalCopy.textContent = "첫 로그인 링크가 발급되면 최근 전달 상태가 여기에 나타납니다.";
    return;
  }

  const latest = items[0];
  const failed = items.filter((item) => item.deliveryStatus === "FAILED").length;
  loginSignal.textContent = failed ? "전달 점검 필요" : loginActivityTitle(latest);
  loginSignal.className = `ops-badge ${failed ? "tone-warning" : "tone-good"}`;
  loginSignalCopy.textContent = failed
    ? `최근 5건 중 전달 실패 ${failed}건이 있습니다. 메일/파일 전달 경로를 다시 확인해 주세요.`
    : `${formatDateTime(latest.createdAt)} 기준 최근 로그인 링크 상태를 요약하고 있습니다.`;

  loginActivity.className = "home-list";
  loginActivity.innerHTML = items.map((item) => `
    <article class="home-list-item">
      <strong>${escapeHtml(loginActivityTitle(item))}</strong>
      <p>${escapeHtml(loginActivityMeta(item))}</p>
      <span>${escapeHtml(`상태 ${item.status || "-"} · 전달 ${item.deliveryStatus || "-"}`)}</span>
    </article>
  `).join("");
}

function accountActivityCopy(item) {
  switch (item.action) {
    case "ACCOUNT_PROFILE_UPDATED":
      return "내 프로필 정보를 수정했습니다.";
    case "ACCOUNT_SESSION_REVOKED":
      return "다른 활성 세션을 종료했습니다.";
    case "COMPANY_INVITATION_REISSUED":
      return "기존 초대 메일을 다시 보냈습니다.";
    case "COMPANY_INVITATION_REVOKED":
      return "대기 중인 초대를 취소했습니다.";
    case "OPS_BACKUP_CREATED":
      return "운영 백업을 직접 생성했습니다.";
    default:
      return `${item.action} 액션이 기록되었습니다.`;
  }
}

function renderAccountActivity(items = []) {
  if (!items.length) {
    activityFeed.className = "home-list empty-state";
    activityFeed.textContent = "내 최근 계정 액션이 아직 없습니다.";
    return;
  }

  activityFeed.className = "home-list";
  activityFeed.innerHTML = items.map((item) => `
    <article class="home-list-item">
      <strong>${escapeHtml(accountActivityCopy(item))}</strong>
      <p>${escapeHtml(`리소스 ${item.resourceType}${item.resourceId ? ` · ${item.resourceId}` : ""}`)}</p>
      <span>${escapeHtml(formatDateTime(item.createdAt))}</span>
    </article>
  `).join("");
}

function renderSecurity(security = {}) {
  const mailMode = (security.mailProvider || "FILE").toUpperCase();
  const idleHours = security.sessionIdleTimeoutSeconds ? Math.round(security.sessionIdleTimeoutSeconds / 3600) : null;
  const rows = [
    ["신뢰 출처 검증", security.trustedOriginEnforced ? "켜짐" : "꺼짐"],
    ["디버그 로그인 링크", security.debugLinksEnabled ? "켜짐" : "꺼짐"],
    ["세션 SameSite", security.sessionSameSite || "-"],
    ["CSRF SameSite", security.csrfSameSite || "-"],
    ["세션 유휴 만료 기준", idleHours ? `${idleHours}시간` : "-"],
    ["메일 전달 모드", mailMode],
    ["발신 주소 설정", security.mailFromConfigured ? "설정됨" : "미설정"],
    ["Resend API", security.resendConfigured ? "설정됨" : "미설정"]
  ];

  securityList.innerHTML = rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");

  if (mailMode === "RESEND" && security.mailFromConfigured && security.resendConfigured && security.trustedOriginEnforced && !security.debugLinksEnabled) {
    securityStatus.textContent = "운영 준비 양호";
    securityStatus.className = "ops-badge tone-good";
    securityMeta.textContent = "로그인 전달과 세션 보안 기준이 운영 모드에 가깝습니다.";
    return;
  }

  securityStatus.textContent = "추가 설정 필요";
  securityStatus.className = "ops-badge tone-warning";
  securityMeta.textContent = "메일 전달 또는 세션 보안 기준에 아직 남아 있는 설정이 있습니다.";
}

function renderInvitePanel(company, role, invitationCount) {
  const isOwner = Boolean(company) && role === "OWNER";
  invitePanel.classList.toggle("hidden", !isOwner);
  inviteSubmit.disabled = !isOwner || state.inviteSubmitting;
  inviteEmail.disabled = !isOwner || state.inviteSubmitting;
  inviteRole.disabled = !isOwner || state.inviteSubmitting;

  if (!isOwner) {
    setInviteFeedback("", "");
    setInviteResult(null);
    return;
  }

  inviteCopy.textContent = invitationCount
    ? `현재 ${invitationCount}건의 초대 기록이 있습니다. 열려 있는 초대만 다시 보내거나 취소할 수 있습니다.`
    : "첫 팀원을 초대하면 여기서 바로 전달 결과와 대기 상태를 함께 확인할 수 있습니다.";
}

function setInviteResult(payload = null) {
  state.inviteResult = payload;
  if (!payload) {
    inviteResult.classList.add("hidden");
    inviteResult.innerHTML = "";
    return;
  }

  const delivery = payload.delivery || {};
  const rows = [
    `<strong>${escapeHtml(payload.email || "초대 메일 발송 완료")}</strong>`,
    `<p>${escapeHtml(payload.role || "-")} 역할 초대를 보냈습니다. 만료 시각은 ${escapeHtml(formatDateTime(payload.expiresAt))}입니다.</p>`,
    `<p class="helper-text">전달 상태: ${escapeHtml(delivery.provider || "-")} / ${escapeHtml(delivery.status || "-")}${delivery.targetMasked ? ` / ${escapeHtml(delivery.targetMasked)}` : ""}</p>`
  ];

  if (payload.previewPath) {
    rows.push(`<p class="helper-text">미리보기 파일: <code>${escapeHtml(payload.previewPath)}</code></p>`);
  }
  if (payload.debugInvitationLink) {
    rows.push(`<a href="${escapeHtml(payload.debugInvitationLink)}" target="_blank" rel="noreferrer">디버그 초대 링크 열기</a>`);
  }

  inviteResult.classList.remove("hidden");
  inviteResult.innerHTML = rows.join("");
}

function renderProfile(user = {}) {
  profileCard.innerHTML = `
    <strong>${escapeHtml(user.displayName || "이름 없음")}</strong>
    <p>${escapeHtml(user.email || "이메일 정보 없음")}</p>
    <p class="helper-text">연락처 ${escapeHtml(user.phoneNumber || "미설정")}</p>
  `;
  profileDisplayName.value = user.displayName || "";
  profilePhone.value = user.phoneNumber || "";
}

function renderOverview() {
  const overview = state.overview;
  const company = overview.company;
  const role = company?.role || "";
  const isSystemAdmin = Boolean(overview.internalAccess?.systemAdmin);
  const invitationItems = overview.invitations || [];
  const sessionItems = overview.sessions || [];
  const recentLoginItems = overview.recentLoginActivity || [];
  const recentAccountItems = overview.recentAccountActivity || [];
  const pendingInvites = invitationItems.filter((item) => item.status === "ISSUED").length;
  const idleRiskSessions = sessionItems.filter((item) => item.isIdleRisk && !isEndedSession(item)).length;
  const otherLiveSessions = sessionItems.filter((item) => !item.isCurrent && !isEndedSession(item)).length;
  const attentionItems = [];

  roleBadge.textContent = company ? role : "회사 연결 필요";
  roleBadge.className = `ops-badge ${company ? roleTone(role) : "tone-warning"}`;
  emailMeta.textContent = overview.user.email || "이메일 정보 없음";

  if (!company) {
    summaryTitle.textContent = `${overview.user.displayName || "사용자"}님의 회사 연결 상태를 먼저 확인해야 합니다.`;
    summaryCopy.textContent = "첫 로그인 설정이나 초대 수락 흐름이 완전히 끝나야 작업 화면과 운영 콘솔을 제대로 사용할 수 있습니다.";
  } else if (role === "OWNER") {
    summaryTitle.textContent = `${company.name} OWNER 세션이 활성화되어 있습니다.`;
    if (otherLiveSessions || pendingInvites || idleRiskSessions) {
      const parts = [];
      if (otherLiveSessions) {
        parts.push(`다른 활성 세션 ${otherLiveSessions}건`);
      }
      if (idleRiskSessions) {
        parts.push(`오래된 세션 ${idleRiskSessions}건`);
      }
      if (pendingInvites) {
        parts.push(`응답 대기 초대 ${pendingInvites}건`);
      }
      summaryCopy.textContent = `${parts.join(", ")}이 남아 있습니다. 필요한 것만 정리한 뒤 작업 화면으로 이동하면 더 깔끔합니다.`;
    } else {
      summaryCopy.textContent = "현재 회사와 세션, 초대 상태가 안정적입니다. 작업 화면 또는 운영 콘솔로 바로 이어갈 수 있습니다.";
    }
  } else {
    summaryTitle.textContent = `${company.name} ${role} 세션으로 로그인되어 있습니다.`;
    summaryCopy.textContent = otherLiveSessions
      ? `현재 역할에서는 작업 화면이 주 경로입니다. 다만 다른 활성 세션 ${otherLiveSessions}건이 보여서 마이페이지에서 먼저 확인하는 편이 좋습니다.`
      : "현재 역할에서는 작업 화면이 주 경로입니다. 마이페이지에서는 내 정보와 세션 보안 상태를 먼저 확인하면 됩니다.";
  }

  if (!company) {
    attentionItems.push("먼저 회사 연결 또는 초대 수락을 마쳐야 작업 화면과 운영 콘솔을 사용할 수 있습니다.");
  } else {
    if (otherLiveSessions) {
      attentionItems.push(`다른 활성 세션 ${otherLiveSessions}건이 있습니다. 쓰지 않는 기기는 종료하는 편이 안전합니다.`);
    }
    if (idleRiskSessions) {
      attentionItems.push(`오래 유지된 세션 ${idleRiskSessions}건이 보입니다. 공용 기기라면 지금 확인해 주세요.`);
    }
    if (pendingInvites) {
      attentionItems.push(`응답 대기 중인 초대 ${pendingInvites}건이 있습니다. 다시 보내기나 취소가 필요한지 확인해 주세요.`);
    }
    if (!attentionItems.length) {
      attentionItems.push("지금 바로 정리할 초대나 보안 이슈는 없습니다. 작업 화면 또는 운영 콘솔로 바로 이동하면 됩니다.");
    }
  }

  renderAttentionList(attentionItems);

  renderProfile(overview.user);

  companyName.textContent = company ? company.name : "활성 회사 없음";
  companyMeta.textContent = company
    ? `${company.role} 권한으로 연결되어 있습니다. 회사 전환 후에는 작업 화면과 운영 콘솔이 새 컨텍스트 기준으로 이어집니다.`
    : "아직 활성 회사 컨텍스트가 없어 작업 화면과 운영 콘솔 접근이 제한됩니다.";

  internalStatus.textContent = isSystemAdmin ? "내부 관리자 포함" : "사장님 계정";
  internalStatus.className = `ops-badge ${isSystemAdmin ? "tone-warning" : "tone-neutral"}`;
  internalMeta.textContent = isSystemAdmin
    ? "이 계정은 시스템 관리자 화면도 볼 수 있습니다."
    : "이 계정은 고객 운영 표면 중심으로 사용됩니다.";

  companySwitcher.innerHTML = overview.companies
    .map((item) => `<option value="${item.id}" ${item.id === company?.id ? "selected" : ""}>${escapeHtml(`${item.name} · ${item.role}`)}</option>`)
    .join("");
  companySwitcher.disabled = overview.companies.length <= 1;
  switchButton.disabled = overview.companies.length <= 1;
  companyNote.textContent = company
    ? `${company.name} 기준으로 마이페이지가 열려 있습니다. 회사 전환 시 작업 화면과 운영 콘솔도 같은 세션 기준으로 바뀝니다.`
    : "회사 연결을 마치면 작업 화면과 운영 콘솔을 같은 세션 기준으로 사용할 수 있습니다.";

  renderSettlementSummary(overview.settlementSummary, company, role);
  renderMemberships(overview.memberships || []);
  renderInvitations(invitationItems, role);
  renderSessions(sessionItems);
  renderLoginActivity(recentLoginItems);
  renderAccountActivity(recentAccountItems);
  renderSecurity(overview.security || {});
  renderInvitePanel(company, role, invitationItems.length);
  adminCard.classList.toggle("hidden", !isSystemAdmin);
}

async function loadOverview() {
  state.overview = await request("/api/v1/account/overview");
  renderOverview();
  setInviteResult(state.inviteResult);
}

async function submitProfile(event) {
  event.preventDefault();
  state.profileSubmitting = true;
  profileSubmit.disabled = true;
  setProfileFeedback("프로필을 저장하는 중입니다.", "");

  try {
    const payload = await request("/api/v1/account/profile", {
      method: "PATCH",
      body: JSON.stringify({
        displayName: profileDisplayName.value,
        phoneNumber: profilePhone.value
      })
    });
    setProfileFeedback("프로필을 저장했습니다. 현재 세션과 계정 요약도 함께 갱신되었습니다.", "success");
    await loadOverview();
    setFeedback(`${payload.user.displayName} 계정 정보가 업데이트되었습니다.`, "success");
  } catch (error) {
    setProfileFeedback(error.message, "error");
  } finally {
    state.profileSubmitting = false;
    profileSubmit.disabled = false;
  }
}

async function submitInvitation(event) {
  event.preventDefault();
  const companyId = state.overview?.company?.id;
  const role = state.overview?.company?.role;

  if (!companyId || role !== "OWNER") {
    setInviteFeedback("현재 회사 OWNER 계정에서만 초대를 보낼 수 있습니다.", "error");
    return;
  }

  const email = inviteEmail.value.trim().toLowerCase();
  if (!email) {
    setInviteFeedback("초대할 이메일을 입력해 주세요.", "error");
    inviteEmail.focus();
    return;
  }

  state.inviteSubmitting = true;
  inviteSubmit.disabled = true;
  setInviteFeedback("초대 메일을 보내는 중입니다.", "");

  try {
    const payload = await request(`/api/v1/companies/${companyId}/invitations`, {
      method: "POST",
      body: JSON.stringify({
        email,
        role: inviteRole.value
      })
    });
    setInviteResult({
      ...payload,
      email
    });
    setInviteFeedback("초대 메일을 보냈습니다. 아래 결과 카드에서 전달 상태를 확인해 주세요.", "success");
    inviteEmail.value = "";
    await loadOverview();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    setInviteFeedback(error.message, "error");
  } finally {
    state.inviteSubmitting = false;
    inviteSubmit.disabled = false;
  }
}

async function handleInvitationAction(action, invitationId) {
  const companyId = state.overview?.company?.id;
  if (!companyId) {
    setInviteFeedback("활성 회사가 없어 초대 상태를 수정할 수 없습니다.", "error");
    return;
  }

  setInviteFeedback(action === "revoke" ? "초대를 취소하는 중입니다." : "초대 메일을 다시 보내는 중입니다.", "");

  try {
    const payload = await request(`/api/v1/companies/${companyId}/invitations/${invitationId}/${action}`, {
      method: "POST"
    });

    if (action === "reissue") {
      setInviteResult(payload);
      setInviteFeedback("초대 메일을 다시 보냈습니다. 전달 결과를 확인해 주세요.", "success");
    } else {
      setInviteResult(null);
      setInviteFeedback("초대를 취소했습니다. 더 이상 이 링크로 합류할 수 없습니다.", "success");
    }

    await loadOverview();
  } catch (error) {
    setInviteFeedback(error.message, "error");
  }
}

async function handleSessionAction(action, sessionId) {
  if (action !== "revoke") {
    return;
  }

  setSessionsFeedback("다른 활성 세션을 종료하는 중입니다.", "");
  try {
    await request(`/api/v1/account/sessions/${sessionId}/revoke`, {
      method: "POST"
    });
    setSessionsFeedback("선택한 세션을 종료했습니다. 현재 세션은 계속 유지됩니다.", "success");
    await loadOverview();
  } catch (error) {
    setSessionsFeedback(error.message, "error");
  }
}

switchButton.addEventListener("click", async () => {
  try {
    await request(`/api/v1/companies/${companySwitcher.value}/switch-context`, {
      method: "POST"
    });
    await loadOverview();
    renderReturnBanner("company-switched");
    setFeedback("회사를 전환했습니다. 현재 마이페이지가 새 회사 기준으로 다시 정렬되었습니다.", "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

profileForm.addEventListener("submit", submitProfile);
inviteForm.addEventListener("submit", submitInvitation);

invitations.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-invitation-action]");
  if (!button) {
    return;
  }
  await handleInvitationAction(button.dataset.invitationAction, button.dataset.invitationId);
});

otherSessionsList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-session-action]");
  if (!button) {
    return;
  }
  await handleSessionAction(button.dataset.sessionAction, button.dataset.sessionId);
});

logoutButton.addEventListener("click", async () => {
  try {
    await request("/api/v1/auth/logout", { method: "POST" });
  } finally {
    redirectToLogin("logged-out");
  }
});

async function bootstrap() {
  try {
    const params = new URLSearchParams(window.location.search);
    renderReturnBanner(params.get("reason") || "");
    await loadOverview();
  } catch (error) {
    setFeedback(error.message, "error");
  }
}

bootstrap().catch(() => undefined);
