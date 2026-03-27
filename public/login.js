const feedback = document.querySelector("#auth-feedback");
const challengeForm = document.querySelector("#challenge-form");
const setupForm = document.querySelector("#setup-form");
const debugLink = document.querySelector("#debug-link");
const inviteBanner = document.querySelector("#invite-banner");
const authHeading = document.querySelector("#auth-heading");
const authCopy = document.querySelector("#auth-copy");
const challengeSubmit = document.querySelector("#challenge-submit");
const emailInput = document.querySelector("#email");
const returnBanner = document.querySelector("#login-return-banner");
const flowBadge = document.querySelector("#login-flow-badge");
const journeyRequest = document.querySelector("#journey-request");
const journeyOpen = document.querySelector("#journey-open");
const journeyHome = document.querySelector("#journey-home");
const deliveryStateTitle = document.querySelector("#delivery-state-title");
const deliveryStateCopy = document.querySelector("#delivery-state-copy");
const nextTarget = document.querySelector("#login-next-target");

const state = {
  challengeId: "",
  token: "",
  invitationToken: "",
  invitedEmail: "",
  nextPath: "/home"
};

const journeyOrder = {
  request: journeyRequest,
  open: journeyOpen,
  home: journeyHome
};

function getNextDestination(pathname = "/home") {
  switch (pathname) {
    case "/app":
      return {
        label: "작업 워크스페이스",
        copy: "로그인 후 작업 워크스페이스로 돌아가 현재 작업 건을 바로 이어서 처리합니다."
      };
    case "/app/capture":
      return {
        label: "현장 기록 단계",
        copy: "로그인 후 현장 기록과 작업 건 연결 단계로 돌아가 intake 흐름을 이어서 처리합니다."
      };
    case "/app/quote":
      return {
        label: "변경 견적 단계",
        copy: "로그인 후 변경 견적과 범위 정리 단계로 돌아가 현재 작업 건을 이어서 처리합니다."
      };
    case "/app/draft":
      return {
        label: "설명 초안 단계",
        copy: "로그인 후 고객 설명 초안 준비 단계로 돌아가 현재 작업 건을 이어서 처리합니다."
      };
    case "/app/confirm":
      return {
        label: "확인과 합의 단계",
        copy: "로그인 후 고객 확인과 합의 기록 단계로 돌아가 현재 작업 건을 이어서 처리합니다."
      };
    case "/ops":
      return {
        label: "운영 콘솔",
        copy: "로그인 후 운영 콘솔로 돌아갑니다. OWNER 권한이 아니면 운영 홈에서 작업 화면으로 다시 안내합니다."
      };
    default:
      return {
        label: "운영 홈",
        copy: "로그인 후 운영 홈으로 이동해 현재 회사와 권한을 먼저 확인합니다."
      };
  }
}

function renderNextTarget() {
  if (!nextTarget) {
    return;
  }
  nextTarget.textContent = getNextDestination(state.nextPath).copy;
}

function renderEntryMode(entry) {
  if (!authHeading || !authCopy || !challengeSubmit) {
    return;
  }

  if (entry === "start") {
    authHeading.textContent = "사장님 시작하기";
    authCopy.textContent = "처음 쓰는 사장님도 이메일 링크 한 번으로 시작할 수 있습니다. 첫 로그인 때 이름과 회사 이름을 한 번만 입력하면 바로 운영 홈과 작업 화면으로 이어집니다.";
    challengeSubmit.textContent = "시작 링크 보내기";
    return;
  }

  authHeading.textContent = "로그인";
  authCopy.textContent = "이메일 매직 링크로 로그인합니다. 받은 링크를 열면 바로 운영 홈으로 이동합니다.";
  challengeSubmit.textContent = "로그인 링크 보내기";
}

function showFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

