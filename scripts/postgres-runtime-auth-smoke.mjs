import assert from "node:assert/strict";

const baseUrl = (process.env.BASE_URL || "https://field-agreement-jihoon-staging.fly.dev").replace(/\/$/, "");
const ownerToken = process.env.OWNER_TOKEN || "";
const shouldReset = process.env.RESET_AFTER !== "false";
const stamp = new Date().toISOString().replace(/[.:]/g, "-");

if (!ownerToken) {
  console.error("OWNER_TOKEN environment variable is required.");
  process.exit(1);
}

function readSetCookies(response) {
  return typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
}

function getCookieValue(cookieHeader, name) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
}

function mergeCookies(existingCookieHeader, response) {
  const jar = new Map();
  if (existingCookieHeader) {
    for (const part of existingCookieHeader.split(";")) {
      const trimmed = part.trim();
      if (!trimmed) {
        continue;
      }
      const index = trimmed.indexOf("=");
      if (index === -1) {
        continue;
      }
      jar.set(trimmed.slice(0, index), trimmed.slice(index + 1));
    }
  }

  for (const item of readSetCookies(response)) {
    const [pair] = item.split(";");
    const index = pair.indexOf("=");
    if (index === -1) {
      continue;
    }
    jar.set(pair.slice(0, index), pair.slice(index + 1));
  }

  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function requestJson(method, pathname, body, { headers = {}, cookie = "" } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body != null ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers
    },
    body: body != null ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return { response, payload, cookie: mergeCookies(cookie, response) };
}

async function issueChallenge(email, extra = {}) {
  return requestJson("POST", "/api/v1/auth/challenges", { email, ...extra });
}

async function verifyWithMagicLink(debugMagicLink, extra = {}) {
  const magicLink = new URL(debugMagicLink);
  const challengeId = magicLink.searchParams.get("challengeId");
  const token = magicLink.searchParams.get("token");
  const invitationToken = magicLink.searchParams.get("invitationToken") || undefined;
  return requestJson("POST", "/api/v1/auth/verify", {
    challengeId,
    token,
    invitationToken,
    ...extra
  });
}

