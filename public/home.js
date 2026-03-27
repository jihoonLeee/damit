const card = document.querySelector("#home-summary-card");
const feedback = document.querySelector("#home-feedback");
const logoutButton = document.querySelector("#logout-button");
const activeCompanyChip = document.querySelector("#active-company-chip");
const companySwitcher = document.querySelector("#company-switcher");
const switchCompanyButton = document.querySelector("#switch-company-button");
const membershipList = document.querySelector("#membership-list");
const invitationSection = document.querySelector("#invitation-section");
const inviteForm = document.querySelector("#invite-form");
const inviteFeedback = document.querySelector("#invite-feedback");
const inviteDebugLink = document.querySelector("#invite-debug-link");
const invitationList = document.querySelector("#invitation-list");
const opsLink = document.querySelector("#ops-link");
const footerOpsLink = document.querySelector("#footer-ops-link");
const accountLink = document.querySelector("#account-link");
const footerAccountLink = document.querySelector("#footer-account-link");
const adminLink = document.querySelector("#admin-link");
const footerAdminLink = document.querySelector("#footer-admin-link");
const returnBanner = document.querySelector("#home-return-banner");
const returnActions = document.querySelector("#home-return-actions");
const homeSessionTitle = document.querySelector("#home-session-title");
const homeSessionCopy = document.querySelector("#home-session-copy");
const homeNextTitle = document.querySelector("#home-next-title");
const homeNextCopy = document.querySelector("#home-next-copy");
const homeNextActions = document.querySelector("#home-next-actions");
const ownerControlSection = document.querySelector("#owner-control-section");
const ownerControlCopy = document.querySelector("#owner-control-copy");
const ownerMonthAmount = document.querySelector("#owner-month-amount");
const ownerMonthAmountCopy = document.querySelector("#owner-month-amount-copy");
const ownerTotalAmount = document.querySelector("#owner-total-amount");
const ownerTotalAmountCopy = document.querySelector("#owner-total-amount-copy");
const ownerLatestConfirmed = document.querySelector("#owner-latest-confirmed");
const ownerLatestConfirmedCopy = document.querySelector("#owner-latest-confirmed-copy");
const ownerRiskSummary = document.querySelector("#owner-risk-summary");
const ownerRiskSummaryCopy = document.querySelector("#owner-risk-summary-copy");
const ownerFocusBadge = document.querySelector("#owner-focus-badge");
const ownerFocusMeta = document.querySelector("#owner-focus-meta");
const ownerFocusTitle = document.querySelector("#owner-focus-title");
const ownerFocusWhy = document.querySelector("#owner-focus-why");
const ownerFocusCopy = document.querySelector("#owner-focus-copy");
const ownerFocusPlan = document.querySelector("#owner-focus-plan");
const ownerFocusActions = document.querySelector("#owner-focus-actions");
const homeRoleChip = document.querySelector("#home-role-chip");
const homeOpsCopy = document.querySelector("#home-ops-copy");
const homeOpsCard = document.querySelector("#home-ops-card");
const homeCompanyNote = document.querySelector("#home-company-note");
const homeRouteSummary = document.querySelector("#home-route-summary");
const workspaceLink = document.querySelector("#workspace-link");
const footerWorkspaceLink = document.querySelector("#footer-workspace-link");
const workspaceRouteCard = document.querySelector("#workspace-route-card");
const workspaceRouteBadge = document.querySelector("#workspace-route-badge");
const opsRouteBadge = document.querySelector("#ops-route-badge");
const accountRouteCard = document.querySelector("#account-route-card");
const accountRouteBadge = document.querySelector("#account-route-badge");
const adminRouteCard = document.querySelector("#admin-route-card");
const adminRouteBadge = document.querySelector("#admin-route-badge");

const state = {
  me: null,
  accountOverview: null,
  ownerOpsSnapshot: null,
  companies: [],
  csrfToken: "",
  returnReason: "",
  returnNext: "",
  lastSwitchCompanyName: ""
};

