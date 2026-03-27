import assert from "node:assert/strict";
import { createServer } from "node:http";
import path from "node:path";
import pg from "pg";

import { loadEnvFile } from "./lib/env-file.mjs";
import { buildPostgresConnectionOptions } from "../src/db/postgres-connection.js";

const { Client } = pg;

function readArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
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

async function requestJson(baseUrl, method, pathname, body, { headers = {}, cookie = "" } = {}) {
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

async function requestForm(baseUrl, pathname, formData, { headers = {}, cookie = "" } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers
    },
    body: formData
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return { response, payload, cookie: mergeCookies(cookie, response) };
}

async function issueChallenge(baseUrl, email, { ip = "198.51.100.10", ...extra } = {}) {
  return requestJson(baseUrl, "POST", "/api/v1/auth/challenges", { email, ...extra }, {
    headers: {
      Origin: process.env.APP_BASE_URL,
      "x-forwarded-for": ip
    }
  });
}

async function verifyWithMagicLink(baseUrl, debugMagicLink, extra = {}) {
  const magicLink = new URL(debugMagicLink);
  return requestJson(baseUrl, "POST", "/api/v1/auth/verify", {
    challengeId: magicLink.searchParams.get("challengeId"),
    token: magicLink.searchParams.get("token"),
    invitationToken: magicLink.searchParams.get("invitationToken") || undefined,
    ...extra
  }, {
    headers: { Origin: process.env.APP_BASE_URL }
  });
}

const rootDir = path.resolve(import.meta.dirname, "..");
const envFile = readArg("env-file", path.join(rootDir, ".env.production.local"));
const runtimePort = Number.parseInt(readArg("port", "3099"), 10);
const loadResult = loadEnvFile(envFile, { override: true });

process.env.APP_ENV = process.env.APP_ENV || "production";
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.PORT = String(runtimePort);
process.env.APP_BASE_URL = `http://127.0.0.1:${runtimePort}`;
process.env.TRUSTED_ORIGINS = process.env.APP_BASE_URL;
process.env.STORAGE_ENGINE = "POSTGRES";
process.env.MAIL_PROVIDER = "FILE";
process.env.AUTH_DEBUG_LINKS = "true";
process.env.AUTH_ENFORCE_TRUSTED_ORIGIN = "true";
process.env.AUTH_CHALLENGE_IP_RATE_LIMIT_COUNT = "20";
process.env.AUTH_VERIFY_RATE_LIMIT_COUNT = "20";

const [{ createApp }, { config }] = await Promise.all([
  import("../src/app.js"),
  import("../src/config.js")
]);

const app = createApp();
const server = createServer((request, response) => {
  app.handle(request, response).catch((error) => {
    console.error(error);
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "Please try again later.",
        requestId: "req_uncaught"
      }
    }));
  });
});

await new Promise((resolve) => server.listen(runtimePort, "127.0.0.1", resolve));
const baseUrl = `http://127.0.0.1:${runtimePort}`;

