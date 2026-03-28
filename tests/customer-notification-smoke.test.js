import test from "node:test";
import assert from "node:assert/strict";

import {
  assertCustomerNotificationSmokeResult,
  isAutomaticCustomerNotificationStatus
} from "../src/qa/customer-notification-smoke.js";

test("automatic customer notification statuses are recognized", () => {
  assert.equal(isAutomaticCustomerNotificationStatus("AUTO_DELIVERED"), true);
  assert.equal(isAutomaticCustomerNotificationStatus("AUTO_DELIVERED_FALLBACK_SMS"), true);
  assert.equal(isAutomaticCustomerNotificationStatus("MANUAL_REQUIRED_CONFIG"), false);
});

test("smoke assertion rejects non-automatic delivery when required", () => {
  assert.throws(
    () => assertCustomerNotificationSmokeResult({ status: "MANUAL_REQUIRED_CONFIG" }, { requireAuto: true }),
    /Expected automatic customer delivery/
  );
});

test("smoke assertion allows non-automatic delivery when auto is optional", () => {
  assert.equal(
    assertCustomerNotificationSmokeResult({ status: "MANUAL_REQUIRED_CONFIG" }, { requireAuto: false }),
    true
  );
});

