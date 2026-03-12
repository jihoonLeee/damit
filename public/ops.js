const ACCESS_TOKEN_KEY = "fieldAgreementOwnerToken";

const elements = {
  healthStatus: document.querySelector("#ops-health-status"),
  healthMeta: document.querySelector("#ops-health-meta"),
  storageEngine: document.querySelector("#ops-storage-engine"),
  storageMeta: document.querySelector("#ops-storage-meta"),
  runtimeMode: document.querySelector("#ops-runtime-mode"),
  runtimeMeta: document.querySelector("#ops-runtime-meta"),
  snapshotList: document.querySelector("#ops-snapshot-list"),
  backups: document.querySelector("#ops-backups"),
  refresh: document.querySelector("#ops-refresh"),
  backupForm: document.querySelector("#ops-backup-form"),
  backupLabel: document.querySelector("#ops-backup-label"),
  backupSubmit: document.querySelector("#ops-backup-submit"),
  feedback: document.querySelector("#ops-feedback")
};

function getDefaultAccessToken() {
  return window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "dev-owner-token"
    : "";
}

function requestAccessToken(force = false) {
  if (!force) {
    const existing = window.localStorage.getItem(ACCESS_TOKEN_KEY) || getDefaultAccessToken();
    if (existing) {
      return existing;
    }
  }

  const nextToken = window.prompt("운영 접근 코드를 입력해 주세요.")?.trim() || "";
  if (!nextToken) {
    throw new Error("운영 접근 코드가 필요합니다.");
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, nextToken);
  return nextToken;
}

function buildHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${requestAccessToken()}`,
    ...extra
  };
}

function showFeedback(message, tone = "") {
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback ${tone}`.trim();
}

function setBusy(button, busy, busyLabel) {
  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent;
  }
  button.disabled = busy;
  button.textContent = busy ? busyLabel : button.dataset.defaultLabel;
}

async function request(url, options = {}, allowRetry = true) {
  const response = await fetch(url, {
    ...options,
    headers: buildHeaders(options.headers || {})
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && allowRetry) {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      requestAccessToken(true);
      return request(url, options, false);
    }
    throw new Error(payload?.error?.message || "요청에 실패했습니다.");
  }

  return payload;
}

function formatBytes(value) {
  if (value == null) {
    return "-";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function renderSnapshot(health, snapshot) {
  elements.healthStatus.textContent = health.status === "ok" ? "정상" : health.status;
  elements.healthMeta.textContent = `service=${health.service} / ${new Date(health.timestamp).toLocaleString("ko-KR")}`;

  elements.storageEngine.textContent = snapshot.storage.storageEngine || "unknown";
  elements.storageMeta.textContent = `jobCases=${snapshot.storage.counts?.jobCases ?? 0}, fieldRecords=${snapshot.storage.counts?.fieldRecords ?? 0}, agreements=${snapshot.storage.counts?.agreements ?? 0}`;

  elements.runtimeMode.textContent = snapshot.runtime.storageEngine || "unknown";
  elements.runtimeMeta.textContent = `nodeEnv=${snapshot.runtime.nodeEnv || "-"}, objectStorage=${snapshot.runtime.objectStorageProvider || "-"}`;

  if (snapshot.release?.tag) {
    elements.healthMeta.textContent = `service=${health.service} / ${new Date(health.timestamp).toLocaleString("ko-KR")} / release=${snapshot.release.tag}`;
  }

  const releaseLabel = snapshot.release?.tag || "로컬 실행 또는 수동 배포";
  const releaseMeta = snapshot.release?.publishedAt
    ? `${releaseLabel} / ${new Date(snapshot.release.publishedAt).toLocaleString("ko-KR")}`
    : releaseLabel;

  elements.snapshotList.innerHTML = [
    ["앱 Base URL", snapshot.runtime.appBaseUrl || "-"],
    ["Object Storage", snapshot.runtime.objectStorageProvider || "-"],
    ["작업 건 수", String(snapshot.storage.counts?.jobCases ?? 0)],
    ["현장 기록 수", String(snapshot.storage.counts?.fieldRecords ?? 0)],
    ["합의 기록 수", String(snapshot.storage.counts?.agreements ?? 0)],
    ["배포 버전", releaseMeta]
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");

  if (!snapshot.backups?.length) {
    elements.backups.innerHTML = '<div class="empty-state">최근 백업이 없습니다.</div>';
    return;
  }

  elements.backups.innerHTML = snapshot.backups.map((item) => `
    <article class="ops-backup-item">
      <strong>${item.name}</strong>
      <p>${item.type} / ${formatBytes(item.sizeBytes)} / ${new Date(item.updatedAt).toLocaleString("ko-KR")}</p>
      <span>${item.relativePath}</span>
    </article>
  `).join("");
}

async function loadOps() {
  const [health, snapshot] = await Promise.all([
    request("/api/v1/health"),
    request("/api/v1/admin/ops-snapshot")
  ]);
  renderSnapshot(health, snapshot);
}

elements.refresh.addEventListener("click", async () => {
  setBusy(elements.refresh, true, "새로고침 중...");
  try {
    await loadOps();
    showFeedback("운영 스냅샷을 새로고침했습니다.", "success");
  } catch (error) {
    showFeedback(error.message, "error");
  } finally {
    setBusy(elements.refresh, false, "새로고침");
  }
});

elements.backupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(elements.backupSubmit, true, "백업 중...");
  try {
    const payload = await request("/api/v1/admin/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: elements.backupLabel.value || "ops-manual" })
    });
    showFeedback(`백업을 만들었습니다: ${payload.fileName}`, "success");
    elements.backupLabel.value = "";
    await loadOps();
  } catch (error) {
    showFeedback(error.message, "error");
  } finally {
    setBusy(elements.backupSubmit, false, "백업 만들기");
  }
});

loadOps().catch((error) => {
  showFeedback(error.message, "error");
});
