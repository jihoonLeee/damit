import crypto from "node:crypto";
import fs from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

import { config } from "../../../config.js";
import { HttpError } from "../../../http.js";

let db = null;
let initialized = false;

function getDb() {
  if (!db) {
    throw new Error("Auth storage is not initialized");
  }
  return db;
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function plusMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function plusDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function plusSeconds(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function isPast(value) {
  return new Date(value).getTime() < Date.now();
}

function isSessionIdleExpired(session) {
  if (!session?.last_seen_at) {
    return false;
  }
  return Date.now() - new Date(session.last_seen_at).getTime() > config.sessionIdleTimeoutSeconds * 1000;
}

function ensureSchema(database) {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT,
      phone_number TEXT,
      status TEXT NOT NULL,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_user_id TEXT NOT NULL,
      plan_code TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      invited_by_user_id TEXT,
      joined_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (company_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS login_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      status TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      request_ip TEXT,
      delivery_provider TEXT,
      delivery_status TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      membership_id TEXT NOT NULL,
      refresh_token_hash TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      invited_by_user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      last_sent_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_login_challenges_email_created_at ON login_challenges (email, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token_hash ON sessions (refresh_token_hash);
    CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON memberships (user_id, status);
    CREATE INDEX IF NOT EXISTS idx_invitations_company_email ON invitations (company_id, email, status);
  `);
}

export async function ensureAuthStorage() {
  if (initialized) {
    return;
  }

  await fs.mkdir(config.dataDir, { recursive: true });
  db = new DatabaseSync(config.dbFilePath);
  ensureSchema(db);
  initialized = true;
}

function transaction(work) {
  const database = getDb();
  database.exec("BEGIN IMMEDIATE TRANSACTION");
  try {
    const result = work(database);
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function listActiveMembershipRows(database, userId) {
  return database.prepare(`
    SELECT memberships.*, companies.name AS company_name
    FROM memberships
    JOIN companies ON companies.id = memberships.company_id
    WHERE memberships.user_id = ? AND memberships.status = 'ACTIVE' AND companies.status = 'ACTIVE'
    ORDER BY memberships.created_at ASC
  `).all(userId);
}

function mapCompanySummary(item) {
  return {
    id: item.company_id,
    name: item.company_name,
    role: item.role,
    membershipId: item.id
  };
}

function revokeSessionRecord(database, sessionId, revokedAt = nowIso()) {
  database.prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ?`).run(revokedAt, sessionId);
}

function touchSessionRecord(database, sessionId, timestamp = nowIso()) {
  database.prepare(`UPDATE sessions SET last_seen_at = ? WHERE id = ?`).run(timestamp, sessionId);
}

function markChallengeDelivery(database, challengeId, deliveryProvider, deliveryStatus) {
  database.prepare(`
    UPDATE login_challenges
    SET delivery_provider = ?,
        delivery_status = ?
    WHERE id = ?
  `).run(deliveryProvider || null, deliveryStatus || null, challengeId);
}

function buildSessionPayload(database, session) {
  if (!session || session.revoked_at) {
    return null;
  }
  if (isPast(session.expires_at) || isSessionIdleExpired(session)) {
    return null;
  }

  const user = database.prepare(`SELECT * FROM users WHERE id = ?`).get(session.user_id);
  const membership = database.prepare(`
    SELECT memberships.*, companies.name AS company_name
    FROM memberships
    JOIN companies ON companies.id = memberships.company_id
    WHERE memberships.id = ?
  `).get(session.membership_id);
  const company = database.prepare(`SELECT * FROM companies WHERE id = ?`).get(session.company_id);

  if (!user || !membership || !company) {
    return null;
  }

    return {
      sessionId: session.id,
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
      phoneNumber: user.phone_number,
      companyId: company.id,
    companyName: company.name,
    role: membership.role,
    membershipId: membership.id,
    expiresAt: session.expires_at,
    lastSeenAt: session.last_seen_at,
    companies: listActiveMembershipRows(database, user.id).map(mapCompanySummary)
  };
}

function createSession(database, { userId, membershipId, companyId, createdAt = nowIso() }) {
  const sessionId = createId("session");
  const refreshToken = crypto.randomBytes(24).toString("base64url");
  database.prepare(`
    INSERT INTO sessions (
      id, user_id, company_id, membership_id, refresh_token_hash,
      last_seen_at, expires_at, revoked_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    userId,
    companyId,
    membershipId,
    sha256(refreshToken),
    createdAt,
    plusSeconds(config.refreshSessionMaxAgeSeconds),
    null,
    createdAt
  );

  return {
    sessionId,
    refreshToken
  };
}

export async function issueLoginChallenge({ email, token, requestIp, deliveryProvider, deliveryStatus }) {
  await ensureAuthStorage();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const database = getDb();
  const recent = database.prepare(`SELECT created_at FROM login_challenges WHERE email = ? ORDER BY created_at DESC LIMIT 1`).get(normalizedEmail);
  if (recent) {
    const elapsed = Date.now() - new Date(recent.created_at).getTime();
    if (elapsed < 60 * 1000) {
      throw new HttpError(429, "AUTH_CHALLENGE_RATE_LIMITED", "잠시 후 다시 요청해주세요");
    }
  }

  const bucketStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recentCount = database.prepare(`SELECT COUNT(*) AS count FROM login_challenges WHERE email = ? AND created_at >= ?`).get(normalizedEmail, bucketStart).count;
  if (recentCount >= 5) {
    throw new HttpError(429, "AUTH_CHALLENGE_RATE_LIMITED", "요청이 너무 많아요. 잠시 후 다시 시도해주세요");
  }

  return transaction((tx) => {
    const user = tx.prepare(`SELECT id FROM users WHERE email = ?`).get(normalizedEmail);
    const challenge = {
      id: createId("challenge"),
      userId: user?.id || null,
      email: normalizedEmail,
      tokenHash: sha256(token),
      status: "ISSUED",
      expiresAt: plusMinutes(config.authChallengeTtlMinutes),
      consumedAt: null,
      requestIp: requestIp || null,
      deliveryProvider: deliveryProvider || "PENDING",
      deliveryStatus: deliveryStatus || "PENDING",
      createdAt: nowIso()
    };

    tx.prepare(`
      UPDATE login_challenges
      SET status = 'SUPERSEDED'
      WHERE email = ? AND status = 'ISSUED'
    `).run(normalizedEmail);

    tx.prepare(`
      INSERT INTO login_challenges (
        id, user_id, email, token_hash, status, expires_at, consumed_at,
        request_ip, delivery_provider, delivery_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      challenge.id,
      challenge.userId,
      challenge.email,
      challenge.tokenHash,
      challenge.status,
      challenge.expiresAt,
      challenge.consumedAt,
      challenge.requestIp,
      challenge.deliveryProvider,
      challenge.deliveryStatus,
      challenge.createdAt
    );

    return {
      id: challenge.id,
      email: challenge.email,
      expiresAt: challenge.expiresAt
    };
  });
}

export async function updateChallengeDelivery({ challengeId, deliveryProvider, deliveryStatus }) {
  await ensureAuthStorage();
  markChallengeDelivery(getDb(), challengeId, deliveryProvider, deliveryStatus);
}

function resolveInvitation(database, invitationToken, challengeEmail, userId) {
  if (!invitationToken) {
    return null;
  }

  const invitation = database.prepare(`
    SELECT invitations.*, companies.name AS company_name
    FROM invitations
    JOIN companies ON companies.id = invitations.company_id
    WHERE invitations.token_hash = ?
  `).get(sha256(invitationToken));

  if (!invitation) {
    throw new HttpError(404, "INVITATION_NOT_FOUND", "초대 링크를 찾을 수 없어요");
  }
  if (invitation.status !== "ISSUED") {
    throw new HttpError(409, "INVITATION_NOT_AVAILABLE", "사용할 수 없는 초대 링크예요");
  }
  if (isPast(invitation.expires_at)) {
    throw new HttpError(410, "INVITATION_EXPIRED", "초대 링크가 만료됐어요");
  }
  if (invitation.email !== challengeEmail) {
    throw new HttpError(403, "INVITATION_EMAIL_MISMATCH", "초대받은 이메일과 로그인 이메일이 다릅니다");
  }

  const existingMembership = database.prepare(`SELECT * FROM memberships WHERE company_id = ? AND user_id = ?`).get(invitation.company_id, userId);
  if (existingMembership && existingMembership.status === "ACTIVE") {
    database.prepare(`UPDATE invitations SET status = 'ACCEPTED', accepted_at = ? WHERE id = ?`).run(nowIso(), invitation.id);
    return {
      membershipId: existingMembership.id,
      companyId: invitation.company_id,
      companyName: invitation.company_name,
      role: existingMembership.role
    };
  }

  const timestamp = nowIso();
  const membershipId = existingMembership?.id || createId("membership");

  if (existingMembership) {
    database.prepare(`
      UPDATE memberships
      SET role = ?, status = 'ACTIVE', invited_by_user_id = ?, joined_at = ?, updated_at = ?
      WHERE id = ?
    `).run(invitation.role, invitation.invited_by_user_id, timestamp, timestamp, membershipId);
  } else {
    database.prepare(`
      INSERT INTO memberships (
        id, company_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
    `).run(membershipId, invitation.company_id, userId, invitation.role, invitation.invited_by_user_id, timestamp, timestamp, timestamp);
  }

  database.prepare(`UPDATE invitations SET status = 'ACCEPTED', accepted_at = ? WHERE id = ?`).run(timestamp, invitation.id);
  return {
    membershipId,
    companyId: invitation.company_id,
    companyName: invitation.company_name,
    role: invitation.role
  };
}

export async function verifyLoginChallenge({ challengeId, token, displayName, companyName, invitationToken }) {
  await ensureAuthStorage();
  const tokenHash = sha256(token);

  return transaction((database) => {
    const challenge = database.prepare(`SELECT * FROM login_challenges WHERE id = ?`).get(challengeId);
    if (!challenge) {
      throw new HttpError(404, "AUTH_CHALLENGE_NOT_FOUND", "로그인 요청을 찾을 수 없어요");
    }
    if (challenge.status !== "ISSUED") {
      throw new HttpError(409, "AUTH_CHALLENGE_NOT_AVAILABLE", "이미 사용했거나 만료된 로그인 요청이에요");
    }
    if (challenge.token_hash !== tokenHash) {
      throw new HttpError(403, "AUTH_CHALLENGE_INVALID", "로그인 링크가 올바르지 않아요");
    }
    if (isPast(challenge.expires_at)) {
      throw new HttpError(410, "AUTH_CHALLENGE_EXPIRED", "로그인 링크가 만료됐어요");
    }

    let user = database.prepare(`SELECT * FROM users WHERE email = ?`).get(challenge.email);
    if (!user) {
      const timestamp = nowIso();
      user = {
        id: createId("user"),
        email: challenge.email,
        display_name: String(displayName || challenge.email.split("@")[0]).trim(),
        phone_number: null,
        status: "ACTIVE",
        last_login_at: null,
        created_at: timestamp,
        updated_at: timestamp
      };
      database.prepare(`
        INSERT INTO users (
          id, email, display_name, phone_number, status, last_login_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        user.email,
        user.display_name,
        user.phone_number,
        user.status,
        user.last_login_at,
        user.created_at,
        user.updated_at
      );
    }

    const invitedMembership = resolveInvitation(database, invitationToken, challenge.email, user.id);
    let memberships = listActiveMembershipRows(database, user.id);

    if (!invitedMembership && memberships.length === 0 && !String(companyName || "").trim()) {
      throw new HttpError(409, "AUTH_SETUP_REQUIRED", "최초 로그인이라 업체 이름이 필요합니다.", {
        companyName: "REQUIRED"
      });
    }

    if (!invitedMembership && memberships.length === 0) {
      const timestamp = nowIso();
      const company = {
        id: createId("company"),
        name: String(companyName).trim(),
        owner_user_id: user.id,
        plan_code: "BASIC",
        status: "ACTIVE",
        created_at: timestamp,
        updated_at: timestamp
      };
      const membership = {
        id: createId("membership"),
        company_id: company.id,
        user_id: user.id,
        role: "OWNER",
        status: "ACTIVE",
        invited_by_user_id: user.id,
        joined_at: timestamp,
        created_at: timestamp,
        updated_at: timestamp
      };

      database.prepare(`INSERT INTO companies (id, name, owner_user_id, plan_code, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        company.id,
        company.name,
        company.owner_user_id,
        company.plan_code,
        company.status,
        company.created_at,
        company.updated_at
      );
      database.prepare(`
        INSERT INTO memberships (
          id, company_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        membership.id,
        membership.company_id,
        membership.user_id,
        membership.role,
        membership.status,
        membership.invited_by_user_id,
        membership.joined_at,
        membership.created_at,
        membership.updated_at
      );
      memberships = listActiveMembershipRows(database, user.id);
    } else if (invitedMembership) {
      memberships = listActiveMembershipRows(database, user.id);
    }

    const selectedMembership = invitedMembership
      ? memberships.find((item) => item.company_id === invitedMembership.companyId)
      : memberships[0];

    if (!selectedMembership) {
      throw new HttpError(500, "AUTH_MEMBERSHIP_RESOLUTION_FAILED", "회사 정보를 불러오지 못했습니다.");
    }

    const timestamp = nowIso();
    const session = createSession(database, {
      userId: user.id,
      membershipId: selectedMembership.id,
      companyId: selectedMembership.company_id,
      createdAt: timestamp
    });

    database.prepare(`UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?`).run(timestamp, timestamp, user.id);
    database.prepare(`UPDATE login_challenges SET status = 'CONSUMED', consumed_at = ? WHERE id = ?`).run(timestamp, challenge.id);

    return {
      sessionId: session.sessionId,
      refreshToken: session.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name
      },
      company: {
        id: selectedMembership.company_id,
        name: selectedMembership.company_name,
        role: selectedMembership.role
      },
      companies: memberships.map(mapCompanySummary)
    };
  });
}

export async function getSessionContext(sessionId) {
  await ensureAuthStorage();
  return transaction((database) => {
    const session = database.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId);
    if (!session || session.revoked_at) {
      return null;
    }
    if (isPast(session.expires_at) || isSessionIdleExpired(session)) {
      revokeSessionRecord(database, session.id);
      return null;
    }

    const touchedAt = nowIso();
    touchSessionRecord(database, session.id, touchedAt);
    return buildSessionPayload(database, { ...session, last_seen_at: touchedAt });
  });
}

export async function refreshSessionByRefreshToken(refreshToken) {
  await ensureAuthStorage();
  return transaction((database) => {
    const session = database.prepare(`SELECT * FROM sessions WHERE refresh_token_hash = ?`).get(sha256(refreshToken));
    if (!session || session.revoked_at) {
      throw new HttpError(401, "AUTH_REFRESH_INVALID", "세션을 다시 시작해주세요");
    }
    if (isPast(session.expires_at)) {
      revokeSessionRecord(database, session.id);
      throw new HttpError(401, "AUTH_REFRESH_EXPIRED", "세션이 만료됐어요. 다시 로그인해주세요");
    }
    if (isSessionIdleExpired(session)) {
      revokeSessionRecord(database, session.id);
      throw new HttpError(401, "AUTH_SESSION_IDLE_EXPIRED", "오래 사용하지 않아 세션이 종료됐어요. 다시 로그인해주세요");
    }

    const rotatedAt = nowIso();
    const nextSession = createSession(database, {
      userId: session.user_id,
      membershipId: session.membership_id,
      companyId: session.company_id,
      createdAt: rotatedAt
    });
    revokeSessionRecord(database, session.id, rotatedAt);

    const context = buildSessionPayload(database, database.prepare(`SELECT * FROM sessions WHERE id = ?`).get(nextSession.sessionId));
    if (!context) {
      throw new HttpError(401, "AUTH_SESSION_INVALID", "세션이 유효하지 않아요. 다시 로그인해주세요");
    }

    return {
      sessionId: nextSession.sessionId,
      refreshToken: nextSession.refreshToken,
      user: {
        id: context.userId,
        email: context.email,
        displayName: context.displayName
      },
      company: {
        id: context.companyId,
        name: context.companyName,
        role: context.role
      },
      companies: context.companies
    };
  });
}

export async function revokeSession(sessionId) {
  await ensureAuthStorage();
  revokeSessionRecord(getDb(), sessionId);
}

export async function listSessionsByUser(userId) {
  await ensureAuthStorage();
  const database = getDb();
  return database.prepare(`
    SELECT sessions.id, sessions.company_id, sessions.membership_id, sessions.last_seen_at, sessions.expires_at, sessions.revoked_at, sessions.created_at,
           companies.name AS company_name, memberships.role
    FROM sessions
    JOIN memberships ON memberships.id = sessions.membership_id
    JOIN companies ON companies.id = sessions.company_id
    WHERE sessions.user_id = ?
    ORDER BY COALESCE(sessions.last_seen_at, sessions.created_at) DESC
  `).all(userId).map((item) => ({
    id: item.id,
    companyId: item.company_id,
    companyName: item.company_name,
    role: item.role,
    membershipId: item.membership_id,
    lastSeenAt: item.last_seen_at,
    expiresAt: item.expires_at,
    revokedAt: item.revoked_at,
    createdAt: item.created_at
  }));
}

export async function listRecentChallengesByEmail(email, limit = 5) {
  await ensureAuthStorage();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return [];
  }

  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 20) : 5;
  const database = getDb();
  return database.prepare(`
    SELECT id, email, status, delivery_provider, delivery_status, expires_at, consumed_at, created_at
    FROM login_challenges
    WHERE email = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(normalizedEmail, safeLimit).map((item) => ({
    id: item.id,
    email: item.email,
    status: item.status,
    deliveryProvider: item.delivery_provider,
    deliveryStatus: item.delivery_status,
    expiresAt: item.expires_at,
    consumedAt: item.consumed_at,
    createdAt: item.created_at
  }));
}

export async function revokeOwnedSession({ userId, sessionId }) {
  await ensureAuthStorage();
  return transaction((database) => {
    const session = database.prepare(`SELECT * FROM sessions WHERE id = ? LIMIT 1`).get(sessionId);
    if (!session || session.user_id !== userId) {
      throw new HttpError(404, "AUTH_SESSION_NOT_FOUND", "세션 정보를 찾을 수 없어요.");
    }
    if (session.revoked_at) {
      return {
        id: session.id,
        revokedAt: session.revoked_at
      };
    }
    const revokedAt = nowIso();
    revokeSessionRecord(database, session.id, revokedAt);
    return {
      id: session.id,
      revokedAt
    };
  });
}

export async function revokeSessionByRefreshToken(refreshToken) {
  await ensureAuthStorage();
  const database = getDb();
  const session = database.prepare(`SELECT * FROM sessions WHERE refresh_token_hash = ?`).get(sha256(refreshToken));
  if (session) {
    revokeSessionRecord(database, session.id);
  }
}

function normalizeProfileDisplayName(value, fallbackEmail = "") {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new HttpError(422, "PROFILE_DISPLAY_NAME_REQUIRED", "표시 이름을 입력해주세요.");
  }
  if (normalized.length > 60) {
    throw new HttpError(422, "PROFILE_DISPLAY_NAME_TOO_LONG", "표시 이름은 60자 이내로 입력해주세요.");
  }
  return normalized || String(fallbackEmail || "").split("@")[0];
}

function normalizeProfilePhoneNumber(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > 30) {
    throw new HttpError(422, "PROFILE_PHONE_TOO_LONG", "연락처는 30자 이내로 입력해주세요.");
  }
  return normalized;
}

function assertInvitationRole(role) {
  if (!["MANAGER", "STAFF"].includes(role)) {
    throw new HttpError(422, "INVITATION_ROLE_INVALID", "초대 역할이 올바르지 않습니다.");
  }
}

function buildInvitationRecord(database, { companyId, companyName, email, role, invitedByUserId }) {
  const invitationToken = crypto.randomBytes(24).toString("base64url");
  const invitation = {
    id: createId("invite"),
    companyId,
    companyName,
    email,
    role,
    invitedByUserId,
    status: "ISSUED",
    tokenHash: sha256(invitationToken),
    expiresAt: plusDays(7),
    acceptedAt: null,
    lastSentAt: nowIso(),
    createdAt: nowIso()
  };

  database.prepare(`
    INSERT INTO invitations (
      id, company_id, email, role, invited_by_user_id, status, token_hash,
      expires_at, accepted_at, last_sent_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invitation.id,
    invitation.companyId,
    invitation.email,
    invitation.role,
    invitation.invitedByUserId,
    invitation.status,
    invitation.tokenHash,
    invitation.expiresAt,
    invitation.acceptedAt,
    invitation.lastSentAt,
    invitation.createdAt
  );

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    companyId: invitation.companyId,
    companyName: invitation.companyName,
    expiresAt: invitation.expiresAt,
    invitationToken
  };
}

function mapInvitationRow(item) {
  return {
    id: item.id,
    email: item.email,
    role: item.role,
    status: item.status,
    expiresAt: item.expires_at,
    acceptedAt: item.accepted_at,
    lastSentAt: item.last_sent_at,
    createdAt: item.created_at
  };
}

export async function updateUserProfile({ userId, displayName, phoneNumber }) {
  await ensureAuthStorage();
  return transaction((database) => {
    const user = database.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).get(userId);
    if (!user) {
      throw new HttpError(404, "USER_NOT_FOUND", "계정 정보를 찾을 수 없어요.");
    }

    const nextDisplayName = normalizeProfileDisplayName(displayName, user.email);
    const nextPhoneNumber = normalizeProfilePhoneNumber(phoneNumber);
    const updatedAt = nowIso();

    database.prepare(`
      UPDATE users
      SET display_name = ?, phone_number = ?, updated_at = ?
      WHERE id = ?
    `).run(nextDisplayName, nextPhoneNumber, updatedAt, userId);

    return {
      id: user.id,
      email: user.email,
      displayName: nextDisplayName,
      phoneNumber: nextPhoneNumber,
      updatedAt
    };
  });
}

export async function listCompaniesForUser(userId) {
  await ensureAuthStorage();
  return listActiveMembershipRows(getDb(), userId).map(mapCompanySummary);
}

export async function switchSessionCompany({ sessionId, userId, companyId }) {
  await ensureAuthStorage();
  return transaction((database) => {
    const session = database.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId);
    if (!session || session.user_id !== userId || session.revoked_at) {
      throw new HttpError(401, "AUTH_SESSION_INVALID", "세션이 유효하지 않아요.");
    }
    if (isPast(session.expires_at) || isSessionIdleExpired(session)) {
      revokeSessionRecord(database, session.id);
      throw new HttpError(401, "AUTH_SESSION_INVALID", "세션이 만료되어 다시 로그인이 필요합니다.");
    }

    const membership = database.prepare(`
      SELECT memberships.*, companies.name AS company_name
      FROM memberships
      JOIN companies ON companies.id = memberships.company_id
      WHERE memberships.user_id = ? AND memberships.company_id = ? AND memberships.status = 'ACTIVE'
    `).get(userId, companyId);

    if (!membership) {
      throw new HttpError(403, "COMPANY_ACCESS_DENIED", "접근할 수 없는 업체입니다.");
    }

    const touchedAt = nowIso();
    database.prepare(`UPDATE sessions SET company_id = ?, membership_id = ?, last_seen_at = ? WHERE id = ?`).run(companyId, membership.id, touchedAt, sessionId);

    return {
      company: {
        id: companyId,
        name: membership.company_name,
        role: membership.role
      },
      companies: listActiveMembershipRows(database, userId).map(mapCompanySummary)
    };
  });
}

export async function createInvitation({ companyId, email, role, invitedByUserId }) {
  await ensureAuthStorage();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new HttpError(422, "INVITATION_EMAIL_REQUIRED", "초대할 이메일이 필요합니다.");
  }
  assertInvitationRole(role);

  return transaction((database) => {
    const company = database.prepare(`SELECT * FROM companies WHERE id = ?`).get(companyId);
    if (!company) {
      throw new HttpError(404, "COMPANY_NOT_FOUND", "업체를 찾을 수 없어요");
    }

    const recent = database.prepare(`
      SELECT * FROM invitations
      WHERE company_id = ? AND email = ? AND status = 'ISSUED'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(companyId, normalizedEmail);

    if (recent && Date.now() - new Date(recent.created_at).getTime() < 5 * 60 * 1000) {
      throw new HttpError(429, "INVITATION_RATE_LIMITED", "잠시 후 다시 초대해주세요.");
    }

    return buildInvitationRecord(database, {
      companyId,
      companyName: company.name,
      email: normalizedEmail,
      role,
      invitedByUserId
    });
  });
}

export async function reissueInvitation({ companyId, invitationId, invitedByUserId }) {
  await ensureAuthStorage();
  return transaction((database) => {
    const invitation = database.prepare(`
      SELECT invitations.*, companies.name AS company_name
      FROM invitations
      JOIN companies ON companies.id = invitations.company_id
      WHERE invitations.id = ? AND invitations.company_id = ?
      LIMIT 1
    `).get(invitationId, companyId);

    if (!invitation) {
      throw new HttpError(404, "INVITATION_NOT_FOUND", "초대 정보를 찾을 수 없어요.");
    }
    if (invitation.status !== "ISSUED") {
      throw new HttpError(409, "INVITATION_NOT_ACTIVE", "다시 보낼 수 있는 초대 상태가 아닙니다.");
    }
    if (Date.now() - new Date(invitation.last_sent_at).getTime() < 60 * 1000) {
      throw new HttpError(429, "INVITATION_RESEND_RATE_LIMITED", "방금 초대를 보냈습니다. 잠시 후 다시 시도해주세요.");
    }

    database.prepare(`
      UPDATE invitations
      SET status = 'REVOKED'
      WHERE id = ?
    `).run(invitation.id);

    return buildInvitationRecord(database, {
      companyId,
      companyName: invitation.company_name,
      email: invitation.email,
      role: invitation.role,
      invitedByUserId: invitedByUserId || invitation.invited_by_user_id
    });
  });
}

export async function revokeInvitation({ companyId, invitationId }) {
  await ensureAuthStorage();
  return transaction((database) => {
    const invitation = database.prepare(`
      SELECT *
      FROM invitations
      WHERE id = ? AND company_id = ?
      LIMIT 1
    `).get(invitationId, companyId);

    if (!invitation) {
      throw new HttpError(404, "INVITATION_NOT_FOUND", "초대 정보를 찾을 수 없어요.");
    }
    if (invitation.status === "ACCEPTED") {
      throw new HttpError(409, "INVITATION_ALREADY_ACCEPTED", "이미 수락된 초대는 취소할 수 없습니다.");
    }
    if (invitation.status !== "REVOKED") {
      database.prepare(`
        UPDATE invitations
        SET status = 'REVOKED'
        WHERE id = ?
      `).run(invitation.id);
      invitation.status = "REVOKED";
    }

    return mapInvitationRow(invitation);
  });
}

export async function listMembershipsByCompany(companyId) {
  await ensureAuthStorage();
  const database = getDb();
  return database.prepare(`
    SELECT memberships.id, memberships.role, memberships.status, memberships.joined_at,
           users.email, users.display_name
    FROM memberships
    JOIN users ON users.id = memberships.user_id
    WHERE memberships.company_id = ?
    ORDER BY memberships.created_at ASC
  `).all(companyId).map((item) => ({
    id: item.id,
    role: item.role,
    status: item.status,
    joinedAt: item.joined_at,
    email: item.email,
    displayName: item.display_name
  }));
}

export async function listInvitationsByCompany(companyId) {
  await ensureAuthStorage();
  const database = getDb();
  return database.prepare(`
    SELECT id, email, role, status, expires_at, accepted_at, last_sent_at, created_at
    FROM invitations
    WHERE company_id = ?
    ORDER BY created_at DESC
  `).all(companyId).map((item) => mapInvitationRow(item));
}
