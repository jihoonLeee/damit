export function isAutomaticCustomerNotificationStatus(status) {
  return status === "AUTO_DELIVERED" || status === "AUTO_DELIVERED_FALLBACK_SMS";
}

export function assertCustomerNotificationSmokeResult(delivery, { requireAuto = true } = {}) {
  const status = String(delivery?.status || "").trim();
  if (!status) {
    throw new Error("Customer notification smoke did not receive a delivery status.");
  }

  if (requireAuto && !isAutomaticCustomerNotificationStatus(status)) {
    throw new Error(`Expected automatic customer delivery on preview, but got ${status}.`);
  }

  return true;
}

