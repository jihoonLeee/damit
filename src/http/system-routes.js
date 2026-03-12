import fs from "node:fs/promises";
import path from "node:path";

import { config } from "../config.js";
import { runPostgresPreflight } from "../db/postgres-preflight.js";
import { HttpError, json, readJsonBody } from "../http.js";
import { assertAuthenticated } from "../contexts/field-agreement/application/field-agreement.validation.js";
import { nowIso } from "../store.js";

export async function handleSystemApiRequest(request, response, pathname, repositories) {
  if (request.method === "GET" && pathname === "/api/v1/health") {
    const storage = await repositories.systemRepository.getStorageSummary();
    json(response, 200, {
      status: "ok",
      service: "field-agreement-assistant",
      ownerMode: "OWNER_ONLY",
      storageEngine: storage.storageEngine,
      timestamp: nowIso(),
      counts: storage.counts
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/admin/storage-status") {
    assertAuthenticated(request);
    const storage = await repositories.systemRepository.getStorageSummary();
    json(response, 200, storage);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/admin/ops-snapshot") {
    assertAuthenticated(request);
    const snapshot = await repositories.systemRepository.getOpsSnapshot(5);
    json(response, 200, {
      ...snapshot,
      release: await readReleaseVersionSummary()
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/v1/admin/postgres-preflight") {
    assertAuthenticated(request);
    if (!config.databaseUrl) {
      throw new HttpError(409, "POSTGRES_NOT_CONFIGURED", "Managed Postgres 연결 정보가 아직 설정되지 않았어요");
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
    assertAuthenticated(request);
    const payload = await readJsonBody(request);
    const backup = await repositories.systemRepository.createBackup(payload.label || "pilot");
    json(response, 201, backup);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/v1/admin/reset-data") {
    assertAuthenticated(request);
    const payload = await readJsonBody(request);
    if (payload.confirm !== "RESET_PILOT_DATA") {
      throw new HttpError(400, "RESET_CONFIRMATION_REQUIRED", "리셋 확인 문구를 정확히 입력해주세요");
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