function closeServer() {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function backdateLoginChallenges(email) {
  const client = new Client(buildPostgresConnectionOptions({
    databaseUrl: process.env.DATABASE_URL,
    sslMode: process.env.POSTGRES_SSL_MODE,
    sslRequire: process.env.POSTGRES_SSL_REQUIRE,
    sslCaPath: process.env.POSTGRES_SSL_CA_PATH,
    applicationName: "damit-postgres-smoke-maintenance",
    maxPoolSize: 1
  }));

  await client.connect();
  try {
    await client.query(
      `
        UPDATE login_challenges
        SET created_at = NOW() - INTERVAL '61 seconds'
        WHERE email = $1
      `,
      [String(email || "").trim().toLowerCase()]
    );
  } finally {
    await client.end();
  }
}

try {
  const stamp = new Date().toISOString().replace(/[.:]/g, "-");
  const ownerOneEmail = `pg-owner-one+${stamp}@example.com`;
  const ownerTwoEmail = `pg-owner-two+${stamp}@example.com`;
  const ownerOneIp = "198.51.100.10";
  const ownerTwoIp = "198.51.100.11";
  const ownerOneJoinIp = "198.51.100.12";
  const summary = {
    ok: true,
    envFile: loadResult.path,
    startedAt: new Date().toISOString(),
    storageEngine: process.env.STORAGE_ENGINE,
    steps: []
  };

  const healthResponse = await fetch(`${baseUrl}/api/v1/health`);
  const healthPayload = await healthResponse.json();
  assert.equal(healthResponse.status, 200);
  assert.equal(healthPayload.storageEngine, "POSTGRES");
  summary.steps.push({ step: "health", ok: true, storageEngine: healthPayload.storageEngine });

  const ownerOneChallenge = await issueChallenge(baseUrl, ownerOneEmail, { ip: ownerOneIp });
  assert.equal(ownerOneChallenge.response.status, 201);
  assert.ok(ownerOneChallenge.payload.debugMagicLink);
  summary.steps.push({ step: "owner-one-challenge", ok: true });

  const ownerOneVerify = await verifyWithMagicLink(baseUrl, ownerOneChallenge.payload.debugMagicLink, {
    displayName: "Postgres Owner One",
    companyName: `Damit PG One ${stamp}`
  });
  assert.equal(ownerOneVerify.response.status, 200);
  let ownerOneCookie = ownerOneVerify.cookie;
  let ownerOneCsrf = getCookieValue(ownerOneCookie, config.csrfCookieName);
  const companyOneId = ownerOneVerify.payload.company.id;
  summary.steps.push({ step: "owner-one-verify", ok: true, companyId: companyOneId });

  const ownerTwoChallenge = await issueChallenge(baseUrl, ownerTwoEmail, { ip: ownerTwoIp });
  assert.equal(ownerTwoChallenge.response.status, 201);
  const ownerTwoVerify = await verifyWithMagicLink(baseUrl, ownerTwoChallenge.payload.debugMagicLink, {
    displayName: "Postgres Owner Two",
    companyName: `Damit PG Two ${stamp}`
  });
  assert.equal(ownerTwoVerify.response.status, 200);
  const ownerTwoCookie = ownerTwoVerify.cookie;
  const ownerTwoCsrf = getCookieValue(ownerTwoCookie, config.csrfCookieName);
  const companyTwoId = ownerTwoVerify.payload.company.id;
  summary.steps.push({ step: "owner-two-verify", ok: true, companyId: companyTwoId });

  const invite = await requestJson(
    baseUrl,
    "POST",
    `/api/v1/companies/${companyTwoId}/invitations`,
    { email: ownerOneEmail, role: "MANAGER" },
    {
      cookie: ownerTwoCookie,
      headers: {
        Origin: process.env.APP_BASE_URL,
        "x-csrf-token": ownerTwoCsrf
      }
    }
  );
  assert.equal(invite.response.status, 201);
  assert.ok(invite.payload.debugInvitationLink);
  summary.steps.push({ step: "invite", ok: true });

  const invitationUrl = new URL(invite.payload.debugInvitationLink);
  const invitationToken = invitationUrl.searchParams.get("invitationToken");
  await backdateLoginChallenges(ownerOneEmail);
  const ownerOneJoinChallenge = await issueChallenge(baseUrl, ownerOneEmail, {
    invitationToken,
    ip: ownerOneJoinIp
  });
  assert.equal(ownerOneJoinChallenge.response.status, 201);
  const ownerOneJoinVerify = await verifyWithMagicLink(baseUrl, ownerOneJoinChallenge.payload.debugMagicLink);
  assert.equal(ownerOneJoinVerify.response.status, 200);
  ownerOneCookie = ownerOneJoinVerify.cookie;
  ownerOneCsrf = getCookieValue(ownerOneCookie, config.csrfCookieName);
  assert.equal(ownerOneJoinVerify.payload.company.id, companyTwoId);
  summary.steps.push({ step: "join-second-company", ok: true, companyCount: ownerOneJoinVerify.payload.companies.length });

  const switchResponse = await requestJson(
    baseUrl,
    "POST",
    `/api/v1/companies/${companyOneId}/switch-context`,
    null,
    {
      cookie: ownerOneCookie,
      headers: {
        Origin: process.env.APP_BASE_URL,
        "x-csrf-token": ownerOneCsrf
      }
    }
  );
  assert.equal(switchResponse.response.status, 200);
  ownerOneCookie = switchResponse.cookie || ownerOneCookie;
  ownerOneCsrf = getCookieValue(ownerOneCookie, config.csrfCookieName) || ownerOneCsrf;
  assert.equal(switchResponse.payload.company.id, companyOneId);
  summary.steps.push({ step: "switch-context", ok: true, activeCompanyId: companyOneId });

  const jobCaseCreate = await requestJson(
    baseUrl,
    "POST",
    "/api/v1/job-cases",
    {
      customerLabel: `Postgres Customer ${stamp}`,
      contactMemo: "postgres runtime smoke",
      siteLabel: `Postgres Site ${stamp}`,
      originalQuoteAmount: 210000
    },
    {
      cookie: ownerOneCookie,
      headers: {
        Origin: process.env.APP_BASE_URL,
        "x-csrf-token": ownerOneCsrf
      }
    }
  );
  assert.equal(jobCaseCreate.response.status, 201);
  const jobCaseId = jobCaseCreate.payload.id;
  summary.steps.push({ step: "job-case-create", ok: true, jobCaseId });

  const fieldRecordForm = new FormData();
  fieldRecordForm.append("primaryReason", "CONTAMINATION");
  fieldRecordForm.append("secondaryReason", "MOLD");
  fieldRecordForm.append("note", "postgres runtime smoke note");
  fieldRecordForm.append(
    "photos[]",
    new File([new Uint8Array([137, 80, 78, 71])], "sample.png", { type: "image/png" })
  );

  const fieldRecordCreate = await requestForm(baseUrl, "/api/v1/field-records", fieldRecordForm, {
    cookie: ownerOneCookie,
    headers: {
      Origin: process.env.APP_BASE_URL,
      "x-csrf-token": ownerOneCsrf
    }
  });
  assert.equal(fieldRecordCreate.response.status, 201, JSON.stringify(fieldRecordCreate.payload));
  assert.ok(fieldRecordCreate.payload.id);
  summary.steps.push({ step: "field-record-create", ok: true, fieldRecordId: fieldRecordCreate.payload.id });

  const fieldRecordLink = await requestJson(
    baseUrl,
    "POST",
    `/api/v1/field-records/${fieldRecordCreate.payload.id}/link-job-case`,
    { jobCaseId },
    {
      cookie: ownerOneCookie,
      headers: {
        Origin: process.env.APP_BASE_URL,
        "x-csrf-token": ownerOneCsrf
      }
    }
  );
  assert.equal(fieldRecordLink.response.status, 200, JSON.stringify(fieldRecordLink.payload));
  summary.steps.push({ step: "field-record-link", ok: true });

  const quoteUpdate = await requestJson(
    baseUrl,
    "PATCH",
    `/api/v1/job-cases/${jobCaseId}/quote`,
    { revisedQuoteAmount: 260000 },
    {
      cookie: ownerOneCookie,
      headers: {
        Origin: process.env.APP_BASE_URL,
        "x-csrf-token": ownerOneCsrf
      }
    }
  );
  assert.equal(quoteUpdate.response.status, 200, JSON.stringify(quoteUpdate.payload));
  assert.equal(quoteUpdate.payload.revisedQuoteAmount, 260000);
  summary.steps.push({ step: "quote-update", ok: true });

  const draftResponse = await requestJson(
    baseUrl,
    "POST",
    `/api/v1/job-cases/${jobCaseId}/draft-message`,
    { tone: "CUSTOMER_MESSAGE" },
    {
      cookie: ownerOneCookie,
      headers: {
        Origin: process.env.APP_BASE_URL,
        "x-csrf-token": ownerOneCsrf
      }
    }
  );
  assert.equal(draftResponse.response.status, 200, JSON.stringify(draftResponse.payload));
  assert.match(draftResponse.payload.body, /260,000/);
  summary.steps.push({ step: "draft-message", ok: true });

  const agreementResponse = await requestJson(
    baseUrl,
    "POST",
    `/api/v1/job-cases/${jobCaseId}/agreement-records`,
    {
      status: "AGREED",
      confirmationChannel: "KAKAO_OR_SMS",
      confirmedAmount: 260000,
      customerResponseNote: "postgres runtime smoke ok"
    },
    {
      cookie: ownerOneCookie,
      headers: {
        Origin: process.env.APP_BASE_URL,
        "x-csrf-token": ownerOneCsrf
      }
    }
  );
  assert.equal(agreementResponse.response.status, 201, JSON.stringify(agreementResponse.payload));
  assert.equal(agreementResponse.payload.currentStatus, "AGREED");
  summary.steps.push({ step: "agreement", ok: true, currentStatus: agreementResponse.payload.currentStatus });

  summary.finishedAt = new Date().toISOString();
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await closeServer();
}
