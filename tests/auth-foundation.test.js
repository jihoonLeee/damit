import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "field-agreement-auth-"));
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
await fs.writeFile(path.join(config.publicDir, "landing.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "login.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "beta-home.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "ops.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "index.html"), "<html></html>", "utf8");

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
  const challengeResponse = await fetch(`${baseUrl}/api/v1/auth/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, ...extra })
  });
  const payload = await challengeResponse.json();
  return { response: challengeResponse, payload };
}

async function verifyViaLink(debugMagicLink, extra = {}) {
  const magicLink = new URL(debugMagicLink);
  const challengeId = magicLink.searchParams.get("challengeId");
  const token = magicLink.searchParams.get("token");
  const invitationToken = magicLink.searchParams.get("invitationToken");

  const verifyResponse = await fetch(`${baseUrl}/api/v1/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeId,
      token,
      invitationToken: invitationToken || undefined,
      ...extra
    })
  });
  const payload = await verifyResponse.json();
  return { response: verifyResponse, payload, magicLink };
}

function backdateChallenges(email) {
  const database = new DatabaseSync(config.dbFilePath);
  database.prepare("UPDATE login_challenges SET created_at = ? WHERE email = ?").run(
    new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    email
  );
  database.close();
}

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("auth challenge returns a dev magic link and requires company setup on first verify", async () => {
  const { response, payload } = await issueChallenge("owner@example.com");
  assert.equal(response.status, 201);
  assert.equal(typeof payload.challengeId, "string");
  assert.match(payload.debugMagicLink, /challengeId=/);

  const firstVerify = await verifyViaLink(payload.debugMagicLink);
  assert.equal(firstVerify.response.status, 409);
  assert.equal(firstVerify.payload.error.code, "AUTH_SETUP_REQUIRED");
});

test("auth verify creates a session and /me returns company context", async () => {
  const challenge = await issueChallenge("boss@example.com");
  const verify = await verifyViaLink(challenge.payload.debugMagicLink, {
    displayName: "김대표",
    companyName: "클린홈 송파점"
  });

  assert.equal(verify.response.status, 200);
  assert.equal(verify.payload.company.name, "클린홈 송파점");

  const cookieHeader = readCookiesFromResponse(verify.response);
  assert.ok(cookieHeader.includes(`${config.sessionCookieName}=`));
  assert.ok(cookieHeader.includes(`${config.refreshCookieName}=`));

  const meResponse = await fetch(`${baseUrl}/api/v1/me`, {
    headers: {
      Cookie: cookieHeader
    }
  });
  assert.equal(meResponse.status, 200);
  const mePayload = await meResponse.json();
  assert.equal(mePayload.user.displayName, "김대표");
  assert.equal(mePayload.company.name, "클린홈 송파점");
  assert.equal(mePayload.company.role, "OWNER");
  assert.equal(mePayload.companies.length, 1);
});

test("auth refresh rotates refresh cookie and preserves company context", async () => {
  const challenge = await issueChallenge("refresh@example.com");
  const verify = await verifyViaLink(challenge.payload.debugMagicLink, {
    displayName: "새로고침",
    companyName: "리프레시 클린"
  });
  const cookieHeader = readCookiesFromResponse(verify.response);
  const previousRefresh = getCookieValue(cookieHeader, config.refreshCookieName);

  const refreshResponse = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader
    }
  });
  assert.equal(refreshResponse.status, 200);
  const refreshPayload = await refreshResponse.json();
  assert.equal(refreshPayload.company.name, "리프레시 클린");

  const refreshedCookieHeader = readCookiesFromResponse(refreshResponse);
  const nextRefresh = getCookieValue(refreshedCookieHeader, config.refreshCookieName);
  assert.notEqual(previousRefresh, nextRefresh);
});

