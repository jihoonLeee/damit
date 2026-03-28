import crypto from "node:crypto";
import fs from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

import { config } from "../../../config.js";
import { HttpError } from "../../../http.js";

let db = null;
let initialized = false;

function getDb() {
  if (!db) {
    throw new Error("Customer confirmation storage is not initialized");
  }
  return db;
}

function nowIso() {
  return new Date().toISOString();
}

function plusHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function mapLink(row) {
  return row
    ? {
        id: row.id,
        jobCaseId: row.job_case_id,
        companyId: row.company_id,
        createdByUserId: row.created_by_user_id,
        status: row.status,
        expiresAt: row.expires_at,
        viewedAt: row.viewed_at,
        confirmedAt: row.confirmed_at,
        confirmationNote: row.confirmation_note,
        requestIp: row.request_ip,
        userAgent: row.user_agent,
        revokedAt: row.revoked_at,
        deliveryChannel: row.delivery_channel || null,
        deliveryProvider: row.delivery_provider || null,
        deliveryStatus: row.delivery_status || null,
        deliveryDestination: row.delivery_destination || null,
        deliveryRequestedAt: row.delivery_requested_at || null,
        deliveryCompletedAt: row.delivery_completed_at || null,
        deliveryMessageId: row.delivery_message_id || null,
        deliveryErrorCode: row.delivery_error_code || null,
        deliveryErrorMessage: row.delivery_error_message || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    : null;
}

function ensureColumn(database, tableName, columnName, definition) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some((column) => column.name === columnName)) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function ensureSchema(database) {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS customer_confirmation_links (
      id TEXT PRIMARY KEY,
      job_case_id TEXT NOT NULL,
      company_id TEXT,
      created_by_user_id TEXT,
      token_hash TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      viewed_at TEXT,
      confirmed_at TEXT,
      confirmation_note TEXT,
      request_ip TEXT,
      user_agent TEXT,
      revoked_at TEXT,
      delivery_channel TEXT,
      delivery_provider TEXT,
      delivery_status TEXT,
      delivery_destination TEXT,
      delivery_requested_at TEXT,
      delivery_completed_at TEXT,
      delivery_message_id TEXT,
      delivery_error_code TEXT,
      delivery_error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_confirmation_events (
      id TEXT PRIMARY KEY,
      link_id TEXT NOT NULL,
      job_case_id TEXT NOT NULL,
      company_id TEXT,
      event_type TEXT NOT NULL,
      note TEXT,
      request_ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customer_confirmation_links_job_created
      ON customer_confirmation_links (job_case_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_customer_confirmation_links_status
      ON customer_confirmation_links (status, expires_at);
    CREATE INDEX IF NOT EXISTS idx_customer_confirmation_events_link_created
      ON customer_confirmation_events (link_id, created_at ASC);
  `);

  ensureColumn(database, "customer_confirmation_links", "delivery_channel", "TEXT");
  ensureColumn(database, "customer_confirmation_links", "delivery_provider", "TEXT");
  ensureColumn(database, "customer_confirmation_links", "delivery_status", "TEXT");
  ensureColumn(database, "customer_confirmation_links", "delivery_destination", "TEXT");
  ensureColumn(database, "customer_confirmation_links", "delivery_requested_at", "TEXT");
  ensureColumn(database, "customer_confirmation_links", "delivery_completed_at", "TEXT");
  ensureColumn(database, "customer_confirmation_links", "delivery_message_id", "TEXT");
  ensureColumn(database, "customer_confirmation_links", "delivery_error_code", "TEXT");
  ensureColumn(database, "customer_confirmation_links", "delivery_error_message", "TEXT");
}

export async function ensureCustomerConfirmationStorage() {
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

function appendEvent(database, { linkId, jobCaseId, companyId, eventType, note, requestIp, userAgent }) {
  database.prepare(`
    INSERT INTO customer_confirmation_events (
      id, link_id, job_case_id, company_id, event_type, note, request_ip, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    createId("cce"),
    linkId,
    jobCaseId,
    companyId || null,
    eventType,
    note || null,
    requestIp || null,
    userAgent || null,
    nowIso()
  );
}

function getLinkRowByTokenHash(database, tokenHash) {
  return database.prepare(`SELECT * FROM customer_confirmation_links WHERE token_hash = ?`).get(tokenHash);
}

function assertAvailableLink(database, link, codePrefix = "CUSTOMER_CONFIRMATION") {
  if (!link) {
    throw new HttpError(404, `${codePrefix}_NOT_FOUND`, "고객 확인 링크를 찾을 수 없어요");
  }

  if (link.status === "REVOKED") {
    throw new HttpError(410, `${codePrefix}_REVOKED`, "이 링크는 더 이상 사용할 수 없어요");
  }

  if (new Date(link.expires_at).getTime() < Date.now()) {
    if (link.status !== "EXPIRED") {
      database.prepare(`
        UPDATE customer_confirmation_links
        SET status = 'EXPIRED', updated_at = ?
        WHERE id = ?
      `).run(nowIso(), link.id);
      appendEvent(database, {
        linkId: link.id,
        jobCaseId: link.job_case_id,
        companyId: link.company_id,
        eventType: "EXPIRED"
      });
    }
    throw new HttpError(410, `${codePrefix}_EXPIRED`, "고객 확인 링크가 만료됐어요");
  }
}

export async function createCustomerConfirmationLink({ jobCaseId, companyId, createdByUserId, expiresInHours = 72 }) {
  await ensureCustomerConfirmationStorage();
  const boundedHours = Number.isInteger(expiresInHours) ? Math.min(Math.max(expiresInHours, 1), 168) : 72;

  return transaction((database) => {
    const timestamp = nowIso();
    database.prepare(`
      UPDATE customer_confirmation_links
      SET status = 'REVOKED', revoked_at = ?, updated_at = ?
      WHERE job_case_id = ? AND status IN ('ISSUED', 'VIEWED')
    `).run(timestamp, timestamp, jobCaseId);

    const token = crypto.randomBytes(24).toString("base64url");
    const link = {
      id: createId("ccl"),
      jobCaseId,
      companyId: companyId || null,
      createdByUserId: createdByUserId || null,
      tokenHash: sha256(token),
      status: "ISSUED",
      expiresAt: plusHours(boundedHours),
      viewedAt: null,
      confirmedAt: null,
      confirmationNote: null,
      requestIp: null,
      userAgent: null,
      revokedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.prepare(`
      INSERT INTO customer_confirmation_links (
        id, job_case_id, company_id, created_by_user_id, token_hash,
      status, expires_at, viewed_at, confirmed_at, confirmation_note,
      request_ip, user_agent, revoked_at,
      delivery_channel, delivery_provider, delivery_status, delivery_destination,
      delivery_requested_at, delivery_completed_at, delivery_message_id, delivery_error_code, delivery_error_message,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      link.id,
      link.jobCaseId,
      link.companyId,
      link.createdByUserId,
      link.tokenHash,
      link.status,
      link.expiresAt,
      link.viewedAt,
      link.confirmedAt,
      link.confirmationNote,
      link.requestIp,
      link.userAgent,
      link.revokedAt,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      link.createdAt,
      link.updatedAt
    );

    appendEvent(database, {
      linkId: link.id,
      jobCaseId: link.jobCaseId,
      companyId: link.companyId,
      eventType: "ISSUED"
    });

    return {
      ...mapLink({
        id: link.id,
        job_case_id: link.jobCaseId,
        company_id: link.companyId,
        created_by_user_id: link.createdByUserId,
        status: link.status,
        expires_at: link.expiresAt,
        viewed_at: link.viewedAt,
        confirmed_at: link.confirmedAt,
        confirmation_note: link.confirmationNote,
        request_ip: link.requestIp,
        user_agent: link.userAgent,
        revoked_at: link.revokedAt,
        delivery_channel: null,
        delivery_provider: null,
        delivery_status: null,
        delivery_destination: null,
        delivery_requested_at: null,
        delivery_completed_at: null,
        delivery_message_id: null,
        delivery_error_code: null,
        delivery_error_message: null,
        created_at: link.createdAt,
        updated_at: link.updatedAt
      }),
      token
    };
  });
}

export async function getLatestCustomerConfirmationLink(jobCaseId) {
  await ensureCustomerConfirmationStorage();
  const row = getDb().prepare(`
    SELECT *
    FROM customer_confirmation_links
    WHERE job_case_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(jobCaseId);
  return mapLink(row);
}

export async function getCustomerConfirmationView({ token, requestIp, userAgent }) {
  await ensureCustomerConfirmationStorage();
  return transaction((database) => {
    const row = getLinkRowByTokenHash(database, sha256(token));
    assertAvailableLink(database, row, "CUSTOMER_CONFIRMATION");

    let nextRow = row;
    if (!row.viewed_at) {
      const timestamp = nowIso();
      const nextStatus = row.status === "ISSUED" ? "VIEWED" : row.status;
      database.prepare(`
        UPDATE customer_confirmation_links
        SET status = ?, viewed_at = ?, request_ip = COALESCE(request_ip, ?), user_agent = COALESCE(user_agent, ?), updated_at = ?
        WHERE id = ?
      `).run(nextStatus, timestamp, requestIp || null, userAgent || null, timestamp, row.id);
      appendEvent(database, {
        linkId: row.id,
        jobCaseId: row.job_case_id,
        companyId: row.company_id,
        eventType: "VIEWED",
        requestIp,
        userAgent
      });
      nextRow = getLinkRowByTokenHash(database, sha256(token));
    }

    return mapLink(nextRow);
  });
}

export async function acknowledgeCustomerConfirmation({ token, note, requestIp, userAgent }) {
  await ensureCustomerConfirmationStorage();
  return transaction((database) => {
    const row = getLinkRowByTokenHash(database, sha256(token));
    assertAvailableLink(database, row, "CUSTOMER_CONFIRMATION");

    if (row.confirmed_at || row.status === "CONFIRMED") {
      throw new HttpError(409, "CUSTOMER_CONFIRMATION_ALREADY_ACKNOWLEDGED", "이미 고객 확인이 완료된 링크예요");
    }

    const timestamp = nowIso();
    database.prepare(`
      UPDATE customer_confirmation_links
      SET status = 'CONFIRMED',
          viewed_at = COALESCE(viewed_at, ?),
          confirmed_at = ?,
          confirmation_note = ?,
          request_ip = ?,
          user_agent = ?,
          updated_at = ?
      WHERE id = ?
    `).run(timestamp, timestamp, note || null, requestIp || null, userAgent || null, timestamp, row.id);

    appendEvent(database, {
      linkId: row.id,
      jobCaseId: row.job_case_id,
      companyId: row.company_id,
      eventType: "ACKNOWLEDGED",
      note,
      requestIp,
      userAgent
    });

    return mapLink(getLinkRowByTokenHash(database, sha256(token)));
  });
}

export async function recordCustomerConfirmationDelivery({
  linkId,
  channel,
  provider,
  status,
  destination,
  messageId,
  errorCode,
  errorMessage,
  requestedAt,
  completedAt
}) {
  await ensureCustomerConfirmationStorage();
  return transaction((database) => {
    database.prepare(`
      UPDATE customer_confirmation_links
      SET delivery_channel = ?,
          delivery_provider = ?,
          delivery_status = ?,
          delivery_destination = ?,
          delivery_requested_at = ?,
          delivery_completed_at = ?,
          delivery_message_id = ?,
          delivery_error_code = ?,
          delivery_error_message = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      channel || null,
      provider || null,
      status || null,
      destination || null,
      requestedAt || nowIso(),
      completedAt || nowIso(),
      messageId || null,
      errorCode || null,
      errorMessage || null,
      nowIso(),
      linkId
    );

    return mapLink(
      database.prepare(`SELECT * FROM customer_confirmation_links WHERE id = ? LIMIT 1`).get(linkId)
    );
  });
}
