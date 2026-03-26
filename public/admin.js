const feedback = document.querySelector("#admin-feedback");
const verdictBadge = document.querySelector("#admin-verdict-badge");
const viewerMeta = document.querySelector("#admin-viewer-meta");
const verdictTitle = document.querySelector("#admin-verdict-title");
const verdictCopy = document.querySelector("#admin-verdict-copy");
const viewerCard = document.querySelector("#admin-viewer-card");
const snapshotList = document.querySelector("#admin-snapshot-list");
const explorerMeta = document.querySelector("#admin-explorer-meta");
const explorerDescription = document.querySelector("#admin-explorer-description");
const focusTitle = document.querySelector("#admin-focus-title");
const focusCopy = document.querySelector("#admin-focus-copy");
const datasetSwitcher = document.querySelector("#admin-dataset-switcher");
const selectedLabel = document.querySelector("#admin-selected-label");
const selectedCount = document.querySelector("#admin-selected-count");
const dataTable = document.querySelector("#admin-data-table");
const companyCount = document.querySelector("#admin-company-count");
const companyMeta = document.querySelector("#admin-company-meta");
const userCount = document.querySelector("#admin-user-count");
const userMeta = document.querySelector("#admin-user-meta");
const sessionCount = document.querySelector("#admin-session-count");
const sessionMeta = document.querySelector("#admin-session-meta");
const jobCount = document.querySelector("#admin-job-count");
const jobMeta = document.querySelector("#admin-job-meta");
const exportLink = document.querySelector("#admin-export-link");
const exportNote = document.querySelector("#admin-export-note");

let currentDataset = "companies";

