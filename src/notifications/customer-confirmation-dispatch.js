import { createRequire } from "node:module";

import { config } from "../config.js";
import { buildCustomerNotificationProviderState } from "./customer-notification-runtime.js";
import { maskCustomerPhoneNumber, normalizeCustomerPhoneNumber } from "./customer-phone.js";

const require = createRequire(import.meta.url);

function formatConfirmedAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return "미정";
  }
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

function formatExpiry(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function getSolapiMessageServiceClass() {
  const { SolapiMessageService } = require("solapi");
  return SolapiMessageService;
}

function createSolapiMessageService(runtimeConfig = config) {
  const SolapiMessageService = getSolapiMessageServiceClass();
  return new SolapiMessageService(
    runtimeConfig.solapiApiKey,
    runtimeConfig.solapiApiSecret
  );
}

function createBaseDeliveryResult({
  status,
  channel = null,
  provider = null,
  destination = null,
  messageId = null,
  errorCode = null,
  errorMessage = null
} = {}) {
  return {
    status,
    channel,
    provider,
    destination,
    destinationMasked: destination ? maskCustomerPhoneNumber(destination) : null,
    messageId,
    errorCode,
    errorMessage,
    manualRequired: status !== "AUTO_DELIVERED" && status !== "AUTO_DELIVERED_FALLBACK_SMS"
  };
}

function extractProviderMessageId(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value.messageId
    || value.groupId
    || value.id
    || value.messages?.[0]?.messageId
    || value.messages?.[0]?.id
    || null;
}

function buildSmsText({ jobCase, confirmationUrl, link, confirmedAmount }) {
  return [
    `[다밋] ${jobCase.customer_label || "고객 확인"} 링크를 보내드립니다.`,
    `${jobCase.site_label || "현장"} 변경 내용을 확인해 주세요.`,
    `확정 금액: ${formatConfirmedAmount(confirmedAmount)}`,
    `확인 링크: ${confirmationUrl}`,
    `만료: ${formatExpiry(link.expiresAt || link.expires_at)}`
  ].join("\n");
}

function buildKakaoVariables({ jobCase, confirmationUrl, link, confirmedAmount }) {
  return {
    "#{서비스명}": "다밋",
    "#{고객명}": String(jobCase.customer_label || ""),
    "#{현장명}": String(jobCase.site_label || ""),
    "#{확인링크}": String(confirmationUrl || ""),
    "#{만료시각}": formatExpiry(link.expiresAt || link.expires_at),
    "#{확정금액}": formatConfirmedAmount(confirmedAmount)
  };
}

async function sendKakaoWithSolapi({ runtimeConfig, destination, confirmationUrl, link, jobCase, confirmedAmount, messageService }) {
  const service = messageService || createSolapiMessageService(runtimeConfig);
  const result = await service.send({
    to: destination,
    from: runtimeConfig.solapiSenderNumber,
    kakaoOptions: {
      pfId: runtimeConfig.solapiKakaoPfId,
      templateId: runtimeConfig.solapiKakaoTemplateId,
      variables: buildKakaoVariables({ jobCase, confirmationUrl, link, confirmedAmount })
    }
  });

  return createBaseDeliveryResult({
    status: "AUTO_DELIVERED",
    channel: "KAKAO_ALIMTALK",
    provider: "SOLAPI",
    destination,
    messageId: extractProviderMessageId(result)
  });
}

async function sendSmsWithSolapi({ runtimeConfig, destination, confirmationUrl, link, jobCase, confirmedAmount, messageService, fallback = false }) {
  const service = messageService || createSolapiMessageService(runtimeConfig);
  const result = await service.send({
    to: destination,
    from: runtimeConfig.solapiSenderNumber,
    text: buildSmsText({ jobCase, confirmationUrl, link, confirmedAmount })
  });

  return createBaseDeliveryResult({
    status: fallback ? "AUTO_DELIVERED_FALLBACK_SMS" : "AUTO_DELIVERED",
    channel: "SMS",
    provider: "SOLAPI",
    destination,
    messageId: extractProviderMessageId(result)
  });
}

export async function dispatchCustomerConfirmationNotification({
  runtimeConfig = config,
  jobCase,
  link,
  confirmationUrl,
  confirmedAmount = null,
  messageService = null
} = {}) {
  const destination = normalizeCustomerPhoneNumber(jobCase?.customer_phone_number || jobCase?.customerPhoneNumber);
  if (!destination) {
    return createBaseDeliveryResult({
      status: "MANUAL_REQUIRED_NO_PHONE",
      errorCode: "PHONE_REQUIRED",
      errorMessage: "고객 휴대폰 번호가 없어 자동 전달을 건너뛰었습니다."
    });
  }

  const providerState = buildCustomerNotificationProviderState(runtimeConfig);
  const primaryChannel = String(runtimeConfig.customerNotificationPrimary || "MANUAL_COPY").trim().toUpperCase();
  const fallbackChannel = String(runtimeConfig.customerNotificationFallback || "").trim().toUpperCase();

  if (primaryChannel === "KAKAO_ALIMTALK" && providerState.kakaoConfigured) {
    try {
      return await sendKakaoWithSolapi({
        runtimeConfig,
        destination,
        confirmationUrl,
        link,
        jobCase,
        confirmedAmount,
        messageService
      });
    } catch (error) {
      if (fallbackChannel === "SMS" && providerState.smsConfigured) {
        try {
          return await sendSmsWithSolapi({
            runtimeConfig,
            destination,
            confirmationUrl,
            link,
            jobCase,
            confirmedAmount,
            messageService,
            fallback: true
          });
        } catch (fallbackError) {
          return createBaseDeliveryResult({
            status: "AUTO_DELIVERY_FAILED",
            channel: "SMS",
            provider: "SOLAPI",
            destination,
            errorCode: fallbackError?.code || fallbackError?.errorCode || "SMS_FALLBACK_FAILED",
            errorMessage: fallbackError?.message || "문자 fallback 발송에 실패했습니다."
          });
        }
      }

      return createBaseDeliveryResult({
        status: "AUTO_DELIVERY_FAILED",
        channel: "KAKAO_ALIMTALK",
        provider: "SOLAPI",
        destination,
        errorCode: error?.code || error?.errorCode || "KAKAO_DELIVERY_FAILED",
        errorMessage: error?.message || "카카오 알림톡 발송에 실패했습니다."
      });
    }
  }

  if (primaryChannel === "SMS" && providerState.smsConfigured) {
    try {
      return await sendSmsWithSolapi({
        runtimeConfig,
        destination,
        confirmationUrl,
        link,
        jobCase,
        confirmedAmount,
        messageService
      });
    } catch (error) {
      return createBaseDeliveryResult({
        status: "AUTO_DELIVERY_FAILED",
        channel: "SMS",
        provider: "SOLAPI",
        destination,
        errorCode: error?.code || error?.errorCode || "SMS_DELIVERY_FAILED",
        errorMessage: error?.message || "문자 발송에 실패했습니다."
      });
    }
  }

  return createBaseDeliveryResult({
    status: "MANUAL_REQUIRED_CONFIG",
    destination,
    errorCode: "PROVIDER_CONFIG_REQUIRED",
    errorMessage: "자동 전달 provider 설정이 없어 수동 전달로 남깁니다."
  });
}
