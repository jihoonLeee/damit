function normalizeChannel(value, fallback = "") {
  return String(value || fallback).trim().toUpperCase();
}

export function formatCustomerNotificationChannelLabel(value) {
  switch (normalizeChannel(value)) {
    case "KAKAO_ALIMTALK":
      return "카카오 알림톡";
    case "SMS":
      return "문자";
    case "MANUAL_COPY":
      return "수동 전달";
    default:
      return "미정";
  }
}

export function buildCustomerNotificationRuntime(runtimeConfig) {
  const primaryChannel = normalizeChannel(runtimeConfig.customerNotificationPrimary, "MANUAL_COPY");
  const fallbackChannel = normalizeChannel(runtimeConfig.customerNotificationFallback);
  const kakaoProvider = String(runtimeConfig.kakaoBizMessageProvider || "").trim();
  const smsProvider = String(runtimeConfig.smsProvider || "").trim();
  const kakaoConfigured = Boolean(kakaoProvider);
  const smsConfigured = Boolean(smsProvider);

  let operationalReadiness = "MANUAL_ONLY";
  if (primaryChannel === "KAKAO_ALIMTALK" && !kakaoConfigured) {
    operationalReadiness = "KAKAO_CONFIG_REQUIRED";
  } else if (fallbackChannel === "SMS" && !smsConfigured) {
    operationalReadiness = "SMS_FALLBACK_CONFIG_REQUIRED";
  } else if (
    (primaryChannel === "KAKAO_ALIMTALK" && kakaoConfigured)
    || (primaryChannel === "SMS" && smsConfigured)
  ) {
    operationalReadiness = "READY";
  }

  return {
    customerNotificationPrimary: primaryChannel,
    customerNotificationPrimaryLabel: formatCustomerNotificationChannelLabel(primaryChannel),
    customerNotificationFallback: fallbackChannel || null,
    customerNotificationFallbackLabel: fallbackChannel ? formatCustomerNotificationChannelLabel(fallbackChannel) : null,
    kakaoBizMessageProvider: kakaoProvider || null,
    kakaoConfigured,
    smsProvider: smsProvider || null,
    smsConfigured,
    customerNotificationOperationalReadiness: operationalReadiness
  };
}
