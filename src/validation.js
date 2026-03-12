import { config } from "./config.js";
import { HttpError } from "./http.js";
import { AGREEMENT_CHANNELS, AGREEMENT_STATUSES, LIST_STATUSES, PRIMARY_REASONS, SECONDARY_REASONS } from "./domain.js";

export function assertAuthenticated(request) {
  const authorization = request.headers.authorization || "";
  if (!authorization) {
    throw new HttpError(401, "UNAUTHORIZED", "다시 로그인해주세요");
  }
  if (authorization !== `Bearer ${config.ownerToken}`) {
    throw new HttpError(403, "FORBIDDEN", "이 작업은 수행할 수 없어요");
  }

  return config.ownerId;
}

export function validateFieldRecordInput(fields, files) {
  if (!files || files.length === 0) {
    throw new HttpError(422, "PHOTO_REQUIRED", "사진을 1장 이상 올려주세요", {
      photos: "REQUIRED"
    });
  }

  if (!PRIMARY_REASONS.includes(fields.primaryReason)) {
    throw new HttpError(422, "PRIMARY_REASON_REQUIRED", "1차 사유를 선택해주세요", {
      primaryReason: "REQUIRED"
    });
  }

  if (!fields.secondaryReason && !fields.note?.trim()) {
    throw new HttpError(422, "SECONDARY_REASON_OR_NOTE_REQUIRED", "상세 사유를 고르거나 메모를 남겨주세요", {
      secondaryReason: "REQUIRED",
      note: "REQUIRED"
    });
  }

  if (fields.secondaryReason && !SECONDARY_REASONS.includes(fields.secondaryReason)) {
    throw new HttpError(422, "VALIDATION_ERROR", "올바르지 않은 상세 사유예요", {
      secondaryReason: "INVALID"
    });
  }

  if (fields.note && fields.note.length > 500) {
    throw new HttpError(422, "VALIDATION_ERROR", "메모는 500자 이내로 입력해주세요", {
      note: "TOO_LONG"
    });
  }
}

export function validateJobCasePayload(payload) {
  if (!payload.customerLabel || String(payload.customerLabel).trim().length > 80) {
    throw new HttpError(422, "VALIDATION_ERROR", "고객명 또는 현장명을 입력해주세요", {
      customerLabel: "INVALID"
    });
  }

  if (!payload.siteLabel || String(payload.siteLabel).trim().length > 120) {
    throw new HttpError(422, "VALIDATION_ERROR", "주소 또는 현장명을 입력해주세요", {
      siteLabel: "INVALID"
    });
  }

  const amount = Number(payload.originalQuoteAmount);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "원래 견적 금액을 입력해주세요", {
      originalQuoteAmount: "INVALID"
    });
  }
}

export function validateQuotePayload(payload) {
  const amount = Number(payload.revisedQuoteAmount);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "변경 후 금액을 입력해주세요", {
      revisedQuoteAmount: "INVALID"
    });
  }
}

export function validateListStatus(status) {
  if (!LIST_STATUSES.includes(status)) {
    throw new HttpError(400, "INVALID_STATUS_FILTER", "올바르지 않은 상태 필터예요", {
      status: "INVALID"
    });
  }
}

export function validateAgreementPayload(payload) {
  if (!AGREEMENT_STATUSES.includes(payload.status)) {
    throw new HttpError(422, "AGREEMENT_STATUS_REQUIRED", "상태를 선택해주세요", {
      status: "REQUIRED"
    });
  }

  if (!AGREEMENT_CHANNELS.includes(payload.confirmationChannel)) {
    throw new HttpError(422, "AGREEMENT_CHANNEL_REQUIRED", "확인 채널을 선택해주세요", {
      confirmationChannel: "REQUIRED"
    });
  }

  if (payload.status === "AGREED") {
    const amount = Number(payload.confirmedAmount);
    if (!Number.isInteger(amount) || amount < 0) {
      throw new HttpError(422, "AGREEMENT_AMOUNT_REQUIRED", "확정 금액을 입력해주세요", {
        confirmedAmount: "REQUIRED"
      });
    }
  }
}

export function validateCustomerConfirmationLinkPayload(payload) {
  if (payload?.expiresInHours == null || payload.expiresInHours === "") {
    return;
  }

  const amount = Number(payload.expiresInHours);
  if (!Number.isInteger(amount) || amount < 1 || amount > 168) {
    throw new HttpError(422, "CUSTOMER_CONFIRMATION_EXPIRY_INVALID", "링크 만료 시간은 1시간에서 168시간 사이여야 해요", {
      expiresInHours: "INVALID"
    });
  }
}

export function validateCustomerConfirmationAcknowledgement(payload) {
  const note = String(payload?.confirmationNote || "").trim();
  if (note.length > 300) {
    throw new HttpError(422, "CUSTOMER_CONFIRMATION_NOTE_TOO_LONG", "확인 메모는 300자 이내로 입력해주세요", {
      confirmationNote: "TOO_LONG"
    });
  }
}