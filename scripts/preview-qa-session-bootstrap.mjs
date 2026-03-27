import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { loadEnvFile } from "./lib/env-file.mjs";

function readArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function ensureDirectory(filePath) {
  return fs.mkdir(path.dirname(filePath), { recursive: true });
}

function buildDefaultValue(prefix) {
  const stamp = new Date().toISOString().replace(/[.:]/g, "-");
  return `${prefix}-${stamp}`;
}

function toSummary({ verified, csrfToken, cookieHeader, cookies, label }) {
  return {
    label,
    user: verified.user,
    company: verified.company,
    companies: verified.companies,
    csrfToken,
    cookieHeader,
    cookies
  };
}

const rootDir = path.resolve(import.meta.dirname, "..");
const envFile = readArg("env-file", "");
if (envFile) {
  loadEnvFile(envFile, { override: true });
}

const baseUrlOverride = readArg("base-url", "");
if (baseUrlOverride) {
  process.env.APP_BASE_URL = baseUrlOverride;
}
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.APP_ENV = process.env.APP_ENV || "production";
process.env.STORAGE_ENGINE = "POSTGRES";

const [
  { createRepositoryBundle },
  { createAuthCookieHeaders, createCsrfToken },
  { config },
  { assertPreviewQaBootstrapAllowed, mergeSetCookieHeaders, setCookieHeadersToPlaywrightCookies }
] = await Promise.all([
  import("../src/repositories/createRepositoryBundle.js"),
  import("../src/contexts/auth/application/auth-runtime.js"),
  import("../src/config.js"),
  import("../src/qa/preview-session-bootstrap.js")
]);

const previewBaseUrl = config.appBaseUrl || process.env.APP_BASE_URL || "";
assertPreviewQaBootstrapAllowed({
  appBaseUrl: previewBaseUrl,
  storageEngine: "POSTGRES",
  authDebugLinks: process.env.AUTH_DEBUG_LINKS || config.authDebugLinks
});

const ownerEmail = readArg("email", `${buildDefaultValue("preview-qa-owner")}@example.com`);
const ownerDisplayName = readArg("display-name", "Preview QA Owner");
const ownerCompanyName = readArg("company-name", `Damit Preview QA ${new Date().toISOString().slice(0, 10)}`);
const inviteEmail = readArg("invite-email", "");
const inviteRole = readArg("invite-role", "MANAGER").toUpperCase();
const inviteDisplayName = readArg("invite-display-name", "Preview QA Teammate");
const outputPath = path.resolve(
  readArg(
    "output",
    path.join(rootDir, "output", "preview-qa", `preview-qa-session-${new Date().toISOString().replace(/[.:]/g, "-")}.json`)
  )
);

const repositories = createRepositoryBundle({
  engine: "POSTGRES",
  databaseUrl: process.env.DATABASE_URL,
  sslMode: process.env.POSTGRES_SSL_MODE,
  sslRequire: process.env.POSTGRES_SSL_REQUIRE,
  sslCaPath: process.env.POSTGRES_SSL_CA_PATH,
  applicationName: process.env.POSTGRES_APPLICATION_NAME || "damit-preview-qa-bootstrap",
  maxPoolSize: process.env.POSTGRES_POOL_MAX || "5"
});

try {
  const ownerToken = crypto.randomBytes(24).toString("base64url");
  const ownerChallenge = await repositories.authRepository.issueChallenge({
    email: ownerEmail,
    token: ownerToken,
    requestIp: "127.0.0.1",
    deliveryProvider: "PREVIEW_QA_BOOTSTRAP",
    deliveryStatus: "SKIPPED"
  });
  const ownerVerified = await repositories.authRepository.verifyChallenge({
    challengeId: ownerChallenge.id,
    token: ownerToken,
    displayName: ownerDisplayName,
    companyName: ownerCompanyName
  });
  const ownerCsrfToken = createCsrfToken();
  const ownerSetCookieHeaders = createAuthCookieHeaders({
    sessionId: ownerVerified.sessionId,
    refreshToken: ownerVerified.refreshToken,
    csrfToken: ownerCsrfToken
  });
  const ownerCookieHeader = mergeSetCookieHeaders(ownerSetCookieHeaders);
  const ownerCookies = setCookieHeadersToPlaywrightCookies(ownerSetCookieHeaders, previewBaseUrl);

  const artifact = {
    ok: true,
    generatedAt: new Date().toISOString(),
    baseUrl: previewBaseUrl,
    nextUrls: {
      home: `${previewBaseUrl}/home`,
      account: `${previewBaseUrl}/account`,
      app: `${previewBaseUrl}/app`,
      ops: `${previewBaseUrl}/ops`
    },
    owner: toSummary({
      label: "owner",
      verified: ownerVerified,
      csrfToken: ownerCsrfToken,
      cookieHeader: ownerCookieHeader,
      cookies: ownerCookies
    })
  };

  if (inviteEmail) {
    const invitation = await repositories.authRepository.createInvitation({
      companyId: ownerVerified.company.id,
      email: inviteEmail,
      role: inviteRole,
      invitedByUserId: ownerVerified.user.id
    });

    const inviteToken = crypto.randomBytes(24).toString("base64url");
    const inviteChallenge = await repositories.authRepository.issueChallenge({
      email: inviteEmail,
      token: inviteToken,
      requestIp: "127.0.0.1",
      deliveryProvider: "PREVIEW_QA_BOOTSTRAP",
      deliveryStatus: "SKIPPED"
    });
    const inviteVerified = await repositories.authRepository.verifyChallenge({
      challengeId: inviteChallenge.id,
      token: inviteToken,
      displayName: inviteDisplayName,
      invitationToken: invitation.invitationToken
    });
    const inviteCsrfToken = createCsrfToken();
    const inviteSetCookieHeaders = createAuthCookieHeaders({
      sessionId: inviteVerified.sessionId,
      refreshToken: inviteVerified.refreshToken,
      csrfToken: inviteCsrfToken
    });

    artifact.invitation = {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      companyId: invitation.companyId,
      companyName: invitation.companyName,
      expiresAt: invitation.expiresAt
    };
    artifact.invitee = toSummary({
      label: "invitee",
      verified: inviteVerified,
      csrfToken: inviteCsrfToken,
      cookieHeader: mergeSetCookieHeaders(inviteSetCookieHeaders),
      cookies: setCookieHeadersToPlaywrightCookies(inviteSetCookieHeaders, previewBaseUrl)
    });
  }

  await ensureDirectory(outputPath);
  await fs.writeFile(outputPath, JSON.stringify(artifact, null, 2), "utf8");

  console.log(JSON.stringify({
    ok: true,
    outputPath,
    baseUrl: artifact.baseUrl,
    ownerEmail,
    ownerCompanyId: artifact.owner.company.id,
    ownerCompanyName: artifact.owner.company.name,
    inviteEmail: artifact.invitee?.user?.email || null
  }, null, 2));
} finally {
  if (typeof repositories.close === "function") {
    await repositories.close();
  }
}
