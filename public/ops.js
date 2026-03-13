const CSRF_COOKIE_NAME = "faa_csrf";

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

function readCookie(name) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) || "";
}

function buildHeaders(extra = {}, method = "GET") {
  const headers = { ...extra };
  if (method !== "GET") {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }
  }
  return headers;
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

async function refreshSession() {
  const response = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    credentials: "same-origin"
  });
  if (!response.ok) {
    throw new Error("세션이 만료되었습니다.");
  }
}

async function request(url, options = {}, allowRetry = true) {
  const method = options.method || "GET";
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: buildHeaders(options.headers || {}, method)
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const code = payload?.error?.code;
    if ((response.status === 401 || response.status === 403) && allowRetry) {
      try {
        await refreshSession();
        return request(url, options, false);
      } catch {
        window.location.href = "/login";
        throw new Error("세션이 만료되었습니다.");
      }
    }
    if (code === "OPS_OWNER_REQUIRED" || code === "COMPANY_ROLE_FORBIDDEN") {
      window.location.href = "/home";
    }
    throw new Error(payload?.error?.message || "요청을 처리하지 못했습니다.");
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

  const releaseLabel = snapshot.release?.tag || "아직 릴리즈 메타데이터 없음";
  const releaseMeta = snapshot.release?.publishedAt
    ? `${releaseLabel} / ${new Date(snapshot.release.publishedAt).toLocaleString("ko-KR")}`
    : releaseLabel;

  elements.snapshotList.innerHTML = [
    ["App Base URL", snapshot.runtime.appBaseUrl || "-"],
    ["Object Storage", snapshot.runtime.objectStorageProvider || "-"],
    ["작업 건 수", String(snapshot.storage.counts?.jobCases ?? 0)],
    ["현장 기록 수", String(snapshot.storage.counts?.fieldRecords ?? 0)],
    ["합의 기록 수", String(snapshot.storage.counts?.agreements ?? 0)],
    ["배포 버전", releaseMeta]
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");

  if (!snapshot.backups?.length) {
    elements.backups.innerHTML = '<div class="empty-state">아직 생성된 백업이 없습니다.</div>';
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
    showFeedback("운영 정보를 새로 불러왔습니다.", "success");
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
