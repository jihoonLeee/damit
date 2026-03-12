import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { createRepositoryBundle } from "../src/repositories/createRepositoryBundle.js";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

function createStatefulAuthPool() {
  const state = {
    users: [],
    companies: [],
    memberships: [],
    loginChallenges: [],
    sessions: [],
    invitations: []
  };
  const calls = [];

  async function runQuery(sql, params = []) {
    const normalizedSql = normalizeSql(sql);
    calls.push({ sql: normalizedSql, params });

    if (normalizedSql === "BEGIN" || normalizedSql === "COMMIT" || normalizedSql === "ROLLBACK") {
      return { rows: [] };
    }

    if (normalizedSql.includes("SELECT created_at FROM login_challenges WHERE email = $1 ORDER BY created_at DESC LIMIT 1")) {
      const rows = state.loginChallenges
        .filter((item) => item.email === params[0])
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, 1)
        .map((item) => ({ created_at: item.created_at }));
      return { rows };
    }

    if (normalizedSql.includes("SELECT COUNT(*)::int AS count FROM login_challenges WHERE email = $1 AND created_at >= $2")) {
      const count = state.loginChallenges.filter((item) => item.email === params[0] && item.created_at >= params[1]).length;
      return { rows: [{ count }] };
    }

    if (normalizedSql.includes("SELECT id FROM users WHERE email = $1 LIMIT 1")) {
      const row = state.users.find((item) => item.email === params[0]);
      return { rows: row ? [{ id: row.id }] : [] };
    }

    if (normalizedSql.includes("SELECT * FROM users WHERE email = $1 LIMIT 1")) {
      const row = state.users.find((item) => item.email === params[0]);
      return { rows: row ? [{ ...row }] : [] };
    }

    if (normalizedSql.includes("SELECT * FROM users WHERE id = $1 LIMIT 1")) {
      const row = state.users.find((item) => item.id === params[0]);
      return { rows: row ? [{ ...row }] : [] };
    }

    if (normalizedSql.includes("INSERT INTO users (")) {
      const row = {
        id: params[0],
        email: params[1],
        display_name: params[2],
        phone_number: params[3],
        status: params[4],
        last_login_at: params[5],
        created_at: params[6],
        updated_at: params[7]
      };
      state.users.push(row);
      return { rows: [] };
    }

    if (normalizedSql.includes("INSERT INTO login_challenges (")) {
      const row = {
        id: params[0],
        user_id: params[1],
        email: params[2],
        token_hash: params[3],
        status: params[4],
        expires_at: params[5],
        consumed_at: params[6],
        request_ip: params[7],
        delivery_provider: params[8],
        delivery_status: params[9],
        created_at: params[10]
      };
      state.loginChallenges.push(row);
      return { rows: [] };
    }

    if (normalizedSql.includes("SELECT * FROM login_challenges WHERE id = $1 LIMIT 1 FOR UPDATE")) {
      const row = state.loginChallenges.find((item) => item.id === params[0]);
      return { rows: row ? [{ ...row }] : [] };
    }

    if (normalizedSql.includes("UPDATE login_challenges SET status = 'CONSUMED', consumed_at = $1 WHERE id = $2")) {
      const row = state.loginChallenges.find((item) => item.id === params[1]);
      if (row) {
        row.status = "CONSUMED";
        row.consumed_at = params[0];
      }
      return { rows: [] };
    }

    if (normalizedSql.includes("SELECT * FROM companies WHERE id = $1 LIMIT 1")) {
      const row = state.companies.find((item) => item.id === params[0]);
      return { rows: row ? [{ ...row }] : [] };
    }

    if (normalizedSql.includes("INSERT INTO companies (id, name, owner_user_id, plan_code, status, created_at, updated_at) VALUES")) {
      const row = {
        id: params[0],
        name: params[1],
        owner_user_id: params[2],
        plan_code: params[3],
        status: params[4],
        created_at: params[5],
        updated_at: params[6]
      };
      state.companies.push(row);
      return { rows: [] };
    }

    if (normalizedSql.includes("SELECT memberships.id AS membership_id,") && normalizedSql.includes("WHERE memberships.user_id = $1") && normalizedSql.includes("ORDER BY memberships.created_at ASC")) {
      const rows = state.memberships
        .filter((item) => item.user_id === params[0] && item.status === "ACTIVE")
        .map((item) => {
          const company = state.companies.find((companyItem) => companyItem.id === item.company_id && companyItem.status === "ACTIVE");
          if (!company) {
            return null;
          }
          return {
            membership_id: item.id,
            company_id: item.company_id,
            role: item.role,
            company_name: company.name,
            created_at: item.created_at
          };
        })
        .filter(Boolean)
        .sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
      return { rows };
    }

    if (normalizedSql.includes("SELECT * FROM memberships WHERE company_id = $1 AND user_id = $2 LIMIT 1 FOR UPDATE")) {
      const row = state.memberships.find((item) => item.company_id === params[0] && item.user_id === params[1]);
      return { rows: row ? [{ ...row }] : [] };
    }

    if (normalizedSql.includes("INSERT INTO memberships (") && normalizedSql.includes("VALUES ($1, $2, $3, $4,")) {
      const usesLiteralActive = normalizedSql.includes("'ACTIVE'");
      const row = {
        id: params[0],
        company_id: params[1],
        user_id: params[2],
        role: params[3],
        status: usesLiteralActive ? "ACTIVE" : params[4],
        invited_by_user_id: usesLiteralActive ? params[4] : params[5],
        joined_at: usesLiteralActive ? params[5] : params[6],
        created_at: usesLiteralActive ? params[6] : params[7],
        updated_at: usesLiteralActive ? params[7] : params[8]
      };
      state.memberships.push(row);
      return { rows: [] };
    }

    if (normalizedSql.includes("UPDATE memberships SET role = $1, status = 'ACTIVE', invited_by_user_id = $2, joined_at = $3, updated_at = $4 WHERE id = $5")) {
      const row = state.memberships.find((item) => item.id === params[4]);
      if (row) {
        row.role = params[0];
        row.status = "ACTIVE";
        row.invited_by_user_id = params[1];
        row.joined_at = params[2];
        row.updated_at = params[3];
      }
      return { rows: [] };
    }

    if (normalizedSql.includes("SELECT invitations.*, companies.name AS company_name FROM invitations JOIN companies ON companies.id = invitations.company_id WHERE invitations.token_hash = $1 LIMIT 1 FOR UPDATE")) {
      const invitation = state.invitations.find((item) => item.token_hash === params[0]);
      if (!invitation) {
        return { rows: [] };
      }
      const company = state.companies.find((item) => item.id === invitation.company_id);
      return { rows: [{ ...invitation, company_name: company?.name || null }] };
    }

    if (normalizedSql.includes("UPDATE invitations SET status = 'ACCEPTED', accepted_at = $1 WHERE id = $2")) {
      const row = state.invitations.find((item) => item.id === params[1]);
      if (row) {
        row.status = "ACCEPTED";
        row.accepted_at = params[0];
      }
      return { rows: [] };
    }

    if (normalizedSql.includes("SELECT * FROM invitations WHERE company_id = $1 AND email = $2 AND status = 'ISSUED' ORDER BY created_at DESC LIMIT 1")) {
      const row = state.invitations
        .filter((item) => item.company_id === params[0] && item.email === params[1] && item.status === "ISSUED")
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
      return { rows: row ? [{ ...row }] : [] };
    }

    if (normalizedSql.includes("INSERT INTO invitations (") && normalizedSql.includes("expires_at, accepted_at, last_sent_at, created_at")) {
      const row = {
        id: params[0],
        company_id: params[1],
        email: params[2],
        role: params[3],
        invited_by_user_id: params[4],
        status: params[5],
        token_hash: params[6],
        expires_at: params[7],
        accepted_at: params[8],
        last_sent_at: params[9],
        created_at: params[10]
      };
      state.invitations.push(row);
      return { rows: [] };
    }

    if (normalizedSql.includes("SELECT memberships.*, companies.name AS company_name FROM memberships JOIN companies ON companies.id = memberships.company_id WHERE memberships.id = $1 LIMIT 1")) {
      const membership = state.memberships.find((item) => item.id === params[0]);
      if (!membership) {
        return { rows: [] };
      }
      const company = state.companies.find((item) => item.id === membership.company_id);
      return { rows: [{ ...membership, company_name: company?.name || null }] };
    }

    if (normalizedSql.includes("INSERT INTO sessions (")) {
      const row = {
        id: params[0],
        user_id: params[1],
        company_id: params[2],
        membership_id: params[3],
        refresh_token_hash: params[4],
        last_seen_at: params[5],
        expires_at: params[6],
        revoked_at: params[7],
        created_at: params[8]
      };
      state.sessions.push(row);
      return { rows: [] };
    }

    if (normalizedSql.includes("UPDATE users SET last_login_at = $1, updated_at = $2 WHERE id = $3")) {
      const row = state.users.find((item) => item.id === params[2]);
      if (row) {
        row.last_login_at = params[0];
        row.updated_at = params[1];
      }
      return { rows: [] };
    }

    if (normalizedSql.includes("SELECT * FROM sessions WHERE id = $1 LIMIT 1 FOR UPDATE")) {
      const row = state.sessions.find((item) => item.id === params[0]);
      return { rows: row ? [{ ...row }] : [] };
    }

    if (normalizedSql.includes("SELECT * FROM sessions WHERE id = $1 LIMIT 1")) {
      const row = state.sessions.find((item) => item.id === params[0]);
      return { rows: row ? [{ ...row }] : [] };
    }

    if (normalizedSql.includes("SELECT * FROM sessions WHERE refresh_token_hash = $1 LIMIT 1 FOR UPDATE")) {
      const row = state.sessions.find((item) => item.refresh_token_hash === params[0]);
      return { rows: row ? [{ ...row }] : [] };
    }

    if (normalizedSql.includes("UPDATE sessions SET last_seen_at = $1, refresh_token_hash = $2 WHERE id = $3")) {
      const row = state.sessions.find((item) => item.id === params[2]);
      if (row) {
        row.last_seen_at = params[0];
        row.refresh_token_hash = params[1];
      }
      return { rows: [] };
    }

    if (normalizedSql.includes("UPDATE sessions SET revoked_at = $1 WHERE id = $2")) {
      const row = state.sessions.find((item) => item.id === params[1]);
      if (row) {
        row.revoked_at = params[0];
      }
      return { rows: [] };
    }

    if (normalizedSql.includes("UPDATE sessions SET revoked_at = $1 WHERE refresh_token_hash = $2")) {
      const row = state.sessions.find((item) => item.refresh_token_hash === params[1]);
      if (row) {
        row.revoked_at = params[0];
      }
      return { rows: [] };
    }

    if (normalizedSql.includes("SELECT memberships.*, companies.name AS company_name FROM memberships JOIN companies ON companies.id = memberships.company_id WHERE memberships.user_id = $1 AND memberships.company_id = $2 AND memberships.status = 'ACTIVE' LIMIT 1")) {
      const membership = state.memberships.find((item) => item.user_id === params[0] && item.company_id === params[1] && item.status === "ACTIVE");
      if (!membership) {
        return { rows: [] };
      }
      const company = state.companies.find((item) => item.id === membership.company_id);
      return { rows: [{ ...membership, company_name: company?.name || null }] };
    }

    if (normalizedSql.includes("UPDATE sessions SET company_id = $1, membership_id = $2, last_seen_at = $3 WHERE id = $4")) {
      const row = state.sessions.find((item) => item.id === params[3]);
      if (row) {
        row.company_id = params[0];
        row.membership_id = params[1];
        row.last_seen_at = params[2];
      }
      return { rows: [] };
    }

    if (normalizedSql.includes("SELECT memberships.id, memberships.role, memberships.status, memberships.joined_at,") && normalizedSql.includes("JOIN users ON users.id = memberships.user_id") && normalizedSql.includes("WHERE memberships.company_id = $1")) {
      const rows = state.memberships
        .filter((item) => item.company_id === params[0])
        .sort((a, b) => (a.created_at > b.created_at ? 1 : -1))
        .map((membership) => {
          const user = state.users.find((item) => item.id === membership.user_id);
          return {
            id: membership.id,
            role: membership.role,
            status: membership.status,
            joined_at: membership.joined_at,
            email: user?.email || null,
            display_name: user?.display_name || null,
            created_at: membership.created_at
          };
        });
      return { rows };
    }

    if (normalizedSql.includes("SELECT id, email, role, status, expires_at, accepted_at, last_sent_at, created_at FROM invitations WHERE company_id = $1 ORDER BY created_at DESC")) {
      const rows = state.invitations
        .filter((item) => item.company_id === params[0])
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .map((item) => ({ ...item }));
      return { rows };
    }

    throw new Error(`Unhandled query in auth fake pool: ${normalizedSql}`);
  }

  const client = {
    query: runQuery,
    release() {
      return undefined;
    }
  };

  return {
    state,
    calls,
    async query(sql, params = []) {
      return runQuery(sql, params);
    },
    async connect() {
      return client;
    },
    async end() {
      return undefined;
    }
  };
}