function roleLabel(role) {
  switch (role) {
    case "OWNER":
      return "OWNER";
    case "MANAGER":
      return "MANAGER";
    case "STAFF":
      return "STAFF";
    default:
      return "역할 없음";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "-";
  }
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
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
  const target = new Date(value).getTime();
  if (!Number.isFinite(target)) {
    return String(value);
  }
  const diffMinutes = Math.round((Date.now() - target) / 60000);
  if (diffMinutes < 1) {
    return "방금 전";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }
  return `${Math.round(diffHours / 24)}일 전`;
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
      return "최종 상태가 기록되면 충분합니다";
    case "confirmation-stale":
      return "후속 연락 여부가 정리되면 충분합니다";
    case "quote-missing":
      return "변경 금액이 저장되면 충분합니다";
    case "draft-missing":
      return "설명 초안이 저장되면 충분합니다";
    case "confirm-link-needed":
      return "확인 링크 또는 합의 기록이 남으면 충분합니다";
    case "on-hold-followup":
      return "보류 메모와 다음 연락 시점이 정리되면 충분합니다";
    case "status-review":
      return "최종 상태가 분명해지면 충분합니다";
    default:
      return "누락된 기록이 없는지만 확인하면 충분합니다";
  }
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
  params.set("source", "home");
  if (reasonKey) {
    params.set("reason", reasonKey);
  }
  if (targetId) {
    params.set("target", targetId);
  }
  return `${resolveAppStagePath(reasonKey, targetId)}?${params.toString()}`;
}

function formatFocusHeadline(item) {
  const customer = String(item?.customerLabel || "").trim();
  const site = String(item?.siteLabel || "").trim();
  if (customer && site) {
    return `${customer} · ${site}`;
  }
  if (customer) {
    return customer;
  }
  if (site) {
    return site;
  }
  return `작업 ${item?.jobCaseId || "-"}`;
}

function createActionItems(company, role) {
  if (!company) {
    return [
      {
        tone: "is-warning",
        title: "회사 컨텍스트가 아직 없습니다",
        body: "초대 링크를 다시 확인하거나 첫 로그인 설정을 완료한 뒤 운영 홈을 새로고침해 주세요. 연결이 끝나야 작업 허브로 들어갈 수 있습니다."
      }
    ];
  }

  if (role === "OWNER") {
    return [
      {
        tone: "is-active",
        title: "작업 허브로 들어가 현재 작업 건을 이어서 처리하세요",
        body: "현장 기록 연결은 /app/capture, 견적은 /app/quote, 최종 확인은 /app/confirm에서 단계별로 이어서 처리합니다. 운영 홈은 출발점이고 실제 건별 편집은 /app입니다."
      },
      {
        tone: "is-good",
        title: "운영 콘솔에서는 점검만 하고, 실제 실행은 다시 작업 허브로 돌아오세요",
        body: "운영 모드 점검, 백업, 로그인 전달 상태는 `/ops`에서 확인합니다. 실제 견적, 초안, 합의 수정은 다시 `/app`에서 처리합니다."
      },
      {
        tone: "is-warning",
        title: "팀원이 함께 쓸 예정이면 아래에서 초대 링크를 먼저 준비하세요",
        body: "OWNER 권한에서는 멤버를 초대하고 역할을 정리한 뒤 각자 세션으로 쓰게 하는 편이 안전합니다."
      }
    ];
  }

  if (role === "MANAGER") {
    return [
      {
        tone: "is-active",
        title: "작업 허브에서 견적과 합의 흐름을 이어서 처리하세요",
        body: "MANAGER 권한에서는 변경 견적, 설명 초안, 합의 기록까지 계속 진행할 수 있습니다. 운영 홈은 상태 판단과 이동에 집중합니다."
      },
      {
        tone: "is-good",
        title: "멤버 구성을 먼저 확인하고, 이후 실제 업무는 작업 허브로 이동하세요",
        body: "누가 OWNER, MANAGER, STAFF인지 먼저 확인해 두면 작업 분담이 훨씬 명확해집니다."
      }
    ];
  }

  return [
    {
      tone: "is-active",
      title: "작업 허브에서 배정된 현장 건과 현장 기록을 처리하세요",
      body: "STAFF 권한에서는 주로 현장 기록 작성과 연결된 작업 건 확인에 집중하면 됩니다. 운영 홈은 오늘 어떤 회사 기준으로 움직일지 정하는 출발점입니다."
    },
    {
      tone: "is-good",
      title: "완료 후에는 합의 상태와 고객 확인 여부를 다시 확인하세요",
      body: "견적 변경은 제한될 수 있으므로, 현재 상태가 OWNER 또는 MANAGER 화면에 잘 반영되는지 함께 확인하면 좋습니다."
    }
  ];
}

