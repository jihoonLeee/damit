import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFile } from "./lib/env-file.mjs";

function readArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function looksPlaceholder(value) {
  return /replace|example|changeme|your-|YOUR-|todo|dummy|\[PASSWORD\]|\[PROJECT-REF\]/i.test(String(value || ""));
}

function ensureValue(errors, key, { allowPlaceholder = false } = {}) {
  const value = String(process.env[key] || "").trim();
  if (!value) {
    errors.push({ key, reason: "missing" });
    return;
  }
  if (!allowPlaceholder && looksPlaceholder(value)) {
    errors.push({ key, reason: "placeholder" });
  }
}

function isValidMailFrom(value) {
  const normalized = String(value || "").trim();
  const plainEmail = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const namedEmail = /^[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/;
  return plainEmail.test(normalized) || namedEmail.test(normalized);
}

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const defaultEnvFile = path.join(rootDir, ".env.production.local");
const envFile = readArg("env-file", defaultEnvFile);
const testEmailArg = readArg("email");
const baseUrlArg = readArg("base-url");
const portArg = Number.parseInt(readArg("port", ""), 10);
const runtimePort = Number.isFinite(portArg) ? portArg : 3098;
const runtimeDataDir = path.join(rootDir, "output", "mail-smoke-runtime");

const loadResult = loadEnvFile(envFile, { override: true });

process.env.APP_ENV = process.env.APP_ENV || "production";
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.PORT = String(runtimePort);
process.env.STORAGE_ENGINE = "SQLITE";
process.env.DATA_DIR = runtimeDataDir;
process.env.DB_FILE_PATH = path.join(runtimeDataDir, "app.sqlite");
process.env.UPLOAD_DIR = path.join(runtimeDataDir, "uploads");
process.env.BACKUP_DIR = path.join(runtimeDataDir, "backups");
process.env.AUTH_DEBUG_LINKS = "false";
process.env.AUTH_ENFORCE_TRUSTED_ORIGIN = "true";
if (baseUrlArg) {
  process.env.APP_BASE_URL = baseUrlArg;
} else if (!process.env.APP_BASE_URL) {
  process.env.APP_BASE_URL = `http://127.0.0.1:${runtimePort}`;
}

const errors = [];
ensureValue(errors, "MAIL_PROVIDER", { allowPlaceholder: false });
ensureValue(errors, "MAIL_FROM");
if (String(process.env.MAIL_FROM || "").trim() && !looksPlaceholder(process.env.MAIL_FROM) && !isValidMailFrom(process.env.MAIL_FROM)) {
  errors.push({ key: "MAIL_FROM", reason: "MAIL_FROM must use email@example.com or Name <email@example.com> format" });
}
ensureValue(errors, "RESEND_API_KEY");
ensureValue(errors, "APP_BASE_URL", { allowPlaceholder: false });

const mailProvider = String(process.env.MAIL_PROVIDER || "").trim().toUpperCase();
if (mailProvider !== "RESEND") {
  errors.push({ key: "MAIL_PROVIDER", reason: "MAIL_PROVIDER must be RESEND for real mail smoke" });
}
if (String(process.env.AUTH_DEBUG_LINKS || "").trim().toLowerCase() !== "false") {
  errors.push({ key: "AUTH_DEBUG_LINKS", reason: "AUTH_DEBUG_LINKS must be false" });
}
if (String(process.env.AUTH_ENFORCE_TRUSTED_ORIGIN || "").trim().toLowerCase() !== "true") {
  errors.push({ key: "AUTH_ENFORCE_TRUSTED_ORIGIN", reason: "AUTH_ENFORCE_TRUSTED_ORIGIN must be true" });
}

const testEmail = String(testEmailArg || process.env.MAIL_SMOKE_TEST_EMAIL || "").trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
  errors.push({ key: "MAIL_SMOKE_TEST_EMAIL", reason: "valid test email is required via env or --email" });
}

if (errors.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    envFile: loadResult.path,
    errors
  }, null, 2));
  process.exit(1);
}

await fs.mkdir(runtimeDataDir, { recursive: true });

const [{ createApp }] = await Promise.all([
  import("../src/app.js")
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

await new Promise((resolve) => server.listen(runtimePort, "127.0.0.1", resolve));

try {
  const response = await fetch(`http://127.0.0.1:${runtimePort}/api/v1/auth/challenges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: process.env.APP_BASE_URL
    },
    body: JSON.stringify({ email: testEmail })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(JSON.stringify({
      ok: false,
      envFile: loadResult.path,
      status: response.status,
      payload
    }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({
      ok: true,
      envFile: loadResult.path,
      appBaseUrl: process.env.APP_BASE_URL,
      runtimePort,
      storageEngine: process.env.STORAGE_ENGINE,
      delivery: payload.delivery,
      debugLinkExposed: Boolean(payload.debugMagicLink),
      nextStep: `${testEmail} inbox and spam folder should now contain the login email.`
    }, null, 2));
  }
} finally {
  await closeServer();
}