test("postgres auth repository supports login, refresh, invitations, and company context switching", async () => {
  const pool = createStatefulAuthPool();
  const bundle = createRepositoryBundle({ engine: "POSTGRES", pool });

  const ownerOneToken = "token-owner-one";
  const ownerOneChallenge = await bundle.authRepository.issueChallenge({
    email: "owner-one@example.com",
    token: ownerOneToken,
    requestIp: "127.0.0.1",
    deliveryProvider: "FILE",
    deliveryStatus: "PENDING"
  });
  const ownerOneVerified = await bundle.authRepository.verifyChallenge({
    challengeId: ownerOneChallenge.id,
    token: ownerOneToken,
    displayName: "오너원",
    companyName: "다밋 클린 1호점"
  });

  assert.equal(ownerOneVerified.user.email, "owner-one@example.com");
  assert.equal(ownerOneVerified.company.name, "다밋 클린 1호점");
  assert.equal(ownerOneVerified.company.role, "OWNER");

  const ownerOneSession = await bundle.authRepository.getSessionContext(ownerOneVerified.sessionId);
  assert.equal(ownerOneSession.companyName, "다밋 클린 1호점");
  assert.equal(ownerOneSession.companies.length, 1);

  const refreshed = await bundle.authRepository.refreshSessionByRefreshToken(ownerOneVerified.refreshToken);
  assert.equal(refreshed.company.name, "다밋 클린 1호점");
  assert.notEqual(refreshed.refreshToken, ownerOneVerified.refreshToken);

  const ownerTwoToken = "token-owner-two";
  const ownerTwoChallenge = await bundle.authRepository.issueChallenge({
    email: "owner-two@example.com",
    token: ownerTwoToken,
    requestIp: "127.0.0.1",
    deliveryProvider: "FILE",
    deliveryStatus: "PENDING"
  });
  const ownerTwoVerified = await bundle.authRepository.verifyChallenge({
    challengeId: ownerTwoChallenge.id,
    token: ownerTwoToken,
    displayName: "오너투",
    companyName: "다밋 클린 2호점"
  });

  const invite = await bundle.authRepository.createInvitation({
    companyId: ownerTwoVerified.company.id,
    email: "owner-one@example.com",
    role: "MANAGER",
    invitedByUserId: ownerTwoVerified.user.id
  });
  assert.equal(invite.companyName, "다밋 클린 2호점");

  const inviteList = await bundle.authRepository.listInvitationsByCompany(ownerTwoVerified.company.id);
  assert.equal(inviteList.length, 1);
  assert.equal(inviteList[0].status, "ISSUED");

  for (const challenge of pool.state.loginChallenges.filter((item) => item.email === "owner-one@example.com")) {
    challenge.created_at = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  }

  const ownerOneJoinToken = "token-owner-one-join";
  const ownerOneJoinChallenge = await bundle.authRepository.issueChallenge({
    email: "owner-one@example.com",
    token: ownerOneJoinToken,
    requestIp: "127.0.0.1",
    deliveryProvider: "FILE",
    deliveryStatus: "PENDING"
  });
  const joined = await bundle.authRepository.verifyChallenge({
    challengeId: ownerOneJoinChallenge.id,
    token: ownerOneJoinToken,
    invitationToken: invite.invitationToken
  });

  assert.equal(joined.company.id, ownerTwoVerified.company.id);
  assert.equal(joined.company.role, "MANAGER");
  assert.equal(joined.companies.length, 2);

  const companies = await bundle.authRepository.listCompaniesForUser(ownerOneVerified.user.id);
  assert.equal(companies.length, 2);

  const switched = await bundle.authRepository.switchSessionCompany({
    sessionId: joined.sessionId,
    userId: ownerOneVerified.user.id,
    companyId: ownerOneVerified.company.id
  });
  assert.equal(switched.company.id, ownerOneVerified.company.id);
  assert.equal(switched.company.role, "OWNER");

  const memberships = await bundle.authRepository.listMembershipsByCompany(ownerOneVerified.company.id);
  assert.equal(memberships.length, 1);
  assert.equal(memberships[0].email, "owner-one@example.com");

  await bundle.authRepository.revokeSession(joined.sessionId);
  const revokedContext = await bundle.authRepository.getSessionContext(joined.sessionId);
  assert.equal(revokedContext, null);

  await bundle.authRepository.revokeSessionByRefreshToken(refreshed.refreshToken);
  const revokedRefreshSession = pool.state.sessions.find((item) => item.id === refreshed.sessionId);
  assert.ok(revokedRefreshSession.revoked_at);

  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO login_challenges")));
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO sessions")));
  assert.ok(pool.calls.some((call) => call.sql.includes("INSERT INTO invitations")));
  assert.ok(pool.calls.some((call) => call.sql.includes("UPDATE sessions SET company_id = $1, membership_id = $2, last_seen_at = $3 WHERE id = $4")));

  await bundle.close();
});

