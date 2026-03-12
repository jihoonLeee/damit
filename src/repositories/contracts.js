export const repositoryContracts = {
  systemRepository: ["getStorageSummary", "createBackup", "resetAllData", "listRecentBackups", "getOpsSnapshot"],
  jobCaseRepository: [
    "listByScope",
    "getDetailById",
    "create",
    "saveQuoteRevision",
    "upsertDraftMessage",
    "createAgreementRecord"
  ],
  fieldRecordRepository: ["listByJobCaseId", "getById", "createCapturedRecord", "linkToJobCase"],
  customerConfirmationRepository: [
    "createLink",
    "getLatestByJobCaseId",
    "getViewByToken",
    "acknowledge"
  ],
  authRepository: [
    "issueChallenge",
    "verifyChallenge",
    "getSessionContext",
    "refreshSessionByRefreshToken",
    "revokeSession",
    "revokeSessionByRefreshToken",
    "switchSessionCompany",
    "createInvitation",
    "listMembershipsByCompany",
    "listInvitationsByCompany",
    "listCompaniesForUser"
  ],
  auditLogRepository: ["append", "listByCompany"],
  timelineEventRepository: ["append"],
  fileAssetRepository: ["listByFieldRecordId"]
};

export class RepositoryContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "RepositoryContractError";
  }
}

export function assertRepositoryBundle(bundle) {
  for (const [repoName, methods] of Object.entries(repositoryContracts)) {
    if (!bundle[repoName]) {
      throw new RepositoryContractError(`Missing repository: ${repoName}`);
    }

    for (const method of methods) {
      if (typeof bundle[repoName][method] !== "function") {
        throw new RepositoryContractError(`Repository ${repoName} is missing method ${method}`);
      }
    }
  }

  return bundle;
}

export function createNotImplemented(engine, repoName, methodName) {
  return async () => {
    throw new Error(`${engine}:${repoName}.${methodName} is not implemented yet`);
  };
}
