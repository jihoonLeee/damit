import assert from "node:assert/strict";
import test from "node:test";

import {
  assertPreviewQaBootstrapAllowed,
  mergeSetCookieHeaders,
  setCookieHeadersToPlaywrightCookies
} from "../src/qa/preview-session-bootstrap.js";

test("preview bootstrap guard accepts preview postgres posture", () => {
  const result = assertPreviewQaBootstrapAllowed({
    appBaseUrl: "https://preview.damit.kr",
    storageEngine: "POSTGRES",
    authDebugLinks: "false"
  });

  assert.equal(result.hostname, "preview.damit.kr");
  assert.equal(result.secure, true);
});

test("preview bootstrap guard rejects non-preview hosts", () => {
  assert.throws(() => assertPreviewQaBootstrapAllowed({
    appBaseUrl: "https://damit.kr",
    storageEngine: "POSTGRES",
    authDebugLinks: "false"
  }), /preview\.\* hosts/i);
});

test("preview bootstrap guard rejects debug-link posture", () => {
  assert.throws(() => assertPreviewQaBootstrapAllowed({
    appBaseUrl: "https://preview.damit.kr",
    storageEngine: "POSTGRES",
    authDebugLinks: "true"
  }), /AUTH_DEBUG_LINKS=false/i);
});

test("cookie helpers produce browser-usable values", () => {
  const setCookieHeaders = [
    "faa_session=session123; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=3600",
    "faa_refresh=refresh123; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=3600",
    "faa_csrf=csrf123; Path=/; SameSite=Strict; Secure; Max-Age=3600"
  ];

  const cookieHeader = mergeSetCookieHeaders(setCookieHeaders);
  assert.equal(cookieHeader, "faa_session=session123; faa_refresh=refresh123; faa_csrf=csrf123");

  const cookies = setCookieHeadersToPlaywrightCookies(setCookieHeaders, "https://preview.damit.kr");
  assert.equal(cookies.length, 3);
  assert.equal(cookies[0].domain, "preview.damit.kr");
  assert.equal(cookies[0].sameSite, "Strict");
  assert.equal(cookies[0].httpOnly, true);
});
