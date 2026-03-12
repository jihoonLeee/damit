import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createReadStream } from "node:fs";

import { config } from "./config.js";
import {
  buildDraftMessage,
  buildScopeComparison,
  deriveJobCaseStatus,
  labelSecondary,
  summarizeAgreement,
  toJobCaseListItem
} from "./domain.js";
import { HttpError, createRequestId, json, notFound, readJsonBody, sendError } from "./http.js";
import { parseMultipart } from "./multipart.js";
import { createId, ensureStorage, nowIso, saveUpload } from "./store.js";
import { resolveLocalUploadPath } from "./object-storage/createObjectStorage.js";
import {
  assertAuthenticated,
  validateAgreementPayload,
  validateCustomerConfirmationAcknowledgement,
  validateCustomerConfirmationLinkPayload,
  validateFieldRecordInput,
  validateJobCasePayload,
  validateListStatus,
  validateQuotePayload
} from "./validation.js";
import {
  assertCsrf,
  createAuthCookieHeaders,
  createClearAuthCookieHeaders,
  createCsrfToken,
  getAuthContext,
  refreshSessionFromRequest
} from "./auth-runtime.js";
import { sendInvitationEmail, sendMagicLinkEmail } from "./mail-gateway.js";
import { runPostgresPreflight } from "./db/postgres-preflight.js";
import { createRepositoryBundle } from "./repositories/createRepositoryBundle.js";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function normalizePathname(urlValue) {
  return new URL(urlValue, "http://localhost").pathname;
}

export function createApp() {
  const repositories = createRepositoryBundle();

  return {
    async handle(request, response) {
      const requestId = createRequestId();

      try {
        await ensureStorage();
        const pathname = normalizePathname(request.url);

        if (pathname.startsWith("/api/v1/")) {
          await handleApiRequest(request, response, repositories);
          return;
        }

        if (pathname.startsWith("/uploads/")) {
          if (String(config.objectStorageProvider || "LOCAL_VOLUME").toUpperCase() !== "LOCAL_VOLUME") {
            notFound(response);
            return;
          }

          const uploadObjectKey = pathname.replace("/uploads/", "");
          await serveFile(response, resolveLocalUploadPath(config.uploadDir, uploadObjectKey));
          return;
        }

        if (pathname === "/" || pathname === "/landing") {
          await serveFile(response, path.join(config.publicDir, "landing.html"));
          return;
        }

        if (pathname === "/login") {
          await serveFile(response, path.join(config.publicDir, "login.html"));
          return;
        }

        if (pathname === "/beta-home") {
          await serveFile(response, path.join(config.publicDir, "beta-home.html"));
          return;
        }

        if (pathname === "/beta-app") {
          await serveFile(response, path.join(config.publicDir, "beta-app.html"));
          return;
        }

        if (pathname.startsWith("/confirm/")) {
          await serveFile(response, path.join(config.publicDir, "confirm.html"));
          return;
        }

        if (pathname === "/app") {
          await serveFile(response, path.join(config.publicDir, "index.html"));
          return;
        }

        await serveFile(response, path.join(config.publicDir, pathname));
      } catch (error) {
        sendError(response, requestId, error);
      }
    }
  };
}