function getRecommendedRoute(company, role) {
  if (!company) {
    return {
      primaryPath: "/home",
      primaryLabel: "회사 연결 상태 확인",
      primaryButtonLabel: "현재 상태 다시 확인",
      title: "회사 연결을 먼저 마무리해 주세요",
      copy: "초대 링크 수락이나 첫 로그인 설정이 끝나야 작업 허브와 운영 콘솔을 제대로 쓸 수 있습니다.",
      routeSummary: "현재 회사 컨텍스트가 없어서 아직 이동보다 연결 상태 확인이 우선입니다.",
      switchNote: "회사 연결이 끝나면 현재 브라우저 세션 기준으로 작업 화면과 운영 화면을 이어서 사용할 수 있습니다."
    };
  }

  if (role === "OWNER") {
    return {
      primaryPath: "/app/capture",
      primaryLabel: "작업 허브",
      primaryButtonLabel: "작업 허브 열기",
      secondaryPath: "/ops",
      secondaryLabel: "운영 콘솔 보기",
      title: "먼저 작업 허브로 이동해 현재 작업 건을 확인하세요",
      copy: "운영 홈은 출발점이고, 실제 업무는 /app/capture부터 시작하는 단계형 작업 허브에서 진행합니다. 운영 점검과 백업 확인은 /ops에서 따로 봅니다.",
      routeSummary: `${company.name}에서는 운영 홈에서 회사와 세션 상태를 확인한 뒤 /app/capture로 넘어가 단계별 작업을 이어가면 됩니다. 운영 점검이 필요할 때만 /ops로 갑니다.`,
      switchNote: "회사 전환 후 이미 열려 있던 /app 또는 /ops 탭이 있다면 한 번 새로고침하면 새 컨텍스트로 이어집니다."
    };
  }

  if (role === "MANAGER") {
    return {
      primaryPath: "/app/capture",
      primaryLabel: "작업 허브",
      primaryButtonLabel: "작업 허브 열기",
      title: "견적과 합의가 필요한 작업 건부터 이어서 처리하세요",
      copy: "현재 권한에서는 /app/capture부터 시작하는 단계형 작업 허브가 주 동선입니다. 운영 콘솔은 OWNER 중심 점검 화면으로 보면 됩니다.",
      routeSummary: `${company.name}에서는 운영 홈에서 현재 회사와 역할을 확인한 뒤 /app/capture부터 시작하는 작업 허브로 이동하면 됩니다.`,
      switchNote: "회사 전환 후에는 현장 기록, 견적, 합의 흐름이 새 회사 기준으로 보이므로 기존 탭을 새로고침해 주세요."
    };
  }

  return {
    primaryPath: "/app/capture",
    primaryLabel: "작업 허브",
    primaryButtonLabel: "작업 허브 열기",
    title: "배정된 현장 작업과 기록 상태를 먼저 확인하세요",
    copy: "현재 권한에서는 /app/capture부터 시작하는 작업 허브가 주 동선입니다. 현장 기록과 연결된 작업 건을 먼저 확인하면 됩니다.",
    routeSummary: `${company.name}에서는 운영 홈에서 회사 컨텍스트를 확인한 뒤 /app/capture에서 현장 기록과 작업 건을 먼저 확인하는 흐름이 우선입니다.`,
    switchNote: "회사 전환 후에는 내가 볼 수 있는 작업 건과 현장 기록 범위가 달라질 수 있으니 새로고침을 권장합니다."
  };
}

function renderSummaryCard() {
  const company = state.me?.company || null;
  const role = company?.role || "";
  const route = getRecommendedRoute(company, role);

  if (!company) {
    setCard("회사 연결 상태를 먼저 확인해 주세요.", "현재 로그인은 되었지만 활성 회사 컨텍스트가 없습니다. 초대 링크 또는 첫 로그인 설정 흐름이 완전히 끝났는지 먼저 확인해야 합니다.");
    return;
  }

  if (state.returnReason === "owner-required") {
    setCard(
      `${company.name} · ${roleLabel(role)} 세션`,
      `운영 콘솔은 OWNER 권한에서만 바로 열 수 있습니다. 지금 역할에서는 ${route.primaryLabel}에서 업무를 이어가면 됩니다.`
    );
    return;
  }

  if (state.returnReason === "company-switched" && state.lastSwitchCompanyName) {
    setCard(
      `${state.lastSwitchCompanyName}로 전환되었습니다.`,
      `${roleLabel(role)} 권한으로 세션이 바뀌었습니다. 이제 ${route.primaryLabel}에서 새 회사 기준으로 업무를 이어가면 됩니다.`
    );
    return;
  }

  setCard(
    `${company.name} · ${roleLabel(role)} 세션`,
    `운영 홈에서는 상태를 판단하고, 실제 업무는 ${route.primaryLabel}에서 이어가면 됩니다. ${role === "OWNER" ? "운영 점검이 필요할 때만 /ops를 추가로 보면 됩니다." : "운영 콘솔은 OWNER 중심 화면이므로 현재 역할에서는 /app이 더 중요합니다."}`
  );
}

