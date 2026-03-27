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
const { resetPublicRateLimitState } = await import("../src/security/public-rate-limit.js");

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
config.authDebugLinks = true;
config.authEnforceTrustedOrigin = false;
config.sessionCookieSameSite = "Strict";
config.csrfCookieSameSite = "Strict";
config.systemAdminEmails = [];

await fs.mkdir(config.publicDir, { recursive: true });
await fs.writeFile(path.join(config.publicDir, "landing.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "start.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "login.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "home.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "account.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "confirm.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "ops.html"), "<html></html>", "utf8");
await fs.writeFile(path.join(config.publicDir, "admin.html"), "<html></html>", "utf8");
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

async function issueChallenge(email, extra = {}, requestHeaders = {}) {
  const challengeResponse = await fetch(`${baseUrl}/api/v1/auth/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...requestHeaders },
    body: JSON.stringify({ email, ...extra })
  });
  const payload = await challengeResponse.json();
  return { response: challengeResponse, payload };
}

async function verifyViaLink(debugMagicLink, extra = {}, requestHeaders = {}) {
  const magicLink = new URL(debugMagicLink);
  const challengeId = magicLink.searchParams.get("challengeId");
  const token = magicLink.searchParams.get("token");
  const invitationToken = magicLink.searchParams.get("invitationToken");

  const verifyResponse = await fetch(`${baseUrl}/api/v1/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...requestHeaders },
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

function backdateInvitation(invitationId, minutes = 2) {
  const database = new DatabaseSync(config.dbFilePath);
  database.prepare("UPDATE invitations SET last_sent_at = ?, created_at = ? WHERE id = ?").run(
    new Date(Date.now() - minutes * 60 * 1000).toISOString(),
    new Date(Date.now() - minutes * 60 * 1000).toISOString(),
    invitationId
  );
  database.close();
}

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test.afterEach(() => {
  resetPublicRateLimitState();
});

test("auth challenge returns a dev magic link and requires company setup on first verify", async () => {
  const { response, payload } = await issueChallenge("owner@example.com");
  assert.equal(response.status, 201);
  assert.equal(typeof payload.challengeId, "string");
  assert.equal(payload.delivery.provider, "FILE");
  assert.equal(payload.delivery.status, "SENT");
  assert.match(payload.delivery.targetMasked, /@/);
  assert.match(payload.debugMagicLink, /challengeId=/);

  const firstVerify = await verifyViaLink(payload.debugMagicLink);
  assert.equal(firstVerify.response.status, 409);
  assert.equal(firstVerify.payload.error.code, "AUTH_SETUP_REQUIRED");
});

test("auth verify creates a session and /me returns company context", async () => {
  const challenge = await issueChallenge("boss@example.com");
  const verify = await verifyViaLink(challenge.payload.debugMagicLink, {
    displayName: "김대표",
    companyName: "다밋 송파"
  });

  assert.equal(verify.response.status, 200);
  assert.equal(verify.payload.company.name, "다밋 송파");

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
  assert.equal(mePayload.company.name, "다밋 송파");
  assert.equal(mePayload.company.role, "OWNER");
  assert.equal(mePayload.companies.length, 1);
});

test("auth refresh rotates refresh cookie and preserves company context", async () => {
  const challenge = await issueChallenge("refresh@example.com");
  const verify = await verifyViaLink(challenge.payload.debugMagicLink, {
    displayName: "리프레시 운영자",
    companyName: "리프레시 클린"
  });
  const cookieHeader = readCookiesFromResponse(verify.response);
  const previousRefresh = getCookieValue(cookieHeader, config.refreshCookieName);
  const previousSession = getCookieValue(cookieHeader, config.sessionCookieName);
  const csrfToken = getCookieValue(cookieHeader, config.csrfCookieName);

  const refreshResponse = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
      "x-csrf-token": csrfToken
    }
  });
  assert.equal(refreshResponse.status, 200);
  const refreshPayload = await refreshResponse.json();
  assert.equal(refreshPayload.company.name, "리프레시 클린");

  const refreshedCookieHeader = readCookiesFromResponse(refreshResponse);
  const nextRefresh = getCookieValue(refreshedCookieHeader, config.refreshCookieName);
  const nextSession = getCookieValue(refreshedCookieHeader, config.sessionCookieName);
  assert.notEqual(previousRefresh, nextRefresh);
  assert.notEqual(previousSession, nextSession);
});

