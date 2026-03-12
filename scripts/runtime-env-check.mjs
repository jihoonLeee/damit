const profileArg = process.argv.find((item) => item.startsWith("--profile="));
const profile = (profileArg ? profileArg.split("=")[1] : process.env.APP_ENV || "staging").toLowerCase();

const env = process.env;
const errors = [];
const warnings = [];

function requireKey(key, reason) {
  if (!env[key] || String(env[key]).trim() === "") {
    errors.push({ key, reason });
  }
}

function warn(message) {
  warnings.push(message);
}

if (!["staging", "production"].includes(profile)) {
  errors.push({ key: "APP_ENV", reason: `Unsupported profile: ${profile}` });
}

requireKey("APP_BASE_URL", "absolute public base URL is required");
requireKey("OWNER_TOKEN", "owner-only admin routes still require a protected token");
requireKey("STORAGE_ENGINE", "data layer must be explicit");
requireKey("POSTGRES_APPLICATION_NAME", "connection attribution is required for managed Postgres ops");
requireKey("POSTGRES_POOL_MAX", "pool sizing must be explicit");

const storageEngine = String(env.STORAGE_ENGINE || "").toUpperCase();
if (storageEngine === "POSTGRES") {
  requireKey("DATABASE_URL", "managed Postgres cutover requires a database connection string");

  const sslMode = String(env.POSTGRES_SSL_MODE || "").trim().toLowerCase();
  const sslRequire = String(env.POSTGRES_SSL_REQUIRE || "").trim().toLowerCase();
  const hasCaPath = Boolean(String(env.POSTGRES_SSL_CA_PATH || "").trim());
  const sslExplicit = ["disable", "require", "verify-ca", "verify-full"].includes(sslMode) || ["true", "false", "1", "0", "yes", "no"].includes(sslRequire) || hasCaPath;
  if (!sslExplicit) {
    errors.push({ key: "POSTGRES_SSL_MODE", reason: "explicit SSL posture is required for managed Postgres" });
  }
}

const mailProvider = String(env.MAIL_PROVIDER || "").trim().toUpperCase();
if (!mailProvider) {
  errors.push({ key: "MAIL_PROVIDER", reason: "mail delivery mode must be explicit" });
} else if (mailProvider === "RESEND") {
  requireKey("RESEND_API_KEY", "Resend provider requires an API key");
  requireKey("MAIL_FROM", "mail sender identity is required");
} else if (mailProvider === "FILE") {
  warn("MAIL_PROVIDER=FILE is only appropriate for local development, not staging/production.");
}

if (!String(env.APP_BASE_URL || "").startsWith("https://")) {
  warnings.push("APP_BASE_URL should use https in staging/production.");
}

if (profile === "production" && String(env.APP_BASE_URL || "").includes("staging")) {
  errors.push({ key: "APP_BASE_URL", reason: "production profile cannot point at a staging hostname" });
}

if (profile === "staging" && !String(env.APP_BASE_URL || "").includes("staging")) {
  warnings.push("staging profile normally uses a staging hostname.");
}

const report = {
  ok: errors.length === 0,
  profile,
  checkedAt: new Date().toISOString(),
  errors,
  warnings,
  summary: {
    storageEngine,
    mailProvider,
    hasDatabaseUrl: Boolean(env.DATABASE_URL),
    hasOwnerToken: Boolean(env.OWNER_TOKEN),
    hasResendApiKey: Boolean(env.RESEND_API_KEY),
    appBaseUrl: env.APP_BASE_URL || ""
  }
};

const serialized = JSON.stringify(report, null, 2);
if (report.ok) {
  console.log(serialized);
} else {
  console.error(serialized);
  process.exit(1);
}