function renderReturnActions(reason, route) {
  if (!returnActions) {
    return;
  }

  const actions = [];
  if (reason === "owner-required" || reason === "company-switched" || reason === "session-expired") {
    actions.push(`<a class="primary-button landing-action action-emphasis" href="${route.primaryPath}">${route.primaryButtonLabel}</a>`);
  }
  if (reason === "company-switched" && route.secondaryPath) {
    actions.push(`<a class="ghost-button landing-action" href="${route.secondaryPath}">${route.secondaryLabel}</a>`);
  }

  if (!actions.length) {
    returnActions.classList.add("hidden");
    returnActions.innerHTML = "";
    return;
  }

  returnActions.classList.remove("hidden");
  returnActions.innerHTML = actions.join("");
}

function renderWorkflowGuidance() {
  const company = state.me?.company || null;
  const role = company?.role || "";
  const roleText = roleLabel(role);
  const route = getRecommendedRoute(company, role);
  const isSystemAdmin = Boolean(state.accountOverview?.internalAccess?.systemAdmin);

  if (homeRoleChip) {
    homeRoleChip.textContent = company ? roleText : "회사 연결 필요";
    homeRoleChip.className = `status-badge ${company ? role : "neutral"}`;
  }

  if (homeSessionTitle) {
    homeSessionTitle.textContent = company
      ? `${company.name} · ${roleText} 세션이 활성화되었습니다`
      : "아직 활성 회사 컨텍스트가 없습니다";
  }

  if (homeSessionCopy) {
    homeSessionCopy.textContent = company
      ? "이 브라우저 세션은 현재 회사 컨텍스트를 유지합니다. 다른 회사로 옮기고 싶을 때만 아래 전환 기능을 사용하면 됩니다. 실제 작업 편집은 `/app`에서 진행합니다."
      : "초대 링크 또는 첫 로그인 설정이 완전히 끝나지 않았을 수 있습니다. 현재 회사 연결 상태를 먼저 확인해 주세요.";
  }

  if (homeNextTitle) {
    homeNextTitle.textContent = route.title;
  }

  if (homeNextCopy) {
    homeNextCopy.textContent = route.copy;
  }

  if (homeNextActions) {
    const items = createActionItems(company, role);
    homeNextActions.innerHTML = items.map((item) => `
      <article class="workspace-priority-item ${item.tone}">
        <strong>${item.title}</strong>
        <p>${item.body}</p>
      </article>
    `).join("");
  }

  const isOwner = role === "OWNER";
  if (opsLink) {
    opsLink.classList.toggle("hidden", !isOwner);
  }
  if (footerOpsLink) {
    footerOpsLink.classList.toggle("hidden", !isOwner);
  }
  if (accountLink) {
    accountLink.classList.remove("hidden");
  }
  if (footerAccountLink) {
    footerAccountLink.classList.remove("hidden");
  }
  if (accountRouteCard) {
    accountRouteCard.classList.add("is-secondary-route");
  }
  if (accountRouteBadge) {
    accountRouteBadge.textContent = "계정/세션";
    accountRouteBadge.className = "status-badge neutral";
  }
  if (homeOpsCard) {
    homeOpsCard.classList.toggle("is-muted", !isOwner);
  }
  if (homeOpsCopy) {
    homeOpsCopy.textContent = isOwner
      ? "운영 상태, 백업, 로그인 전달 준비도, 최근 활동을 확인하는 점검 화면입니다. 실제 건별 편집은 다시 `/app`으로 돌아가서 처리합니다."
      : "운영 콘솔은 OWNER 권한에서 주로 확인합니다. 현재 역할에서는 작업 허브 중심으로 업무를 이어가면 됩니다.";
  }

  if (homeCompanyNote) {
    homeCompanyNote.textContent = state.returnReason === "company-switched" && state.lastSwitchCompanyName
      ? `${state.lastSwitchCompanyName} 기준으로 세션이 바뀌었습니다. 이미 열려 있는 작업 탭이 있다면 한 번 새로고침하면 새 회사 컨텍스트로 이어집니다.`
      : route.switchNote;
  }

  if (homeRouteSummary) {
    homeRouteSummary.textContent = route.routeSummary;
  }

  if (workspaceLink) {
    workspaceLink.textContent = route.primaryButtonLabel;
    workspaceLink.href = route.primaryPath;
  }
  if (footerWorkspaceLink) {
    footerWorkspaceLink.textContent = company ? route.primaryLabel : "회사 연결 상태 확인";
    footerWorkspaceLink.href = route.primaryPath;
  }
  if (workspaceRouteCard) {
    workspaceRouteCard.classList.toggle("is-primary-route", route.primaryPath.startsWith("/app"));
  }
  if (workspaceRouteBadge) {
    workspaceRouteBadge.textContent = company
      ? role === "OWNER"
        ? "실행 시작"
        : "주 실행 화면"
      : "연결 우선";
    workspaceRouteBadge.className = `status-badge ${company ? "EXPLAINED" : "neutral"}`;
  }
  if (opsRouteBadge) {
    opsRouteBadge.textContent = isOwner ? "운영 점검" : company ? "OWNER 점검" : "대기";
    opsRouteBadge.className = `status-badge ${isOwner ? "AGREED" : "neutral"}`;
  }
  if (homeOpsCard) {
    homeOpsCard.classList.toggle("is-secondary-route", isOwner);
  }
  if (adminRouteCard) {
    adminRouteCard.classList.toggle("hidden", !isSystemAdmin);
    adminRouteCard.classList.toggle("is-secondary-route", isSystemAdmin);
    adminRouteCard.classList.toggle("is-internal-route", isSystemAdmin);
  }
  if (adminLink) {
    adminLink.classList.toggle("hidden", !isSystemAdmin);
  }
  if (footerAdminLink) {
    footerAdminLink.classList.toggle("hidden", !isSystemAdmin);
  }
  if (adminRouteBadge) {
    adminRouteBadge.textContent = isSystemAdmin ? "내부 전용" : "권한 없음";
    adminRouteBadge.className = `status-badge ${isSystemAdmin ? "ON_HOLD" : "neutral"}`;
  }

  renderSummaryCard();
  renderReturnBanner(state.returnReason);
  renderOwnerControlDesk();
}

