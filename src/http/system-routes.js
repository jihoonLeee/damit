import fs from "node:fs/promises";
import path from "node:path";

import { config } from "../config.js";
import { runPostgresPreflight } from "../db/postgres-preflight.js";
import { HttpError, json, jsonNoStore, readJsonBody } from "../http.js";
import { assertCsrf, assertTrustedOrigin, getAuthContext } from "../contexts/auth/application/auth-runtime.js";
import { nowIso } from "../store.js";

export async function handleSystemApiRequest(request, response, pathname, repositories) {
  if (request.method === "GET" && pathname === "/api/v1/health") {
    const storage = await repositories.systemRepository.getStorageSummary();
    jsonNoStore(response, 200, {
      status: "ok",
      service: "damit",
      authMode: "SESSION_ONLY",
      storageEngine: storage.storageEngine,
      timestamp: nowIso(),
      counts: storage.counts
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/admin/storage-status") {
    await requireOwnerOpsContext(request, repositories);
    const storage = await repositories.systemRepository.getStorageSummary();
    jsonNoStore(response, 200, storage);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/admin/ops-snapshot") {
    await requireOwnerOpsContext(request, repositories);
    const snapshot = await repositories.systemRepository.getOpsSnapshot(5);
    jsonNoStore(response, 200, {
      ...snapshot,
      release: await readReleaseVersionSummary()
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/system-admin/overview") {
    const authContext = await requireSystemAdminContext(request, repositories);
    const snapshot = await repositories.systemRepository.getOpsSnapshot(8);
    jsonNoStore(response, 200, {
      viewer: buildAdminViewerSummary(authContext),
      snapshot,
      release: await readReleaseVersionSummary()
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/system-admin/data-explorer") {
    const authContext = await requireSystemAdminContext(request, repositories);
    const url = new URL(request.url, "http://localhost");
    const dataset = url.searchParams.get("dataset") || "companies";
    const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10);
    const explorer = await repositories.systemRepository.getDataExplorer(dataset, limit);
    jsonNoStore(response, 200, {
      viewer: buildAdminViewerSummary(authContext),
      ...explorer
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/system-admin/data-explorer/export") {
    const authContext = await requireSystemAdminContext(request, repositories);
    const url = new URL(request.url, "http://localhost");
    const dataset = url.searchParams.get("dataset") || "companies";
    const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10);
    const explorer = await repositories.systemRepository.getDataExplorer(dataset, limit);
    const selectedKey = explorer.selected?.key || dataset;
    const filename = `damit-system-admin-${selectedKey}-${new Date().toISOString().slice(0, 10)}.json`;
    jsonNoStore(response, 200, {
      viewer: buildAdminViewerSummary(authContext),
      exportedAt: nowIso(),
      dataset: selectedKey,
      limit,
      selected: explorer.selected,
      datasets: explorer.datasets
    }, {
      "Content-Disposition": `attachment; filename="${filename}"`
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/admin/data-explorer") {
    await requireOwnerOpsContext(request, repositories);
    const url = new URL(request.url, "http://localhost");
    const dataset = url.searchParams.get("dataset") || "jobCases";
    const limit = Number.parseInt(url.searchParams.get("limit") || "8", 10);
    const explorer = await repositories.systemRepository.getDataExplorer(dataset, limit);
    jsonNoStore(response, 200, explorer);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/admin/postgres-preflight") {
    await requireOwnerOpsContext(request, repositories);
    if (!config.databaseUrl) {
      throw new HttpError(409, "POSTGRES_NOT_CONFIGURED", "Postgres 연결 문자열이 아직 설정되지 않았습니다.");
    }
    const report = await runPostgresPreflight({
      databaseUrl: config.databaseUrl,
      sslMode: config.postgresSslMode,
      sslRequire: config.postgresSslRequire,
      sslCaPath: config.postgresSslCaPath,
      applicationName: config.postgresApplicationName,
      maxPoolSize: config.postgresPoolMax
    });
    jsonNoStore(response, 200, report);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/v1/admin/backup") {
    const authContext = await requireOwnerOpsContext(request, repositories, { write: true });
    const payload = await readJsonBody(request);
    const label = payload.label || "ops-manual";
    const backup = await repositories.systemRepository.createBackup(label);
    await appendOpsAuditLog(repositories, authContext, {
      action: "OPS_BACKUP_CREATED",
      resourceType: "SYSTEM_BACKUP",
      resourceId: backup.fileName,
      payloadJson: {
        label,
        relativePath: backup.relativePath || null
      }
    });
    jsonNoStore(response, 201, backup);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/v1/admin/reset-data") {
    const authContext = await requireOwnerOpsContext(request, repositories, { write: true });
    const payload = await readJsonBody(request);
    if (payload.confirm !== "RESET_ALL_OPERATIONAL_DATA") {
      throw new HttpError(400, "RESET_CONFIRMATION_REQUIRED", "초기화 확인 문구가 올바르지 않습니다.");
    }
    const backup = await repositories.systemRepository.createBackup("before-reset");
    const storage = await repositories.systemRepository.resetAllData();
    await appendOpsAuditLog(repositories, authContext, {
      action: "OPS_DATA_RESET",
      resourceType: "SYSTEM_RUNTIME",
      resourceId: storage.storageEngine,
      payloadJson: {
        backupFileName: backup.fileName,
        counts: storage.counts
      }
    });
    json(response, 200, {
      ok: true,
      storageEngine: storage.storageEngine,
      counts: storage.counts
    });
    return true;
  }

  return false;
}

async function requireOwnerOpsContext(request, repositories, options = {}) {
  const authContext = await getAuthContext(request, repositories);
  if (authContext.mode !== "SESSION") {
    throw new HttpError(403, "SESSION_AUTH_REQUIRED", "운영 API는 세션 로그인 후에만 사용할 수 있습니다.");
  }
  if (authContext.role !== "OWNER") {
    throw new HttpError(403, "OPS_OWNER_REQUIRED", "운영 콘솔은 OWNER 권한에서만 사용할 수 있습니다.");
  }
  if (options.write) {
    assertTrustedOrigin(request);
    assertCsrf(request);
  }
  return authContext;
}

async function requireSystemAdminContext(request, repositories) {
  const authContext = await getAuthContext(request, repositories);
  if (authContext.mode !== "SESSION") {
    throw new HttpError(403, "SESSION_AUTH_REQUIRED", "시스템 관리자 화면은 세션 로그인 후에만 사용할 수 있습니다.");
  }
  if (!isSystemAdmin(authContext.email)) {
    throw new HttpError(403, "SYSTEM_ADMIN_REQUIRED", "시스템 관리자 화면은 내부 관리자 계정에서만 사용할 수 있습니다.");
  }
  return authContext;
}

function isSystemAdmin(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return Boolean(normalized) && config.systemAdminEmails.includes(normalized);
}

function buildAdminViewerSummary(authContext) {
  return {
    userId: authContext.userId,
    email: authContext.email || null,
    displayName: authContext.displayName || null,
    companyId: authContext.companyId || null,
    companyName: authContext.companyName || null,
    role: authContext.role || null
  };
}

async function appendOpsAuditLog(repositories, authContext, { action, resourceType, resourceId, payloadJson }) {
  if (!repositories.auditLogRepository?.append) {
    return;
  }

  await repositories.auditLogRepository.append({
    companyId: authContext.companyId,
    actorUserId: authContext.userId,
    actorType: "USER",
    action,
    resourceType,
    resourceId: resourceId || null,
    requestId: null,
    payloadJson: payloadJson || null,
    createdAt: nowIso()
  });
}

async function readReleaseVersionSummary() {
  const filePath = path.join(config.rootDir, ".release-version");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const rows = Object.fromEntries(
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const index = line.indexOf("=");
          return index === -1 ? [line, ""] : [line.slice(0, index), line.slice(index + 1)];
        })
    );

    return {
      tag: rows.TAG || null,
      name: rows.NAME || null,
      target: rows.TARGET || null,
      sha: rows.SHA || null,
      publishedAt: rows.PUBLISHED_AT || null
    };
  } catch {
    return null;
  }
}