async function run() {
  const summary = {
    baseUrl,
    startedAt: new Date().toISOString(),
    steps: []
  };

  if (shouldReset) {
    const resetBefore = await requestJson(
      "POST",
      "/api/v1/admin/reset-data",
      { confirm: "RESET_PILOT_DATA" },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    assert.equal(resetBefore.response.status, 200, "pre-smoke reset should succeed");
    summary.steps.push({ step: "reset-before", ok: true, counts: resetBefore.payload.counts });
  }

  const health = await fetch(`${baseUrl}/api/v1/health`);
  const healthPayload = await health.json();
  assert.equal(health.status, 200, "health should respond 200");
  assert.equal(healthPayload.storageEngine, "POSTGRES", "staging runtime should be POSTGRES for this smoke");
  summary.steps.push({ step: "health", ok: true, storageEngine: healthPayload.storageEngine, counts: healthPayload.counts });

  const ownerOneEmail = `owner-one+${stamp}@example.com`;
  const ownerTwoEmail = `owner-two+${stamp}@example.com`;

  const ownerOneChallenge = await issueChallenge(ownerOneEmail);
  assert.equal(ownerOneChallenge.response.status, 201, "owner one challenge should succeed");
  assert.match(ownerOneChallenge.payload.debugMagicLink, /challengeId=/);
  summary.steps.push({ step: "owner-one-challenge", ok: true, challengeId: ownerOneChallenge.payload.challengeId });

  const ownerOneVerify = await verifyWithMagicLink(ownerOneChallenge.payload.debugMagicLink, {
    displayName: "오너원",
    companyName: `다밋 포스트그레스 1호점 ${stamp}`
  });
  assert.equal(ownerOneVerify.response.status, 200, "owner one verify should succeed");
  const ownerOneCookie = ownerOneVerify.cookie;
  const ownerOneCsrf = getCookieValue(ownerOneCookie, "faa_csrf");
  assert.ok(ownerOneCsrf, "owner one csrf should exist");
  const companyOneId = ownerOneVerify.payload.company.id;
  summary.steps.push({ step: "owner-one-verify", ok: true, companyId: companyOneId });

  const meOne = await requestJson("GET", "/api/v1/me", null, { cookie: ownerOneCookie });
  assert.equal(meOne.response.status, 200, "owner one /me should succeed");
  assert.equal(meOne.payload.company.id, companyOneId);
  summary.steps.push({ step: "owner-one-me", ok: true, companyId: meOne.payload.company.id });

  const refreshOne = await requestJson("POST", "/api/v1/auth/refresh", null, { cookie: ownerOneCookie });
  assert.equal(refreshOne.response.status, 200, "owner one refresh should succeed");
  const refreshedOwnerOneCookie = refreshOne.cookie;
  summary.steps.push({ step: "owner-one-refresh", ok: true });

  const ownerTwoChallenge = await issueChallenge(ownerTwoEmail);
  assert.equal(ownerTwoChallenge.response.status, 201, "owner two challenge should succeed");
  const ownerTwoVerify = await verifyWithMagicLink(ownerTwoChallenge.payload.debugMagicLink, {
    displayName: "오너투",
    companyName: `다밋 포스트그레스 2호점 ${stamp}`
  });
  assert.equal(ownerTwoVerify.response.status, 200, "owner two verify should succeed");
  const ownerTwoCookie = ownerTwoVerify.cookie;
  const ownerTwoCsrf = getCookieValue(ownerTwoCookie, "faa_csrf");
  const companyTwoId = ownerTwoVerify.payload.company.id;
  summary.steps.push({ step: "owner-two-verify", ok: true, companyId: companyTwoId });

  const invite = await requestJson(
    "POST",
    `/api/v1/companies/${companyTwoId}/invitations`,
    { email: ownerOneEmail, role: "MANAGER" },
    { cookie: ownerTwoCookie, headers: { "x-csrf-token": ownerTwoCsrf } }
  );
  assert.equal(invite.response.status, 201, "invitation should succeed");
  assert.match(invite.payload.debugInvitationLink, /invitationToken=/);
  summary.steps.push({ step: "invite", ok: true, companyId: companyTwoId });

  const invitationUrl = new URL(invite.payload.debugInvitationLink);
  const invitationToken = invitationUrl.searchParams.get("invitationToken");
  const ownerOneJoinChallenge = await issueChallenge(ownerOneEmail, { invitationToken });
  assert.equal(ownerOneJoinChallenge.response.status, 201, "owner one join challenge should succeed");

  const ownerOneJoinVerify = await verifyWithMagicLink(ownerOneJoinChallenge.payload.debugMagicLink);
  assert.equal(ownerOneJoinVerify.response.status, 200, "owner one join verify should succeed");
  let joinedCookie = ownerOneJoinVerify.cookie;
  let joinedCsrf = getCookieValue(joinedCookie, "faa_csrf");
  assert.equal(ownerOneJoinVerify.payload.company.id, companyTwoId, "joined company context should point to company two");
  assert.equal(ownerOneJoinVerify.payload.companies.length, 2, "joined user should see two companies");
  summary.steps.push({ step: "join-second-company", ok: true, companyCount: ownerOneJoinVerify.payload.companies.length });

  const companiesResponse = await requestJson("GET", "/api/v1/companies", null, { cookie: joinedCookie });
  assert.equal(companiesResponse.response.status, 200, "company list should succeed");
  assert.equal(companiesResponse.payload.items.length, 2);
  summary.steps.push({ step: "company-list", ok: true, companyCount: companiesResponse.payload.items.length });

  const switchResponse = await requestJson(
    "POST",
    `/api/v1/companies/${companyOneId}/switch-context`,
    null,
    { cookie: joinedCookie, headers: { "x-csrf-token": joinedCsrf } }
  );
  assert.equal(switchResponse.response.status, 200, "switch context should succeed");
  joinedCookie = switchResponse.cookie || joinedCookie;
  joinedCsrf = getCookieValue(joinedCookie, "faa_csrf") || joinedCsrf;
  assert.equal(switchResponse.payload.company.id, companyOneId);
  summary.steps.push({ step: "switch-context", ok: true, activeCompanyId: switchResponse.payload.company.id });

  const jobCaseCreate = await requestJson(
    "POST",
    "/api/v1/job-cases",
    {
      customerLabel: `포스트그레스 스모크 고객 ${stamp}`,
      contactMemo: "session backed postgres smoke",
      siteLabel: `포스트그레스 스모크 현장 ${stamp}`,
      originalQuoteAmount: 210000
    },
    { cookie: joinedCookie, headers: { "x-csrf-token": joinedCsrf } }
  );
  assert.equal(jobCaseCreate.response.status, 201, "session-backed job case creation should succeed");
  const jobCaseId = jobCaseCreate.payload.id;
  summary.steps.push({ step: "job-case-create", ok: true, jobCaseId });

  const jobCaseList = await requestJson("GET", "/api/v1/job-cases", null, { cookie: joinedCookie });
  assert.equal(jobCaseList.response.status, 200, "job case list should succeed");
  assert.ok(jobCaseList.payload.items.some((item) => item.id === jobCaseId), "created job case should be visible in list");
  summary.steps.push({ step: "job-case-list", ok: true, itemCount: jobCaseList.payload.items.length });

  if (shouldReset) {
    const resetAfter = await requestJson(
      "POST",
      "/api/v1/admin/reset-data",
      { confirm: "RESET_PILOT_DATA" },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    assert.equal(resetAfter.response.status, 200, "post-smoke reset should succeed");
    summary.steps.push({ step: "reset-after", ok: true, counts: resetAfter.payload.counts });
  }

  summary.finishedAt = new Date().toISOString();
  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error("POSTGRES_RUNTIME_SMOKE_FAILED");
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
