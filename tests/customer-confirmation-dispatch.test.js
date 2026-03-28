import test from "node:test";
import assert from "node:assert/strict";

import { dispatchCustomerConfirmationNotification } from "../src/notifications/customer-confirmation-dispatch.js";

const baseRuntimeConfig = {
  customerNotificationPrimary: "KAKAO_ALIMTALK",
  customerNotificationFallback: "SMS",
  kakaoBizMessageProvider: "SOLAPI",
  smsProvider: "SOLAPI",
  solapiApiKey: "key",
  solapiApiSecret: "secret",
  solapiSenderNumber: "029302266",
  solapiKakaoPfId: "KA01PF00000000000000000000000000",
  solapiKakaoTemplateId: "KA01TP00000000000000000000000000"
};

const baseJobCase = {
  customer_label: "김고객",
  site_label: "잠실 리모델링 현장",
  customer_phone_number: "010-2222-3333"
};

const baseLink = {
  id: "ccl_test",
  expiresAt: "2026-03-30T10:00:00.000Z"
};

test("dispatch falls back to manual when customer phone number is missing", async () => {
  const delivery = await dispatchCustomerConfirmationNotification({
    runtimeConfig: baseRuntimeConfig,
    jobCase: { ...baseJobCase, customer_phone_number: "" },
    link: baseLink,
    confirmationUrl: "https://damit.kr/confirm/test"
  });

  assert.equal(delivery.status, "MANUAL_REQUIRED_NO_PHONE");
  assert.equal(delivery.manualRequired, true);
});

test("dispatch returns config-required when provider readiness is incomplete", async () => {
  const delivery = await dispatchCustomerConfirmationNotification({
    runtimeConfig: {
      ...baseRuntimeConfig,
      solapiApiKey: "",
      solapiApiSecret: "",
      solapiSenderNumber: ""
    },
    jobCase: baseJobCase,
    link: baseLink,
    confirmationUrl: "https://damit.kr/confirm/test"
  });

  assert.equal(delivery.status, "MANUAL_REQUIRED_CONFIG");
  assert.equal(delivery.manualRequired, true);
});

test("dispatch sends kakao first when provider succeeds", async () => {
  const calls = [];
  const messageService = {
    async send(payload) {
      calls.push(payload);
      return { messageId: "msg_kakao_1" };
    }
  };

  const delivery = await dispatchCustomerConfirmationNotification({
    runtimeConfig: baseRuntimeConfig,
    jobCase: baseJobCase,
    link: baseLink,
    confirmationUrl: "https://damit.kr/confirm/test",
    confirmedAmount: 480000,
    messageService
  });

  assert.equal(delivery.status, "AUTO_DELIVERED");
  assert.equal(delivery.channel, "KAKAO_ALIMTALK");
  assert.equal(delivery.messageId, "msg_kakao_1");
  assert.equal(calls.length, 1);
  assert.ok(calls[0].kakaoOptions);
});

test("dispatch falls back to sms when kakao send fails", async () => {
  let callCount = 0;
  const messageService = {
    async send(payload) {
      callCount += 1;
      if (callCount === 1) {
        const error = new Error("kakao send failed");
        error.code = "KAKAO_FAILED";
        throw error;
      }
      return { messageId: "msg_sms_1" };
    }
  };

  const delivery = await dispatchCustomerConfirmationNotification({
    runtimeConfig: baseRuntimeConfig,
    jobCase: baseJobCase,
    link: baseLink,
    confirmationUrl: "https://damit.kr/confirm/test",
    messageService
  });

  assert.equal(delivery.status, "AUTO_DELIVERED_FALLBACK_SMS");
  assert.equal(delivery.channel, "SMS");
  assert.equal(callCount, 2);
});
