import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { createServer, request as httpRequest } from "node:http";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { createOwnerSession } from "./helpers/session-auth.js";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "damit-api-"));
process.chdir(tempRoot);

const { createApp } = await import("../src/app.js");
const { config } = await import("../src/config.js");
const { readDb } = await import("../src/store.js");

config.rootDir = tempRoot;
config.publicDir = path.join(tempRoot, "public");
config.dataDir = path.join(tempRoot, "data");
config.uploadDir = path.join(tempRoot, "data", "uploads");
config.backupDir = path.join(tempRoot, "data", "backups");
config.dbFilePath = path.join(tempRoot, "data", "app.sqlite");
config.storageEngine = "SQLITE";

await fs.mkdir(config.publicDir, { recursive: true });
for (const fileName of ["landing.html", "login.html", "home.html", "ops.html", "index.html", "confirm.html"]) {
  await fs.writeFile(path.join(config.publicDir, fileName), "<html></html>", "utf8");
}

const app = createApp();
const server = createServer((req, res) => app.handle(req, res));
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

const ownerSession = await createOwnerSession(baseUrl, config, {
  email: "owner@example.com",
  displayName: "Operator Owner",
  companyName: "Damit Ops"
});

function sessionHeaders(extra = {}) {
  return {
    Cookie: ownerSession.cookieHeader,
    ...extra
  };
}

function writeSessionHeaders(extra = {}) {
  return {
    Cookie: ownerSession.cookieHeader,
    "x-csrf-token": ownerSession.csrfToken,
    ...extra
  };
}

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("www host redirects to canonical root origin", async () => {
  config.appBaseUrl = "https://damit.kr";

  const response = await new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        host: "127.0.0.1",
        port,
        path: "/login?next=%2Fapp",
        method: "GET",
        headers: {
          Host: "www.damit.kr"
        }
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );
    request.on("error", reject);
    request.end();
  });

  assert.equal(response.statusCode, 308);
  assert.equal(response.headers.location, "https://damit.kr/login?next=%2Fapp");
  assert.match(response.body, /Redirecting to https:\/\/damit\.kr\/login\?next=%2Fapp/);
});

test("health endpoint returns launch metadata", async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.status, "ok");
  assert.equal(payload.authMode, "SESSION_ONLY");
  assert.equal(payload.storageEngine, "SQLITE");

  const db = new DatabaseSync(config.dbFilePath);
  const tables = new Set(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name)
  );

  for (const tableName of [
    "users",
    "companies",
    "memberships",
    "login_challenges",
    "sessions",
    "invitations",
    "customer_confirmation_links",
    "customer_confirmation_events"
  ]) {
    assert.equal(tables.has(tableName), true, `${tableName} should exist after boot`);
  }
});

