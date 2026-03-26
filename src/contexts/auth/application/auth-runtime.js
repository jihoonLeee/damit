import crypto from "node:crypto";

import { config } from "../../../config.js";
import { HttpError } from "../../../http.js";

export function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) {
          return [part, ""];
        }
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function cookieFlags(maxAgeSeconds = null, sameSite = "Lax") {
  const parts = ["Path=/", "HttpOnly", `SameSite=${sameSite}`];
  if (config.nodeEnv === "production") {
    parts.push("Secure");
  }
  if (maxAgeSeconds != null) {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }
  return parts;
}

function getCurrentRequestOrigin(request) {
  const host = request.headers.host || "";
  if (!host) {
    return null;
  }
  const forwardedProto = String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const protocol = forwardedProto || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}

function normalizeOriginValue(value) {
  if (!value) {
    return null;
  }
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getTrustedOriginAllowlist(request) {
  const allowlist = new Set();
  const currentOrigin = getCurrentRequestOrigin(request);
  const configuredOrigins = String(config.trustedOrigins || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const item of configuredOrigins) {
    const normalized = normalizeOriginValue(item);
    if (normalized) {
      allowlist.add(normalized);
    }
  }

  if (config.appBaseUrl) {
    const normalizedBaseUrl = normalizeOriginValue(config.appBaseUrl);
    if (normalizedBaseUrl) {
      allowlist.add(normalizedBaseUrl);
    }
  }

  if (currentOrigin) {
    allowlist.add(currentOrigin);
  }

  return allowlist;
}

export function extractTrustedRequestOrigin(request) {
  const rawOrigin = request.headers.origin;
  if (rawOrigin) {
    return normalizeOriginValue(String(rawOrigin));
  }

  const rawReferer = request.headers.referer;
  if (rawReferer) {
    return normalizeOriginValue(String(rawReferer));
  }

  return null;
}

export function assertTrustedOrigin(request) {
  if (!config.authEnforceTrustedOrigin) {
    return;
  }

  const requestOrigin = extractTrustedRequestOrigin(request);
  if (!requestOrigin) {
    throw new HttpError(403, "TRUSTED_ORIGIN_REQUIRED", "운영 모드에서는 동일 출처 요청만 허용됩니다.");
  }

  const allowlist = getTrustedOriginAllowlist(request);
  if (!allowlist.has(requestOrigin)) {
    throw new HttpError(403, "TRUSTED_ORIGIN_INVALID", "허용되지 않은 출처에서 온 요청입니다.");
  }
}

export function createAuthCookieHeaders({ sessionId, refreshToken, csrfToken }) {
  return [
    `${config.sessionCookieName}=${encodeURIComponent(sessionId)}; ${cookieFlags(config.sessionMaxAgeSeconds, config.sessionCookieSameSite).join("; ")}`,
    `${config.refreshCookieName}=${encodeURIComponent(refreshToken)}; ${cookieFlags(config.refreshSessionMaxAgeSeconds, config.sessionCookieSameSite).join("; ")}`,
    `${config.csrfCookieName}=${encodeURIComponent(csrfToken)}; Path=/; SameSite=${config.csrfCookieSameSite}${config.nodeEnv === "production" ? "; Secure" : ""}; Max-Age=${config.sessionMaxAgeSeconds}`
  ];
}

export function createClearAuthCookieHeaders() {
  return [
    `${config.sessionCookieName}=; ${cookieFlags(0, config.sessionCookieSameSite).join("; ")}`,
    `${config.refreshCookieName}=; ${cookieFlags(0, config.sessionCookieSameSite).join("; ")}`,
    `${config.csrfCookieName}=; Path=/; SameSite=${config.csrfCookieSameSite}${config.nodeEnv === "production" ? "; Secure" : ""}; Max-Age=0`
  ];
}

export function createCsrfToken() {
  return crypto.randomBytes(18).toString("base64url");
}

export function assertCsrf(request) {
  const cookies = parseCookies(request.headers.cookie || "");
  const cookieToken = cookies[config.csrfCookieName];
  const headerToken = request.headers["x-csrf-token"];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new HttpError(403, "CSRF_TOKEN_INVALID", "CSRF 토큰이 유효하지 않습니다.");
  }
}

export async function getAuthContext(request, repositories) {
  const cookies = parseCookies(request.headers.cookie || "");
  const sessionId = cookies[config.sessionCookieName];
  if (!sessionId) {
    throw new HttpError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const context = await repositories.authRepository.getSessionContext(sessionId);
  if (!context) {
    throw new HttpError(401, "AUTH_SESSION_INVALID", "세션이 유효하지 않습니다. 다시 로그인해 주세요.");
  }

  return {
    ...context,
    mode: "SESSION",
    csrfToken: cookies[config.csrfCookieName] || null,
    sessionId
  };
}

export async function refreshSessionFromRequest(request, repositories) {
  const cookies = parseCookies(request.headers.cookie || "");
  const refreshToken = cookies[config.refreshCookieName];
  if (!refreshToken) {
    throw new HttpError(401, "AUTH_REFRESH_INVALID", "리프레시 세션이 유효하지 않습니다.");
  }
  return repositories.authRepository.refreshSessionByRefreshToken(refreshToken);
}
