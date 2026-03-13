import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "damit-workspace-"));
process.chdir(tempRoot);

const { createApp } = await import("../src/app.js");
const { config } = await import("../src/config.js");

config.rootDir = tempRoot;
config.publicDir = path.join(tempRoot, "public");
config.dataDir = path.join(tempRoot, "data");
config.uploadDir = path.join(tempRoot, "data", "uploads");
config.backupDir = path.join(tempRoot, "data", "backups");
config.dbFilePath = path.join(tempRoot, "data", "app.sqlite");
config.storageEngine = "SQLITE";
config.nodeEnv = "development";
config.mailProvider = "FILE";
config.appBaseUrl = "";

await fs.mkdir(config.publicDir, { recursive: true });
for (const fileName of ["landing.html", "login.html", "home.html", "ops.html", "index.html", "confirm.html"]) {
  await fs.writeFile(path.join(config.publicDir, fileName), "<html></html>", "utf8");
}

const app = createApp();
const server = createServer((req, res) => app.handle(req, res));
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

function readCookiesFromResponse(response) {
  return response.headers.getSetCookie().map((item) => item.split(";")[0]).join("; ");
}

function getCookieValue(cookieHeader, name) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
}

async function issueChallenge(email, extra = {}) {
  const response = await fetch(`${baseUrl}/api/v1/auth/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, ...extra })
  });
  return { response, payload: await response.json() };
}

async function verifyViaLink(debugMagicLink, extra = {}) {
  const magicLink = new URL(debugMagicLink);
  const response = await fetch(`${baseUrl}/api/v1/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeId: magicLink.searchParams.get("challengeId"),
      token: magicLink.searchParams.get("token"),
      invitationToken: magicLink.searchParams.get("invitationToken") || undefined,
      ...extra
    })
  });
  return { response, payload: await response.json() };
}

function backdateChallenges(email) {
  const database = new DatabaseSync(config.dbFilePath);
  database.prepare("UPDATE login_challenges SET created_at = ? WHERE email = ?").run(
    new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    email
  );
  database.close();
}

async function createFieldRecord(cookieHeader, csrfToken, note) {
  const formData = new FormData();
  formData.append("primaryReason", "CONTAMINATION");
  formData.append("secondaryReason", "NICOTINE");
  formData.append("note", note);
  formData.append("photos[]", new File([new Uint8Array([137, 80, 78, 71])], "sample.png", { type: "image/png" }));

  const response = await fetch(`${baseUrl}/api/v1/field-records`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
      "x-csrf-token": csrfToken
    },
    body: formData
  });
  return { response, payload: await response.json() };
}

async function createJobCase(cookieHeader, csrfToken, customerLabel) {
  const response = await fetch(`${baseUrl}/api/v1/job-cases`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
      "x-csrf-token": csrfToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      customerLabel,
      siteLabel: customerLabel,
      contactMemo: "workspace flow",
      originalQuoteAmount: 250000
    })
  });
  return { response, payload: await response.json() };
}

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("tenantized workspace isolates companies and enforces staff quote restrictions", async () => {
  const ownerOne = await verifyViaLink((await issueChallenge("owner-a@example.com")).payload.debugMagicLink, {
    displayName: "오너A",
    companyName: "클린 A"
  });
  const ownerOneCookie = readCookiesFromResponse(ownerOne.response);
  const ownerOneCsrf = getCookieValue(ownerOneCookie, config.csrfCookieName);

  const ownerTwo = await verifyViaLink((await issueChallenge("owner-b@example.com")).payload.debugMagicLink, {
    displayName: "오너B",
    companyName: "클린 B"
  });
  const ownerTwoCookie = readCookiesFromResponse(ownerTwo.response);
  const ownerTwoCsrf = getCookieValue(ownerTwoCookie, config.csrfCookieName);

  const ownerOneFieldRecord = await createFieldRecord(ownerOneCookie, ownerOneCsrf, "A 업체 현장 기록");
  assert.equal(ownerOneFieldRecord.response.status, 201);
  const ownerOneJobCase = await createJobCase(ownerOneCookie, ownerOneCsrf, "송파 A 현장");
  assert.equal(ownerOneJobCase.response.status, 201);

  const ownerOneLink = await fetch(`${baseUrl}/api/v1/field-records/${ownerOneFieldRecord.payload.id}/link-job-case`, {
    method: "POST",
    headers: {
      Cookie: ownerOneCookie,
      "x-csrf-token": ownerOneCsrf,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ jobCaseId: ownerOneJobCase.payload.id })
  });
  assert.equal(ownerOneLink.status, 200);

  const ownerTwoList = await fetch(`${baseUrl}/api/v1/job-cases`, {
    headers: { Cookie: ownerTwoCookie }
  });
  const ownerTwoListPayload = await ownerTwoList.json();
  assert.equal(ownerTwoList.status, 200);
  assert.equal(ownerTwoListPayload.items.length, 0);

  const ownerTwoDetail = await fetch(`${baseUrl}/api/v1/job-cases/${ownerOneJobCase.payload.id}`, {
    headers: { Cookie: ownerTwoCookie }
  });
  assert.equal(ownerTwoDetail.status, 404);

  const inviteResponse = await fetch(`${baseUrl}/api/v1/companies/${ownerOne.payload.company.id}/invitations`, {
    method: "POST",
    headers: {
      Cookie: ownerOneCookie,
      "x-csrf-token": ownerOneCsrf,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: "staff-a@example.com", role: "STAFF" })
  });
  assert.equal(inviteResponse.status, 201);
  const invitePayload = await inviteResponse.json();

  backdateChallenges("staff-a@example.com");
  const inviteLink = new URL(invitePayload.debugInvitationLink);
  const staffChallenge = await issueChallenge("staff-a@example.com", {
    invitationToken: inviteLink.searchParams.get("invitationToken")
  });
  const staff = await verifyViaLink(staffChallenge.payload.debugMagicLink, {
    displayName: "현장직원"
  });
  const staffCookie = readCookiesFromResponse(staff.response);
  const staffCsrf = getCookieValue(staffCookie, config.csrfCookieName);

  const staffList = await fetch(`${baseUrl}/api/v1/job-cases`, {
    headers: { Cookie: staffCookie }
  });
  const staffListPayload = await staffList.json();
  assert.equal(staffList.status, 200);
  assert.equal(staffListPayload.items.length, 1);

  const staffQuote = await fetch(`${baseUrl}/api/v1/job-cases/${ownerOneJobCase.payload.id}/quote`, {
    method: "PATCH",
    headers: {
      Cookie: staffCookie,
      "x-csrf-token": staffCsrf,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ revisedQuoteAmount: 310000 })
  });
  assert.equal(staffQuote.status, 403);

  const staffAgreement = await fetch(`${baseUrl}/api/v1/job-cases/${ownerOneJobCase.payload.id}/agreement-records`, {
    method: "POST",
    headers: {
      Cookie: staffCookie,
      "x-csrf-token": staffCsrf,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: "ON_HOLD",
      confirmationChannel: "PHONE",
      customerResponseNote: "고객이 다시 연락주기로 함"
    })
  });
  assert.equal(staffAgreement.status, 201);

  const staffOwnFieldRecord = await createFieldRecord(staffCookie, staffCsrf, "STAFF own record");
  assert.equal(staffOwnFieldRecord.response.status, 201);
  const staffOwnJobCase = await createJobCase(staffCookie, staffCsrf, "잠실 STAFF 현장");
  assert.equal(staffOwnJobCase.response.status, 201);
  assert.equal(staffOwnJobCase.payload.visibility, "PRIVATE_ASSIGNED");
});