const DATASET_META = {
  companies: {
    label: "회사",
    description: "등록된 회사와 현재 상태를 전역 기준으로 확인합니다.",
    focus: "현재 어떤 회사가 등록돼 있고 어떤 상태인지 빠르게 비교할 수 있습니다."
  },
  users: {
    label: "사용자",
    description: "계정과 최근 로그인 상태를 전역 기준으로 확인합니다.",
    focus: "운영 중인 계정이 얼마나 있고 어떤 이메일로 연결돼 있는지 확인하는 용도입니다."
  },
  sessions: {
    label: "세션",
    description: "현재 활성 세션과 종료 흐름을 전역 기준으로 확인합니다.",
    focus: "동시에 살아 있는 세션이 얼마나 있는지, 예상보다 많지 않은지 먼저 보는 데이터셋입니다."
  },
  loginChallenges: {
    label: "로그인 요청",
    description: "로그인 링크 발급과 전달 상태를 전역 기준으로 확인합니다.",
    focus: "로그인 링크 전달이 실패하거나 과도하게 쌓이지 않는지 확인할 때 가장 먼저 봅니다."
  },
  memberships: {
    label: "멤버십",
    description: "회사별 멤버 구성과 역할 상태를 전역 기준으로 확인합니다.",
    focus: "회사마다 OWNER, MANAGER, STAFF 구성이 어떻게 연결돼 있는지 보는 화면입니다."
  },
  auditLogs: {
    label: "감사 로그",
    description: "최근 운영 액션과 변경 흔적을 전역 기준으로 확인합니다.",
    focus: "누가 어떤 액션을 했는지 증거를 확인할 때 쓰는 읽기 전용 기록입니다."
  },
  jobCases: {
    label: "작업 건",
    description: "전체 작업 건과 현재 상태를 전역 기준으로 확인합니다.",
    focus: "운영 중인 작업 건 수와 상태 분포가 정상인지 한 번에 보는 용도입니다."
  },
  fieldRecords: {
    label: "현장 기록",
    description: "최근 현장 기록과 연결 상태를 전역 기준으로 확인합니다.",
    focus: "현장 기록이 작업 건에 제대로 연결되고 있는지 빠르게 점검할 수 있습니다."
  },
  agreementRecords: {
    label: "합의 기록",
    description: "합의 상태와 변경 금액 기록을 전역 기준으로 확인합니다.",
    focus: "실제 합의가 기록으로 남고 있는지, 금액 정보가 비어 있지 않은지 보는 용도입니다."
  },
  customerConfirmations: {
    label: "고객 확인",
    description: "고객 확인 링크의 최근 상태를 전역 기준으로 확인합니다.",
    focus: "발급, 열람, 확인 완료 흐름이 끊기지 않는지 확인할 때 가장 유용합니다."
  },
  timelineEvents: {
    label: "타임라인",
    description: "최근 제품 이벤트와 작업 흐름을 전역 기준으로 확인합니다.",
    focus: "최근 운영 활동이 실제로 시스템 안에 기록되고 있는지 확인하는 최종 로그입니다."
  }
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

function formatCount(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function redirectToLogin(reason = "session-expired", nextPath = "/admin") {
  const params = new URLSearchParams();
  params.set("reason", reason);
  params.set("next", nextPath);
  window.location.href = `/login?${params.toString()}`;
}

function redirectToAccount(reason = "system-admin-required") {
  const params = new URLSearchParams();
  params.set("reason", reason);
  window.location.href = `/account?${params.toString()}`;
}

async function request(url, options = {}, allowRetry = true) {
  const method = options.method || "GET";
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (method !== "GET") {
    const csrfToken = readCookie("faa_csrf");
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
    const code = payload?.error?.code;
    if ((response.status === 401 || response.status === 403) && allowRetry) {
      try {
        await request("/api/v1/auth/refresh", { method: "POST" }, false);
        return request(url, options, false);
      } catch {
        if (code === "SYSTEM_ADMIN_REQUIRED") {
          redirectToAccount();
        } else {
          redirectToLogin();
        }
        throw new Error("다시 로그인해 주세요.");
      }
    }
    if (code === "SYSTEM_ADMIN_REQUIRED") {
      redirectToAccount();
      throw new Error("시스템 관리자 권한이 필요합니다.");
    }
    const error = new Error(payload?.error?.message || "요청을 처리하지 못했습니다.");
    error.code = code;
    throw error;
  }
  return payload;
}

function datasetCount(datasets, key) {
  return datasets.find((item) => item.key === key)?.count || 0;
}

function datasetLabel(key, fallback) {
  return DATASET_META[key]?.label || fallback || key;
}

function datasetDescription(key, fallback) {
  return DATASET_META[key]?.description || fallback || "전역 운영 데이터를 읽기 전용으로 확인합니다.";
}

function datasetFocusCopy(key) {
  return DATASET_META[key]?.focus || "현재 선택한 데이터셋이 어떤 의미인지 먼저 확인한 뒤 표를 읽으면 더 빠르게 판단할 수 있습니다.";
}

function buildExportHref(datasetKey) {
  const params = new URLSearchParams();
  params.set("dataset", datasetKey);
  params.set("limit", "12");
  return `/api/v1/system-admin/data-explorer/export?${params.toString()}`;
}

function updateExportAction(datasetKey) {
  exportLink.href = buildExportHref(datasetKey);
  exportLink.setAttribute("download", "");
  exportNote.textContent = `${datasetLabel(datasetKey)} 데이터셋을 JSON으로 내려받아 조사 기록이나 증거 캡처로 남길 수 있습니다.`;
}

function renderOverview(overview, explorer) {
  const viewer = overview.viewer || {};
  const snapshot = overview.snapshot || {};
  const datasets = explorer.datasets || [];

  verdictBadge.textContent = "내부 관리자";
  verdictBadge.className = "ops-badge tone-warning";
  viewerMeta.textContent = `${viewer.displayName || viewer.email || "관리자"} · ${viewer.email || "-"}`;
  verdictTitle.textContent = "전역 운영 상태를 읽는 내부 관리자 세션입니다.";
  verdictCopy.textContent = "이 화면은 여러 회사, 로그인 요청, 세션, 감사 로그를 읽기 전용으로 확인하는 증거 수집용 관리자 표면입니다.";

  viewerCard.innerHTML = `
    <strong>${escapeHtml(viewer.displayName || "이름 없음")}</strong>
    <p>${escapeHtml(viewer.email || "이메일 정보 없음")}</p>
    <p class="helper-text">현재 회사 ${escapeHtml(viewer.companyName || "없음")} · 역할 ${escapeHtml(viewer.role || "-")}</p>
  `;

  const release = overview.release?.tag || "릴리즈 정보 없음";
  snapshotList.innerHTML = [
    ["배포 버전", release],
    ["저장 엔진", snapshot.storage?.storageEngine || "-"],
    ["작업 건", formatCount(snapshot.storage?.counts?.jobCases)],
    ["현장 기록", formatCount(snapshot.storage?.counts?.fieldRecords)],
    ["합의 기록", formatCount(snapshot.storage?.counts?.agreements)],
    ["최근 스냅샷", formatDateTime(snapshot.generatedAt)]
  ].map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");

  companyCount.textContent = formatCount(datasetCount(datasets, "companies"));
  companyMeta.textContent = "현재 회사 기준";
  userCount.textContent = formatCount(datasetCount(datasets, "users"));
  userMeta.textContent = "등록 계정 기준";
  sessionCount.textContent = formatCount(datasetCount(datasets, "sessions"));
  sessionMeta.textContent = "활성 및 최근 세션 기준";
  jobCount.textContent = formatCount(snapshot.storage?.counts?.jobCases);
  jobMeta.textContent = "전역 작업 건 기준";
}

function renderExplorer(explorer) {
  const selected = explorer.selected;
  if (!selected) {
    explorerMeta.textContent = "선택된 데이터셋 없음";
    datasetSwitcher.innerHTML = '<div class="empty-state">사용 가능한 데이터셋이 없습니다.</div>';
    selectedLabel.textContent = "선택된 데이터셋 없음";
    selectedCount.textContent = "0건";
    explorerDescription.textContent = "전역 운영 데이터를 읽기 전용으로 확인합니다.";
    focusTitle.textContent = "데이터셋을 불러오지 못했습니다.";
    focusCopy.textContent = "선택 가능한 데이터셋이 없어서 표를 보여주지 못하고 있습니다.";
    dataTable.innerHTML = '<div class="empty-state">표시할 데이터가 없습니다.</div>';
    updateExportAction("companies");
    return;
  }

  explorerMeta.textContent = explorer.generatedAt ? `생성 시각 ${formatDateTime(explorer.generatedAt)}` : "생성 시각 없음";
  explorerDescription.textContent = datasetDescription(selected.key, selected.description);
  selectedLabel.textContent = datasetLabel(selected.key, selected.label);
  selectedCount.textContent = `${formatCount(selected.count)}건`;
  focusTitle.textContent = `${datasetLabel(selected.key, selected.label)} 데이터셋을 보고 있습니다.`;
  focusCopy.textContent = datasetFocusCopy(selected.key);
  updateExportAction(selected.key);

  datasetSwitcher.innerHTML = (explorer.datasets || []).map((item) => `
    <button type="button" class="ops-dataset-chip ${item.key === selected.key ? "is-active" : ""}" data-dataset-key="${escapeHtml(item.key)}">
      <strong>${escapeHtml(datasetLabel(item.key, item.label))}</strong>
      <span>${escapeHtml(`${formatCount(item.count)}건`)}</span>
    </button>
  `).join("");

  if (!selected.rows?.length) {
    dataTable.innerHTML = '<div class="empty-state">이 데이터셋에는 아직 표시할 데이터가 없습니다.</div>';
    return;
  }

  const header = selected.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("");
  const body = selected.rows.map((row) => `
    <tr>${selected.columns.map((column) => `<td>${escapeHtml(row[column] ?? "-")}</td>`).join("")}</tr>
  `).join("");

  dataTable.innerHTML = `
    <table class="ops-data-table">
      <thead><tr>${header}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function setFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

async function load(dataset = currentDataset) {
  const [overview, explorer] = await Promise.all([
    request("/api/v1/system-admin/overview"),
    request(`/api/v1/system-admin/data-explorer?dataset=${encodeURIComponent(dataset)}&limit=12`)
  ]);
  currentDataset = explorer.selected?.key || dataset;
  renderOverview(overview, explorer);
  renderExplorer(explorer);
}

datasetSwitcher.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-dataset-key]");
  if (!button) {
    return;
  }
  const dataset = button.dataset.datasetKey;
  if (!dataset || dataset === currentDataset) {
    return;
  }
  try {
    await load(dataset);
    setFeedback(`${datasetLabel(dataset)} 데이터셋을 불러왔습니다.`, "success");
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

exportLink.addEventListener("click", () => {
  setFeedback(`${datasetLabel(currentDataset)} 데이터셋 JSON 내보내기를 시작합니다.`, "success");
});

load().catch((error) => {
  setFeedback(error.message, "error");
});