function renderOwnerControlDesk() {
  const company = state.me?.company || null;
  const role = company?.role || "";
  if (!ownerControlSection) {
    return;
  }

  if (!company || role !== "OWNER") {
    ownerControlSection.classList.add("hidden");
    return;
  }

  ownerControlSection.classList.remove("hidden");

  const settlement = state.accountOverview?.settlementSummary || null;
  const snapshot = state.ownerOpsSnapshot || null;
  const focusCase = snapshot?.focusCases?.[0] || null;
  const staleOpenCount = Number(snapshot?.signals?.customerConfirmations?.staleOpenCount || 0);
  const failedDeliveryCount = Number(snapshot?.signals?.auth?.failedDeliveryCount24h || 0);
  const runtime = snapshot?.runtime || {};

  const monthAmount = Number(settlement?.confirmedAmountThisMonth || 0);
  const totalAmount = Number(settlement?.totalConfirmedAmount || 0);
  const monthCount = Number(settlement?.agreementCountThisMonth || 0);
  const totalCount = Number(settlement?.agreementCountTotal || 0);
  const latestConfirmedAt = settlement?.latestConfirmedAt || null;
  const riskItems = [];

  if (staleOpenCount > 0) {
    riskItems.push(`확인 지연 ${staleOpenCount}건`);
  }
  if (failedDeliveryCount > 0) {
    riskItems.push(`로그인 전달 실패 ${failedDeliveryCount}건`);
  }
  if (runtime.mailProvider) {
    riskItems.push(`메일 ${runtime.mailProvider}`);
  }

  ownerControlCopy.textContent = settlement?.agreementCountTotal
    ? `${company.name}의 합의 흐름과 대표 운영 병목을 먼저 보고, 깊은 점검만 필요할 때 /ops로 넘어가면 됩니다.`
    : `${company.name}의 첫 운영 흐름을 여는 단계입니다. 합의가 아직 없더라도 오늘 가장 먼저 볼 작업 건과 전달 상태를 여기서 확인할 수 있습니다.`;

  ownerMonthAmount.textContent = formatMoney(monthAmount);
  ownerMonthAmountCopy.textContent = monthCount > 0
    ? `이번 달 최종 합의 ${monthCount}건이 정리되어 있습니다.`
    : "이번 달 확정된 합의가 아직 없습니다.";

  ownerTotalAmount.textContent = formatMoney(totalAmount);
  ownerTotalAmountCopy.textContent = totalCount > 0
    ? `누적 합의 ${totalCount}건 기준입니다. 상세 내역은 마이페이지에서 다시 볼 수 있습니다.`
    : "누적 합의 기록이 아직 없습니다.";

  ownerLatestConfirmed.textContent = latestConfirmedAt ? formatRelativeTime(latestConfirmedAt) : "기록 없음";
  ownerLatestConfirmedCopy.textContent = latestConfirmedAt
    ? `최근 합의 시각 ${formatDateTime(latestConfirmedAt)}`
    : "최근 합의가 아직 없어 오늘 작업 흐름을 먼저 여는 것이 좋습니다.";

  ownerRiskSummary.textContent = riskItems.length ? riskItems.join(" · ") : "즉시 경고 없음";
  ownerRiskSummaryCopy.textContent = riskItems.length
    ? "고객 확인 지연이나 로그인 전달 실패가 있어 운영 콘솔 점검도 같이 보는 편이 좋습니다."
    : "지금은 큰 운영 경고보다 작업 흐름을 이어가는 편이 더 중요합니다.";

  if (!focusCase) {
    ownerFocusBadge.textContent = "운영 안정";
    ownerFocusBadge.className = "status-badge AGREED";
    ownerFocusMeta.textContent = "대표 병목 없음";
    ownerFocusTitle.textContent = "오늘 즉시 점검할 대표 병목은 없습니다.";
    ownerFocusWhy.textContent = "지금은 운영 경고보다 작업 허브에서 현장 기록과 견적 흐름을 이어가는 편이 더 가치가 큽니다.";
    ownerFocusCopy.textContent = "합의 흐름이나 고객 확인 상태는 마이페이지와 운영 콘솔에서 다시 볼 수 있습니다.";
    ownerFocusPlan.innerHTML = `
      <span class="ops-handoff-plan-pill">먼저 작업 허브</span>
      <span class="ops-handoff-plan-pill">완료 기준 오늘 작업 건 선택</span>
    `;
    ownerFocusActions.innerHTML = `
      <a class="primary-button landing-action" href="/app/capture">작업 허브 열기</a>
      <a class="ghost-button landing-action" href="/account">정산 다시 보기</a>
      <a class="ghost-button landing-action" href="/ops">운영 콘솔 보기</a>
    `;
    return;
  }

  ownerFocusBadge.textContent = focusCase.focusBadge || "운영 판단";
  ownerFocusBadge.className = `status-badge ${focusCase.focusTone === "warning" ? "ON_HOLD" : focusCase.focusTone === "good" ? "AGREED" : "neutral"}`;
  ownerFocusMeta.textContent = `${describeFocusUrgency(focusCase)} · 작업 ${focusCase.jobCaseId}`;
  ownerFocusTitle.textContent = `${formatFocusHeadline(focusCase)}부터 확인하세요`;
  ownerFocusWhy.textContent = focusCase.focusWhyNow || focusCase.focusCopy || "오늘 가장 먼저 확인해야 할 작업 건입니다.";
  ownerFocusCopy.textContent = focusCase.focusCopy || "현재 병목을 짧게 정리한 뒤 다음 단계로 넘기면 됩니다.";
  ownerFocusPlan.innerHTML = `
    <span class="ops-handoff-plan-pill">먼저 ${escapeHtml(describeFocusFirstCheck(focusCase))}</span>
    <span class="ops-handoff-plan-pill">완료 기준 ${escapeHtml(describeFocusDoneWhen(focusCase))}</span>
  `;
  ownerFocusActions.innerHTML = `
    <a class="primary-button landing-action" href="${escapeHtml(buildAppCaseHref(focusCase.jobCaseId, focusCase.focusReasonKey, focusCase.focusTargetId))}">이 작업 건 열기</a>
    <a class="ghost-button landing-action" href="/ops">운영 콘솔 깊게 보기</a>
    <a class="ghost-button landing-action" href="/account">정산 다시 보기</a>
  `;
}

