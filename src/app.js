import crypto from "node:crypto";

import { config } from "./config.js";
import {
  buildDraftMessage,
  buildScopeComparison,
  deriveJobCaseStatus,
  labelSecondary,
  summarizeAgreement,
  toJobCaseListItem
} from "./contexts/field-agreement/domain/field-agreement.domain.js";
import { HttpError, createRequestId, json, jsonNoStore, notFound, readJsonBody, redirect, sendError } from "./http.js";
import { parseMultipart } from "./multipart.js";
import { createId, ensureStorage, nowIso, saveUpload } from "./store.js";
import {
  validateAgreementPayload,
  validateCustomerConfirmationAcknowledgement,
  validateCustomerConfirmationLinkPayload,
  validateFieldRecordInput,
  validateJobCasePayload,
  validateListStatus,
  validateQuotePayload
} from "./contexts/field-agreement/application/field-agreement.validation.js";
import {
  assertCsrf,
  assertTrustedOrigin,
  createAuthCookieHeaders,
  createClearAuthCookieHeaders,
  createCsrfToken,
  getAuthContext,
  refreshSessionFromRequest
} from "./contexts/auth/application/auth-runtime.js";
import { ensureAuthStorage } from "./contexts/auth/infrastructure/sqlite-auth-store.js";
import { ensureCustomerConfirmationStorage } from "./contexts/customer-confirmation/infrastructure/sqlite-customer-confirmation-store.js";
import { sendInvitationEmail, sendMagicLinkEmail } from "./mail-gateway.js";
import { buildCustomerNotificationRuntime } from "./notifications/customer-notification-runtime.js";
import { createRepositoryBundle } from "./repositories/createRepositoryBundle.js";
import { normalizePathname, serveStaticRequest } from "./http/static-routes.js";
import { handleSystemApiRequest } from "./http/system-routes.js";
import { assertActionRateLimit, assertPublicRateLimit } from "./security/public-rate-limit.js";

async function ensureOperationalSchemas(repositories) {
  if (repositories.engine !== "SQLITE") {
    return;
  }

  await ensureAuthStorage();
  await ensureCustomerConfirmationStorage();
}

export function createApp() {
  const repositories = createRepositoryBundle();

  return {
    async handle(request, response) {
      const requestId = createRequestId();

      try {
        await ensureStorage();
        await ensureOperationalSchemas(repositories);
        const pathname = normalizePathname(request.url);
        const canonicalRedirectUrl = resolveCanonicalRedirectUrl(request);

        if (canonicalRedirectUrl) {
          redirect(response, 308, canonicalRedirectUrl);
          return;
        }

        if (pathname.startsWith("/api/v1/")) {
          await handleApiRequest(request, response, repositories);
          return;
        }

        await serveStaticRequest(pathname, response);
      } catch (error) {
        sendError(response, requestId, error, request);
      }
    }
  };
}

function resolveCanonicalRedirectUrl(request) {
  const canonicalBaseUrl = String(config.appBaseUrl || "").trim();
  if (!canonicalBaseUrl) {
    return null;
  }

  let canonicalUrl;
  try {
    canonicalUrl = new URL(canonicalBaseUrl);
  } catch {
    return null;
  }

  const requestHost = String(request.headers.host || "").trim().toLowerCase();
  if (!requestHost) {
    return null;
  }

  const requestHostname = requestHost.split(":")[0];
  const canonicalHostname = canonicalUrl.hostname.toLowerCase();

  if (requestHostname !== `www.${canonicalHostname}`) {
    return null;
  }

  const forwardedProto = String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const protocol = forwardedProto || (requestHostname.includes("localhost") || requestHostname.includes("127.0.0.1") ? "http" : "https");
  const requestUrl = new URL(request.url, `${protocol}://${request.headers.host || canonicalUrl.host}`);
  return `${canonicalUrl.origin}${requestUrl.pathname}${requestUrl.search}`;
}