async function handleApiRequest(request, response, repositories) {
  const url = new URL(request.url, "http://localhost");
  const pathname = url.pathname;

  if (request.method === "GET" && pathname === "/api/v1/health") {
    const storage = await repositories.systemRepository.getStorageSummary();
    json(response, 200, {
      status: "ok",
      service: "field-agreement-assistant",
      ownerMode: "OWNER_ONLY",
      storageEngine: storage.storageEngine,
      timestamp: nowIso(),
      counts: storage.counts
    });
    return;
  }

  const publicConfirmationMatch = pathname.match(/^\/api\/v1\/public\/confirm\/([^/]+)$/);
  if (request.method === "GET" && publicConfirmationMatch) {
    const token = decodeURIComponent(publicConfirmationMatch[1]);
    const link = await repositories.customerConfirmationRepository.getViewByToken({
      token,
      requestIp: getRequestIp(request),
      userAgent: getUserAgent(request)
    });
    const payload = await buildPublicCustomerConfirmationPayload(repositories, link);
    json(response, 200, payload);
    return;
  }

  const publicConfirmationAckMatch = pathname.match(/^\/api\/v1\/public\/confirm\/([^/]+)\/acknowledge$/);
  if (request.method === "POST" && publicConfirmationAckMatch) {
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

    json(response, 200, {
      ok: true,
      status: link.status,
      confirmedAt: link.confirmedAt,
      confirmationNote: link.confirmationNote
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/v1/auth/challenges") {
    const payload = await readJsonBody(request);
    const email = String(payload.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(422, "AUTH_EMAIL_REQUIRED", "\uC62C\uBC14\uB978 \uC774\uBA54\uC77C\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694", {
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

    const delivery = await sendMagicLinkEmail({
      request,
      email,
      challengeId: challenge.id,
      token,
      invitationToken: payload.invitationToken
    });

    json(response, 201, {
      challengeId: challenge.id,
      retryAfterSeconds: 60,
      delivery: {
        provider: delivery.provider,
        status: delivery.status
      },
      ...(delivery.debugMagicLink ? { debugMagicLink: delivery.debugMagicLink } : {})
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/v1/auth/verify") {
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

    json(
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
    const refreshed = await refreshSessionFromRequest(request, repositories);
    json(
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

    json(response, 200, { ok: true }, { "Set-Cookie": createClearAuthCookieHeaders() });
    return;
  }

  if (request.method === "GET" && pathname === "/api/v1/me") {
    const authContext = await getAuthContext(request, repositories);
    json(response, 200, {
      authenticated: true,
      mode: authContext.mode,
      user: {
        id: authContext.userId,
        displayName: authContext.displayName,
        email: authContext.email || null
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
    assertCsrf(request);
    const authContext = await requireSessionContext(request, repositories);
    const result = await repositories.authRepository.switchSessionCompany({
      sessionId: authContext.sessionId,
      userId: authContext.userId,
      companyId: switchMatch[1]
    });
    json(response, 200, result);
    return;
  }

  const membershipsMatch = pathname.match(/^\/api\/v1\/companies\/([^/]+)\/memberships$/);
  if (request.method === "GET" && membershipsMatch) {
    const companyId = membershipsMatch[1];
    const authContext = await requireSessionContext(request, repositories);
    assertActiveCompanyMatch(authContext, companyId);
    const items = await repositories.authRepository.listMembershipsByCompany(companyId);
    json(response, 200, { items });
    return;
  }

  const invitationsMatch = pathname.match(/^\/api\/v1\/companies\/([^/]+)\/invitations$/);
  if (invitationsMatch && request.method === "GET") {
    const companyId = invitationsMatch[1];
    const authContext = await requireSessionContext(request, repositories);
    assertActiveCompanyMatch(authContext, companyId);
    assertRole(authContext, ["OWNER"]);
    const items = await repositories.authRepository.listInvitationsByCompany(companyId);
    json(response, 200, { items });
    return;
  }

  if (invitationsMatch && request.method === "POST") {
    assertCsrf(request);
    const companyId = invitationsMatch[1];
    const authContext = await requireSessionContext(request, repositories);
    assertActiveCompanyMatch(authContext, companyId);
    assertRole(authContext, ["OWNER"]);
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
    json(response, 201, {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      delivery: {
        provider: delivery.provider,
        status: delivery.status
      },
      ...(delivery.debugInvitationLink ? { debugInvitationLink: delivery.debugInvitationLink } : {})
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/v1/admin/storage-status") {
    assertAuthenticated(request);
    const storage = await repositories.systemRepository.getStorageSummary();
    json(response, 200, storage);
    return;
  }


  if (request.method === "GET" && pathname === "/api/v1/admin/postgres-preflight") {
    assertAuthenticated(request);
    if (!config.databaseUrl) {
      throw new HttpError(409, "POSTGRES_NOT_CONFIGURED", "Managed Postgres \uC5F0\uACB0 \uC815\uBCF4\uAC00 \uC544\uC9C1 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694");
    }
    const report = await runPostgresPreflight({
      databaseUrl: config.databaseUrl,
      sslMode: config.postgresSslMode,
      sslRequire: config.postgresSslRequire,
      sslCaPath: config.postgresSslCaPath,
      applicationName: config.postgresApplicationName,
      maxPoolSize: config.postgresPoolMax
    });
    json(response, 200, report);
    return;
  }
  if (request.method === "POST" && pathname === "/api/v1/admin/backup") {
    assertAuthenticated(request);
    const payload = await readJsonBody(request);
    const backup = await repositories.systemRepository.createBackup(payload.label || "pilot");
    json(response, 201, backup);
    return;
  }

  if (request.method === "POST" && pathname === "/api/v1/admin/reset-data") {
    assertAuthenticated(request);
    const payload = await readJsonBody(request);
    if (payload.confirm !== "RESET_PILOT_DATA") {
      throw new HttpError(400, "RESET_CONFIRMATION_REQUIRED", "\uB9AC\uC14B \uD655\uC778 \uBB38\uAD6C\uB97C \uC815\uD655\uD788 \uC785\uB825\uD574\uC8FC\uC138\uC694");
    }
    await repositories.systemRepository.createBackup("before-reset");
    const storage = await repositories.systemRepository.resetAllData();
    json(response, 200, {
      ok: true,
      storageEngine: storage.storageEngine,
      counts: storage.counts
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
      owner_id: businessContext.ownerId,
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
        ownerId: businessContext.ownerId
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
        owner_id: businessContext.ownerId,
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
      throw new HttpError(403, "JOB_CASE_FORBIDDEN", "???臾믩씜 椰꾨똻??疫뀀뜆釉????륁젟??亦낅슦釉????곷선??");
    }
    if (!Number.isInteger(detailSource.jobCase.original_quote_amount)) {
      throw new HttpError(422, "VALIDATION_ERROR", "?癒?삋 野꺫딆읅 疫뀀뜆釉????낆젾??곻폒?紐꾩뒄", {
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
  if (businessContext.mode === "OWNER_TOKEN") {
    return {
      companyId: null,
      actorUserId: null,
      role: "OWNER"
    };
  }

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
    throw new HttpError(403, "SESSION_AUTH_REQUIRED", "\uBCA0\uD0C0 \uB85C\uADF8\uC778 \uC138\uC158\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
  }
  return authContext;
}

async function requireBusinessContext(request, repositories, options = {}) {
  const authContext = await getAuthContext(request, repositories);
  if (authContext.mode === "SESSION") {
    if (options.write) {
      assertCsrf(request);
    }
    return {
      mode: "SESSION",
      ownerId: config.ownerId,
      companyId: authContext.companyId,
      userId: authContext.userId,
      role: authContext.role,
      companies: authContext.companies || []
    };
  }

  if (authContext.mode === "OWNER_TOKEN") {
    return {
      mode: "OWNER_TOKEN",
      ownerId: config.ownerId,
      companyId: null,
      userId: config.ownerId,
      role: "OWNER",
      companies: []
    };
  }

  throw new HttpError(401, "UNAUTHORIZED", "\uB2E4\uC2DC \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694");
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
  if (businessContext.mode === "OWNER_TOKEN") {
    return true;
  }
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
  if (businessContext.mode === "OWNER_TOKEN") {
    return true;
  }
  if (jobCase.company_id !== businessContext.companyId) {
    return false;
  }
  return businessContext.role === "OWNER" || businessContext.role === "MANAGER";
}

function getScopedJobCaseOrThrow(db, jobCaseId, businessContext, options = {}) {
  const jobCase = db.jobCases.find((item) => item.id === jobCaseId);
  if (!jobCase || !canReadJobCase(jobCase, businessContext)) {
    throw new HttpError(404, "JOB_CASE_NOT_FOUND", "\uC791\uC5C5 \uAC74\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694");
  }
  if (options.requireManager && !canManageQuote(jobCase, businessContext)) {
    throw new HttpError(403, "JOB_CASE_FORBIDDEN", "\uC774 \uC791\uC5C5 \uAC74\uC758 \uAE08\uC561\uC744 \uC218\uC815\uD560 \uAD8C\uD55C\uC774 \uC5C6\uC5B4\uC694.");
  }
  return jobCase;
}

async function getFieldRecordSourceOrThrow(repositories, fieldRecordId, businessContext) {
  const fieldRecord = await repositories.fieldRecordRepository.getById(fieldRecordId, {
    companyId: businessContext.companyId || null
  });

  if (!fieldRecord) {
    throw new HttpError(404, "FIELD_RECORD_NOT_FOUND", "\uD604\uC7A5 \uAE30\uB85D\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694");
  }
  if (businessContext.mode === "OWNER_TOKEN") {
    return fieldRecord;
  }
  if (fieldRecord.company_id !== businessContext.companyId) {
    throw new HttpError(404, "FIELD_RECORD_NOT_FOUND", "\uD604\uC7A5 \uAE30\uB85D\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694");
  }
  if (businessContext.role === "OWNER" || businessContext.role === "MANAGER" || fieldRecord.created_by_user_id === businessContext.userId) {
    return fieldRecord;
  }
  throw new HttpError(404, "FIELD_RECORD_NOT_FOUND", "\uD604\uC7A5 \uAE30\uB85D\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694");
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

function getRequestIp(request) {
  const forwarded = request.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return request.socket?.remoteAddress || null;
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

async function serveFile(response, filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await serveFile(response, path.join(filePath, "index.html"));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    notFound(response);
  }
}






















