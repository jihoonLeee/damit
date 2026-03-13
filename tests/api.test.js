import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

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
  displayName: "운영자",
  companyName: "다밋 클린"
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

test("health endpoint returns launch metadata", async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.status, "ok");
  assert.equal(payload.authMode, "SESSION_ONLY");
  assert.equal(payload.storageEngine, "SQLITE");
});

test("P0 happy path completes from field record to agreement", async () => {
  const note = "거실 니코틴 오염";
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
      customerLabel: "송파 힐스테이트 1203호",
      contactMemo: "당근 문의 고객",
      siteLabel: "송파 힐스테이트 1203호",
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
  assert.match(draft.body, /320,000원/);

  const agreementResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/agreement-records`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      status: "AGREED",
      confirmationChannel: "KAKAO_OR_SMS",
      confirmedAmount: 320000,
      customerResponseNote: "진행 동의"
    })
  });
  assert.equal(agreementResponse.status, 201);

  const listResponse = await fetch(`${baseUrl}/api/v1/job-cases?status=AGREED&query=힐스테이트`, {
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
  assert.match(scopePayload.extraWorkSummary, /니코틴 오염/);

  const draftGetResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/draft-message`, {
    headers: sessionHeaders()
  });
  assert.equal(draftGetResponse.status, 200);
  const draftGetPayload = await draftGetResponse.json();
  assert.match(draftGetPayload.body, /현장 확인 결과/);

  const timelineResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/timeline`, {
    headers: sessionHeaders()
  });
  assert.equal(timelineResponse.status, 200);
  const timeline = await timelineResponse.json();
  assert.equal(timeline.items.length, 4);
});

test("admin backup and reset endpoints work for owner session operations", async () => {
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
  missingPhotoForm.append("note", "메모만 있음");

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