function renderReturnBanner(reason) {
  if (!returnBanner || !reason) {
    returnBanner?.classList.add("hidden");
    if (returnBanner) {
      returnBanner.innerHTML = "";
    }
    return;
  }

  let title = "";
  let copy = "";
  const destination = getNextDestination(state.nextPath);
  switch (reason) {
    case "session-expired":
      title = "세션이 만료되어 다시 로그인이 필요합니다.";
      copy = `보안을 위해 일정 시간 뒤에는 다시 로그인합니다. 로그인 후에는 ${destination.label}로 다시 연결합니다.`;
      break;
    case "logged-out":
      title = "로그아웃되었습니다.";
      copy = `다른 계정으로 들어가거나 다시 작업을 이어가려면 로그인 링크를 요청해 주세요. 로그인 후에는 ${destination.label}로 이동합니다.`;
      break;
    default:
      title = "로그인 후 다시 진행해 주세요.";
      copy = `로그인에 성공하면 ${destination.label}로 자동 이동합니다.`;
      break;
  }

  returnBanner.classList.remove("hidden");
  returnBanner.innerHTML = `<strong>${title}</strong><p>${copy}</p>`;
}

function setJourneyState(step, options = {}) {
  const completed = new Set(options.completed || []);
  Object.entries(journeyOrder).forEach(([key, node]) => {
    if (!node) {
      return;
    }
    node.classList.toggle("is-complete", completed.has(key));
    node.classList.toggle("is-active", key === step);
  });

  if (flowBadge) {
    flowBadge.textContent = options.badge || "로그인 대기";
    flowBadge.className = `status-badge ${options.badgeTone || "neutral"}`;
  }

  if (deliveryStateTitle) {
    deliveryStateTitle.textContent = options.title || "링크를 요청하면 여기에서 다음 안내가 보입니다.";
  }
  if (deliveryStateCopy) {
    deliveryStateCopy.textContent = options.copy || "현재는 로그인 링크를 보내기 전 상태입니다. 첫 로그인이라면 이후 회사와 이름을 한 번만 입력하게 됩니다.";
  }
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
    const error = new Error(payload?.error?.message || "요청을 처리하지 못했습니다.");
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

function renderDebugLink(payload) {
  if (!payload.debugMagicLink) {
    debugLink.classList.add("hidden");
    debugLink.innerHTML = "";
    return;
  }

  const details = [
    `<strong>개발 모드 전용 로그인 링크</strong>`,
    `<a href="${payload.debugMagicLink}">${payload.debugMagicLink}</a>`
  ];

  if (payload.previewPath) {
    details.push(`<p>파일 미리보기 위치: <code>${payload.previewPath}</code></p>`);
  }

  debugLink.classList.remove("hidden");
  debugLink.innerHTML = details.join("");
}

async function issueChallenge(email) {
  const payload = await request("/api/v1/auth/challenges", {
    method: "POST",
    body: JSON.stringify({
      email,
      invitationToken: state.invitationToken || undefined
    })
  });

  const targetMasked = payload.delivery?.targetMasked;
  const deliveryProvider = payload.delivery?.provider || "MAIL";
  const destination = getNextDestination(state.nextPath);
  const sentCopy = deliveryProvider === "FILE"
    ? `현재는 파일 미리보기 기반으로 로그인 링크를 확인하는 모드입니다. 링크를 열면 ${destination.label}로 이어집니다.`
    : `메일함과 스팸함을 함께 확인한 뒤 로그인 링크를 열어 주세요. 로그인 후에는 ${destination.label}로 이동합니다.`;
  setJourneyState("open", {
    completed: ["request"],
    badge: "메일 확인",
    badgeTone: "EXPLAINED",
    title: targetMasked
      ? `${targetMasked} 주소로 로그인 링크를 보냈습니다.`
      : "로그인 링크를 보냈습니다.",
    copy: sentCopy
  });
  showFeedback(
    targetMasked
      ? `${targetMasked} 주소로 로그인 링크를 보냈습니다. 메일함과 스팸함을 함께 확인해 주세요.`
      : `로그인 링크를 보냈습니다. 메일함과 스팸함을 함께 확인해 주세요.`,
    "success"
  );

  renderDebugLink(payload);

  if (deliveryProvider === "FILE" && payload.previewPath && !payload.debugMagicLink) {
    showFeedback("현재는 파일 기반 메일 모드입니다. 운영 전환 시 실제 메일 발송으로 바꿀 수 있습니다.", "success");
  }
}

async function verifyChallenge(extra = {}) {
  const destination = getNextDestination(state.nextPath);
  setJourneyState("home", {
    completed: ["request", "open"],
    badge: "로그인 확인 중",
    badgeTone: "EXPLAINED",
    title: `링크를 확인하고 ${destination.label}으로 연결하는 중입니다.`,
    copy: "세션과 회사 컨텍스트를 확인한 뒤 안전하게 이동합니다."
  });
  const payload = await request("/api/v1/auth/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeId: state.challengeId,
      token: state.token,
      invitationToken: state.invitationToken || undefined,
      ...extra
    })
  });
  setJourneyState("home", {
    completed: ["request", "open", "home"],
    badge: "로그인 완료",
    badgeTone: "AGREED",
    title: `${payload.user.displayName}님, 로그인되었습니다.`,
    copy: payload.company
      ? `${payload.company.name} · ${payload.company.role} 컨텍스트를 확인했고 ${destination.label}으로 들어갑니다.`
      : `${destination.label}으로 이동합니다.`
  });
  showFeedback(`${payload.user.displayName}님, 로그인되었습니다.`, "success");
  window.setTimeout(() => {
    window.location.href = state.nextPath || "/home";
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
  renderEntryMode(params.get("entry") || "");
  state.challengeId = params.get("challengeId") || "";
  state.token = params.get("token") || "";
  state.invitationToken = params.get("invitationToken") || "";
  state.invitedEmail = params.get("email") || "";
  const nextPath = params.get("next") || "/home";
  state.nextPath = nextPath.startsWith("/") ? nextPath : "/home";
  renderNextTarget();
  renderReturnBanner(params.get("reason") || "");

  if (state.invitedEmail) {
    emailInput.value = state.invitedEmail;
  }

  if (state.invitationToken) {
    inviteBanner.classList.remove("hidden");
    inviteBanner.innerHTML = `<strong>팀 초대 링크입니다.</strong><p>${state.invitedEmail || "초대된 사용자"} 계정으로 로그인하면 초대를 이어서 수락하고, 운영 홈에서 현재 회사 권한을 바로 확인할 수 있습니다.</p>`;
  }

  if (!state.challengeId || !state.token) {
    const destination = getNextDestination(state.nextPath);
    setJourneyState("request", {
      badge: "로그인 대기",
      badgeTone: "neutral",
      title: "이메일을 입력하면 로그인 링크를 보내 드립니다.",
      copy: `${destination.copy} 첫 로그인일 때만 회사와 이름을 한 번 입력하게 됩니다.`
    });
    return;
  }

  showFeedback("로그인 링크를 확인하고 있습니다...");
  setJourneyState("home", {
    completed: ["request", "open"],
    badge: "링크 검증 중",
    badgeTone: "EXPLAINED",
    title: "로그인 링크를 확인하는 중입니다.",
    copy: `${getNextDestination(state.nextPath).label}으로 이동할 준비를 하고 있습니다.`
  });
  try {
    await verifyChallenge();
  } catch (error) {
    if (error.code === "AUTH_SETUP_REQUIRED") {
      challengeForm.classList.add("hidden");
      setupForm.classList.remove("hidden");
      setJourneyState("home", {
        completed: ["request", "open"],
        badge: "첫 로그인 설정",
        badgeTone: "ON_HOLD",
        title: "처음 로그인이라 회사와 기본 정보를 먼저 입력해 주세요.",
        copy: `이 단계는 한 번만 진행됩니다. 설정이 끝나면 바로 ${getNextDestination(state.nextPath).label}으로 이동합니다.`
      });
      showFeedback("처음 로그인이라 회사와 기본 정보를 먼저 입력해 주세요.", "");
      return;
    }
    setJourneyState("request", {
      badge: "로그인 재시도 필요",
      badgeTone: "ON_HOLD",
      title: "로그인 링크를 다시 요청해 주세요.",
      copy: "링크가 만료되었거나 검증에 실패했습니다. 다시 요청하면 새로운 링크를 받을 수 있습니다."
    });
    showFeedback(error.message, "error");
  }
}

bootstrap().catch(() => undefined);