function readCookie(name) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length) || "";
}

function setCard(title, body) {
  card.innerHTML = `<strong>${title}</strong><p>${body}</p>`;
}

function redirectToLogin(reason = "session-expired", nextPath = window.location.pathname) {
  const params = new URLSearchParams();
  params.set("reason", reason);
  if (nextPath && nextPath.startsWith("/")) {
    params.set("next", nextPath);
  }
  window.location.href = `/login?${params.toString()}`;
}

function setFeedback(target, message, type = "") {
  target.textContent = message;
  target.className = `feedback ${type}`.trim();
}

function renderReturnBanner(reason) {
  if (!returnBanner || !reason) {
    returnBanner?.classList.add("hidden");
    if (returnBanner) {
      returnBanner.innerHTML = "";
    }
    renderReturnActions("", getRecommendedRoute(state.me?.company || null, state.me?.company?.role || ""));
    return;
  }

  let title = "";
  let copy = "";
  const route = getRecommendedRoute(state.me?.company || null, state.me?.company?.role || "");
  switch (reason) {
    case "owner-required":
      title = "운영 콘솔은 OWNER 권한에서만 바로 확인할 수 있습니다.";
      copy = `현재 역할에서는 ${route.primaryLabel} 중심으로 업무를 이어가고, 운영 점검이 필요하면 OWNER와 함께 확인해 주세요.`;
      break;
    case "company-switched":
      title = state.lastSwitchCompanyName
        ? `${state.lastSwitchCompanyName}로 전환되었습니다.`
        : "회사 컨텍스트가 전환되었습니다.";
      copy = `이제 ${route.primaryLabel}에서 새 회사 기준으로 업무를 이어가면 됩니다. 열려 있던 탭은 한 번 새로고침해 주세요.`;
      break;
    default:
      title = "운영 홈으로 돌아왔습니다.";
      copy = `현재 세션과 회사 상태를 다시 확인한 뒤 ${route.primaryLabel}로 이동하면 됩니다.`;
      break;
  }

  returnBanner.classList.remove("hidden");
  returnBanner.innerHTML = `<strong>${title}</strong><p>${copy}</p>`;
  renderReturnActions(reason, route);
}

