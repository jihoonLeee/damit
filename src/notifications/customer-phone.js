export function normalizeCustomerPhoneNumber(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) {
    return null;
  }

  if (digits.startsWith("82") && digits.length >= 11 && digits.length <= 12) {
    return `0${digits.slice(2)}`;
  }

  return digits;
}

export function isValidCustomerPhoneNumber(value) {
  const normalized = normalizeCustomerPhoneNumber(value);
  if (!normalized) {
    return false;
  }

  return /^0\d{9,10}$/.test(normalized);
}

export function maskCustomerPhoneNumber(value) {
  const normalized = normalizeCustomerPhoneNumber(value);
  if (!normalized || normalized.length < 7) {
    return "-";
  }

  return `${normalized.slice(0, 3)}-${"*".repeat(Math.max(normalized.length - 7, 3))}-${normalized.slice(-4)}`;
}
