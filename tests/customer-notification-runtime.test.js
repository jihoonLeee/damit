import test from "node:test";
import assert from "node:assert/strict";

import { buildCustomerNotificationRuntime } from "../src/notifications/customer-notification-runtime.js";

test("customer notification runtime defaults to kakao-first readiness warning without provider config", () => {
  const runtime = buildCustomerNotificationRuntime({
    customerNotificationPrimary: "KAKAO_ALIMTALK",
    customerNotificationFallback: "SMS",
    kakaoBizMessageProvider: "",
    smsProvider: ""
  });

  assert.equal(runtime.customerNotificationPrimary, "KAKAO_ALIMTALK");
  assert.equal(runtime.customerNotificationFallback, "SMS");
  assert.equal(runtime.kakaoConfigured, false);
  assert.equal(runtime.smsConfigured, false);
  assert.equal(runtime.customerNotificationOperationalReadiness, "KAKAO_CONFIG_REQUIRED");
});

test("customer notification runtime becomes ready when primary and fallback providers are configured", () => {
  const runtime = buildCustomerNotificationRuntime({
    customerNotificationPrimary: "KAKAO_ALIMTALK",
    customerNotificationFallback: "SMS",
    kakaoBizMessageProvider: "solapi-bizmessage",
    smsProvider: "solapi-sms"
  });

  assert.equal(runtime.kakaoConfigured, true);
  assert.equal(runtime.smsConfigured, true);
  assert.equal(runtime.customerNotificationOperationalReadiness, "READY");
});

test("customer notification runtime stays manual when manual copy is selected", () => {
  const runtime = buildCustomerNotificationRuntime({
    customerNotificationPrimary: "MANUAL_COPY",
    customerNotificationFallback: "",
    kakaoBizMessageProvider: "",
    smsProvider: ""
  });

  assert.equal(runtime.customerNotificationPrimary, "MANUAL_COPY");
  assert.equal(runtime.customerNotificationFallback, null);
  assert.equal(runtime.customerNotificationOperationalReadiness, "MANUAL_ONLY");
});
