import { createBackup, createId, getStorageSummary, nowIso, readDb, resetDb, updateDb } from "../../store.js";
import {
  createInvitation,
  getSessionContext,
  issueLoginChallenge,
  listCompaniesForUser,
  listInvitationsByCompany,
  listMembershipsByCompany,
  refreshSessionByRefreshToken,
  revokeSession,
  revokeSessionByRefreshToken,
  switchSessionCompany,
  verifyLoginChallenge
} from "../../auth-store.js";
import {
  acknowledgeCustomerConfirmation,
  createCustomerConfirmationLink,
  getCustomerConfirmationView,
  getLatestCustomerConfirmationLink
} from "../../customer-confirmation-store.js";


function canReadJobCase(jobCase, scope) {
  if (!scope?.companyId) {
    return true;
  }

  if ((jobCase.company_id || null) !== scope.companyId) {
    return false;
  }

  const role = String(scope.role || "OWNER").toUpperCase();
  if (role === "OWNER" || role === "MANAGER") {
    return true;
  }

  return jobCase.created_by_user_id === scope.actorUserId
    || jobCase.assigned_user_id === scope.actorUserId
    || (jobCase.visibility || "PRIVATE_ASSIGNED") === "TEAM_SHARED";
}

function matchesQuery(jobCase, query) {
  if (!query) {
    return true;
  }

  const haystack = [jobCase.customer_label, jobCase.site_label, jobCase.contact_memo]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function sortByUpdatedAtDesc(items) {
  return [...items].sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1));
}

function deriveStatus(agreements) {
  if (!agreements || agreements.length === 0) {
    return "UNEXPLAINED";
  }
  return [...agreements].sort((left, right) => (left.created_at < right.created_at ? 1 : -1))[0].status;
}

function toJobCaseListItem(jobCase, fieldRecords, agreementRecords) {
  const relatedRecords = fieldRecords.filter((record) => record.job_case_id === jobCase.id);
  const latestRecord = relatedRecords[relatedRecords.length - 1];
  const relatedAgreements = agreementRecords.filter((record) => record.job_case_id === jobCase.id);

  return {
    id: jobCase.id,
    customerLabel: jobCase.customer_label,
    siteLabel: jobCase.site_label,
    originalQuoteAmount: jobCase.original_quote_amount,
    revisedQuoteAmount: jobCase.revised_quote_amount,
    quoteDeltaAmount: jobCase.quote_delta_amount,
    primaryReason: latestRecord?.primary_reason || null,
    secondaryReason: latestRecord?.secondary_reason || null,
    currentStatus: deriveStatus(relatedAgreements),
    hasAgreementRecord: relatedAgreements.length > 0,
    updatedAt: jobCase.updated_at
  };
}

function toAuditLog(entry) {
  return {
    id: entry.id,
    companyId: entry.company_id || null,
    actorUserId: entry.actor_user_id || null,
    actorType: entry.actor_type,
    action: entry.action,
    resourceType: entry.resource_type,
    resourceId: entry.resource_id || null,
    requestId: entry.request_id || null,
    payloadJson: entry.payload_json || null,
    createdAt: entry.created_at
  };
}

function toTimelineEvent(event) {
  return {
    id: event.id,
    job_case_id: event.job_case_id,
    company_id: event.company_id || null,
    actor_user_id: event.actor_user_id || null,
    event_type: event.event_type,
    summary: event.summary,
    payload_json: event.payload_json || null,
    created_at: event.created_at
  };
}

function canReadFieldRecord(fieldRecord, scope) {
  if (!scope?.companyId) {
    return true;
  }

  return (fieldRecord.company_id || null) === scope.companyId;
}

