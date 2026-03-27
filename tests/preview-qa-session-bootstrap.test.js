import test from "node:test";
import assert from "node:assert/strict";

import {
  assertPreviewQaBootstrapAllowed,
  mergeSetCookieHeaders,
  setCookieHeadersToPlaywrightCookies
} from "../src/qa/preview-session-bootstrap.js";

test("preview QA bootstrap only allows preview postgres hosts", () => {
  const result = assertPreviewQaBootstrapAllowed({
    appBaseUrl: "https://preview.damit.kr",
    storageEngine: "POSTGRES",
    authDebugLinks: "false"
  });

  assert.equal(result.origin, "https://preview.damit.kr");
  assert.equal(result.hostname, "preview.damit.kr");
  assert.equal(result.secure, true);

  assert.throws(() => assertPreviewQaBootstrapAllowed({
    appBaseUrl: "https://damit.kr",
    storageEngine: "POSTGRES",
    authDebugLinks: "false"
  }), /preview\.\* hosts/);

  assert.throws(() => assertPreviewQaBootstrapAllowed({
    appBaseUrl: "https://preview.damit.kr",
    storageEngine: "SQLITE",
    authDebugLinks: "false"
  }), /POSTGRES runtime intent/);

  assert.throws(() => assertPreviewQaBootstrapAllowed({
    appBaseUrl: "https://preview.damit.kr",
    storageEngine: "POSTGRES",
    authDebugLinks: "true"
  }), /AUTH_DEBUG_LINKS=false/);
});

test("mergeSetCookieHeaders produces a browser cookie header", () => {
  const cookieHeader = mergeSetCookieHeaders([
    "faa_session=session_123; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=100",
    "faa_refresh=refresh_456; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=200",
    "faa_csrf=csrf_789; Path=/; SameSite=Strict; Secure; Max-Age=300"
  ]);

  assert.equal(cookieHeader, "faa_session=session_123; faa_refresh=refresh_456; faa_csrf=csrf_789");
});

test("setCookieHeadersToPlaywrightCookies converts set-cookie lines for preview host", () => {
  const cookies = setCookieHeadersToPlaywrightCookies([
    "faa_session=session_123; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=100",
    "faa_csrf=csrf_789; Path=/; SameSite=Lax; Secure; Max-Age=300"
  ], "https://preview.damit.kr");

  assert.equal(cookies.length, 2);
  assert.deepEqual(cookies[0], {
    name: "faa_session",
    value: "session_123",
    domain: "preview.damit.kr",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Strict"
  });
  assert.deepEqual(cookies[1], {
    name: "faa_csrf",
    value: "csrf_789",
    domain: "preview.damit.kr",
    path: "/",
    httpOnly: false,
    secure: true,
    sameSite: "Lax"
  });
});
