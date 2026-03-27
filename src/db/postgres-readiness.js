import { redactDatabaseUrl } from "./postgres-connection.js";

function parseInteger(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBooleanLike(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "on", "require"].includes(normalized);
}

function normalizeSslMode(value) {
  return String(value || "").trim().toLowerCase();
}

function looksSupabaseHost(hostname) {
  return /(?:\.supabase\.(co|in)|\.pooler\.supabase\.com)$/i.test(String(hostname || "").trim());
}

export function assessPostgresReadiness(envLike = process.env) {
  const env = envLike || {};
  const errors = [];
  const warnings = [];

  const databaseUrl = String(env.DATABASE_URL || "").trim();
  const sslMode = normalizeSslMode(env.POSTGRES_SSL_MODE || env.PGSSLMODE);
  const sslRequire = String(env.POSTGRES_SSL_REQUIRE || "").trim();
  const sslCaPath = String(env.POSTGRES_SSL_CA_PATH || "").trim();
  const applicationName = String(env.POSTGRES_APPLICATION_NAME || "").trim();
  const poolMax = String(env.POSTGRES_POOL_MAX || "").trim();

  let parsedDatabaseUrl = null;
  let provider = "UNKNOWN";

  if (!databaseUrl) {
    errors.push({ key: "DATABASE_URL", reason: "managed Postgres connection string is required" });
  } else {
    try {
      parsedDatabaseUrl = new URL(databaseUrl);
      if (!["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol)) {
        errors.push({
          key: "DATABASE_URL",
          reason: "connection string must use postgres:// or postgresql://, not a dashboard https URL"
        });
      }
      provider = looksSupabaseHost(parsedDatabaseUrl.hostname) ? "SUPABASE" : "CUSTOM_POSTGRES";
    } catch {
      errors.push({ key: "DATABASE_URL", reason: "connection string is not a valid URL" });
    }
  }

  const sslExplicit = ["disable", "require", "verify-ca", "verify-full"].includes(sslMode)
    || ["true", "false", "1", "0", "yes", "no"].includes(String(sslRequire).trim().toLowerCase())
    || Boolean(sslCaPath);
  if (!sslExplicit) {
    errors.push({ key: "POSTGRES_SSL_MODE", reason: "explicit SSL posture is required" });
  }

  if (provider === "SUPABASE" && sslMode !== "require" && !parseBooleanLike(sslRequire) && !sslCaPath) {
    warnings.push("Supabase normally expects SSL to be explicitly required.");
  }

  if (!applicationName) {
    errors.push({ key: "POSTGRES_APPLICATION_NAME", reason: "application naming must be explicit for operator attribution" });
  } else if (applicationName === "damit") {
    warnings.push("Use an environment-specific application name like damit-production or damit-staging.");
  }

  const parsedPoolMax = parseInteger(poolMax);
  if (parsedPoolMax == null || parsedPoolMax <= 0) {
    errors.push({ key: "POSTGRES_POOL_MAX", reason: "pool sizing must be an explicit positive integer" });
  } else if (parsedPoolMax > 20) {
    warnings.push("Pool size is larger than expected for the current single-node runtime.");
  }

  if (provider === "CUSTOM_POSTGRES") {
    warnings.push("Target host does not look like Supabase. This is fine if intentional, but PM currently recommends Supabase first.");
  }

  const nextSteps = errors.length > 0
    ? [
        "Fill the missing Postgres environment values.",
        "Run npm run pg:readiness again.",
        "Only after readiness is green, run npm run pg:preflight."
      ]
    : [
        "Run npm run pg:preflight.",
        "Run npm run migrate:status.",
        "Do not cut over the runtime until preflight and migration status are both understood."
      ];

  return {
    ok: errors.length === 0,
    checkedAt: new Date().toISOString(),
    provider,
    errors,
    warnings,
    summary: {
      databaseUrl: redactDatabaseUrl(databaseUrl),
      hostname: parsedDatabaseUrl?.hostname || null,
      port: parsedDatabaseUrl?.port || null,
      databaseName: parsedDatabaseUrl?.pathname?.replace(/^\//, "") || null,
      sslMode: sslMode || null,
      sslRequire: sslRequire || null,
      hasCustomCa: Boolean(sslCaPath),
      applicationName: applicationName || null,
      poolMax: parsedPoolMax
    },
    nextSteps
  };
}