async function handleApiRequest(request, response, repositories) {
  const url = new URL(request.url, "http://localhost");
  const pathname = url.pathname;

  if (await handleSystemApiRequest(request, response, pathname, repositories)) {
    return;
  }


  const publicConfirmationMatch = pathname.match(/^\/api\/v1\/public\/confirm\/([^/]+)$/);
  if (request.method === "GET" && publicConfirmationMatch) {
    assertPublicRateLimit({
      key: "public-confirm-view",
      identifier: getRequestIp(request),
      limit: config.publicConfirmViewRateLimitCount,
      windowSeconds: config.publicConfirmViewRateLimitWindowSeconds,
      code: "PUBLIC_CONFIRM_VIEW_RATE_LIMITED",
      message: "고객 확인 링크 요청이 너무 많아요. 잠시 후 다시 시도해 주세요."
    });
    const token = decodeURIComponent(publicConfirmationMatch[1]);
    const link = await repositories.customerConfirmationRepository.getViewByToken({
      token,
      requestIp: getRequestIp(request),
      userAgent: getUserAgent(request)
    });
    const payload = await buildPublicCustomerConfirmationPayload(repositories, link);
    jsonNoStore(response, 200, payload);
    return;
  }

  const publicConfirmationAckMatch = pathname.match(/^\/api\/v1\/public\/confirm\/([^/]+)\/acknowledge$/);
  if (request.method === "POST" && publicConfirmationAckMatch) {
    assertTrustedOrigin(request);
    assertPublicRateLimit({
      key: "public-confirm-ack",
      identifier: getRequestIp(request),
      limit: config.publicConfirmAckRateLimitCount,
      windowSeconds: config.publicConfirmAckRateLimitWindowSeconds,
      code: "PUBLIC_CONFIRM_ACK_RATE_LIMITED",
      message: "고객 확인 완료 요청이 너무 많아요. 잠시 후 다시 시도해 주세요."
    });
    const token = decodeURIComponent(publicConfirmationAckMatch[1]);
    const payload = await readJsonBody(request);
    validateCustomerConfirmationAcknowledgement(payload);
    const link = await repositories.customerConfirmationRepository.acknowledge({
      token,
      note: payload.confirmationNote,
      requestIp: getRequestIp(request),
      userAgent: getUserAgent(request)
    });

    await appendCustomerConfirmationTimeline(repositories, link, "CUSTOMER_CONFIRMATION_ACKNOWLEDGED", "\uACE0\uAC1D \uD655\uC778 \uB9C1\uD06C\uC5D0\uC11C \uB0B4\uC6A9 \uD655\uC778 \uC644\uB8CC", {
      confirmationNote: payload.confirmationNote || null,
      confirmedAt: link.confirmedAt
    });

    jsonNoStore(response, 200, {
      ok: true,
      status: link.status,
      confirmedAt: link.confirmedAt,
      confirmationNote: link.confirmationNote
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/v1/auth/challenges") {
    assertTrustedOrigin(request);
    assertPublicRateLimit({
      key: "auth-challenge",
      identifier: getRequestIp(request),
      limit: config.authChallengeIpRateLimitCount,
      windowSeconds: config.authChallengeIpRateLimitWindowSeconds,
      code: "AUTH_CHALLENGE_IP_RATE_LIMITED",
      message: "로그인 링크 요청이 너무 많아요. 잠시 후 다시 시도해 주세요."
    });
    const payload = await readJsonBody(request);
    const email = String(payload.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(422, "AUTH_EMAIL_REQUIRED", "로그인 링크를 받을 이메일 주소가 필요합니다.", {
        email: "INVALID"
      });
    }

    const token = crypto.randomBytes(24).toString("base64url");
    const challenge = await repositories.authRepository.issueChallenge({
      email,
      token,
      requestIp: request.socket.remoteAddress,
      deliveryProvider: "PENDING",
      deliveryStatus: "PENDING"
    });

    try {
      const delivery = await sendMagicLinkEmail({
        request,
        email,
        challengeId: challenge.id,
        token,
        invitationToken: payload.invitationToken
      });

      await repositories.authRepository.updateChallengeDelivery({
        challengeId: challenge.id,
        deliveryProvider: delivery.provider,
        deliveryStatus: delivery.status
      });

      jsonNoStore(response, 201, {
        challengeId: challenge.id,
        retryAfterSeconds: 60,
        delivery: {
          provider: delivery.provider,
          status: delivery.status,
          targetMasked: delivery.targetMasked || null
        },
        ...(delivery.previewPath ? { previewPath: delivery.previewPath } : {}),
        ...(delivery.debugMagicLink ? { debugMagicLink: delivery.debugMagicLink } : {})
      });
      return;
    } catch (error) {
      await repositories.authRepository.updateChallengeDelivery({
        challengeId: challenge.id,
        deliveryProvider: (config.mailProvider || "UNKNOWN").toUpperCase(),
        deliveryStatus: "FAILED"
      });
      throw new HttpError(502, "MAIL_DELIVERY_FAILED", "로그인 메일을 보내지 못했습니다. 메일 설정을 확인한 뒤 다시 시도해 주세요.");
    }
  }

  if (request.method === "POST" && pathname === "/api/v1/auth/verify") {
    assertTrustedOrigin(request);
    assertPublicRateLimit({
      key: "auth-verify",
      identifier: getRequestIp(request),
      limit: config.authVerifyRateLimitCount,
      windowSeconds: config.authVerifyRateLimitWindowSeconds,
      code: "AUTH_VERIFY_RATE_LIMITED",
      message: "로그인 확인 요청이 너무 많아요. 잠시 후 다시 시도해 주세요."
    });
    const payload = await readJsonBody(request);
    if (!payload.challengeId || !payload.token) {
      throw new HttpError(422, "AUTH_VERIFY_INVALID", "\uB85C\uADF8\uC778 \uB9C1\uD06C \uC815\uBCF4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
    }

    const verified = await repositories.authRepository.verifyChallenge({
      challengeId: payload.challengeId,
      token: payload.token,
      displayName: payload.displayName,
      companyName: payload.companyName,
      invitationToken: payload.invitationToken
    });
    const csrfToken = createCsrfToken();

    jsonNoStore(
      response,
      200,
      {
        ok: true,
        user: verified.user,
        company: verified.company,
        companies: verified.companies
      },
      {
        "Set-Cookie": createAuthCookieHeaders({
          sessionId: verified.sessionId,
          refreshToken: verified.refreshToken,
          csrfToken
        })
      }
    );
    return;
  }

  if (request.method === "POST" && pathname === "/api/v1/auth/refresh") {
    assertTrustedOrigin(request);
    assertCsrf(request);
    const refreshed = await refreshSessionFromRequest(request, repositories);
    jsonNoStore(
      response,
      200,
      {
        ok: true,
        user: refreshed.user,
        company: refreshed.company,
        companies: refreshed.companies
      },
      {
        "Set-Cookie": createAuthCookieHeaders({
          sessionId: refreshed.sessionId,
          refreshToken: refreshed.refreshToken,
          csrfToken: createCsrfToken()
        })
      }
    );
    return;
  }

  if (request.method === "POST" && pathname === "/api/v1/auth/logout") {
    assertTrustedOrigin(request);
    assertCsrf(request);
    try {
      const authContext = await getAuthContext(request, repositories);
      if (authContext.sessionId) {
        await repositories.authRepository.revokeSession(authContext.sessionId);
      }
    } catch {
      try {
        await repositories.authRepository.revokeSessionByRefreshToken(extractRefreshToken(request));
      } catch {
        // Ignore invalid session during logout.
      }
    }

    jsonNoStore(response, 200, { ok: true }, { "Set-Cookie": createClearAuthCookieHeaders() });
    return;
  }

  if (request.method === "GET" && pathname === "/api/v1/me") {
    const authContext = await getAuthContext(request, repositories);
    jsonNoStore(response, 200, {
      authenticated: true,
      mode: authContext.mode,
        user: {
          id: authContext.userId,
          displayName: authContext.displayName,
          email: authContext.email || null,
          phoneNumber: authContext.phoneNumber || null
        },
      company: authContext.companyId
        ? {
            id: authContext.companyId,
            name: authContext.companyName,
            role: authContext.role
          }
        : null,
      companies: authContext.companies || []
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/v1/account/overview") {
    const authContext = await requireSessionContext(request, repositories);
    const [membershipItems, invitationItems, sessionItems, recentLoginActivity, recentAccountActivity, settlementSummary] = await Promise.all([
      authContext.companyId
        ? repositories.authRepository.listMembershipsByCompany(authContext.companyId)
        : [],
      authContext.companyId && authContext.role === "OWNER"
        ? repositories.authRepository.listInvitationsByCompany(authContext.companyId)
        : [],
      repositories.authRepository.listSessionsByUser(authContext.userId),
      authContext.email
        ? repositories.authRepository.listRecentChallengesByEmail(authContext.email, 5)
        : [],
      authContext.companyId
        ? repositories.auditLogRepository.listByCompany(authContext.companyId, { limit: 20 })
        : [],
      authContext.companyId && authContext.role === "OWNER"
        ? repositories.authRepository.getSettlementSummaryByCompany(authContext.companyId)
        : null
    ]);
    const scopedAccountActivity = authContext.companyId
      ? recentAccountActivity
        .filter((item) => item.actorUserId === authContext.userId)
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          action: item.action,
          resourceType: item.resourceType,
          resourceId: item.resourceId || null,
          createdAt: item.createdAt
        }))
      : [];

    jsonNoStore(response, 200, {
      user: {
        id: authContext.userId,
        displayName: authContext.displayName,
        email: authContext.email || null,
        phoneNumber: authContext.phoneNumber || null
      },
      company: authContext.companyId
        ? {
            id: authContext.companyId,
            name: authContext.companyName,
            role: authContext.role
          }
        : null,
      companies: authContext.companies || [],
      memberships: membershipItems,
      invitations: invitationItems,
      sessions: sessionItems.map((item) => ({
        ...item,
        isCurrent: item.id === authContext.sessionId,
        isExpired: isPastTimestamp(item.expiresAt),
        isIdleRisk: isSessionIdleRisk(item.lastSeenAt || item.createdAt)
      })),
      recentLoginActivity,
      recentAccountActivity: scopedAccountActivity,
      settlementSummary,
        security: {
          trustedOriginEnforced: config.authEnforceTrustedOrigin,
          debugLinksEnabled: config.authDebugLinks,
          sessionSameSite: config.sessionCookieSameSite,
          csrfSameSite: config.csrfCookieSameSite,
          sessionIdleTimeoutSeconds: config.sessionIdleTimeoutSeconds,
          mailProvider: (config.mailProvider || "FILE").toUpperCase(),
          mailFromConfigured: Boolean(config.mailFrom),
          resendConfigured: Boolean(config.resendApiKey),
          ...buildCustomerNotificationRuntime(config)
        },
      internalAccess: {
        systemAdmin: isSystemAdminEmail(authContext.email)
      }
      });
      return;
    }

    if (request.method === "PATCH" && pathname === "/api/v1/account/profile") {
      assertTrustedOrigin(request);
      assertCsrf(request);
      const authContext = await requireSessionContext(request, repositories);
      const payload = await readJsonBody(request);
      const user = await repositories.authRepository.updateUserProfile({
        userId: authContext.userId,
        displayName: payload.displayName,
        phoneNumber: payload.phoneNumber
      });

      if (authContext.companyId) {
        await repositories.auditLogRepository.append({
          companyId: authContext.companyId,
          actorUserId: authContext.userId,
          actorType: "USER",
          action: "ACCOUNT_PROFILE_UPDATED",
          resourceType: "USER",
          resourceId: authContext.userId,
          requestId: null,
          payloadJson: {
            displayName: user.displayName,
            phoneNumber: user.phoneNumber
          },
          createdAt: nowIso()
        });
      }

      jsonNoStore(response, 200, { user });
      return;
    }

    const accountSessionMatch = pathname.match(/^\/api\/v1\/account\/sessions\/([^/]+)\/revoke$/);
    if (request.method === "POST" && accountSessionMatch) {
      assertTrustedOrigin(request);
      assertCsrf(request);
      const authContext = await requireSessionContext(request, repositories);
      const sessionId = accountSessionMatch[1];

      if (sessionId === authContext.sessionId) {
        throw new HttpError(409, "AUTH_SESSION_CURRENT_REVOKE_NOT_ALLOWED", "현재 세션은 여기서 종료하지 않습니다. 로그아웃 버튼을 사용해 주세요.");
      }

      const session = await repositories.authRepository.revokeOwnedSession({
        userId: authContext.userId,
        sessionId
      });

      if (authContext.companyId) {
        await repositories.auditLogRepository.append({
          companyId: authContext.companyId,
          actorUserId: authContext.userId,
          actorType: "USER",
          action: "ACCOUNT_SESSION_REVOKED",
          resourceType: "SESSION",
          resourceId: session.id,
          requestId: null,
          payloadJson: {
            revokedAt: session.revokedAt
          },
          createdAt: nowIso()
        });
      }

      jsonNoStore(response, 200, { session });
      return;
    }

    if (request.method === "GET" && pathname === "/api/v1/companies") {
    const authContext = await requireSessionContext(request, repositories);
    json(response, 200, {
      items: authContext.companies || [],
      activeCompanyId: authContext.companyId
    });
    return;
  }

  const switchMatch = pathname.match(/^\/api\/v1\/companies\/([^/]+)\/switch-context$/);
  if (request.method === "POST" && switchMatch) {
    assertTrustedOrigin(request);
    assertCsrf(request);
    const authContext = await requireSessionContext(request, repositories);
    const result = await repositories.authRepository.switchSessionCompany({
      sessionId: authContext.sessionId,
      userId: authContext.userId,
      companyId: switchMatch[1]
    });
    jsonNoStore(response, 200, result);
    return;
  }

  const membershipsMatch = pathname.match(/^\/api\/v1\/companies\/([^/]+)\/memberships$/);
  if (request.method === "GET" && membershipsMatch) {
    const companyId = membershipsMatch[1];
    const authContext = await requireSessionContext(request, repositories);
    assertActiveCompanyMatch(authContext, companyId);
    const items = await repositories.authRepository.listMembershipsByCompany(companyId);
    jsonNoStore(response, 200, { items });
    return;
  }

  const invitationsMatch = pathname.match(/^\/api\/v1\/companies\/([^/]+)\/invitations$/);
  const invitationActionMatch = pathname.match(/^\/api\/v1\/companies\/([^/]+)\/invitations\/([^/]+)\/(reissue|revoke)$/);
  if (invitationsMatch && request.method === "GET") {
    const companyId = invitationsMatch[1];
    const authContext = await requireSessionContext(request, repositories);
    assertActiveCompanyMatch(authContext, companyId);
    assertRole(authContext, ["OWNER"]);
    const items = await repositories.authRepository.listInvitationsByCompany(companyId);
    jsonNoStore(response, 200, { items });
    return;
    }

    if (invitationActionMatch && request.method === "POST") {
      assertTrustedOrigin(request);
      assertCsrf(request);
      const companyId = invitationActionMatch[1];
      const invitationId = invitationActionMatch[2];
      const action = invitationActionMatch[3];
      const authContext = await requireSessionContext(request, repositories);
      assertActiveCompanyMatch(authContext, companyId);
      assertRole(authContext, ["OWNER"]);

      if (action === "reissue") {
        assertActionRateLimit({
          key: "company-invitation-reissue",
          identifier: `${companyId}:${authContext.userId}`,
          limit: config.invitationReissueRateLimitCount,
          windowSeconds: config.invitationReissueRateLimitWindowSeconds,
          code: "INVITATION_REISSUE_RATE_LIMITED",
          message: "팀 초대 재전송 요청이 너무 많아요. 잠시 후 다시 시도해 주세요."
        });
        const invitation = await repositories.authRepository.reissueInvitation({
          companyId,
          invitationId,
          invitedByUserId: authContext.userId
        });
        const delivery = await sendInvitationEmail({
          request,
          email: invitation.email,
          role: invitation.role,
          companyName: invitation.companyName,
          invitationToken: invitation.invitationToken
        });
        await repositories.auditLogRepository.append({
          companyId,
          actorUserId: authContext.userId,
          actorType: "USER",
          action: "COMPANY_INVITATION_REISSUED",
          resourceType: "INVITATION",
          resourceId: invitation.id,
          requestId: null,
          payloadJson: {
            email: invitation.email,
            role: invitation.role
          },
          createdAt: nowIso()
        });
        jsonNoStore(response, 200, {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          delivery: {
            provider: delivery.provider,
            status: delivery.status,
            targetMasked: delivery.targetMasked || null
          },
          ...(delivery.previewPath ? { previewPath: delivery.previewPath } : {}),
          ...(delivery.debugInvitationLink ? { debugInvitationLink: delivery.debugInvitationLink } : {})
        });
        return;
      }

      const invitation = await repositories.authRepository.revokeInvitation({
        companyId,
        invitationId
      });
      await repositories.auditLogRepository.append({
        companyId,
        actorUserId: authContext.userId,
        actorType: "USER",
        action: "COMPANY_INVITATION_REVOKED",
        resourceType: "INVITATION",
        resourceId: invitation.id,
        requestId: null,
        payloadJson: {
          email: invitation.email,
          role: invitation.role,
          status: invitation.status
        },
        createdAt: nowIso()
      });
      jsonNoStore(response, 200, { item: invitation });
      return;
    }

    if (invitationsMatch && request.method === "POST") {
      assertTrustedOrigin(request);
      assertCsrf(request);
      const companyId = invitationsMatch[1];
      const authContext = await requireSessionContext(request, repositories);
      assertActiveCompanyMatch(authContext, companyId);
      assertRole(authContext, ["OWNER"]);
      assertActionRateLimit({
        key: "company-invitation-create",
        identifier: `${companyId}:${authContext.userId}`,
        limit: config.invitationCreateRateLimitCount,
        windowSeconds: config.invitationCreateRateLimitWindowSeconds,
        code: "INVITATION_CREATE_RATE_LIMITED",
        message: "팀 초대 요청이 너무 많아요. 잠시 후 다시 시도해 주세요."
      });
      const payload = await readJsonBody(request);
      const invitation = await repositories.authRepository.createInvitation({
        companyId,
        email: payload.email,
        role: payload.role,
        invitedByUserId: authContext.userId
      });
      const delivery = await sendInvitationEmail({
        request,
        email: invitation.email,
        role: invitation.role,
        companyName: invitation.companyName,
        invitationToken: invitation.invitationToken
      });
      jsonNoStore(response, 201, {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        delivery: {
          provider: delivery.provider,
          status: delivery.status,
          targetMasked: delivery.targetMasked || null
        },
        ...(delivery.previewPath ? { previewPath: delivery.previewPath } : {}),
        ...(delivery.debugInvitationLink ? { debugInvitationLink: delivery.debugInvitationLink } : {})
      });
      return;
    }

  if (request.method === "POST" && pathname === "/api/v1/field-records") {
    const businessContext = await requireBusinessContext(request, repositories, { write: true });
    const form = await parseMultipart(request);
    validateFieldRecordInput(form.fields, form.files);

    const fieldRecordId = createId("fr");
    const createdAt = nowIso();
    const fieldRecord = {
      id: fieldRecordId,
      owner_id: businessContext.ownerId || businessContext.userId,
      company_id: businessContext.companyId,
      created_by_user_id: businessContext.userId,
      job_case_id: null,
      primary_reason: form.fields.primaryReason,
      secondary_reason: form.fields.secondaryReason || null,
      note: form.fields.note?.trim() || null,
      status: "UNLINKED",
      created_at: createdAt
    };

    const photos = [];
    for (const [index, file] of form.files.entries()) {
      const upload = await saveUpload(file, {
        fieldRecordId,
        companyId: businessContext.companyId,
        ownerId: businessContext.ownerId || businessContext.userId
      });
      photos.push({
        id: upload.id,
        field_record_id: fieldRecordId,
        storage_provider: upload.storageProvider,
        object_key: upload.objectKey,
        public_url: upload.publicUrl,
        url: upload.url,
        sort_order: index,
        created_at: createdAt
      });
    }

    const result = await repositories.fieldRecordRepository.createCapturedRecord({
      fieldRecord,
      photos
    });

    json(response, 201, result);
    return;
  }

  if (request.method === "POST" && pathname === "/api/v1/job-cases") {
    const businessContext = await requireBusinessContext(request, repositories, { write: true });
    const payload = await readJsonBody(request);
    validateJobCasePayload(payload);

    const createdAt = nowIso();
    const result = await repositories.jobCaseRepository.create({
      jobCase: {
        id: createId("jc"),
        owner_id: businessContext.ownerId || businessContext.userId,
        company_id: businessContext.companyId,
        created_by_user_id: businessContext.userId,
        assigned_user_id: businessContext.mode === "SESSION" && businessContext.role === "STAFF" ? businessContext.userId : null,
        visibility: businessContext.mode === "SESSION" && businessContext.role === "STAFF" ? "PRIVATE_ASSIGNED" : "TEAM_SHARED",
        updated_by_user_id: businessContext.userId,
        customer_label: payload.customerLabel.trim(),
        contact_memo: payload.contactMemo?.trim() || null,
        site_label: payload.siteLabel.trim(),
        original_quote_amount: Number(payload.originalQuoteAmount),
        revised_quote_amount: null,
        quote_delta_amount: null,
        current_status: "UNEXPLAINED",
        created_at: createdAt,
        updated_at: createdAt
      }
    });

    json(response, 201, result);
    return;
  }

  const linkMatch = pathname.match(/^\/api\/v1\/field-records\/([^/]+)\/link-job-case$/);
  if (request.method === "POST" && linkMatch) {
    const businessContext = await requireBusinessContext(request, repositories, { write: true });
    const fieldRecordId = linkMatch[1];
    const payload = await readJsonBody(request);

    const fieldRecord = await getFieldRecordSourceOrThrow(repositories, fieldRecordId, businessContext);
    const detailSource = await getJobCaseDetailSourceOrThrow(repositories, payload.jobCaseId, businessContext);

    if (fieldRecord.status === "LINKED") {
      throw new HttpError(409, "FIELD_RECORD_ALREADY_LINKED", "\uC774\uBBF8 \uC5F0\uACB0\uB41C \uD604\uC7A5 \uAE30\uB85D\uC774\uC5D0\uC694");
    }

    const result = await repositories.fieldRecordRepository.linkToJobCase({
      fieldRecordId,
      jobCaseId: detailSource.jobCase.id,
      actorUserId: businessContext.userId,
      linkedAt: nowIso()
    });

    await appendTimelineEvent(repositories, {
      jobCaseId: detailSource.jobCase.id,
      companyId: businessContext.companyId,
      actorUserId: businessContext.userId,
      eventType: "FIELD_RECORD_LINKED",
      summary: `${labelSecondary(fieldRecord.secondary_reason) || "\uD604\uC7A5 \uAE30\uB85D"} \uC5F0\uACB0`,
      payloadJson: { fieldRecordId: fieldRecord.id },
      createdAt: result.linkedAt
    });

    json(response, 200, {
      fieldRecordId: result.fieldRecordId,
      jobCaseId: result.jobCaseId,
      status: result.status
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/v1/job-cases") {
    const businessContext = await requireBusinessContext(request, repositories);
    const status = url.searchParams.get("status") || "ALL";
    const query = (url.searchParams.get("query") || "").trim();
    validateListStatus(status);

    const items = await repositories.jobCaseRepository.listByScope({
      ...buildRepositoryReadScope(businessContext),
      status,
      query
    });

    json(response, 200, { items });
    return;
  }

  const jobCaseDetailMatch = pathname.match(/^\/api\/v1\/job-cases\/([^/]+)$/);
  if (request.method === "GET" && jobCaseDetailMatch) {
    const businessContext = await requireBusinessContext(request, repositories);
    const jobCaseId = jobCaseDetailMatch[1];
    const detailSource = await getJobCaseDetailSourceOrThrow(repositories, jobCaseId, businessContext);
    const detail = await buildJobCaseDetailFromRepository(repositories, detailSource);
    detail.latestCustomerConfirmationLink = await repositories.customerConfirmationRepository.getLatestByJobCaseId(jobCaseId);
    json(response, 200, detail);
    return;
  }

  const quoteMatch = pathname.match(/^\/api\/v1\/job-cases\/([^/]+)\/quote$/);
  if (request.method === "PATCH" && quoteMatch) {
    const businessContext = await requireBusinessContext(request, repositories, { write: true });
    const payload = await readJsonBody(request);
    validateQuotePayload(payload);
    const jobCaseId = quoteMatch[1];
    const detailSource = await getJobCaseDetailSourceOrThrow(repositories, jobCaseId, businessContext);

    if (!canManageQuote(detailSource.jobCase, businessContext)) {
      throw new HttpError(403, "JOB_CASE_FORBIDDEN", "현재 권한으로는 이 작업 건의 견적을 변경할 수 없습니다.");
    }
    if (!Number.isInteger(detailSource.jobCase.original_quote_amount)) {
      throw new HttpError(422, "VALIDATION_ERROR", "기존 견적 금액이 없어 변경 견적을 계산할 수 없습니다.", {
        originalQuoteAmount: "REQUIRED"
      });
    }

    const amount = Number(payload.revisedQuoteAmount);
    const comparison = buildScopeComparison(detailSource.fieldRecords);
    const result = await repositories.jobCaseRepository.saveQuoteRevision({
      jobCaseId,
      actorUserId: businessContext.userId,
      revisedQuoteAmount: amount,
      scopeComparison: comparison,
      updatedAt: nowIso()
    });
    await appendTimelineEvent(repositories, {
      jobCaseId,
      companyId: businessContext.companyId,
      actorUserId: businessContext.userId,
      eventType: "QUOTE_UPDATED",
      summary: `\uBCC0\uACBD \uACAC\uC801 ${result.quoteDeltaAmount >= 0 ? "+" : ""}${result.quoteDeltaAmount}\uC6D0`,
      payloadJson: { revisedQuoteAmount: amount },
      createdAt: result.updatedAt
    });
    await appendAuditLogIfPossible(repositories, businessContext, {
      action: "JOB_CASE_QUOTE_UPDATED",
      resourceId: jobCaseId,
      payloadJson: {
        originalQuoteAmount: result.originalQuoteAmount,
        revisedQuoteAmount: result.revisedQuoteAmount,
        quoteDeltaAmount: result.quoteDeltaAmount
      }
    });

    json(response, 200, result);
    return;
  }
  const scopeMatch = pathname.match(/^\/api\/v1\/job-cases\/([^/]+)\/scope-comparison$/);
  if (request.method === "GET" && scopeMatch) {
    const businessContext = await requireBusinessContext(request, repositories);
    const jobCaseId = scopeMatch[1];
    const detailSource = await getJobCaseDetailSourceOrThrow(repositories, jobCaseId, businessContext);
    const comparison = detailSource.scopeComparisons[detailSource.scopeComparisons.length - 1] || null;

    if (!comparison) {
      json(response, 200, {
        baseScopeSummary: "\uAE30\uBCF8 \uC785\uC8FC\uCCAD\uC18C \uBC94\uC704 \uAE30\uC900",
        extraWorkSummary: "\uCD94\uAC00 \uC791\uC5C5\uC774 \uC544\uC9C1 \uC815\uB9AC\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694",
        reasonWhyExtra: "\uD604\uC7A5 \uAE30\uB85D\uACFC \uBCC0\uACBD \uAE08\uC561\uC744 \uC800\uC7A5\uD558\uBA74 \uC790\uB3D9\uC73C\uB85C \uC815\uB9AC\uB429\uB2C8\uB2E4."
      });
      return;
    }

    json(response, 200, {
      baseScopeSummary: comparison.base_scope_summary,
      extraWorkSummary: comparison.extra_work_summary,
      reasonWhyExtra: comparison.reason_why_extra
    });
    return;
  }

  const draftMatch = pathname.match(/^\/api\/v1\/job-cases\/([^/]+)\/draft-message$/);
  if (request.method === "POST" && draftMatch) {
    const businessContext = await requireBusinessContext(request, repositories, { write: true });
    const jobCaseId = draftMatch[1];
    const payload = await readJsonBody(request);
    const detailSource = await getJobCaseDetailSourceOrThrow(repositories, jobCaseId, businessContext);

    const linkedRecords = detailSource.fieldRecords;
    if (linkedRecords.length === 0) {
      throw new HttpError(422, "FIELD_RECORD_REQUIRED_FOR_DRAFT", "\uD604\uC7A5 \uAE30\uB85D\uC774 \uC788\uC5B4\uC57C \uC124\uBA85 \uCD08\uC548\uC744 \uB9CC\uB4E4 \uC218 \uC788\uC5B4\uC694");
    }
    if (!Number.isInteger(detailSource.jobCase.revised_quote_amount)) {
      throw new HttpError(422, "QUOTE_REQUIRED_FOR_DRAFT", "\uBCC0\uACBD \uD6C4 \uAE08\uC561\uC744 \uBA3C\uC800 \uC785\uB825\uD574\uC8FC\uC138\uC694");
    }

    const latestComparison = detailSource.scopeComparisons[detailSource.scopeComparisons.length - 1] || {
      ...buildScopeComparison(linkedRecords),
      job_case_id: jobCaseId
    };
    const tone = payload.tone || "CUSTOMER_MESSAGE";
    const body = buildDraftMessage(detailSource.jobCase, linkedRecords, {
      base_scope_summary: latestComparison.base_scope_summary || latestComparison.baseScopeSummary,
      extra_work_summary: latestComparison.extra_work_summary || latestComparison.extraWorkSummary,
      reason_why_extra: latestComparison.reason_why_extra || latestComparison.reasonWhyExtra
    });

    const result = await repositories.jobCaseRepository.upsertDraftMessage({
      jobCaseId,
      companyId: businessContext.companyId,
      actorUserId: businessContext.userId,
      tone,
      body,
      timestamp: nowIso()
    });
    await appendTimelineEvent(repositories, {
      jobCaseId,
      companyId: businessContext.companyId,
      actorUserId: businessContext.userId,
      eventType: "DRAFT_CREATED",
      summary: "\uACE0\uAC1D \uC124\uBA85 \uCD08\uC548 \uC0DD\uC131",
      payloadJson: { draftId: result.id },
      createdAt: result.updatedAt
    });
    await appendAuditLogIfPossible(repositories, businessContext, {
      action: "JOB_CASE_DRAFT_UPSERTED",
      resourceId: jobCaseId,
      payloadJson: {
        draftId: result.id,
        tone: result.tone
      }
    });

    json(response, 200, {
      id: result.id,
      jobCaseId: result.jobCaseId,
      tone: result.tone,
      body: result.body,
      createdAt: result.createdAt
    });
    return;
  }
  if (request.method === "GET" && draftMatch) {
    const businessContext = await requireBusinessContext(request, repositories);
    const jobCaseId = draftMatch[1];
    const detailSource = await getJobCaseDetailSourceOrThrow(repositories, jobCaseId, businessContext);
    const draft = detailSource.drafts[detailSource.drafts.length - 1] || null;
    if (!draft) {
      json(response, 200, { item: null });
      return;
    }

    json(response, 200, {
      id: draft.id,
      jobCaseId,
      tone: draft.tone,
      body: draft.body,
      createdAt: draft.created_at
    });
    return;
  }

  const confirmationLinkMatch = pathname.match(/^\/api\/v1\/job-cases\/([^/]+)\/customer-confirmation-links$/);
  if (request.method === "POST" && confirmationLinkMatch) {
    const businessContext = await requireBusinessContext(request, repositories, { write: true });
    const jobCaseId = confirmationLinkMatch[1];
    const payload = await readJsonBody(request);
    validateCustomerConfirmationLinkPayload(payload);
    const detailSource = await getJobCaseDetailSourceOrThrow(repositories, jobCaseId, businessContext);

    if (!canManageQuote(detailSource.jobCase, businessContext)) {
      throw new HttpError(403, "JOB_CASE_FORBIDDEN", "\uC774 \uC791\uC5C5 \uAC74\uC758 \uAE08\uC561\uC744 \uC218\uC815\uD560 \uAD8C\uD55C\uC774 \uC5C6\uC5B4\uC694.");
    }

    const draft = detailSource.drafts[detailSource.drafts.length - 1] || null;
    if (!draft?.body) {
      throw new HttpError(422, "DRAFT_REQUIRED_FOR_CONFIRMATION", "\uC124\uBA85 \uCD08\uC548\uC774 \uC788\uC5B4\uC57C \uACE0\uAC1D \uD655\uC778 \uB9C1\uD06C\uB97C \uBC1C\uAE09\uD560 \uC218 \uC788\uC5B4\uC694");
    }
    if (!Number.isInteger(detailSource.jobCase.revised_quote_amount)) {
      throw new HttpError(422, "QUOTE_REQUIRED_FOR_CONFIRMATION", "\uBCC0\uACBD \uD6C4 \uAE08\uC561\uC744 \uBA3C\uC800 \uC785\uB825\uD574\uC8FC\uC138\uC694");
    }

    const link = await repositories.customerConfirmationRepository.createLink({
      jobCaseId: detailSource.jobCase.id,
      companyId: businessContext.companyId,
      createdByUserId: businessContext.userId,
      expiresInHours: payload?.expiresInHours == null || payload.expiresInHours === "" ? undefined : Number(payload.expiresInHours)
    });

    await appendCustomerConfirmationTimeline(repositories, link, "CUSTOMER_CONFIRMATION_LINK_CREATED", "\uACE0\uAC1D \uD655\uC778 \uB9C1\uD06C \uBC1C\uAE09", {
      expiresAt: link.expiresAt
    }, businessContext.userId);

    json(response, 201, {
      id: link.id,
      status: link.status,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      confirmationUrl: buildPublicConfirmationUrl(request, link.token)
    });
    return;
  }

  const agreementMatch = pathname.match(/^\/api\/v1\/job-cases\/([^/]+)\/agreement-records$/);
  if (request.method === "POST" && agreementMatch) {
    const businessContext = await requireBusinessContext(request, repositories, { write: true });
    const jobCaseId = agreementMatch[1];
    const payload = await readJsonBody(request);
    validateAgreementPayload(payload);
    await getJobCaseDetailSourceOrThrow(repositories, jobCaseId, businessContext);

    const normalizedConfirmedAmount = payload.confirmedAmount == null || payload.confirmedAmount === "" ? null : Number(payload.confirmedAmount);
    const result = await repositories.jobCaseRepository.createAgreementRecord({
      jobCaseId,
      companyId: businessContext.companyId,
      actorUserId: businessContext.userId,
      status: payload.status,
      confirmationChannel: payload.confirmationChannel,
      confirmedAt: payload.confirmedAt || nowIso(),
      confirmedAmount: normalizedConfirmedAmount,
      customerResponseNote: payload.customerResponseNote?.trim() || null,
      createdAt: nowIso()
    });
    await appendTimelineEvent(repositories, {
      jobCaseId,
      companyId: businessContext.companyId,
      actorUserId: businessContext.userId,
      eventType: "AGREEMENT_RECORDED",
      summary: summarizeAgreement({
        status: payload.status,
        confirmation_channel: payload.confirmationChannel,
        confirmed_amount: normalizedConfirmedAmount
      }),
      payloadJson: { agreementId: result.id },
      createdAt: result.createdAt
    });
    await appendAuditLogIfPossible(repositories, businessContext, {
      action: "JOB_CASE_AGREEMENT_RECORDED",
      resourceId: jobCaseId,
      payloadJson: {
        agreementId: result.id,
        status: result.status,
        confirmationChannel: result.confirmationChannel,
        confirmedAmount: result.confirmedAmount
      }
    });

    json(response, 201, result);
    return;
  }
  const timelineMatch = pathname.match(/^\/api\/v1\/job-cases\/([^/]+)\/timeline$/);
  if (request.method === "GET" && timelineMatch) {
    const businessContext = await requireBusinessContext(request, repositories);
    const jobCaseId = timelineMatch[1];
    const detailSource = await getJobCaseDetailSourceOrThrow(repositories, jobCaseId, businessContext);

    const items = [...detailSource.timelineEvents]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((item) => ({
        type: item.event_type,
        createdAt: item.created_at,
        summary: item.summary
      }));

    json(response, 200, { items });
    return;
  }

  notFound(response);
}

function buildRepositoryReadScope(businessContext) {
  return {
    companyId: businessContext.companyId,
    actorUserId: businessContext.userId,
    role: businessContext.role
  };
}

async function getJobCaseDetailSourceOrThrow(repositories, jobCaseId, businessContext) {
  const detailSource = await repositories.jobCaseRepository.getDetailById(
    jobCaseId,
    buildRepositoryReadScope(businessContext)
  );

  if (!detailSource) {
    throw new HttpError(404, "JOB_CASE_NOT_FOUND", "\uC791\uC5C5 \uAC74\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694");
  }

  return detailSource;
}

async function buildJobCaseDetailFromRepository(repositories, detailSource) {
  const jobCase = detailSource.jobCase;
  const scopeComparison = detailSource.scopeComparisons[detailSource.scopeComparisons.length - 1] || null;
  const latestDraft = detailSource.drafts[detailSource.drafts.length - 1] || null;
  const latestAgreement = detailSource.agreements[detailSource.agreements.length - 1] || null;
  const fieldRecords = await Promise.all(
    detailSource.fieldRecords.map(async (record) => {
      const photos = await repositories.fileAssetRepository.listByFieldRecordId(record.id);
      return {
        id: record.id,
        primaryReason: record.primary_reason,
        secondaryReason: record.secondary_reason,
        note: record.note,
        status: record.status,
        createdAt: record.created_at,
        photos: photos
          .sort((left, right) => left.sort_order - right.sort_order)
          .map((photo) => ({ id: photo.id, url: resolvePhotoUrl(photo) }))
      };
    })
  );

  const currentStatus = deriveJobCaseStatus(detailSource.agreements);

  return {
    id: jobCase.id,
    customerLabel: jobCase.customer_label,
    contactMemo: jobCase.contact_memo,
    siteLabel: jobCase.site_label,
    currentStatus,
    visibility: jobCase.visibility || "PRIVATE_ASSIGNED",
    originalQuoteAmount: jobCase.original_quote_amount,
    revisedQuoteAmount: jobCase.revised_quote_amount,
    quoteDeltaAmount: jobCase.quote_delta_amount,
    scopeComparison: scopeComparison
      ? {
          baseScopeSummary: scopeComparison.base_scope_summary,
          extraWorkSummary: scopeComparison.extra_work_summary,
          reasonWhyExtra: scopeComparison.reason_why_extra
        }
      : null,
    latestDraftMessage: latestDraft
      ? {
          id: latestDraft.id,
          tone: latestDraft.tone,
          body: latestDraft.body,
          updatedAt: latestDraft.updated_at || null
        }
      : null,
    latestAgreementRecord: latestAgreement
      ? {
          status: latestAgreement.status,
          confirmationChannel: latestAgreement.confirmation_channel,
          confirmedAt: latestAgreement.confirmed_at,
          confirmedAmount: latestAgreement.confirmed_amount,
          customerResponseNote: latestAgreement.customer_response_note
        }
      : null,
    fieldRecords
  };
}

async function appendTimelineEvent(repositories, entry) {
  return repositories.timelineEventRepository.append(entry);
}

async function appendAuditLogIfPossible(repositories, businessContext, entry) {
  if (!businessContext.companyId) {
    return null;
  }

  return repositories.auditLogRepository.append({
    companyId: businessContext.companyId,
    actorUserId: businessContext.userId || null,
    actorType: "USER",
    action: entry.action,
    resourceType: "JOB_CASE",
    resourceId: entry.resourceId || null,
    requestId: entry.requestId || null,
    payloadJson: entry.payloadJson || null,
    createdAt: nowIso()
  });
}

async function requireSessionContext(request, repositories) {
  const authContext = await getAuthContext(request, repositories);
  if (authContext.mode !== "SESSION") {
    throw new HttpError(403, "SESSION_AUTH_REQUIRED", "세션 로그인이 필요합니다.");
  }
  return authContext;
}

async function requireBusinessContext(request, repositories, options = {}) {
  const authContext = await getAuthContext(request, repositories);
  if (authContext.mode === "SESSION") {
    if (options.write) {
      assertTrustedOrigin(request);
      assertCsrf(request);
    }
    return {
      mode: "SESSION",
      ownerId: authContext.userId || config.ownerId,
      companyId: authContext.companyId,
      userId: authContext.userId,
      role: authContext.role,
      companies: authContext.companies || []
    };
  }

  throw new HttpError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
}

function assertActiveCompanyMatch(authContext, companyId) {
  if (authContext.companyId !== companyId) {
    throw new HttpError(409, "ACTIVE_COMPANY_REQUIRED", "\uBA3C\uC800 \uC774 \uC5C5\uCCB4 \uCEE8\uD14D\uC2A4\uD2B8\uB85C \uC804\uD658\uD574\uC8FC\uC138\uC694.");
  }
}

function assertRole(authContext, allowedRoles) {
  if (!allowedRoles.includes(authContext.role)) {
    throw new HttpError(403, "COMPANY_ROLE_FORBIDDEN", "\uC774 \uC791\uC5C5\uC744 \uC218\uD589\uD560 \uAD8C\uD55C\uC774 \uC5C6\uC5B4\uC694.");
  }
}

function canReadJobCase(jobCase, businessContext) {
  if (jobCase.company_id !== businessContext.companyId) {
    return false;
  }
  if (businessContext.role === "OWNER" || businessContext.role === "MANAGER") {
    return true;
  }
  return jobCase.created_by_user_id === businessContext.userId
    || jobCase.assigned_user_id === businessContext.userId
    || jobCase.visibility === "TEAM_SHARED";
}

function canManageQuote(jobCase, businessContext) {
  if (jobCase.company_id !== businessContext.companyId) {
    return false;
  }
  return businessContext.role === "OWNER" || businessContext.role === "MANAGER";
}


async function getFieldRecordSourceOrThrow(repositories, fieldRecordId, businessContext) {
  const fieldRecord = await repositories.fieldRecordRepository.getById(fieldRecordId, {
    companyId: businessContext.companyId || null
  });

  if (!fieldRecord) {
    throw new HttpError(404, "FIELD_RECORD_NOT_FOUND", "현장 기록을 찾을 수 없습니다.");
  }
  if (fieldRecord.company_id !== businessContext.companyId) {
    throw new HttpError(404, "FIELD_RECORD_NOT_FOUND", "현장 기록을 찾을 수 없습니다.");
  }
  if (businessContext.role === "OWNER" || businessContext.role === "MANAGER" || fieldRecord.created_by_user_id === businessContext.userId) {
    return fieldRecord;
  }
  throw new HttpError(404, "FIELD_RECORD_NOT_FOUND", "현장 기록을 찾을 수 없습니다.");
}

function resolvePhotoUrl(photo) {
  return photo.public_url || photo.url || null;
}

async function buildPublicCustomerConfirmationPayload(repositories, link) {
  const detailSource = await repositories.jobCaseRepository.getDetailById(link.jobCaseId, {});
  if (!detailSource) {
    throw new HttpError(404, "JOB_CASE_NOT_FOUND", "\uC791\uC5C5 \uAC74\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694");
  }

  const detail = await buildJobCaseDetailFromRepository(repositories, detailSource);

  return {
    link: {
      id: link.id,
      status: link.status,
      expiresAt: link.expiresAt,
      viewedAt: link.viewedAt,
      confirmedAt: link.confirmedAt,
      confirmationNote: link.confirmationNote
    },
    jobCase: {
      id: detail.id,
      customerLabel: detail.customerLabel,
      siteLabel: detail.siteLabel,
      originalQuoteAmount: detail.originalQuoteAmount,
      revisedQuoteAmount: detail.revisedQuoteAmount,
      quoteDeltaAmount: detail.quoteDeltaAmount
    },
    scopeComparison: detail.scopeComparison,
    draftMessage: detail.latestDraftMessage
      ? {
          id: detail.latestDraftMessage.id,
          body: detail.latestDraftMessage.body,
          updatedAt: detail.latestDraftMessage.updatedAt || null
        }
      : null,
    fieldRecords: detail.fieldRecords.map((record) => ({
      id: record.id,
      primaryReason: record.primaryReason,
      secondaryReason: record.secondaryReason,
      note: record.note,
      photos: record.photos
    }))
  };
}

async function appendCustomerConfirmationTimeline(repositories, link, eventType, summary, payloadJson, actorUserId = null) {
  return appendTimelineEvent(repositories, {
    jobCaseId: link.jobCaseId,
    companyId: link.companyId || null,
    actorUserId,
    eventType,
    summary,
    payloadJson,
    createdAt: nowIso()
  });
}

function buildPublicConfirmationUrl(request, token) {
  const requestUrl = new URL(request.url, "http://" + (request.headers.host || "localhost"));
  const origin = config.appBaseUrl || requestUrl.origin;
  return origin + "/confirm/" + encodeURIComponent(token);
}

function isTrustedProxyAddress(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const withoutPort = normalized.startsWith("[")
    ? normalized.slice(1).split("]")[0]
    : normalized.split(":")[0];

  return withoutPort === "127.0.0.1"
    || withoutPort === "::1"
    || withoutPort === "::ffff:127.0.0.1"
    || withoutPort === "localhost"
    || withoutPort.startsWith("10.")
    || withoutPort.startsWith("192.168.")
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(withoutPort)
    || withoutPort.startsWith("fc")
    || withoutPort.startsWith("fd")
    || withoutPort.startsWith("fe80:");
}

function pickForwardedIp(value) {
  const first = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0];
  return first || null;
}

function getRequestIp(request) {
  const remoteAddress = request.socket?.remoteAddress || null;
  if (config.trustProxyHeaders && isTrustedProxyAddress(remoteAddress)) {
    const cloudflareIp = pickForwardedIp(request.headers["cf-connecting-ip"]);
    if (cloudflareIp) {
      return cloudflareIp;
    }

    const forwarded = pickForwardedIp(request.headers["x-forwarded-for"]);
    if (forwarded) {
      return forwarded;
    }
  }
  return remoteAddress;
}

function getUserAgent(request) {
  return String(request.headers["user-agent"] || "").slice(0, 500) || null;
}

function extractRefreshToken(request) {
  const cookieHeader = request.headers.cookie || "";
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .map((part) => part.split("="))
    .find(([name]) => name === config.refreshCookieName)?.[1] || "";
}

function isSystemAdminEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return Boolean(normalized) && config.systemAdminEmails.includes(normalized);
}

function isPastTimestamp(value) {
  return Boolean(value) && new Date(value).getTime() < Date.now();
}

function isSessionIdleRisk(value) {
  if (!value) {
    return false;
  }
  const ageMs = Date.now() - new Date(value).getTime();
  return ageMs > Math.max(config.sessionIdleTimeoutSeconds * 1000 * 0.5, 60 * 60 * 1000);
}
