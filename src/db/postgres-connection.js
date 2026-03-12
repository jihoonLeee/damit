import fs from "node:fs";

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "off", ""].includes(normalized)) {
    return false;
  }
  return false;
}

export function redactDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return "";
  }

  try {
    const url = new URL(databaseUrl);
    if (url.password) {
      url.password = "***";
    }
    if (url.username) {
      url.username = `${url.username.slice(0, 2)}***`;
    }
    return url.toString();
  } catch {
    return databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
  }
}

function resolveSslOptions({ sslMode, sslRequire, sslCaPath }) {
  const normalizedMode = String(sslMode || "").trim().toLowerCase();
  const modeRequiresSsl = ["require", "verify-ca", "verify-full"].includes(normalizedMode);
  const modeDisablesSsl = normalizedMode === "disable";
  const requireSsl = !modeDisablesSsl && (modeRequiresSsl || parseBoolean(sslRequire) || Boolean(sslCaPath));

  if (!requireSsl) {
    return null;
  }

  if (sslCaPath) {
    const ca = fs.readFileSync(sslCaPath, "utf8");
    return {
      ca,
      rejectUnauthorized: true
    };
  }

  return {
    rejectUnauthorized: false
  };
}

export function buildPostgresConnectionOptions({
  databaseUrl,
  sslMode,
  sslRequire,
  sslCaPath,
  applicationName,
  maxPoolSize
} = {}) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Postgres operations.");
  }

  const options = {
    connectionString: databaseUrl
  };

  const ssl = resolveSslOptions({ sslMode, sslRequire, sslCaPath });
  if (ssl) {
    options.ssl = ssl;
  }

  if (applicationName) {
    options.application_name = applicationName;
  }

  const parsedMax = Number(maxPoolSize);
  if (Number.isInteger(parsedMax) && parsedMax > 0) {
    options.max = parsedMax;
  }

  return options;
}

export function summarizeConnectionOptions(connectionOptions) {
  return {
    hasSsl: Boolean(connectionOptions.ssl),
    rejectUnauthorized: Boolean(connectionOptions.ssl?.rejectUnauthorized),
    hasCustomCa: Boolean(connectionOptions.ssl?.ca),
    applicationName: connectionOptions.application_name || null,
    maxPoolSize: connectionOptions.max || null
  };
}