test("auth refresh requires csrf token", async () => {
  const challenge = await issueChallenge("csrf@example.com");
  const verify = await verifyViaLink(challenge.payload.debugMagicLink, {
    displayName: "CSRF ???",
    companyName: "CSRF ??"
  });
  const cookieHeader = readCookiesFromResponse(verify.response);

  const refreshResponse = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader
    }
  });
  assert.equal(refreshResponse.status, 403);
  const refreshPayload = await refreshResponse.json();
  assert.equal(refreshPayload.error.code, "CSRF_TOKEN_INVALID");
});

test("auth challenge hides debug link when debug mode is disabled", async () => {
  config.authDebugLinks = false;
  try {
    const { response, payload } = await issueChallenge("prodmode@example.com");
    assert.equal(response.status, 201);
    assert.equal(payload.debugMagicLink, undefined);
    assert.equal(payload.delivery.provider, "FILE");
    assert.equal(payload.delivery.status, "SENT");
    assert.match(payload.delivery.targetMasked, /@/);
  } finally {
    config.authDebugLinks = true;
  }
});

test("auth challenge is rate limited by request IP", async () => {
  const previousCount = config.authChallengeIpRateLimitCount;
  const previousWindow = config.authChallengeIpRateLimitWindowSeconds;
  config.authChallengeIpRateLimitCount = 2;
  config.authChallengeIpRateLimitWindowSeconds = 600;

  try {
    const first = await issueChallenge("ip-limit-1@example.com", {}, { "x-forwarded-for": "203.0.113.10" });
    const second = await issueChallenge("ip-limit-2@example.com", {}, { "x-forwarded-for": "203.0.113.10" });
    const third = await issueChallenge("ip-limit-3@example.com", {}, { "x-forwarded-for": "203.0.113.10" });

    assert.equal(first.response.status, 201);
    assert.equal(second.response.status, 201);
    assert.equal(third.response.status, 429);
    assert.equal(third.payload.error.code, "AUTH_CHALLENGE_IP_RATE_LIMITED");
    assert.equal(third.response.headers.get("retry-after"), "600");
  } finally {
    config.authChallengeIpRateLimitCount = previousCount;
    config.authChallengeIpRateLimitWindowSeconds = previousWindow;
  }
});

test("auth verify is rate limited by request IP", async () => {
  const previousCount = config.authVerifyRateLimitCount;
  const previousWindow = config.authVerifyRateLimitWindowSeconds;
  config.authVerifyRateLimitCount = 1;
  config.authVerifyRateLimitWindowSeconds = 600;

  try {
    const challenge = await issueChallenge("verify-limit@example.com");
    const firstVerify = await verifyViaLink(challenge.payload.debugMagicLink, {}, { "x-forwarded-for": "203.0.113.20" });
    const secondVerify = await verifyViaLink(challenge.payload.debugMagicLink, {}, { "x-forwarded-for": "203.0.113.20" });

    assert.equal(firstVerify.response.status, 409);
    assert.equal(secondVerify.response.status, 429);
    assert.equal(secondVerify.payload.error.code, "AUTH_VERIFY_RATE_LIMITED");
    assert.equal(secondVerify.response.headers.get("retry-after"), "600");
  } finally {
    config.authVerifyRateLimitCount = previousCount;
    config.authVerifyRateLimitWindowSeconds = previousWindow;
  }
});

