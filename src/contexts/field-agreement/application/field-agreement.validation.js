import { HttpError } from "../../../http.js";
import { AGREEMENT_CHANNELS, AGREEMENT_STATUSES, LIST_STATUSES, PRIMARY_REASONS, SECONDARY_REASONS } from "../domain/field-agreement.domain.js";
import { isValidCustomerPhoneNumber, normalizeCustomerPhoneNumber } from "../../../notifications/customer-phone.js";

export function validateFieldRecordInput(fields, files) {
  if (!files || files.length === 0) {
    throw new HttpError(422, "PHOTO_REQUIRED", "사진을 1장 이상 업로드해 주세요.", {
      photos: "REQUIRED"
    });
  }

  if (!PRIMARY_REASONS.includes(fields.primaryReason)) {
    throw new HttpError(422, "PRIMARY_REASON_REQUIRED", "1차 사유를 선택해 주세요.", {
      primaryReason: "REQUIRED"
    });
  }

  if (!fields.secondaryReason && !fields.note?.trim()) {
    throw new HttpError(422, "SECONDARY_REASON_OR_NOTE_REQUIRED", "2차 상세 사유 또는 메모를 입력해 주세요.", {
      secondaryReason: "REQUIRED",
      note: "REQUIRED"
    });
  }

  if (fields.secondaryReason && !SECONDARY_REASONS.includes(fields.secondaryReason)) {
    throw new HttpError(422, "VALIDATION_ERROR", "상태 필터 값이 올바르지 않습니다.", {
      secondaryReason: "INVALID"
    });
  }

  if (fields.note && fields.note.length > 500) {
    throw new HttpError(422, "VALIDATION_ERROR", "메모는 500자 이하로 입력해 주세요.", {
      note: "TOO_LONG"
    });
  }
}

export function validateJobCasePayload(payload) {
  if (!payload.customerLabel || String(payload.customerLabel).trim().length > 80) {
    throw new HttpError(422, "VALIDATION_ERROR", "고객 표시 이름을 다시 확인해 주세요.", {
      customerLabel: "INVALID"
    });
  }

  if (!payload.siteLabel || String(payload.siteLabel).trim().length > 120) {
    throw new HttpError(422, "VALIDATION_ERROR", "현장 위치 이름을 다시 확인해 주세요.", {
      siteLabel: "INVALID"
    });
  }

  const amount = Number(payload.originalQuoteAmount);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "원래 견적 금액을 다시 확인해 주세요.", {
      originalQuoteAmount: "INVALID"
    });
  }

  const normalizedPhone = normalizeCustomerPhoneNumber(payload.customerPhoneNumber);
  if (payload.customerPhoneNumber != null && String(payload.customerPhoneNumber).trim() !== "" && !isValidCustomerPhoneNumber(normalizedPhone)) {
    throw new HttpError(422, "VALIDATION_ERROR", "고객 휴대폰 번호를 다시 확인해 주세요.", {
      customerPhoneNumber: "INVALID"
    });
  }
}

export function validateQuotePayload(payload) {
  const amount = Number(payload.revisedQuoteAmount);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "변경 견적 금액을 다시 확인해 주세요.", {
      revisedQuoteAmount: "INVALID"
    });
  }
}

export function validateListStatus(status) {
  if (!LIST_STATUSES.includes(status)) {
    throw new HttpError(400, "INVALID_STATUS_FILTER", "상태 필터 값이 올바르지 않습니다.", {
      status: "INVALID"
    });
  }
}

export function validateAgreementPayload(payload) {
  if (!AGREEMENT_STATUSES.includes(payload.status)) {
    throw new HttpError(422, "AGREEMENT_STATUS_REQUIRED", "합의 상태를 선택해 주세요.", {
      status: "REQUIRED"
    });
  }

  if (!AGREEMENT_CHANNELS.includes(payload.confirmationChannel)) {
    throw new HttpError(422, "AGREEMENT_CHANNEL_REQUIRED", "확인 채널을 선택해 주세요.", {
      confirmationChannel: "REQUIRED"
    });
  }

  if (payload.status === "AGREED") {
    const amount = Number(payload.confirmedAmount);
    if (!Number.isInteger(amount) || amount < 0) {
      throw new HttpError(422, "AGREEMENT_AMOUNT_REQUIRED", "확인 채널을 선택해 주세요.", {
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
    throw new HttpError(422, "CUSTOMER_CONFIRMATION_EXPIRY_INVALID", "확인 링크 만료 시간은 1시간 이상 168시간 이하여야 합니다.", {
      expiresInHours: "INVALID"
    });
  }
}

export function validateCustomerConfirmationAcknowledgement(payload) {
  const note = String(payload?.confirmationNote || "").trim();
  if (note.length > 300) {
    throw new HttpError(422, "CUSTOMER_CONFIRMATION_NOTE_TOO_LONG", "고객 확인 메모는 300자 이하로 입력해 주세요.", {
      confirmationNote: "TOO_LONG"
    });
  }
}
