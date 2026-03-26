const token = decodeURIComponent(window.location.pathname.replace(/^\/confirm\//, ""));

const elements = {
  feedback: document.querySelector("#confirm-feedback"),
  title: document.querySelector("#confirm-title"),
  status: document.querySelector("#confirm-status"),
  heroCopy: document.querySelector("#confirm-hero-copy"),
  original: document.querySelector("#confirm-original"),
  revised: document.querySelector("#confirm-revised"),
  delta: document.querySelector("#confirm-delta"),
  meta: document.querySelector("#confirm-meta"),
  scopeBase: document.querySelector("#confirm-scope-base"),
  scopeExtra: document.querySelector("#confirm-scope-extra"),
  scopeReason: document.querySelector("#confirm-scope-reason"),
  draftBody: document.querySelector("#confirm-draft-body"),
  photos: document.querySelector("#confirm-photos"),
  ackForm: document.querySelector("#confirm-ack-form"),
  ackButton: document.querySelector("#confirm-submit"),
  ackHelp: document.querySelector("#confirm-ack-help"),
  note: document.querySelector("#confirmation-note"),
  stateBadge: document.querySelector("#confirm-state-badge"),
  stateTitle: document.querySelector("#confirm-state-title"),
  stateCopy: document.querySelector("#confirm-state-copy")
};

const statusLabels = {
  ISSUED: "발급됨",
  VIEWED: "열람됨",
  CONFIRMED: "확인 완료",
  REVOKED: "회수됨",
  EXPIRED: "만료됨"
};

function formatMoney(value) {
  if (value == null || value === "") {
    return "-";
  }
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("ko-KR");
}

function showFeedback(message, type = "") {
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback ${type}`.trim();
}

function setBusy(busy) {
  elements.ackButton.disabled = busy;
  elements.ackButton.textContent = busy ? "기록 중..." : "내용 확인 완료";
}

function renderState(link) {
  const confirmed = Boolean(link.confirmedAt);
  const viewed = Boolean(link.viewedAt);

  if (confirmed) {
    elements.stateBadge.textContent = "확인 완료";
    elements.stateBadge.className = "ops-badge tone-good";
    elements.stateTitle.textContent = "내용 확인이 정상적으로 기록되었습니다.";
    elements.stateCopy.textContent = `확인 완료 시각은 ${formatDateTime(link.confirmedAt)}입니다. 이제 담당자가 이후 진행 여부와 세부 협의를 이어서 정리합니다.`;
    elements.ackHelp.textContent = "이미 확인이 완료된 링크입니다. 같은 링크에서는 다시 제출하지 않아도 됩니다.";
    return;
  }

  if (viewed) {
    elements.stateBadge.textContent = "열람됨";
    elements.stateBadge.className = "ops-badge tone-warning";
    elements.stateTitle.textContent = "내용을 읽은 뒤 마지막으로 확인 완료를 남겨 주세요.";
    elements.stateCopy.textContent = "추가 작업 사유와 변경 금액을 확인했다면, 아래 버튼으로 확인 기록을 남길 수 있습니다.";
    elements.ackHelp.textContent = "확인 완료를 누르면 담당자 화면에 완료 시각과 메모가 바로 반영됩니다.";
    return;
  }

  elements.stateBadge.textContent = "확인 전";
  elements.stateBadge.className = "ops-badge tone-neutral";
  elements.stateTitle.textContent = "추가 작업 내용과 변경 금액을 먼저 확인해 주세요.";
  elements.stateCopy.textContent = "기본 범위와 추가 작업, 안내 문장을 읽은 뒤 마지막에 확인 완료를 남기면 됩니다.";
  elements.ackHelp.textContent = "확인 완료를 누르면 담당자 화면에 완료 시각과 메모가 바로 반영됩니다.";
}

function render(payload) {
  const statusLabel = statusLabels[payload.link.status] || payload.link.status;
  const isConfirmed = Boolean(payload.link.confirmedAt);

  elements.title.textContent = `${payload.jobCase.customerLabel} · ${payload.jobCase.siteLabel}`;
  elements.status.textContent = statusLabel;
  elements.status.className = `status-badge ${isConfirmed ? "AGREED" : payload.link.viewedAt ? "EXPLAINED" : "neutral"}`;
  elements.original.textContent = formatMoney(payload.jobCase.originalQuoteAmount);
  elements.revised.textContent = formatMoney(payload.jobCase.revisedQuoteAmount);
  elements.delta.textContent = payload.jobCase.quoteDeltaAmount == null
    ? "-"
    : `${payload.jobCase.quoteDeltaAmount >= 0 ? "+" : ""}${formatMoney(payload.jobCase.quoteDeltaAmount)}`;

  elements.heroCopy.textContent = `${payload.jobCase.siteLabel} 현장에서 확인한 추가 작업과 변경 금액 안내입니다.`;
  elements.meta.textContent = [
    `만료 ${formatDateTime(payload.link.expiresAt)}`,
    payload.link.viewedAt ? `열람 ${formatDateTime(payload.link.viewedAt)}` : "아직 열람 기록이 없습니다.",
    payload.link.confirmedAt ? `확인 완료 ${formatDateTime(payload.link.confirmedAt)}` : "아직 확인 완료 기록이 없습니다."
  ].join(" · ");

  elements.scopeBase.textContent = payload.scopeComparison?.baseScopeSummary || "기본 포함 범위 설명이 아직 없습니다.";
  elements.scopeExtra.textContent = payload.scopeComparison?.extraWorkSummary || "추가 작업 설명이 아직 없습니다.";
  elements.scopeReason.textContent = payload.scopeComparison?.reasonWhyExtra || "담당자가 현장 내용을 정리하는 중입니다.";
  elements.draftBody.textContent = payload.draftMessage?.body || "아직 안내 문장이 준비되지 않았습니다.";

  const photos = payload.fieldRecords.flatMap((record) => record.photos || []);
  elements.photos.innerHTML = photos.length === 0
    ? '<p class="helper-text">공유된 현장 사진이 아직 없습니다.</p>'
    : photos.map((photo) => `<img src="${photo.url}" alt="현장 사진" />`).join("");

  elements.note.value = payload.link.confirmationNote || "";
  elements.note.disabled = isConfirmed;
  elements.ackButton.disabled = isConfirmed;
  elements.ackButton.textContent = isConfirmed ? "확인 완료됨" : "내용 확인 완료";

  renderState(payload.link);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    throw new Error(payload?.error?.message || "요청을 처리하지 못했습니다.");
  }
  return payload;
}

async function load(showLoadedFeedback = false) {
  const payload = await request(`/api/v1/public/confirm/${encodeURIComponent(token)}`);
  render(payload);
  if (showLoadedFeedback) {
    showFeedback("고객 확인 링크를 불러왔습니다.", "success");
  }
}

elements.ackForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(true);
  try {
    await request(`/api/v1/public/confirm/${encodeURIComponent(token)}/acknowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        confirmationNote: elements.note.value
      })
    });
    await load(false);
    showFeedback("내용 확인이 완료되었습니다. 담당자가 이후 진행 내용을 이어서 정리합니다.", "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showFeedback(error.message, "error");
  } finally {
    setBusy(false);
  }
});

load(true).catch((error) => {
  showFeedback(error.message, "error");
});