test("workflow split routes resolve to the workspace document", async () => {
  for (const route of ["/app/capture", "/app/quote", "/app/draft", "/app/confirm"]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} should resolve`);
    const body = await response.text();
    assert.match(body, /<html>/i);
  }
});


test("admin data explorer returns dataset metadata", async () => {
  const response = await fetch(`${baseUrl}/api/v1/admin/data-explorer?dataset=users&limit=3`, {
    headers: sessionHeaders()
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(Array.isArray(payload.datasets), true);
  assert.equal(payload.datasets.some((item) => item.key === "jobCases"), true);
  assert.equal(payload.datasets.some((item) => item.key === "loginChallenges"), true);
  assert.equal(payload.datasets.some((item) => item.key === "sessions"), true);
  assert.equal(payload.selected.key, "users");
  assert.equal(payload.selected.tableName, "users");
  assert.deepEqual(payload.selected.columns, ["id", "email", "display_name", "status", "last_login_at", "updated_at"]);
  assert.equal(Array.isArray(payload.selected.rows), true);
});
test("P0 happy path completes from field record to agreement", async () => {
  const note = "living room nicotine contamination";
  const formData = new FormData();
  formData.append("primaryReason", "CONTAMINATION");
  formData.append("secondaryReason", "NICOTINE");
  formData.append("note", note);
  formData.append("photos[]", new File([new Uint8Array([137, 80, 78, 71])], "sample.png", { type: "image/png" }));

  const fieldRecordResponse = await fetch(`${baseUrl}/api/v1/field-records`, {
    method: "POST",
    headers: writeSessionHeaders(),
    body: formData
  });
  assert.equal(fieldRecordResponse.status, 201);
  const fieldRecord = await fieldRecordResponse.json();
  assert.equal(fieldRecord.note, note);
  assert.match(fieldRecord.photos[0].url, new RegExp(`^/uploads/companies/${ownerSession.verify.payload.company.id}/field-records/${fieldRecord.id}/photo_[^/]+\.png$`));

  const snapshot = await readDb();
  const savedPhoto = snapshot.fieldRecordPhotos.find((item) => item.field_record_id === fieldRecord.id);
  assert.equal(savedPhoto.storage_provider, "LOCAL_VOLUME");
  assert.match(savedPhoto.object_key, new RegExp(`^companies/${ownerSession.verify.payload.company.id}/field-records/${fieldRecord.id}/photo_[^/]+\.png$`));
  assert.equal(savedPhoto.public_url, fieldRecord.photos[0].url);

  const jobCaseResponse = await fetch(`${baseUrl}/api/v1/job-cases`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      customerLabel: "Songpa Hills 1203",
      contactMemo: "carrot inquiry lead",
      siteLabel: "Songpa Hills 1203",
      originalQuoteAmount: 250000
    })
  });
  assert.equal(jobCaseResponse.status, 201);
  const jobCase = await jobCaseResponse.json();

  const linkResponse = await fetch(`${baseUrl}/api/v1/field-records/${fieldRecord.id}/link-job-case`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ jobCaseId: jobCase.id })
  });
  assert.equal(linkResponse.status, 200);

  const quoteResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/quote`, {
    method: "PATCH",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ revisedQuoteAmount: 320000 })
  });
  assert.equal(quoteResponse.status, 200);

  const draftResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/draft-message`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ tone: "CUSTOMER_MESSAGE" })
  });
  assert.equal(draftResponse.status, 200);
  const draft = await draftResponse.json();
  assert.match(draft.body, /320,000/);

  const agreementResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/agreement-records`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      status: "AGREED",
      confirmationChannel: "KAKAO_OR_SMS",
      confirmedAmount: 320000,
      customerResponseNote: "approved to continue"
    })
  });
  assert.equal(agreementResponse.status, 201);

  const listResponse = await fetch(`${baseUrl}/api/v1/job-cases?status=AGREED&query=Songpa`, {
    headers: sessionHeaders()
  });
  assert.equal(listResponse.status, 200);
  const listPayload = await listResponse.json();
  assert.equal(listPayload.items.length, 1);
  assert.equal(listPayload.items[0].currentStatus, "AGREED");

  const detailResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}`, {
    headers: sessionHeaders()
  });
  assert.equal(detailResponse.status, 200);
  const detail = await detailResponse.json();
  assert.equal(detail.currentStatus, "AGREED");
  assert.equal(detail.latestAgreementRecord.confirmedAmount, 320000);
  assert.equal(detail.fieldRecords[0].note, note);

  const scopeResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/scope-comparison`, {
    headers: sessionHeaders()
  });
  assert.equal(scopeResponse.status, 200);
  const scopePayload = await scopeResponse.json();
  assert.match(scopePayload.extraWorkSummary, /니코틴|nicotine/i);

  const draftGetResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/draft-message`, {
    headers: sessionHeaders()
  });
  assert.equal(draftGetResponse.status, 200);
  const draftGetPayload = await draftGetResponse.json();
  assert.match(draftGetPayload.body, /onsite|320,000/i);

  const timelineResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/timeline`, {
    headers: sessionHeaders()
  });
  assert.equal(timelineResponse.status, 200);
  const timeline = await timelineResponse.json();
  assert.equal(timeline.items.length, 4);
});