async function request(url, options = {}, allowRetry = true) {
  const headers = {
    ...(options.headers || {})
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (options.method && options.method !== "GET") {
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
        redirectToLogin("session-expired", "/home");
        throw new Error("세션이 만료되었습니다.");
      }
    }
    const error = new Error(payload?.error?.message || "요청을 처리하지 못했습니다.");
    error.code = payload?.error?.code;
    throw error;
  }
  state.csrfToken = readCookie("faa_csrf");
  return payload;
}

function renderCompanySwitcher() {
  companySwitcher.innerHTML = state.companies
    .map((company) => `<option value="${company.id}" ${company.id === state.me.company?.id ? "selected" : ""}>${company.name} · ${company.role}</option>`)
    .join("");
  activeCompanyChip.textContent = state.me.company ? `${state.me.company.name} · ${state.me.company.role}` : "회사 없음";
  activeCompanyChip.className = `status-badge ${state.me.company ? state.me.company.role : "neutral"}`;
  companySwitcher.disabled = state.companies.length <= 1;
  switchCompanyButton.disabled = state.companies.length <= 1;
}

function renderMemberships(items) {
  if (!items.length) {
    membershipList.className = "home-list empty-state";
    membershipList.textContent = "아직 활성 멤버가 없습니다.";
    return;
  }
  membershipList.className = "home-list";
  membershipList.innerHTML = items.map((item) => `
    <article class="home-list-item">
      <strong>${item.displayName || item.email}</strong>
      <p>${item.email}</p>
      <span>${item.role} · ${item.status}</span>
    </article>
  `).join("");
}

function renderInvitations(items) {
  if (!items.length) {
    invitationList.className = "home-list empty-state";
    invitationList.textContent = "발송된 초대가 아직 없습니다.";
    return;
  }
  invitationList.className = "home-list";
  invitationList.innerHTML = items.map((item) => `
    <article class="home-list-item">
      <strong>${item.email}</strong>
      <p>${item.role} · ${item.status}</p>
      <span>만료 ${new Date(item.expiresAt).toLocaleString("ko-KR")}</span>
    </article>
  `).join("");
}

