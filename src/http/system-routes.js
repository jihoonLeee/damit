import fs from "node:fs/promises";
import path from "node:path";

import { config } from "../config.js";
import { runPostgresPreflight } from "../db/postgres-preflight.js";
import { HttpError, json, readJsonBody } from "../http.js";
import { assertCsrf, getAuthContext } from "../contexts/auth/application/auth-runtime.js";
import { nowIso } from "../store.js";

export async function handleSystemApiRequest(request, response, pathname, repositories) {
  if (request.method === "GET" && pathname === "/api/v1/health") {
    const storage = await repositories.systemRepository.getStorageSummary();
    json(response, 200, {
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
    json(response, 200, storage);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/admin/ops-snapshot") {
    await requireOwnerOpsContext(request, repositories);
    const snapshot = await repositories.systemRepository.getOpsSnapshot(5);
    json(response, 200, {
      ...snapshot,
      release: await readReleaseVersionSummary()
    });
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
    json(response, 200, report);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/v1/admin/backup") {
    await requireOwnerOpsContext(request, repositories, { write: true });
    const payload = await readJsonBody(request);
    const backup = await repositories.systemRepository.createBackup(payload.label || "ops-manual");
    json(response, 201, backup);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/v1/admin/reset-data") {
    await requireOwnerOpsContext(request, repositories, { write: true });
    const payload = await readJsonBody(request);
    if (payload.confirm !== "RESET_ALL_OPERATIONAL_DATA") {
      throw new HttpError(400, "RESET_CONFIRMATION_REQUIRED", "초기화 확인 문구가 올바르지 않습니다.");
    }
    await repositories.systemRepository.createBackup("before-reset");
    const storage = await repositories.systemRepository.resetAllData();
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
    assertCsrf(request);
  }
  return authContext;
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
