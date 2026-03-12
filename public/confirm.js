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
  note: document.querySelector("#confirmation-note")
};

const statusLabels = {
  ISSUED: "발급됨",
  VIEWED: "열람됨",
  CONFIRMED: "확인완료",
  REVOKED: "사용중지",
  EXPIRED: "만료"
};

function formatMoney(value) {
  if (value == null || value === "") {
    return "-";
  }
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function showFeedback(message, type = "") {
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback ${type}`.trim();
}

function setBusy(busy) {
  elements.ackButton.disabled = busy;
  elements.ackButton.textContent = busy ? "기록 중..." : "내용 확인 완료";
}

function render(payload) {
  elements.title.textContent = `${payload.jobCase.customerLabel} · ${payload.jobCase.siteLabel}`;
  elements.status.textContent = statusLabels[payload.link.status] || payload.link.status;
  elements.status.className = `status-badge ${payload.link.status === "CONFIRMED" ? "AGREED" : payload.link.status === "VIEWED" ? "EXPLAINED" : "neutral"}`;
  elements.original.textContent = formatMoney(payload.jobCase.originalQuoteAmount);
  elements.revised.textContent = formatMoney(payload.jobCase.revisedQuoteAmount);
  elements.delta.textContent = payload.jobCase.quoteDeltaAmount == null ? "-" : `${payload.jobCase.quoteDeltaAmount >= 0 ? "+" : ""}${formatMoney(payload.jobCase.quoteDeltaAmount)}`;
  elements.heroCopy.textContent = `${payload.jobCase.siteLabel} 현장에서 확인된 추가 작업과 변경 금액 안내입니다.`;
  elements.meta.textContent = [
    `만료 ${new Date(payload.link.expiresAt).toLocaleString("ko-KR")}`,
    payload.link.viewedAt ? `열람 ${new Date(payload.link.viewedAt).toLocaleString("ko-KR")}` : "첫 열람 기록 중",
    payload.link.confirmedAt ? `확인 완료 ${new Date(payload.link.confirmedAt).toLocaleString("ko-KR")}` : "아직 확인 완료 전"
  ].join(" · ");

  elements.scopeBase.textContent = payload.scopeComparison?.baseScopeSummary || "기본 범위 설명이 아직 없습니다.";
  elements.scopeExtra.textContent = payload.scopeComparison?.extraWorkSummary || "추가 작업 설명이 아직 없습니다.";
  elements.scopeReason.textContent = payload.scopeComparison?.reasonWhyExtra || "담당자가 현장 내용을 설명 중입니다.";
  elements.draftBody.textContent = payload.draftMessage?.body || "아직 안내 메시지가 준비되지 않았습니다.";

  const photos = payload.fieldRecords.flatMap((record) => record.photos || []);
  elements.photos.innerHTML = photos.length === 0
    ? `<p class="helper-text">공유된 현장 사진이 아직 없습니다.</p>`
    : photos.map((photo) => `<img src="${photo.url}" alt="현장 사진" />`).join("");

  const alreadyConfirmed = Boolean(payload.link.confirmedAt);
  elements.note.value = payload.link.confirmationNote || "";
  elements.note.disabled = alreadyConfirmed;
  elements.ackButton.disabled = alreadyConfirmed;
  elements.ackButton.textContent = alreadyConfirmed ? "확인 완료됨" : "내용 확인 완료";
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
    throw new Error(payload?.error?.message || "요청에 실패했습니다.");
  }
  return payload;
}

async function load() {
  const payload = await request(`/api/v1/public/confirm/${encodeURIComponent(token)}`);
  render(payload);
  showFeedback("고객 확인 링크를 불러왔습니다.", "success");
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
    await load();
    showFeedback("내용 확인이 기록되었습니다.", "success");
  } catch (error) {
    showFeedback(error.message, "error");
  } finally {
    setBusy(false);
  }
});

load().catch((error) => {
  showFeedback(error.message, "error");
});