export function createSqliteRepositoryBundle() {
  return {
    engine: "SQLITE",
    systemRepository: {
      getStorageSummary: async () => getStorageSummary(),
      createBackup: async (label) => createBackup(label),
      resetAllData: async () => {
        await resetDb();
        return getStorageSummary();
      }
    },
    jobCaseRepository: {
      listByScope: async (scope = {}) => {
        const db = await readDb();
        const normalizedQuery = String(scope.query || "").trim().toLowerCase();
        const normalizedStatus = String(scope.status || "ALL").toUpperCase();

        const items = db.jobCases
          .filter((jobCase) => canReadJobCase(jobCase, scope))
          .map((jobCase) => toJobCaseListItem(jobCase, db.fieldRecords, db.agreementRecords))
          .filter((item) => normalizedStatus === "ALL" || item.currentStatus === normalizedStatus)
          .filter((item) => matchesQuery({
            customer_label: item.customerLabel,
            site_label: item.siteLabel,
            contact_memo: ""
          }, normalizedQuery));

        return sortByUpdatedAtDesc(items);
      },
      getDetailById: async (jobCaseId, scope = {}) => {
        const db = await readDb();
        const jobCase = db.jobCases.find((item) => item.id === jobCaseId) || null;
        if (!jobCase || !canReadJobCase(jobCase, scope)) {
          return null;
        }
        return {
          jobCase,
          fieldRecords: db.fieldRecords.filter((item) => item.job_case_id === jobCaseId),
          agreements: db.agreementRecords.filter((item) => item.job_case_id === jobCaseId),
          drafts: db.messageDrafts.filter((item) => item.job_case_id === jobCaseId),
          scopeComparisons: db.scopeComparisons.filter((item) => item.job_case_id === jobCaseId),
          timelineEvents: db.timelineEvents.filter((item) => item.job_case_id === jobCaseId)
        };
      },
      create: async ({ jobCase }) => {
        return updateDb((db) => {
          db.jobCases.push({ ...jobCase });
          return {
            id: jobCase.id,
            currentStatus: jobCase.current_status,
            originalQuoteAmount: jobCase.original_quote_amount,
            revisedQuoteAmount: jobCase.revised_quote_amount ?? null,
            quoteDeltaAmount: jobCase.quote_delta_amount ?? null,
            createdAt: jobCase.created_at,
            visibility: jobCase.visibility || "PRIVATE_ASSIGNED"
          };
        });
      },
      saveQuoteRevision: async ({ jobCaseId, actorUserId, revisedQuoteAmount, scopeComparison, updatedAt }) => {
        return updateDb((db) => {
          const jobCase = db.jobCases.find((item) => item.id === jobCaseId);
          if (!jobCase) {
            throw new Error(`Job case not found: ${jobCaseId}`);
          }

          const timestamp = updatedAt || nowIso();
          jobCase.revised_quote_amount = revisedQuoteAmount;
          jobCase.quote_delta_amount = revisedQuoteAmount - jobCase.original_quote_amount;
          jobCase.updated_at = timestamp;
          jobCase.updated_by_user_id = actorUserId || jobCase.updated_by_user_id || null;

          const existingComparison = db.scopeComparisons.find((item) => item.job_case_id === jobCaseId);
          if (existingComparison) {
            existingComparison.base_scope_summary = scopeComparison.baseScopeSummary;
            existingComparison.extra_work_summary = scopeComparison.extraWorkSummary;
            existingComparison.reason_why_extra = scopeComparison.reasonWhyExtra;
            existingComparison.updated_at = timestamp;
          } else {
            db.scopeComparisons.push({
              id: createId("sc"),
              job_case_id: jobCaseId,
              base_scope_summary: scopeComparison.baseScopeSummary,
              extra_work_summary: scopeComparison.extraWorkSummary,
              reason_why_extra: scopeComparison.reasonWhyExtra,
              updated_at: timestamp
            });
          }

          return {
            jobCaseId,
            originalQuoteAmount: jobCase.original_quote_amount,
            revisedQuoteAmount: jobCase.revised_quote_amount,
            quoteDeltaAmount: jobCase.quote_delta_amount,
            updatedAt: timestamp,
            scopeComparison: {
              baseScopeSummary: scopeComparison.baseScopeSummary,
              extraWorkSummary: scopeComparison.extraWorkSummary,
              reasonWhyExtra: scopeComparison.reasonWhyExtra
            }
          };
        });
      },
      upsertDraftMessage: async ({ jobCaseId, companyId, actorUserId, tone, body, timestamp }) => {
        return updateDb((db) => {
          const jobCase = db.jobCases.find((item) => item.id === jobCaseId);
          if (!jobCase) {
            throw new Error(`Job case not found: ${jobCaseId}`);
          }

          const savedAt = timestamp || nowIso();
          const existing = db.messageDrafts.find((item) => item.job_case_id === jobCaseId);

          if (existing) {
            existing.tone = tone;
            existing.body = body;
            existing.updated_at = savedAt;
            existing.company_id = companyId || existing.company_id || null;
            existing.created_by_user_id = existing.created_by_user_id || actorUserId || null;
          } else {
            db.messageDrafts.push({
              id: createId("draft"),
              job_case_id: jobCaseId,
              company_id: companyId || null,
              created_by_user_id: actorUserId || null,
              tone,
              body,
              created_at: savedAt,
              updated_at: savedAt
            });
          }

          jobCase.updated_at = savedAt;
          jobCase.updated_by_user_id = actorUserId || jobCase.updated_by_user_id || null;

          const latest = db.messageDrafts.find((item) => item.job_case_id === jobCaseId);
          return {
            id: latest.id,
            jobCaseId,
            tone: latest.tone,
            body: latest.body,
            createdAt: latest.created_at,
            updatedAt: latest.updated_at
          };
        });
      },
      createAgreementRecord: async ({
        jobCaseId,
        companyId,
        actorUserId,
        status,
        confirmationChannel,
        confirmedAt,
        confirmedAmount,
        customerResponseNote,
        createdAt
      }) => {
        return updateDb((db) => {
          const jobCase = db.jobCases.find((item) => item.id === jobCaseId);
          if (!jobCase) {
            throw new Error(`Job case not found: ${jobCaseId}`);
          }

          const timestamp = createdAt || nowIso();
          const agreement = {
            id: createId("ar"),
            job_case_id: jobCaseId,
            company_id: companyId || null,
            created_by_user_id: actorUserId || null,
            status,
            confirmation_channel: confirmationChannel,
            confirmed_at: confirmedAt || timestamp,
            confirmed_amount: confirmedAmount == null ? null : confirmedAmount,
            customer_response_note: customerResponseNote || null,
            created_at: timestamp
          };

          db.agreementRecords.push(agreement);
          jobCase.current_status = status;
          jobCase.updated_at = timestamp;
          jobCase.updated_by_user_id = actorUserId || jobCase.updated_by_user_id || null;

          return {
            id: agreement.id,
            jobCaseId,
            status: agreement.status,
            confirmationChannel: agreement.confirmation_channel,
            confirmedAt: agreement.confirmed_at,
            confirmedAmount: agreement.confirmed_amount,
            customerResponseNote: agreement.customer_response_note,
            currentStatus: jobCase.current_status,
            createdAt: agreement.created_at
          };
        });
      }
    },
    fieldRecordRepository: {
      listByJobCaseId: async (jobCaseId) => {
        const db = await readDb();
        return db.fieldRecords.filter((item) => item.job_case_id === jobCaseId);
      },
      getById: async (fieldRecordId, scope = {}) => {
        const db = await readDb();
        const fieldRecord = db.fieldRecords.find((item) => item.id === fieldRecordId) || null;
        if (!fieldRecord || !canReadFieldRecord(fieldRecord, scope)) {
          return null;
        }
        return fieldRecord;
      },
      createCapturedRecord: async ({ fieldRecord, photos }) => {
        return updateDb((db) => {
          db.fieldRecords.push({ ...fieldRecord });
          for (const photo of photos || []) {
            db.fieldRecordPhotos.push({ ...photo });
          }

          return {
            id: fieldRecord.id,
            jobCaseId: fieldRecord.job_case_id || null,
            primaryReason: fieldRecord.primary_reason,
            secondaryReason: fieldRecord.secondary_reason,
            note: fieldRecord.note,
            status: fieldRecord.status,
            photos: (photos || []).map((photo) => ({
              id: photo.id,
              url: photo.public_url || photo.url
            })),
            createdAt: fieldRecord.created_at
          };
        });
      },
      linkToJobCase: async ({ fieldRecordId, jobCaseId, actorUserId, linkedAt }) => {
        return updateDb((db) => {
          const fieldRecord = db.fieldRecords.find((item) => item.id === fieldRecordId);
          if (!fieldRecord) {
            throw new Error(`Field record not found: ${fieldRecordId}`);
          }
          if (fieldRecord.status === "LINKED") {
            throw new Error(`Field record already linked: ${fieldRecordId}`);
          }

          const jobCase = db.jobCases.find((item) => item.id === jobCaseId);
          if (!jobCase) {
            throw new Error(`Job case not found: ${jobCaseId}`);
          }

          const timestamp = linkedAt || nowIso();
          fieldRecord.job_case_id = jobCaseId;
          fieldRecord.status = "LINKED";
          jobCase.updated_at = timestamp;
          jobCase.updated_by_user_id = actorUserId || jobCase.updated_by_user_id || null;

          return {
            fieldRecordId,
            jobCaseId,
            status: fieldRecord.status,
            linkedAt: timestamp,
            primaryReason: fieldRecord.primary_reason,
            secondaryReason: fieldRecord.secondary_reason
          };
        });
      }
    },
    customerConfirmationRepository: {
      createLink: async ({ jobCaseId, companyId, createdByUserId, expiresInHours }) => {
        return createCustomerConfirmationLink({
          jobCaseId,
          companyId,
          createdByUserId,
          expiresInHours
        });
      },
      getLatestByJobCaseId: async (jobCaseId) => getLatestCustomerConfirmationLink(jobCaseId),
      getViewByToken: async ({ token, requestIp, userAgent }) => {
        return getCustomerConfirmationView({ token, requestIp, userAgent });
      },
      acknowledge: async ({ token, note, requestIp, userAgent }) => {
        return acknowledgeCustomerConfirmation({ token, note, requestIp, userAgent });
      }
    },
    authRepository: {
      issueChallenge: async (input) => issueLoginChallenge(input),
      verifyChallenge: async (input) => verifyLoginChallenge(input),
      getSessionContext: async (sessionId) => getSessionContext(sessionId),
      refreshSessionByRefreshToken: async (refreshToken) => refreshSessionByRefreshToken(refreshToken),
      revokeSession: async (sessionId) => revokeSession(sessionId),
      revokeSessionByRefreshToken: async (refreshToken) => revokeSessionByRefreshToken(refreshToken),
      switchSessionCompany: async (input) => switchSessionCompany(input),
      createInvitation: async (input) => createInvitation(input),
      listMembershipsByCompany: async (companyId) => listMembershipsByCompany(companyId),
      listInvitationsByCompany: async (companyId) => listInvitationsByCompany(companyId),
      listCompaniesForUser: async (userId) => listCompaniesForUser(userId)
    },
    auditLogRepository: {
      append: async (entry) => {
        return updateDb((db) => {
          const savedEntry = {
            id: entry.id || createId("audit"),
            company_id: entry.companyId || null,
            actor_user_id: entry.actorUserId || null,
            actor_type: entry.actorType,
            action: entry.action,
            resource_type: entry.resourceType,
            resource_id: entry.resourceId || null,
            request_id: entry.requestId || null,
            payload_json: entry.payloadJson || null,
            created_at: entry.createdAt || nowIso()
          };
          db.auditLogs.push(savedEntry);
          return toAuditLog(savedEntry);
        });
      },
      listByCompany: async (companyId) => {
        const db = await readDb();
        return db.auditLogs
          .filter((item) => item.company_id === companyId)
          .sort((left, right) => (left.created_at < right.created_at ? 1 : -1))
          .map((item) => toAuditLog(item));
      }
    },
    timelineEventRepository: {
      append: async ({ jobCaseId, companyId, actorUserId, eventType, summary, payloadJson, createdAt }) => {
        return updateDb((db) => {
          const jobCase = db.jobCases.find((item) => item.id === jobCaseId);
          if (!jobCase) {
            throw new Error(`Job case not found: ${jobCaseId}`);
          }

          const timestamp = createdAt || nowIso();
          jobCase.updated_at = timestamp;
          jobCase.updated_by_user_id = actorUserId || jobCase.updated_by_user_id || null;

          const event = {
            id: createId("te"),
            job_case_id: jobCaseId,
            company_id: companyId || jobCase.company_id || null,
            actor_user_id: actorUserId || null,
            event_type: eventType,
            summary,
            payload_json: payloadJson || null,
            created_at: timestamp
          };
          db.timelineEvents.push(event);
          return toTimelineEvent(event);
        });
      }
    },
    fileAssetRepository: {
      listByFieldRecordId: async (fieldRecordId) => {
        const db = await readDb();
        return db.fieldRecordPhotos.filter((item) => item.field_record_id === fieldRecordId);
      }
    }
  };
}
