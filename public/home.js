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
        window.location.href = "/login";
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
  setCard(
    `${payload.user.displayName || payload.user.email}님, 반갑습니다.`,
    payload.company
      ? `${payload.company.name}에서 ${payload.company.role} 권한으로 로그인되어 있습니다. 운영 홈에서 회사 전환, 멤버 확인, 초대 관리를 이어서 처리할 수 있습니다.`
      : "아직 연결된 회사가 없습니다. 로그인 절차를 다시 확인해 주세요."
  );
  renderCompanySwitcher();
  if (opsLink) {
    opsLink.classList.toggle("hidden", payload.company?.role !== "OWNER");
  }
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
    renderCompanySwitcher();
    await loadMembersAndInvites();
    setFeedback(feedback, `${payload.company.name}로 전환되었습니다.`, "success");
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
    setFeedback(inviteFeedback, `${payload.email} 주소로 초대 링크를 만들었습니다.`, "success");
    if (payload.debugInvitationLink) {
      inviteDebugLink.classList.remove("hidden");
      inviteDebugLink.innerHTML = `<strong>디버그 초대 링크</strong><a href="${payload.debugInvitationLink}">${payload.debugInvitationLink}</a>`;
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
    setFeedback(feedback, error.message, "error");
    setCard("운영 홈을 불러오지 못했습니다", "로그인 상태와 서버 연결을 다시 확인해 주세요.");
  }
}

bootstrap().catch(() => undefined);