async function loadMe() {
  const payload = await request("/api/v1/me");
  state.me = payload;
  state.companies = payload.companies || [];
  state.csrfToken = readCookie("faa_csrf");
  try {
    state.accountOverview = await request("/api/v1/account/overview");
  } catch {
    state.accountOverview = null;
  }
  if (state.me?.company?.role === "OWNER") {
    try {
      state.ownerOpsSnapshot = await request("/api/v1/admin/ops-snapshot");
    } catch {
      state.ownerOpsSnapshot = null;
    }
  } else {
    state.ownerOpsSnapshot = null;
  }
  renderCompanySwitcher();
  renderWorkflowGuidance();
}

async function loadMembersAndInvites() {
  if (!state.me?.company?.id) {
    renderMemberships([]);
    renderInvitations([]);
    invitationSection.classList.add("hidden");
    return;
  }

  const membershipsPayload = await request(`/api/v1/companies/${state.me.company.id}/memberships`);
  renderMemberships(membershipsPayload.items || []);

  if (state.me.company.role === "OWNER") {
    invitationSection.classList.remove("hidden");
    const invitationsPayload = await request(`/api/v1/companies/${state.me.company.id}/invitations`);
    renderInvitations(invitationsPayload.items || []);
  } else {
    invitationSection.classList.add("hidden");
  }
}

switchCompanyButton.addEventListener("click", async () => {
  try {
    const payload = await request(`/api/v1/companies/${companySwitcher.value}/switch-context`, {
      method: "POST"
    });
    state.me.company = payload.company;
    state.companies = payload.companies || state.companies;
    try {
      state.accountOverview = await request("/api/v1/account/overview");
    } catch {
      state.accountOverview = null;
    }
    if (payload.company?.role === "OWNER") {
      try {
        state.ownerOpsSnapshot = await request("/api/v1/admin/ops-snapshot");
      } catch {
        state.ownerOpsSnapshot = null;
      }
    } else {
      state.ownerOpsSnapshot = null;
    }
    state.returnReason = "company-switched";
    state.returnNext = getRecommendedRoute(payload.company, payload.company.role).primaryPath;
    state.lastSwitchCompanyName = payload.company.name;
    renderCompanySwitcher();
    renderWorkflowGuidance();
    await loadMembersAndInvites();
    setFeedback(feedback, `${payload.company.name}로 전환되었습니다. 이제 ${getRecommendedRoute(payload.company, payload.company.role).primaryLabel}에서 이어서 처리할 수 있습니다.`, "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    setFeedback(feedback, error.message, "error");
  }
});

inviteForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = await request(`/api/v1/companies/${state.me.company.id}/invitations`, {
      method: "POST",
      body: JSON.stringify({
        email: document.querySelector("#invite-email").value.trim().toLowerCase(),
        role: document.querySelector("#invite-role").value
      })
    });
    const targetMasked = payload.delivery?.targetMasked;
    setFeedback(
      inviteFeedback,
      targetMasked
        ? `${targetMasked} 주소로 초대 메일을 보냈습니다.`
        : `${payload.email} 주소로 초대 메일을 보냈습니다.`,
      "success"
    );
    setFeedback(
      feedback,
      "초대 링크를 보낸 뒤에는 상대가 로그인하면 현재 회사 컨텍스트가 자동으로 연결됩니다.",
      "success"
    );
    if (payload.debugInvitationLink) {
      inviteDebugLink.classList.remove("hidden");
      inviteDebugLink.innerHTML = `<strong>개발 모드 전용 초대 링크</strong><a href="${payload.debugInvitationLink}">${payload.debugInvitationLink}</a>${payload.previewPath ? `<p>파일 미리보기 위치: <code>${payload.previewPath}</code></p>` : ""}`;
    } else {
      inviteDebugLink.classList.add("hidden");
    inviteDebugLink.innerHTML = "";
    }
    inviteForm.reset();
    await loadMembersAndInvites();
    renderWorkflowGuidance();
  } catch (error) {
    setFeedback(inviteFeedback, error.message, "error");
  }
});

logoutButton.addEventListener("click", async () => {
  await request("/api/v1/auth/logout", {
    method: "POST"
  });
  redirectToLogin("logged-out");
});

async function bootstrap() {
  try {
    const params = new URLSearchParams(window.location.search);
    state.returnReason = params.get("reason") || "";
    const next = params.get("next") || "";
    state.returnNext = next.startsWith("/") ? next : "";
    await loadMe();
    await loadMembersAndInvites();
  } catch (error) {
    setFeedback(feedback, error.message, "error");
    setCard("운영 홈을 불러오지 못했습니다", "로그인 상태와 서버 연결을 다시 확인해 주세요.");
  }
}

bootstrap().catch(() => undefined);




