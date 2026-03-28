import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { loadEnvFile } from "./lib/env-file.mjs";

function readArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function readBooleanArg(name, fallback) {
  const value = readArg(name, "");
  if (!value) {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

async function fileExists(targetPath) {
  if (!targetPath) {
    return false;
  }

  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function readSetCookies(response) {
  return typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
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

const rootDir = path.resolve(import.meta.dirname, "..");
const defaultEnvFile = path.join(rootDir, ".env.production.local");
const requestedEnvFile = readArg("config-env-file", readArg("env-file", ""));
const envFile = requestedEnvFile || (await fileExists(defaultEnvFile) ? defaultEnvFile : "");

if (envFile) {
  loadEnvFile(envFile, { override: true });
}

const baseUrl = readArg("base-url", process.env.APP_BASE_URL || "https://preview.damit.kr");
const runtimeBaseUrl = readArg("runtime-base-url", baseUrl);
const testPhone = String(readArg("phone", process.env.CUSTOMER_NOTIFICATION_TEST_PHONE || "")).trim();
const requireAuto = readBooleanArg("require-auto", true);
const stamp = new Date().toISOString().replace(/[.:]/g, "-");

if (!testPhone) {
  throw new Error("Customer notification provider smoke requires --phone=... or CUSTOMER_NOTIFICATION_TEST_PHONE.");
}

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.APP_ENV = process.env.APP_ENV || "production";
process.env.STORAGE_ENGINE = "POSTGRES";
process.env.AUTH_DEBUG_LINKS = "false";
process.env.APP_BASE_URL = baseUrl;

const [
  { createRepositoryBundle },
  { createAuthCookieHeaders, createCsrfToken },
  { config },
  { assertPreviewQaBootstrapAllowed, mergeSetCookieHeaders },
  { assertCustomerNotificationSmokeResult }
] = await Promise.all([
  import("../src/repositories/createRepositoryBundle.js"),
  import("../src/contexts/auth/application/auth-runtime.js"),
  import("../src/config.js"),
  import("../src/qa/preview-session-bootstrap.js"),
  import("../src/qa/customer-notification-smoke.js")
]);

assertPreviewQaBootstrapAllowed({
  appBaseUrl: baseUrl,
  storageEngine: "POSTGRES",
  authDebugLinks: "false"
});

const repositories = createRepositoryBundle({
  engine: "POSTGRES",
  databaseUrl: process.env.DATABASE_URL,
  sslMode: process.env.POSTGRES_SSL_MODE,
  sslRequire: process.env.POSTGRES_SSL_REQUIRE,
  sslCaPath: process.env.POSTGRES_SSL_CA_PATH,
  applicationName: process.env.POSTGRES_APPLICATION_NAME || "damit-preview-customer-notification-smoke",
  maxPoolSize: process.env.POSTGRES_POOL_MAX || "5"
});

try {
  const ownerEmail = `preview-notify-smoke-${stamp}@example.com`;
  const token = crypto.randomBytes(24).toString("base64url");
  const challenge = await repositories.authRepository.issueChallenge({
    email: ownerEmail,
    token,
    requestIp: "127.0.0.1",
    deliveryProvider: "PREVIEW_NOTIFICATION_SMOKE",
    deliveryStatus: "SKIPPED"
  });
  const verified = await repositories.authRepository.verifyChallenge({
    challengeId: challenge.id,
    token,
    displayName: "Preview Notification Smoke Owner",
    companyName: `Damit Preview Notification ${stamp}`
  });
  const csrfToken = createCsrfToken();
  const cookieHeader = mergeSetCookieHeaders(createAuthCookieHeaders({
    sessionId: verified.sessionId,
    refreshToken: verified.refreshToken,
    csrfToken
  }));

  const writeHeaders = {
    Origin: baseUrl,
    "x-csrf-token": csrfToken
  };

  const health = await fetch(`${runtimeBaseUrl}/api/v1/health`);
  const healthPayload = await health.json();
  if (!health.ok || healthPayload.storageEngine !== "POSTGRES") {
    throw new Error(`Preview runtime is not ready for provider smoke: ${JSON.stringify(healthPayload)}`);
  }

  const me = await requestJson(runtimeBaseUrl, "GET", "/api/v1/me", null, { cookie: cookieHeader });
  if (me.response.status !== 200 || !me.payload?.authenticated) {
    throw new Error("Preview QA bootstrap session was not accepted by the preview runtime.");
  }

  const createJobCase = await requestJson(
    runtimeBaseUrl,
    "POST",
    "/api/v1/job-cases",
    {
      customerLabel: `고객 알림 스모크 ${stamp}`,
      customerPhoneNumber: testPhone,
      contactMemo: "preview customer notification provider smoke",
      siteLabel: `다밋 프리뷰 스모크 ${stamp}`,
      originalQuoteAmount: 180000
    },
    {
      cookie: cookieHeader,
      headers: writeHeaders
    }
  );
  if (createJobCase.response.status !== 201) {
    throw new Error(`Job case creation failed: ${JSON.stringify(createJobCase.payload)}`);
  }

  const jobCaseId = createJobCase.payload.id;

  const formData = new FormData();
  formData.append("primaryReason", "CONTAMINATION");
  formData.append("secondaryReason", "NICOTINE");
  formData.append("note", "preview customer notification provider smoke");
  formData.append(
    "photos[]",
    new File([new Uint8Array([137, 80, 78, 71])], "preview-smoke.png", { type: "image/png" })
  );

  const createFieldRecord = await requestForm(runtimeBaseUrl, "/api/v1/field-records", formData, {
    cookie: cookieHeader,
    headers: writeHeaders
  });
  if (createFieldRecord.response.status !== 201) {
    throw new Error(`Field record creation failed: ${JSON.stringify(createFieldRecord.payload)}`);
  }

  const fieldRecordId = createFieldRecord.payload.id;

  const linkFieldRecord = await requestJson(
    runtimeBaseUrl,
    "POST",
    `/api/v1/field-records/${fieldRecordId}/link-job-case`,
    { jobCaseId },
    {
      cookie: cookieHeader,
      headers: writeHeaders
    }
  );
  if (linkFieldRecord.response.status !== 200) {
    throw new Error(`Field record link failed: ${JSON.stringify(linkFieldRecord.payload)}`);
  }

  const updateQuote = await requestJson(
    runtimeBaseUrl,
    "PATCH",
    `/api/v1/job-cases/${jobCaseId}/quote`,
    { revisedQuoteAmount: 240000 },
    {
      cookie: cookieHeader,
      headers: writeHeaders
    }
  );
  if (updateQuote.response.status !== 200) {
    throw new Error(`Quote update failed: ${JSON.stringify(updateQuote.payload)}`);
  }

  const createDraft = await requestJson(
    runtimeBaseUrl,
    "POST",
    `/api/v1/job-cases/${jobCaseId}/draft-message`,
    { tone: "CUSTOMER_MESSAGE" },
    {
      cookie: cookieHeader,
      headers: writeHeaders
    }
  );
  if (createDraft.response.status !== 200) {
    throw new Error(`Draft generation failed: ${JSON.stringify(createDraft.payload)}`);
  }

  const createLink = await requestJson(
    runtimeBaseUrl,
    "POST",
    `/api/v1/job-cases/${jobCaseId}/customer-confirmation-links`,
    { expiresInHours: 72 },
    {
      cookie: cookieHeader,
      headers: writeHeaders
    }
  );
  if (createLink.response.status !== 201) {
    throw new Error(`Customer confirmation link issuance failed: ${JSON.stringify(createLink.payload)}`);
  }

  const detail = await requestJson(
    runtimeBaseUrl,
    "GET",
    `/api/v1/job-cases/${jobCaseId}`,
    null,
    { cookie: cookieHeader }
  );
  if (detail.response.status !== 200) {
    throw new Error(`Job case detail fetch failed: ${JSON.stringify(detail.payload)}`);
  }

  const delivery = createLink.payload?.delivery || null;
  const persistedDeliveryStatus = detail.payload?.latestCustomerConfirmationLink?.deliveryStatus || null;
  if (!delivery) {
    throw new Error(
      `Customer notification smoke did not receive delivery metadata. `
      + `response=${JSON.stringify(createLink.payload)} `
      + `persistedDeliveryStatus=${JSON.stringify(persistedDeliveryStatus)}`
    );
  }
  assertCustomerNotificationSmokeResult(delivery, { requireAuto });

  console.log(JSON.stringify({
    ok: true,
    envFile,
    baseUrl,
    runtimeBaseUrl,
    requireAuto,
    jobCaseId,
    fieldRecordId,
    confirmationUrl: createLink.payload.confirmationUrl,
    delivery,
    persistedDeliveryStatus
  }, null, 2));
} finally {
  if (typeof repositories.close === "function") {
    await repositories.close();
  }
}
