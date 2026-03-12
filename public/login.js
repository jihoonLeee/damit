const feedback = document.querySelector("#auth-feedback");
const challengeForm = document.querySelector("#challenge-form");
const setupForm = document.querySelector("#setup-form");
const debugLink = document.querySelector("#debug-link");
const inviteBanner = document.querySelector("#invite-banner");
const emailInput = document.querySelector("#email");

const state = {
  challengeId: "",
  token: "",
  invitationToken: "",
  invitedEmail: ""
};

function showFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "요청에 실패했습니다.");
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

async function issueChallenge(email) {
  const payload = await request("/api/v1/auth/challenges", {
    method: "POST",
    body: JSON.stringify({
      email,
      invitationToken: state.invitationToken || undefined
    })
  });
  showFeedback("로그인 링크를 보냈습니다. 이메일을 확인해주세요.", "success");
  if (payload.debugMagicLink) {
    debugLink.classList.remove("hidden");
    debugLink.innerHTML = `<strong>개발용 magic link</strong><a href="${payload.debugMagicLink}">${payload.debugMagicLink}</a>`;
  }
}

async function verifyChallenge(extra = {}) {
  const payload = await request("/api/v1/auth/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeId: state.challengeId,
      token: state.token,
      invitationToken: state.invitationToken || undefined,
      ...extra
    })
  });
  showFeedback(`${payload.user.displayName}님, 로그인되었습니다.`, "success");
  window.setTimeout(() => {
    window.location.href = "/beta-home";
  }, 400);
}

challengeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  try {
    await issueChallenge(email);
  } catch (error) {
    showFeedback(error.message, "error");
  }
});

setupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await verifyChallenge({
      displayName: document.querySelector("#displayName").value.trim(),
      companyName: document.querySelector("#companyName").value.trim()
    });
  } catch (error) {
    showFeedback(error.message, "error");
  }
});

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  state.challengeId = params.get("challengeId") || "";
  state.token = params.get("token") || "";
  state.invitationToken = params.get("invitationToken") || "";
  state.invitedEmail = params.get("email") || "";

  if (state.invitedEmail) {
    emailInput.value = state.invitedEmail;
  }

  if (state.invitationToken) {
    inviteBanner.classList.remove("hidden");
    inviteBanner.innerHTML = `<strong>팀 초대 링크입니다.</strong><p>${state.invitedEmail || "초대받은 이메일"}로 로그인하면 초대가 자동으로 연결됩니다.</p>`;
  }

  if (!state.challengeId || !state.token) {
    return;
  }

  showFeedback("로그인 링크를 확인하는 중입니다...");
  try {
    await verifyChallenge();
  } catch (error) {
    if (error.code === "AUTH_SETUP_REQUIRED") {
      challengeForm.classList.add("hidden");
      setupForm.classList.remove("hidden");
      showFeedback("최초 로그인이라 업체 이름이 필요합니다.", "error");
      return;
    }
    showFeedback(error.message, "error");
  }
}

bootstrap().catch(() => undefined);
