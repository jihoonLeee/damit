export const repositoryContracts = {
  systemRepository: ["getStorageSummary", "createBackup", "resetAllData", "listRecentBackups", "getOpsSnapshot", "getDataExplorer"],
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
    "updateChallengeDelivery",
    "verifyChallenge",
    "getSessionContext",
    "updateUserProfile",
    "listRecentChallengesByEmail",
    "refreshSessionByRefreshToken",
    "revokeSession",
    "listSessionsByUser",
    "revokeOwnedSession",
    "revokeSessionByRefreshToken",
    "switchSessionCompany",
    "createInvitation",
    "reissueInvitation",
    "revokeInvitation",
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
