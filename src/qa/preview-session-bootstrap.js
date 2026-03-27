function normalizeSameSite(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "strict") {
    return "Strict";
  }
  if (normalized === "none") {
    return "None";
  }
  return "Lax";
}

function parseSetCookieLine(line) {
  const parts = String(line || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

  const [pair, ...attributes] = parts;
  const index = pair ? pair.indexOf("=") : -1;
  if (!pair || index === -1) {
    throw new Error(`Invalid Set-Cookie header: ${line}`);
  }

  const name = pair.slice(0, index);
  const value = pair.slice(index + 1);
  const parsed = {
    name,
    value,
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
    maxAge: null
  };

  for (const attribute of attributes) {
    const separatorIndex = attribute.indexOf("=");
    const rawKey = separatorIndex === -1 ? attribute : attribute.slice(0, separatorIndex);
    const rawValue = separatorIndex === -1 ? "" : attribute.slice(separatorIndex + 1);
    const key = rawKey.trim().toLowerCase();
    const valueText = rawValue.trim();

    if (key === "path" && valueText) {
      parsed.path = valueText;
      continue;
    }
    if (key === "httponly") {
      parsed.httpOnly = true;
      continue;
    }
    if (key === "secure") {
      parsed.secure = true;
      continue;
    }
    if (key === "samesite") {
      parsed.sameSite = normalizeSameSite(valueText);
      continue;
    }
    if (key === "max-age") {
      const maxAge = Number.parseInt(valueText, 10);
      parsed.maxAge = Number.isFinite(maxAge) ? maxAge : null;
    }
  }

  return parsed;
}

export function assertPreviewQaBootstrapAllowed({ appBaseUrl, storageEngine, authDebugLinks }) {
  if (!appBaseUrl) {
    throw new Error("APP_BASE_URL is required for preview QA bootstrap.");
  }

  let url;
  try {
    url = new URL(appBaseUrl);
  } catch {
    throw new Error(`APP_BASE_URL must be a valid URL: ${appBaseUrl}`);
  }

  if (!url.hostname.startsWith("preview.")) {
    throw new Error("Preview QA bootstrap only supports preview.* hosts.");
  }

  if (String(storageEngine || "").trim().toUpperCase() !== "POSTGRES") {
    throw new Error("Preview QA bootstrap requires POSTGRES runtime intent.");
  }

  if (String(authDebugLinks || "").trim().toLowerCase() === "true") {
    throw new Error("Preview QA bootstrap must run with AUTH_DEBUG_LINKS=false.");
  }

  return {
    origin: url.origin,
    hostname: url.hostname,
    secure: url.protocol === "https:"
  };
}

export function mergeSetCookieHeaders(setCookieHeaders = []) {
  return setCookieHeaders
    .map((item) => parseSetCookieLine(item))
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");
}

export function setCookieHeadersToPlaywrightCookies(setCookieHeaders = [], baseUrl) {
  const { hostname, secure } = assertPreviewQaBootstrapAllowed({
    appBaseUrl: baseUrl,
    storageEngine: "POSTGRES",
    authDebugLinks: "false"
  });

  return setCookieHeaders.map((item) => {
    const parsed = parseSetCookieLine(item);
    return {
      name: parsed.name,
      value: parsed.value,
      domain: hostname,
      path: parsed.path || "/",
      httpOnly: parsed.httpOnly,
      secure: secure || parsed.secure,
      sameSite: parsed.sameSite
    };
  });
}
