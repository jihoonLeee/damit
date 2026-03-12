const card = document.querySelector("#beta-home-card");
const feedback = document.querySelector("#beta-feedback");
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

const state = {
  me: null,
  companies: [],
  csrfToken: ""
};

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

function setFeedback(target, message, type = "") {
  target.textContent = message;
  target.className = `feedback ${type}`.trim();
}

async function request(url, options = {}) {
  const headers = {
    ...(options.headers || {})
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (options.method && options.method !== "GET" && state.csrfToken) {
    headers["x-csrf-token"] = state.csrfToken;
  }

  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "요청에 실패했습니다.");
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
}

function renderMemberships(items) {
  if (!items.length) {
    membershipList.className = "beta-list empty-state";
    membershipList.textContent = "아직 연결된 멤버가 없습니다.";
    return;
  }
  membershipList.className = "beta-list";
  membershipList.innerHTML = items.map((item) => `
    <article class="beta-list-item">
      <strong>${item.displayName || item.email}</strong>
      <p>${item.email}</p>
      <span>${item.role} · ${item.status}</span>
    </article>
  `).join("");
}

function renderInvitations(items) {
  if (!items.length) {
    invitationList.className = "beta-list empty-state";
    invitationList.textContent = "아직 발송된 초대가 없습니다.";
    return;
  }
  invitationList.className = "beta-list";
  invitationList.innerHTML = items.map((item) => `
    <article class="beta-list-item">
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
  setCard(
    `${payload.user.displayName || payload.user.email} 로그인 완료`,
    payload.company
      ? `${payload.company.name} · ${payload.company.role} 컨텍스트가 활성화되어 있습니다. 현재는 beta auth foundation 단계라 실제 현장 데이터 앱은 /beta-app에서 이어집니다.`
      : "현재는 owner token 기반 파일럿 워크스페이스와 분리된 auth foundation 단계입니다."
  );
  renderCompanySwitcher();
}

async function loadMembersAndInvites() {
  if (!state.me?.company?.id) {
    renderMemberships([]);
    renderInvitations([]);
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
    renderCompanySwitcher();
    await loadMembersAndInvites();
    setFeedback(feedback, `${payload.company.name} 컨텍스트로 전환했습니다.`, "success");
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
    setFeedback(inviteFeedback, `${payload.email}에게 초대를 보냈습니다.`, "success");
    if (payload.debugInvitationLink) {
      inviteDebugLink.classList.remove("hidden");
      inviteDebugLink.innerHTML = `<strong>개발용 invite link</strong><a href="${payload.debugInvitationLink}">${payload.debugInvitationLink}</a>`;
    }
    inviteForm.reset();
    await loadMembersAndInvites();
  } catch (error) {
    setFeedback(inviteFeedback, error.message, "error");
  }
});

logoutButton.addEventListener("click", async () => {
  await request("/api/v1/auth/logout", {
    method: "POST"
  });
  window.location.href = "/login";
});

async function bootstrap() {
  try {
    await loadMe();
    await loadMembersAndInvites();
  } catch (error) {
    if (error.code === "AUTH_SESSION_INVALID" || error.code === "UNAUTHORIZED") {
      try {
        await request("/api/v1/auth/refresh", { method: "POST" });
        await loadMe();
        await loadMembersAndInvites();
        setFeedback(feedback, "세션을 새로고침했습니다.", "success");
        return;
      } catch {
        // fall through
      }
    }
    setFeedback(feedback, error.message, "error");
    setCard("세션이 없습니다", "다시 로그인해 주세요.");
  }
}

bootstrap().catch(() => undefined);