test("admin backup and reset endpoints work for owner session operations", async () => {
  const riskCandidate = await fetch(`${baseUrl}/api/v1/job-cases`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      customerLabel: "잠실 리스크 작업",
      contactMemo: "ops risk candidate",
      siteLabel: "잠실 리스크 작업",
      originalQuoteAmount: 180000
    })
  });
  assert.equal(riskCandidate.status, 201);

  const before = await fetch(`${baseUrl}/api/v1/admin/storage-status`, {
    headers: sessionHeaders()
  });
  assert.equal(before.status, 200);
  const beforePayload = await before.json();
  assert.equal(beforePayload.storageEngine, "SQLITE");
  assert.equal(beforePayload.objectStorageProvider, "LOCAL_VOLUME");
  assert.equal(typeof beforePayload.updatedAt, "string");

  const backup = await fetch(`${baseUrl}/api/v1/admin/backup`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ label: "test-backup" })
  });
  assert.equal(backup.status, 201);
  const backupPayload = await backup.json();
  assert.match(backupPayload.fileName, /test-backup/);

  const snapshot = await fetch(`${baseUrl}/api/v1/admin/ops-snapshot`, {
    headers: sessionHeaders()
  });
  assert.equal(snapshot.status, 200);
  const snapshotPayload = await snapshot.json();
  assert.equal(snapshotPayload.storage.storageEngine, "SQLITE");
  assert.ok(Array.isArray(snapshotPayload.backups));
  assert.ok(snapshotPayload.backups.length >= 1);
  assert.equal(snapshotPayload.runtime.storageEngine, "SQLITE");
  assert.equal(snapshotPayload.runtime.mailProvider, "FILE");
  assert.equal(snapshotPayload.runtime.mailFromConfigured, true);
  assert.equal(snapshotPayload.runtime.resendConfigured, false);
  assert.equal(snapshotPayload.runtime.authDebugLinks, true);
  assert.equal(snapshotPayload.runtime.authEnforceTrustedOrigin, false);
  assert.equal(snapshotPayload.runtime.authDeliveryMode, "FILE_PREVIEW");
  assert.equal(snapshotPayload.runtime.authOperationalReadiness, "HARDENING_REQUIRED");
  assert.equal(typeof snapshotPayload.generatedAt, "string");
  assert.equal(snapshotPayload.backupSummary.totalRecentBackups >= 1, true);
  assert.equal(typeof snapshotPayload.signals.agreements.totalCount, "number");
  assert.equal(typeof snapshotPayload.signals.customerConfirmations.openCount, "number");
  assert.equal(typeof snapshotPayload.signals.timeline.recentCount24h, "number");
  assert.equal(typeof snapshotPayload.signals.auth.challengeTotalCount, "number");
  assert.equal(typeof snapshotPayload.signals.auth.activeSessionCount, "number");
  assert.equal(Array.isArray(snapshotPayload.signals.timeline.topEventTypes), true);
  assert.equal(Array.isArray(snapshotPayload.activity.recentAuditLogs), true);
  assert.equal(Array.isArray(snapshotPayload.activity.recentCustomerConfirmations), true);
  assert.equal(Array.isArray(snapshotPayload.activity.recentTimelineEvents), true);
  assert.equal(Array.isArray(snapshotPayload.activity.recentAuthChallenges), true);
  assert.equal(Array.isArray(snapshotPayload.focusCases), true);
  assert.equal(snapshotPayload.focusCases.length >= 1, true);
  assert.equal(snapshotPayload.focusCases[0].focusReasonKey, "quote-missing");
  assert.equal(snapshotPayload.focusCases[0].customerLabel, "잠실 리스크 작업");
  assert.equal(snapshotPayload.activity.recentAuditLogs[0].action, "OPS_BACKUP_CREATED");

  const badReset = await fetch(`${baseUrl}/api/v1/admin/reset-data`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ confirm: "NOPE" })
  });
  assert.equal(badReset.status, 400);

  const goodReset = await fetch(`${baseUrl}/api/v1/admin/reset-data`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ confirm: "RESET_ALL_OPERATIONAL_DATA" })
  });
  assert.equal(goodReset.status, 200);
  const resetPayload = await goodReset.json();
  assert.equal(resetPayload.ok, true);
  assert.deepEqual(resetPayload.counts, {
    jobCases: 0,
    fieldRecords: 0,
    agreements: 0
  });
});

test("returns documented validation errors", async () => {
  const missingPhotoForm = new FormData();
  missingPhotoForm.append("primaryReason", "CONTAMINATION");
  missingPhotoForm.append("note", "memo only");

  const missingPhotoResponse = await fetch(`${baseUrl}/api/v1/field-records`, {
    method: "POST",
    headers: writeSessionHeaders(),
    body: missingPhotoForm
  });
  assert.equal(missingPhotoResponse.status, 422);
  const missingPhotoPayload = await missingPhotoResponse.json();
  assert.equal(missingPhotoPayload.error.code, "PHOTO_REQUIRED");

  const badFilterResponse = await fetch(`${baseUrl}/api/v1/job-cases?status=BAD`, {
    headers: sessionHeaders()
  });
  assert.equal(badFilterResponse.status, 400);
  const badFilterPayload = await badFilterResponse.json();
  assert.equal(badFilterPayload.error.code, "INVALID_STATUS_FILTER");
});