test("owner can invite a user, invited user joins second company, and switches context", async () => {
  const ownerOneChallenge = await issueChallenge("owner-one@example.com");
  const ownerOneVerify = await verifyViaLink(ownerOneChallenge.payload.debugMagicLink, {
    displayName: "오너원",
    companyName: "청소 1호점"
  });
  const ownerOneCookie = readCookiesFromResponse(ownerOneVerify.response);
  const ownerOneCsrf = getCookieValue(ownerOneCookie, config.csrfCookieName);

  const ownerTwoChallenge = await issueChallenge("owner-two@example.com");
  const ownerTwoVerify = await verifyViaLink(ownerTwoChallenge.payload.debugMagicLink, {
    displayName: "오너투",
    companyName: "청소 2호점"
  });
  const ownerTwoCookie = readCookiesFromResponse(ownerTwoVerify.response);
  const ownerTwoCsrf = getCookieValue(ownerTwoCookie, config.csrfCookieName);
  const companyTwoId = ownerTwoVerify.payload.company.id;

  const inviteResponse = await fetch(`${baseUrl}/api/v1/companies/${companyTwoId}/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ownerTwoCookie,
      "x-csrf-token": ownerTwoCsrf
    },
    body: JSON.stringify({
      email: "owner-one@example.com",
      role: "MANAGER"
    })
  });
  assert.equal(inviteResponse.status, 201);
  const invitePayload = await inviteResponse.json();
  assert.match(invitePayload.debugInvitationLink, /invitationToken=/);

  const inviteListResponse = await fetch(`${baseUrl}/api/v1/companies/${companyTwoId}/invitations`, {
    headers: {
      Cookie: ownerTwoCookie
    }
  });
  assert.equal(inviteListResponse.status, 200);
  const inviteListPayload = await inviteListResponse.json();
  assert.equal(inviteListPayload.items.length, 1);

  backdateChallenges("owner-one@example.com");
  const inviteLink = new URL(invitePayload.debugInvitationLink);
  const invitationToken = inviteLink.searchParams.get("invitationToken");
  const invitedChallenge = await issueChallenge("owner-one@example.com", { invitationToken });
  assert.match(invitedChallenge.payload.debugMagicLink, /invitationToken=/);

  const invitedVerify = await verifyViaLink(invitedChallenge.payload.debugMagicLink);
  assert.equal(invitedVerify.response.status, 200);
  assert.equal(invitedVerify.payload.company.id, companyTwoId);
  assert.equal(invitedVerify.payload.company.role, "MANAGER");
  const invitedCookie = readCookiesFromResponse(invitedVerify.response);
  const invitedCsrf = getCookieValue(invitedCookie, config.csrfCookieName);

  const companiesResponse = await fetch(`${baseUrl}/api/v1/companies`, {
    headers: {
      Cookie: invitedCookie
    }
  });
  assert.equal(companiesResponse.status, 200);
  const companiesPayload = await companiesResponse.json();
  assert.equal(companiesPayload.items.length, 2);

  const switchResponse = await fetch(`${baseUrl}/api/v1/companies/${ownerOneVerify.payload.company.id}/switch-context`, {
    method: "POST",
    headers: {
      Cookie: invitedCookie,
      "x-csrf-token": invitedCsrf
    }
  });
  assert.equal(switchResponse.status, 200);
  const switchPayload = await switchResponse.json();
  assert.equal(switchPayload.company.id, ownerOneVerify.payload.company.id);
  assert.equal(switchPayload.company.role, "OWNER");

  const meResponse = await fetch(`${baseUrl}/api/v1/me`, {
    headers: {
      Cookie: invitedCookie
    }
  });
  const mePayload = await meResponse.json();
  assert.equal(mePayload.company.id, ownerOneVerify.payload.company.id);

  const membershipsResponse = await fetch(`${baseUrl}/api/v1/companies/${ownerOneVerify.payload.company.id}/memberships`, {
    headers: {
      Cookie: ownerOneCookie
    }
  });
  assert.equal(membershipsResponse.status, 200);
  const membershipsPayload = await membershipsResponse.json();
  assert.equal(membershipsPayload.items.length, 1);
});

test("static entry routes are served for landing, login, beta-home, ops, and app", async () => {
  const landing = await fetch(`${baseUrl}/`);
  const login = await fetch(`${baseUrl}/login`);
  const betaHome = await fetch(`${baseUrl}/beta-home`);
  const opsPage = await fetch(`${baseUrl}/ops`);
  const appPage = await fetch(`${baseUrl}/app`);
  assert.equal(landing.status, 200);
  assert.equal(login.status, 200);
  assert.equal(betaHome.status, 200);
  assert.equal(opsPage.status, 200);
  assert.equal(appPage.status, 200);
});