test("owner can invite a user, invited user joins second company, and switches context", async () => {
  const ownerOneChallenge = await issueChallenge("owner-one@example.com");
  const ownerOneVerify = await verifyViaLink(ownerOneChallenge.payload.debugMagicLink, {
    displayName: "오너1",
    companyName: "청소 1호점"
  });
  const ownerOneCookie = readCookiesFromResponse(ownerOneVerify.response);
  const ownerOneCsrf = getCookieValue(ownerOneCookie, config.csrfCookieName);

  const ownerTwoChallenge = await issueChallenge("owner-two@example.com");
  const ownerTwoVerify = await verifyViaLink(ownerTwoChallenge.payload.debugMagicLink, {
    displayName: "오너2",
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

test("account overview returns company, memberships, invitations, and security summary", async () => {
  const ownerChallenge = await issueChallenge("account-owner@example.com");
  const ownerVerify = await verifyViaLink(ownerChallenge.payload.debugMagicLink, {
    displayName: "계정 오너",
    companyName: "계정 테스트 클린"
  });
  const ownerCookie = readCookiesFromResponse(ownerVerify.response);
  const ownerCsrf = getCookieValue(ownerCookie, config.csrfCookieName);
  const companyId = ownerVerify.payload.company.id;

  const inviteResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ownerCookie,
      "x-csrf-token": ownerCsrf
    },
    body: JSON.stringify({
      email: "staff@example.com",
      role: "STAFF"
    })
  });
  assert.equal(inviteResponse.status, 201);

  const accountResponse = await fetch(`${baseUrl}/api/v1/account/overview`, {
    headers: {
      Cookie: ownerCookie
    }
  });
  assert.equal(accountResponse.status, 200);
  const accountPayload = await accountResponse.json();
  assert.equal(accountPayload.user.displayName, "계정 오너");
  assert.equal(accountPayload.company.name, "계정 테스트 클린");
  assert.equal(accountPayload.memberships.length, 1);
  assert.equal(accountPayload.invitations.length, 1);
  assert.equal(accountPayload.recentLoginActivity.length >= 1, true);
  assert.equal(accountPayload.recentLoginActivity[0].email, "account-owner@example.com");
  assert.equal(Array.isArray(accountPayload.recentAccountActivity), true);
  assert.equal(accountPayload.user.phoneNumber, null);
  assert.equal(accountPayload.security.mailProvider, "FILE");
  assert.equal(accountPayload.internalAccess.systemAdmin, false);
});

test("account profile can update display name and phone number", async () => {
  const ownerChallenge = await issueChallenge("profile-owner@example.com");
  const ownerVerify = await verifyViaLink(ownerChallenge.payload.debugMagicLink, {
    displayName: "초기 이름",
    companyName: "프로필 테스트 클린"
  });
  const ownerCookie = readCookiesFromResponse(ownerVerify.response);
  const ownerCsrf = getCookieValue(ownerCookie, config.csrfCookieName);

  const updateResponse = await fetch(`${baseUrl}/api/v1/account/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: ownerCookie,
      "x-csrf-token": ownerCsrf
    },
    body: JSON.stringify({
      displayName: "변경된 이름",
      phoneNumber: "010-1234-5678"
    })
  });
  assert.equal(updateResponse.status, 200);
  const updatePayload = await updateResponse.json();
  assert.equal(updatePayload.user.displayName, "변경된 이름");
  assert.equal(updatePayload.user.phoneNumber, "010-1234-5678");

  const accountResponse = await fetch(`${baseUrl}/api/v1/account/overview`, {
    headers: {
      Cookie: ownerCookie
    }
  });
  assert.equal(accountResponse.status, 200);
  const accountPayload = await accountResponse.json();
  assert.equal(accountPayload.user.displayName, "변경된 이름");
  assert.equal(accountPayload.user.phoneNumber, "010-1234-5678");
});

test("account overview exposes sessions and can revoke another owned session", async () => {
  const ownerChallenge = await issueChallenge("session-owner@example.com");
  const ownerVerify = await verifyViaLink(ownerChallenge.payload.debugMagicLink, {
    displayName: "세션 오너",
    companyName: "세션 테스트 클린"
  });

  backdateChallenges("session-owner@example.com");
  const secondChallenge = await issueChallenge("session-owner@example.com");
  const secondVerify = await verifyViaLink(secondChallenge.payload.debugMagicLink);
  const secondCookie = readCookiesFromResponse(secondVerify.response);
  const secondCsrf = getCookieValue(secondCookie, config.csrfCookieName);

  const accountResponse = await fetch(`${baseUrl}/api/v1/account/overview`, {
    headers: {
      Cookie: secondCookie
    }
  });
  assert.equal(accountResponse.status, 200);
  const accountPayload = await accountResponse.json();
  assert.equal(accountPayload.sessions.length, 2);
  assert.equal(accountPayload.sessions.filter((item) => item.isCurrent).length, 1);

  const otherSession = accountPayload.sessions.find((item) => !item.isCurrent);
  assert.ok(otherSession);

  const revokeResponse = await fetch(`${baseUrl}/api/v1/account/sessions/${otherSession.id}/revoke`, {
    method: "POST",
    headers: {
      Cookie: secondCookie,
      "x-csrf-token": secondCsrf
    }
  });
  assert.equal(revokeResponse.status, 200);
  const revokePayload = await revokeResponse.json();
  assert.equal(revokePayload.session.id, otherSession.id);

  const afterResponse = await fetch(`${baseUrl}/api/v1/account/overview`, {
    headers: {
      Cookie: secondCookie
    }
  });
  assert.equal(afterResponse.status, 200);
  const afterPayload = await afterResponse.json();
  const revokedSession = afterPayload.sessions.find((item) => item.id === otherSession.id);
  assert.ok(revokedSession.revokedAt);
});

test("owner can reissue and revoke invitations from the same company", async () => {
  const ownerChallenge = await issueChallenge("owner-actions@example.com");
  const ownerVerify = await verifyViaLink(ownerChallenge.payload.debugMagicLink, {
    displayName: "초대 관리자",
    companyName: "초대 액션 클린"
  });
  const ownerCookie = readCookiesFromResponse(ownerVerify.response);
  const ownerCsrf = getCookieValue(ownerCookie, config.csrfCookieName);
  const companyId = ownerVerify.payload.company.id;

  const inviteResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ownerCookie,
      "x-csrf-token": ownerCsrf
    },
    body: JSON.stringify({
      email: "crew@example.com",
      role: "STAFF"
    })
  });
  assert.equal(inviteResponse.status, 201);
  const invitePayload = await inviteResponse.json();

  const inviteListResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
    headers: {
      Cookie: ownerCookie
    }
  });
  assert.equal(inviteListResponse.status, 200);
  const inviteListPayload = await inviteListResponse.json();
  assert.equal(inviteListPayload.items.length, 1);
  backdateInvitation(inviteListPayload.items[0].id);

  const reissueResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations/${inviteListPayload.items[0].id}/reissue`, {
    method: "POST",
    headers: {
      Cookie: ownerCookie,
      "x-csrf-token": ownerCsrf
    }
  });
  assert.equal(reissueResponse.status, 200);
  const reissuePayload = await reissueResponse.json();
  assert.equal(reissuePayload.email, "crew@example.com");
  assert.match(reissuePayload.debugInvitationLink, /invitationToken=/);

  const inviteListAfterReissueResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
    headers: {
      Cookie: ownerCookie
    }
  });
  assert.equal(inviteListAfterReissueResponse.status, 200);
  const inviteListAfterReissue = await inviteListAfterReissueResponse.json();
  assert.equal(inviteListAfterReissue.items.length, 2);
  assert.equal(inviteListAfterReissue.items[0].status, "ISSUED");
  assert.equal(inviteListAfterReissue.items[1].status, "REVOKED");

  const revokeResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations/${inviteListAfterReissue.items[0].id}/revoke`, {
    method: "POST",
    headers: {
      Cookie: ownerCookie,
      "x-csrf-token": ownerCsrf
    }
  });
  assert.equal(revokeResponse.status, 200);
  const revokePayload = await revokeResponse.json();
  assert.equal(revokePayload.item.status, "REVOKED");

  const inviteListAfterRevokeResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
    headers: {
      Cookie: ownerCookie
    }
  });
  const inviteListAfterRevoke = await inviteListAfterRevokeResponse.json();
  assert.equal(inviteListAfterRevoke.items[0].status, "REVOKED");
});

test("invitation create is rate limited by owner-company scope", async () => {
  const previousCount = config.invitationCreateRateLimitCount;
  const previousWindow = config.invitationCreateRateLimitWindowSeconds;
  config.invitationCreateRateLimitCount = 2;
  config.invitationCreateRateLimitWindowSeconds = 600;

  try {
    const ownerChallenge = await issueChallenge("invite-limit-owner@example.com");
    const ownerVerify = await verifyViaLink(ownerChallenge.payload.debugMagicLink, {
      displayName: "초대 제한 오너",
      companyName: "초대 제한 업체"
    });
    const ownerCookie = readCookiesFromResponse(ownerVerify.response);
    const ownerCsrf = getCookieValue(ownerCookie, config.csrfCookieName);
    const companyId = ownerVerify.payload.company.id;

    const firstInvite = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerCookie,
        "x-csrf-token": ownerCsrf
      },
      body: JSON.stringify({
        email: "crew-limit-1@example.com",
        role: "STAFF"
      })
    });
    const secondInvite = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerCookie,
        "x-csrf-token": ownerCsrf
      },
      body: JSON.stringify({
        email: "crew-limit-2@example.com",
        role: "STAFF"
      })
    });
    const thirdInvite = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerCookie,
        "x-csrf-token": ownerCsrf
      },
      body: JSON.stringify({
        email: "crew-limit-3@example.com",
        role: "STAFF"
      })
    });

    assert.equal(firstInvite.status, 201);
    assert.equal(secondInvite.status, 201);
    assert.equal(thirdInvite.status, 429);
    const thirdPayload = await thirdInvite.json();
    assert.equal(thirdPayload.error.code, "INVITATION_CREATE_RATE_LIMITED");
    assert.equal(thirdInvite.headers.get("retry-after"), "600");
  } finally {
    config.invitationCreateRateLimitCount = previousCount;
    config.invitationCreateRateLimitWindowSeconds = previousWindow;
  }
});

test("invitation reissue is rate limited by owner-company scope", async () => {
  const previousCount = config.invitationReissueRateLimitCount;
  const previousWindow = config.invitationReissueRateLimitWindowSeconds;
  config.invitationReissueRateLimitCount = 1;
  config.invitationReissueRateLimitWindowSeconds = 600;

  try {
    const ownerChallenge = await issueChallenge("reissue-limit-owner@example.com");
    const ownerVerify = await verifyViaLink(ownerChallenge.payload.debugMagicLink, {
      displayName: "재전송 제한 오너",
      companyName: "재전송 제한 업체"
    });
    const ownerCookie = readCookiesFromResponse(ownerVerify.response);
    const ownerCsrf = getCookieValue(ownerCookie, config.csrfCookieName);
    const companyId = ownerVerify.payload.company.id;

    const firstInviteResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerCookie,
        "x-csrf-token": ownerCsrf
      },
      body: JSON.stringify({
        email: "crew-reissue-1@example.com",
        role: "STAFF"
      })
    });
    assert.equal(firstInviteResponse.status, 201);

    const firstListResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
      headers: {
        Cookie: ownerCookie
      }
    });
    const firstListPayload = await firstListResponse.json();
    backdateInvitation(firstListPayload.items[0].id);

    const firstReissueResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations/${firstListPayload.items[0].id}/reissue`, {
      method: "POST",
      headers: {
        Cookie: ownerCookie,
        "x-csrf-token": ownerCsrf
      }
    });
    assert.equal(firstReissueResponse.status, 200);

    const secondInviteResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerCookie,
        "x-csrf-token": ownerCsrf
      },
      body: JSON.stringify({
        email: "crew-reissue-2@example.com",
        role: "STAFF"
      })
    });
    assert.equal(secondInviteResponse.status, 201);

    const secondListResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations`, {
      headers: {
        Cookie: ownerCookie
      }
    });
    const secondListPayload = await secondListResponse.json();
    const activeIssuedInvitation = secondListPayload.items.find((item) => item.status === "ISSUED");
    backdateInvitation(activeIssuedInvitation.id);

    const secondReissueResponse = await fetch(`${baseUrl}/api/v1/companies/${companyId}/invitations/${activeIssuedInvitation.id}/reissue`, {
      method: "POST",
      headers: {
        Cookie: ownerCookie,
        "x-csrf-token": ownerCsrf
      }
    });
    assert.equal(secondReissueResponse.status, 429);
    const secondReissuePayload = await secondReissueResponse.json();
    assert.equal(secondReissuePayload.error.code, "INVITATION_REISSUE_RATE_LIMITED");
    assert.equal(secondReissueResponse.headers.get("retry-after"), "600");
  } finally {
    config.invitationReissueRateLimitCount = previousCount;
    config.invitationReissueRateLimitWindowSeconds = previousWindow;
  }
});

test("system admin overview requires allowlisted email and returns global snapshot when authorized", async () => {
  const previousEmails = [...config.systemAdminEmails];
  try {
    const blockedChallenge = await issueChallenge("regular-owner@example.com");
    const blockedVerify = await verifyViaLink(blockedChallenge.payload.debugMagicLink, {
      displayName: "일반 오너",
      companyName: "일반 업체"
    });
    const blockedCookie = readCookiesFromResponse(blockedVerify.response);
    const blockedOverview = await fetch(`${baseUrl}/api/v1/system-admin/overview`, {
      headers: {
        Cookie: blockedCookie
      }
    });
    assert.equal(blockedOverview.status, 403);
    const blockedPayload = await blockedOverview.json();
    assert.equal(blockedPayload.error.code, "SYSTEM_ADMIN_REQUIRED");

    config.systemAdminEmails = ["admin@example.com"];
    const adminChallenge = await issueChallenge("admin@example.com");
    const adminVerify = await verifyViaLink(adminChallenge.payload.debugMagicLink, {
      displayName: "시스템 관리자",
      companyName: "내부 운영"
    });
    const adminCookie = readCookiesFromResponse(adminVerify.response);

    const overviewResponse = await fetch(`${baseUrl}/api/v1/system-admin/overview`, {
      headers: {
        Cookie: adminCookie
      }
    });
    assert.equal(overviewResponse.status, 200);
    const overviewPayload = await overviewResponse.json();
    assert.equal(overviewPayload.viewer.email, "admin@example.com");
    assert.equal(overviewPayload.snapshot.storage.storageEngine, "SQLITE");

    const explorerResponse = await fetch(`${baseUrl}/api/v1/system-admin/data-explorer?dataset=companies&limit=5`, {
      headers: {
        Cookie: adminCookie
      }
    });
    assert.equal(explorerResponse.status, 200);
    const explorerPayload = await explorerResponse.json();
    assert.equal(explorerPayload.viewer.email, "admin@example.com");
    assert.equal(explorerPayload.selected.key, "companies");

    const exportResponse = await fetch(`${baseUrl}/api/v1/system-admin/data-explorer/export?dataset=companies&limit=5`, {
      headers: {
        Cookie: adminCookie
      }
    });
    assert.equal(exportResponse.status, 200);
    assert.match(exportResponse.headers.get("content-disposition") || "", /attachment/);
    const exportPayload = await exportResponse.json();
    assert.equal(exportPayload.viewer.email, "admin@example.com");
    assert.equal(exportPayload.dataset, "companies");
    assert.equal(exportPayload.selected.key, "companies");
  } finally {
    config.systemAdminEmails = previousEmails;
  }
});

test("static entry routes are served for landing, start, login, home, account, ops, admin, and app", async () => {
  const landing = await fetch(`${baseUrl}/`);
  const start = await fetch(`${baseUrl}/start`);
  const login = await fetch(`${baseUrl}/login`);
  const home = await fetch(`${baseUrl}/home`);
  const account = await fetch(`${baseUrl}/account`);
  const opsPage = await fetch(`${baseUrl}/ops`);
  const adminPage = await fetch(`${baseUrl}/admin`);
  const appPage = await fetch(`${baseUrl}/app`);
  assert.equal(landing.status, 200);
  assert.equal(start.status, 200);
  assert.equal(login.status, 200);
  assert.equal(home.status, 200);
  assert.equal(account.status, 200);
  assert.equal(opsPage.status, 200);
  assert.equal(adminPage.status, 200);
  assert.equal(appPage.status, 200);
});


test("auth challenge responses are non-cacheable and carry baseline security headers", async () => {
  const { response } = await issueChallenge("headers@example.com");
  assert.equal(response.status, 201);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy") || "", /default-src 'self'/);
});

test("trusted origin enforcement blocks missing origin and allows same-origin auth requests", async () => {
  config.authEnforceTrustedOrigin = true;
  try {
    const blocked = await issueChallenge("origin-blocked@example.com");
    assert.equal(blocked.response.status, 403);
    assert.equal(blocked.payload.error.code, "TRUSTED_ORIGIN_REQUIRED");

    const allowed = await issueChallenge("origin-allowed@example.com", {}, { Origin: baseUrl });
    assert.equal(allowed.response.status, 201);
  } finally {
    config.authEnforceTrustedOrigin = false;
  }
});

test("logout requires csrf token before clearing cookies", async () => {
  const challenge = await issueChallenge("logout@example.com");
  const verify = await verifyViaLink(challenge.payload.debugMagicLink, {
    displayName: "???? ???",
    companyName: "?? ???"
  });
  const cookieHeader = readCookiesFromResponse(verify.response);
  const csrfToken = getCookieValue(cookieHeader, config.csrfCookieName);

  const blocked = await fetch(`${baseUrl}/api/v1/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookieHeader }
  });
  const blockedPayload = await blocked.json();
  assert.equal(blocked.status, 403);
  assert.equal(blockedPayload.error.code, "CSRF_TOKEN_INVALID");

  const logoutResponse = await fetch(`${baseUrl}/api/v1/auth/logout`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
      "x-csrf-token": csrfToken
    }
  });
  const logoutPayload = await logoutResponse.json();
  assert.equal(logoutResponse.status, 200);
  assert.equal(logoutPayload.ok, true);
  assert.match(logoutResponse.headers.get("cache-control") || "", /no-store/);
});
