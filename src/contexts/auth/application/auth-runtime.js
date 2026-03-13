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

function cookieFlags(maxAgeSeconds = null) {
  const parts = ["Path=/", "HttpOnly", "SameSite=Lax"];
  if (config.nodeEnv === "production") {
    parts.push("Secure");
  }
  if (maxAgeSeconds != null) {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }
  return parts;
}

export function createAuthCookieHeaders({ sessionId, refreshToken, csrfToken }) {
  return [
    `${config.sessionCookieName}=${encodeURIComponent(sessionId)}; ${cookieFlags(8 * 60 * 60).join("; ")}`,
    `${config.refreshCookieName}=${encodeURIComponent(refreshToken)}; ${cookieFlags(30 * 24 * 60 * 60).join("; ")}`,
    `${config.csrfCookieName}=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Lax${config.nodeEnv === "production" ? "; Secure" : ""}; Max-Age=${8 * 60 * 60}`
  ];
}

export function createClearAuthCookieHeaders() {
  return [
    `${config.sessionCookieName}=; ${cookieFlags(0).join("; ")}`,
    `${config.refreshCookieName}=; ${cookieFlags(0).join("; ")}`,
    `${config.csrfCookieName}=; Path=/; SameSite=Lax${config.nodeEnv === "production" ? "; Secure" : ""}; Max-Age=0`
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
