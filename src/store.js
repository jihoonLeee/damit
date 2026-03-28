import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import { config } from "./config.js";
import { buildCustomerNotificationRuntime } from "./notifications/customer-notification-runtime.js";
import { createObjectStorage } from "./object-storage/createObjectStorage.js";

export const emptyDb = {
  jobCases: [],
  fieldRecords: [],
  fieldRecordPhotos: [],
  scopeComparisons: [],
  messageDrafts: [],
  agreementRecords: [],
  timelineEvents: [],
  auditLogs: []
};

let initialized = false;
let db = null;
let writeQueue = Promise.resolve();

function cloneEmptyDb() {
  return JSON.parse(JSON.stringify(emptyDb));
}

function getDb() {
  if (!db) {
    throw new Error("SQLite storage is not initialized");
  }
  return db;
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

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_cases (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      customer_label TEXT NOT NULL,
      customer_phone_number TEXT,
      contact_memo TEXT,
      site_label TEXT NOT NULL,
      original_quote_amount INTEGER NOT NULL,
      revised_quote_amount INTEGER,
      quote_delta_amount INTEGER,
      current_status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS field_records (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      job_case_id TEXT,
      primary_reason TEXT NOT NULL,
      secondary_reason TEXT,
      note TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS field_record_photos (
      id TEXT PRIMARY KEY,
      field_record_id TEXT NOT NULL,
      storage_provider TEXT,
      object_key TEXT,
      public_url TEXT,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scope_comparisons (
      id TEXT PRIMARY KEY,
      job_case_id TEXT NOT NULL,
      base_scope_summary TEXT NOT NULL,
      extra_work_summary TEXT NOT NULL,
      reason_why_extra TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS message_drafts (
      id TEXT PRIMARY KEY,
      job_case_id TEXT NOT NULL,
      tone TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agreement_records (
      id TEXT PRIMARY KEY,
      job_case_id TEXT NOT NULL,
      status TEXT NOT NULL,
      confirmation_channel TEXT NOT NULL,
      confirmed_at TEXT NOT NULL,
      confirmed_amount INTEGER,
      customer_response_note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      job_case_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      payload_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      actor_user_id TEXT,
      actor_type TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      request_id TEXT,
      payload_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  ensureColumn(database, "job_cases", "company_id", "TEXT");
  ensureColumn(database, "job_cases", "created_by_user_id", "TEXT");
  ensureColumn(database, "job_cases", "assigned_user_id", "TEXT");
  ensureColumn(database, "job_cases", "visibility", "TEXT NOT NULL DEFAULT 'PRIVATE_ASSIGNED'");
  ensureColumn(database, "job_cases", "updated_by_user_id", "TEXT");
  ensureColumn(database, "job_cases", "customer_phone_number", "TEXT");

  ensureColumn(database, "field_records", "company_id", "TEXT");
  ensureColumn(database, "field_records", "created_by_user_id", "TEXT");

  ensureColumn(database, "field_record_photos", "storage_provider", "TEXT");
  ensureColumn(database, "field_record_photos", "object_key", "TEXT");
  ensureColumn(database, "field_record_photos", "public_url", "TEXT");

  ensureColumn(database, "message_drafts", "company_id", "TEXT");
  ensureColumn(database, "message_drafts", "created_by_user_id", "TEXT");

  ensureColumn(database, "agreement_records", "company_id", "TEXT");
  ensureColumn(database, "agreement_records", "created_by_user_id", "TEXT");

  ensureColumn(database, "timeline_events", "company_id", "TEXT");
  ensureColumn(database, "timeline_events", "actor_user_id", "TEXT");

  database.prepare(`
    INSERT INTO app_meta (key, value)
    VALUES ('schema_version', 'sqlite-v2-tenant-foundation')
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run();
}

export async function ensureStorage() {
  if (initialized) {
    return;
  }

  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.mkdir(config.uploadDir, { recursive: true });
  await fs.mkdir(config.backupDir, { recursive: true });

  db = new DatabaseSync(config.dbFilePath);
  ensureSchema(db);
  initialized = true;
}

function inferObjectKeyFromUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  if (url.startsWith("/uploads/")) {
    return url.slice("/uploads/".length);
  }

  return null;
}

function normalizePhotoRow(photo) {
  const publicUrl = photo.public_url || photo.url || null;
  return {
    ...photo,
    storage_provider: photo.storage_provider || "LOCAL_VOLUME",
    object_key: photo.object_key || inferObjectKeyFromUrl(publicUrl),
    public_url: publicUrl,
    url: photo.url || publicUrl
  };
}

function mapRows(database) {
  const jobCases = database.prepare(`SELECT * FROM job_cases ORDER BY created_at ASC`).all();
  const fieldRecords = database.prepare(`SELECT * FROM field_records ORDER BY created_at ASC`).all();
  const fieldRecordPhotos = database.prepare(`SELECT * FROM field_record_photos ORDER BY created_at ASC, sort_order ASC`).all();
  const scopeComparisons = database.prepare(`SELECT * FROM scope_comparisons ORDER BY updated_at ASC`).all();
  const messageDrafts = database.prepare(`SELECT * FROM message_drafts ORDER BY created_at ASC`).all();
  const agreementRecords = database.prepare(`SELECT * FROM agreement_records ORDER BY created_at ASC`).all();
  const timelineEvents = database.prepare(`SELECT * FROM timeline_events ORDER BY created_at ASC`).all();
  const auditLogs = database.prepare(`SELECT * FROM audit_logs ORDER BY created_at ASC`).all();

  return {
    jobCases,
    fieldRecords,
    fieldRecordPhotos: fieldRecordPhotos.map((photo) => normalizePhotoRow(photo)),
    scopeComparisons,
    messageDrafts,
    agreementRecords,
    timelineEvents: timelineEvents.map((event) => ({
      ...event,
      payload_json: event.payload_json ? JSON.parse(event.payload_json) : null
    })),
    auditLogs: auditLogs.map((entry) => ({
      ...entry,
      payload_json: entry.payload_json ? JSON.parse(entry.payload_json) : null
    }))
  };
}

export async function readDb() {
  await ensureStorage();
  return mapRows(getDb());
}

function replaceAllRows(database, snapshot) {
  database.exec("BEGIN IMMEDIATE TRANSACTION");
  try {
    database.exec(`
      DELETE FROM audit_logs;
      DELETE FROM timeline_events;
      DELETE FROM agreement_records;
      DELETE FROM message_drafts;
      DELETE FROM scope_comparisons;
      DELETE FROM field_record_photos;
      DELETE FROM field_records;
      DELETE FROM job_cases;
    `);

      const insertJobCase = database.prepare(`
        INSERT INTO job_cases (
          id, owner_id, customer_label, customer_phone_number, contact_memo, site_label,
          original_quote_amount, revised_quote_amount, quote_delta_amount,
          current_status, created_at, updated_at,
          company_id, created_by_user_id, assigned_user_id, visibility, updated_by_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
    const insertFieldRecord = database.prepare(`
      INSERT INTO field_records (
        id, owner_id, job_case_id, primary_reason, secondary_reason,
        note, status, created_at, company_id, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPhoto = database.prepare(`
      INSERT INTO field_record_photos (
        id, field_record_id, storage_provider, object_key, public_url, url, sort_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertScope = database.prepare(`
      INSERT INTO scope_comparisons (
        id, job_case_id, base_scope_summary, extra_work_summary,
        reason_why_extra, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertDraft = database.prepare(`
      INSERT INTO message_drafts (
        id, job_case_id, tone, body, created_at, updated_at, company_id, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAgreement = database.prepare(`
      INSERT INTO agreement_records (
        id, job_case_id, status, confirmation_channel,
        confirmed_at, confirmed_amount, customer_response_note, created_at, company_id, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertTimeline = database.prepare(`
      INSERT INTO timeline_events (
        id, job_case_id, event_type, summary, payload_json, created_at, company_id, actor_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAudit = database.prepare(`
      INSERT INTO audit_logs (
        id, company_id, actor_user_id, actor_type, action, resource_type, resource_id, request_id, payload_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      for (const item of snapshot.jobCases || []) {
        insertJobCase.run(
          item.id,
          item.owner_id,
          item.customer_label,
          item.customer_phone_number ?? null,
          item.contact_memo ?? null,
          item.site_label,
          item.original_quote_amount,
        item.revised_quote_amount ?? null,
        item.quote_delta_amount ?? null,
        item.current_status,
        item.created_at,
        item.updated_at,
        item.company_id ?? null,
        item.created_by_user_id ?? null,
        item.assigned_user_id ?? null,
        item.visibility ?? "PRIVATE_ASSIGNED",
        item.updated_by_user_id ?? null
      );
    }

    for (const item of snapshot.fieldRecords || []) {
      insertFieldRecord.run(
        item.id,
        item.owner_id,
        item.job_case_id ?? null,
        item.primary_reason,
        item.secondary_reason ?? null,
        item.note ?? null,
        item.status,
        item.created_at,
        item.company_id ?? null,
        item.created_by_user_id ?? null
      );
    }

    for (const item of snapshot.fieldRecordPhotos || []) {
      const normalizedPhoto = normalizePhotoRow(item);
      insertPhoto.run(
        normalizedPhoto.id,
        normalizedPhoto.field_record_id,
        normalizedPhoto.storage_provider,
        normalizedPhoto.object_key,
        normalizedPhoto.public_url,
        normalizedPhoto.url,
        normalizedPhoto.sort_order,
        normalizedPhoto.created_at
      );
    }

    for (const item of snapshot.scopeComparisons || []) {
      insertScope.run(
        item.id,
        item.job_case_id,
        item.base_scope_summary,
        item.extra_work_summary,
        item.reason_why_extra,
        item.updated_at
      );
    }

    for (const item of snapshot.messageDrafts || []) {
      insertDraft.run(
        item.id,
        item.job_case_id,
        item.tone,
        item.body,
        item.created_at,
        item.updated_at,
        item.company_id ?? null,
        item.created_by_user_id ?? null
      );
    }

    for (const item of snapshot.agreementRecords || []) {
      insertAgreement.run(
        item.id,
        item.job_case_id,
        item.status,
        item.confirmation_channel,
        item.confirmed_at,
        item.confirmed_amount ?? null,
        item.customer_response_note ?? null,
        item.created_at,
        item.company_id ?? null,
        item.created_by_user_id ?? null
      );
    }

    for (const item of snapshot.timelineEvents || []) {
      insertTimeline.run(
        item.id,
        item.job_case_id,
        item.event_type,
        item.summary,
        item.payload_json ? JSON.stringify(item.payload_json) : null,
        item.created_at,
        item.company_id ?? null,
        item.actor_user_id ?? null
      );
    }

    for (const item of snapshot.auditLogs || []) {
      insertAudit.run(
        item.id,
        item.company_id ?? null,
        item.actor_user_id ?? null,
        item.actor_type,
        item.action,
        item.resource_type,
        item.resource_id ?? null,
        item.request_id ?? null,
        item.payload_json ? JSON.stringify(item.payload_json) : null,
        item.created_at
      );
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export async function writeDb(nextDb) {
  await ensureStorage();
  writeQueue = writeQueue.then(() => replaceAllRows(getDb(), nextDb));
  await writeQueue;
}

export async function updateDb(mutator) {
  const snapshot = await readDb();
  const result = await mutator(snapshot);
  await writeDb(snapshot);
  return result;
}

export async function resetDb() {
  await writeDb(cloneEmptyDb());
  return cloneEmptyDb();
}

function createBackupStamp(label = "manual") {
  const safeLabel = String(label).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40) || "manual";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return { safeLabel, stamp };
}

function countFilesInDirectory(entries = []) {
  let count = 0;
  for (const entry of entries) {
    if (entry.type === "file") {
      count += 1;
    }
    if (entry.type === "directory") {
      count += countFilesInDirectory(entry.children || []);
    }
  }
  return count;
}

async function listDirectoryTree(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return Promise.all(entries.map(async (entry) => {
    const targetPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return {
        type: "directory",
        name: entry.name,
        children: await listDirectoryTree(targetPath)
      };
    }
    return {
      type: "file",
      name: entry.name
    };
  }));
}

async function recreateSqliteConnection() {
  if (db) {
    db.close();
    db = null;
  }
  initialized = false;
  await ensureStorage();
}

export async function createBackup(label = "manual") {
  await ensureStorage();
  getDb().exec("PRAGMA wal_checkpoint(FULL);");
  const { safeLabel, stamp } = createBackupStamp(label);
  const fileName = `sqlite-${safeLabel}-${stamp}.db`;
  const filePath = path.join(config.backupDir, fileName);
  await fs.copyFile(config.dbFilePath, filePath);
  return {
    fileName,
    filePath,
    relativePath: path.relative(config.rootDir, filePath)
  };
}

export async function createUploadBackup(label = "manual") {
  await ensureStorage();
  const { safeLabel, stamp } = createBackupStamp(label);
  const directoryName = `uploads-${safeLabel}-${stamp}`;
  const directoryPath = path.join(config.backupDir, directoryName);

  await fs.rm(directoryPath, { recursive: true, force: true });
  await fs.mkdir(path.dirname(directoryPath), { recursive: true });
  await fs.cp(config.uploadDir, directoryPath, { recursive: true, force: true });

  const tree = await listDirectoryTree(directoryPath);
  return {
    directoryName,
    directoryPath,
    relativePath: path.relative(config.rootDir, directoryPath),
    fileCount: countFilesInDirectory(tree)
  };
}

export async function restoreSqliteBackup(filePath) {
  await ensureStorage();
  await fs.access(filePath);
  if (db) {
    db.close();
    db = null;
  }
  initialized = false;
  if (path.resolve(filePath) !== path.resolve(config.dbFilePath)) {
    await fs.copyFile(filePath, config.dbFilePath);
  }
  await ensureStorage();
  return getStorageSummary();
}

export async function restoreUploadBackup(directoryPath) {
  await ensureStorage();
  await fs.access(directoryPath);
  await fs.rm(config.uploadDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(config.uploadDir), { recursive: true });
  await fs.cp(directoryPath, config.uploadDir, { recursive: true, force: true });

  const tree = await listDirectoryTree(config.uploadDir);
  return {
    uploadDir: config.uploadDir,
    relativePath: path.relative(config.rootDir, config.uploadDir),
    fileCount: countFilesInDirectory(tree)
  };
}

export async function getStorageSummary() {
  await ensureStorage();
  const database = getDb();
  const stat = await fs.stat(config.dbFilePath);
  const count = (table) => database.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;

  return {
    storageEngine: config.storageEngine,
    objectStorageProvider: config.objectStorageProvider,
    dbFilePath: config.dbFilePath,
    updatedAt: stat.mtime.toISOString(),
    counts: {
      jobCases: count("job_cases"),
      fieldRecords: count("field_records"),
      agreements: count("agreement_records")
    }
  };
}

export async function listBackups(limit = 10) {
  await ensureStorage();
  await fs.mkdir(config.backupDir, { recursive: true });
  const entries = await fs.readdir(config.backupDir, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    const targetPath = path.join(config.backupDir, entry.name);
    const stat = await fs.stat(targetPath);
    let fileCount = null;
    if (entry.isDirectory()) {
      const tree = await listDirectoryTree(targetPath);
      fileCount = countFilesInDirectory(tree);
    }
    items.push({
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file",
      filePath: targetPath,
      relativePath: path.relative(config.rootDir, targetPath),
      sizeBytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
      fileCount
    });
  }

  return items.sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1)).slice(0, limit);
}

function pickSnapshotValue(item, keys) {
  for (const key of keys) {
    if (item && item[key] != null) {
      return item[key];
    }
  }
  return null;
}

function sortByTimestampDesc(items, keys) {
  return [...items].sort((left, right) => {
    const leftValue = pickSnapshotValue(left, keys);
    const rightValue = pickSnapshotValue(right, keys);
    return String(leftValue || "") < String(rightValue || "") ? 1 : -1;
  });
}

function isWithinHours(value, hours) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return Date.now() - date.getTime() <= hours * 60 * 60 * 1000;
}

function isPastTimestamp(value) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.getTime() < Date.now();
}

function maskEmailAddress(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const [localPart, domain = ""] = normalized.split("@");
  if (!localPart || !domain) {
    return normalized || "-";
  }

  const visiblePrefix = localPart.slice(0, Math.min(localPart.length, 2));
  const hidden = "*".repeat(Math.max(localPart.length - visiblePrefix.length, 1));
  return `${visiblePrefix}${hidden}@${domain}`;
}

function summarizeTopTokens(items, tokenKey, limit = 3) {
  const counts = new Map();
  for (const item of items) {
    const token = pickSnapshotValue(item, [tokenKey, tokenKey.toLowerCase(), tokenKey.toUpperCase()]) || 'UNKNOWN';
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([token, count]) => ({ token, count }));
}

function readOptionalTableRows(database, tableName, orderBy = 'created_at DESC') {
  const exists = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName);
  if (!exists) {
    return [];
  }
  return database.prepare("SELECT * FROM " + tableName + " ORDER BY " + orderBy).all();
}

const DATA_EXPLORER_DATASETS = {
  jobCases: {
    key: "jobCases",
    tableName: "job_cases",
    label: "Job Cases",
    description: "Current job cases and quote state.",
    orderBy: "updated_at DESC",
    timestampKeys: ["updated_at", "created_at"],
    columns: ["id", "customer_label", "site_label", "current_status", "original_quote_amount", "revised_quote_amount", "updated_at"]
  },
  fieldRecords: {
    key: "fieldRecords",
    tableName: "field_records",
    label: "Field Records",
    description: "Latest onsite records and link status.",
    orderBy: "created_at DESC",
    timestampKeys: ["created_at"],
    columns: ["id", "job_case_id", "primary_reason", "secondary_reason", "note", "status", "created_at"]
  },
  agreementRecords: {
    key: "agreementRecords",
    tableName: "agreement_records",
    label: "Agreements",
    description: "Agreement records and confirmation channels.",
    orderBy: "created_at DESC",
    timestampKeys: ["confirmed_at", "created_at"],
    columns: ["id", "job_case_id", "status", "confirmation_channel", "confirmed_amount", "confirmed_at", "created_at"]
  },
    customerConfirmations: {
      key: "customerConfirmations",
      tableName: "customer_confirmation_links",
      label: "Customer Confirmations",
      description: "Issued customer confirmation links and recent status.",
      orderBy: "COALESCE(updated_at, confirmed_at, viewed_at, created_at) DESC",
      timestampKeys: ["updated_at", "confirmed_at", "viewed_at", "created_at"],
      columns: ["id", "job_case_id", "status", "delivery_status", "delivery_channel", "delivery_provider", "delivery_destination", "expires_at", "viewed_at", "confirmed_at", "updated_at"]
    },
  timelineEvents: {
    key: "timelineEvents",
    tableName: "timeline_events",
    label: "Timeline",
    description: "Recent product timeline events.",
    orderBy: "created_at DESC",
    timestampKeys: ["created_at"],
    columns: ["id", "job_case_id", "event_type", "summary", "created_at"]
  },
  users: {
    key: "users",
    tableName: "users",
    label: "Users",
    description: "Accounts and recent login state.",
    orderBy: "updated_at DESC",
    timestampKeys: ["updated_at", "created_at"],
    columns: ["id", "email", "display_name", "status", "last_login_at", "updated_at"]
  },
  companies: {
    key: "companies",
    tableName: "companies",
    label: "Companies",
    description: "Registered companies and workspace status.",
    orderBy: "updated_at DESC",
    timestampKeys: ["updated_at", "created_at"],
    columns: ["id", "name", "status", "created_at", "updated_at"]
  },
  loginChallenges: {
    key: "loginChallenges",
    tableName: "login_challenges",
    label: "Login Challenges",
    description: "Latest login-link delivery attempts.",
    orderBy: "created_at DESC",
    timestampKeys: ["created_at"],
    columns: ["id", "email", "status", "delivery_provider", "delivery_status", "expires_at", "created_at"]
  },
  sessions: {
    key: "sessions",
    tableName: "sessions",
    label: "Sessions",
    description: "Current session inventory and revocation state.",
    orderBy: "COALESCE(last_seen_at, created_at) DESC",
    timestampKeys: ["last_seen_at", "created_at"],
    columns: ["id", "user_id", "company_id", "last_seen_at", "expires_at", "revoked_at", "created_at"]
  },
  memberships: {
    key: "memberships",
    tableName: "memberships",
    label: "Memberships",
    description: "Company membership and role state.",
    orderBy: "updated_at DESC",
    timestampKeys: ["updated_at", "created_at"],
    columns: ["id", "company_id", "user_id", "role", "status", "joined_at", "updated_at"]
  },
  auditLogs: {
    key: "auditLogs",
    tableName: "audit_logs",
    label: "Audit Logs",
    description: "Recent operational audit entries.",
    orderBy: "created_at DESC",
    timestampKeys: ["created_at"],
    columns: ["id", "actor_type", "action", "resource_type", "resource_id", "created_at"]
  }
};

function readOptionalTableCount(database, tableName) {
  const exists = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName);
  if (!exists) {
    return 0;
  }
  return database.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count || 0;
}

function readOptionalTableRowsLimited(database, tableName, orderBy = 'created_at DESC', limit = 10) {
  const exists = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName);
  if (!exists) {
    return [];
  }
  return database.prepare(`SELECT * FROM ${tableName} ORDER BY ${orderBy} LIMIT ?`).all(limit);
}

function toExplorerRow(row, columns) {
  return Object.fromEntries(columns.map((column) => [column, row?.[column] ?? null]));
}

function buildOpsSignals({ agreementRecords, customerConfirmationLinks, timelineEvents, loginChallenges, sessions }) {
  const sortedAgreements = sortByTimestampDesc(agreementRecords || [], ['confirmed_at', 'created_at']);
  const latestAgreement = sortedAgreements[0] || null;
  const agreementStatuses = summarizeTopTokens(agreementRecords || [], 'status');
  const recentAgreementCount7d = (agreementRecords || []).filter((item) => isWithinHours(pickSnapshotValue(item, ['confirmed_at', 'created_at']), 24 * 7)).length;

  const sortedConfirmations = sortByTimestampDesc(customerConfirmationLinks || [], ['updated_at', 'confirmed_at', 'viewed_at', 'created_at']);
  const latestConfirmation = sortedConfirmations[0] || null;
  const openConfirmations = (customerConfirmationLinks || []).filter((item) => ['ISSUED', 'VIEWED'].includes(item.status));
  const staleOpenConfirmations = openConfirmations.filter((item) => !isWithinHours(pickSnapshotValue(item, ['updated_at', 'created_at']), 24));
  const recentConfirmedLinks7d = (customerConfirmationLinks || []).filter((item) => item.status === 'CONFIRMED' && isWithinHours(pickSnapshotValue(item, ['confirmed_at', 'updated_at']), 24 * 7)).length;

  const sortedTimeline = sortByTimestampDesc(timelineEvents || [], ['created_at']);
  const latestTimeline = sortedTimeline[0] || null;
  const recentTimelineCount24h = (timelineEvents || []).filter((item) => isWithinHours(pickSnapshotValue(item, ['created_at']), 24)).length;
  const timelineEventMix = summarizeTopTokens(timelineEvents || [], 'event_type');

  const sortedChallenges = sortByTimestampDesc(loginChallenges || [], ['created_at']);
  const latestChallenge = sortedChallenges[0] || null;
  const recentChallengeCount24h = (loginChallenges || []).filter((item) => isWithinHours(pickSnapshotValue(item, ['created_at']), 24)).length;
  const failedDeliveryCount24h = (loginChallenges || []).filter((item) => item.delivery_status === 'FAILED' && isWithinHours(pickSnapshotValue(item, ['created_at']), 24)).length;
  const deliveryStatusMix = summarizeTopTokens(loginChallenges || [], 'delivery_status');

  const activeSessions = (sessions || []).filter((item) => !item.revoked_at && !isPastTimestamp(item.expires_at));
  const idleRiskSessions = activeSessions.filter((item) => {
    const lastSeenAt = pickSnapshotValue(item, ['last_seen_at', 'created_at']);
    if (!lastSeenAt) {
      return false;
    }
    const ageMs = Date.now() - new Date(lastSeenAt).getTime();
    return ageMs > Math.max(config.sessionIdleTimeoutSeconds * 1000 * 0.5, 60 * 60 * 1000);
  });
  const latestSession = sortByTimestampDesc(activeSessions, ['last_seen_at', 'created_at'])[0] || null;

  return {
    agreements: {
      totalCount: agreementRecords?.length || 0,
      recentCount7d: recentAgreementCount7d,
      latestStatus: latestAgreement?.status || null,
      latestConfirmedAt: pickSnapshotValue(latestAgreement, ['confirmed_at', 'created_at']),
      topStatuses: agreementStatuses
    },
    customerConfirmations: {
      totalCount: customerConfirmationLinks?.length || 0,
      openCount: openConfirmations.length,
      staleOpenCount: staleOpenConfirmations.length,
      recentConfirmedCount7d: recentConfirmedLinks7d,
      latestStatus: latestConfirmation?.status || null,
      latestUpdatedAt: pickSnapshotValue(latestConfirmation, ['updated_at', 'confirmed_at', 'viewed_at', 'created_at'])
    },
    timeline: {
      totalCount: timelineEvents?.length || 0,
      recentCount24h: recentTimelineCount24h,
      latestEventType: latestTimeline?.event_type || null,
      latestEventAt: pickSnapshotValue(latestTimeline, ['created_at']),
      topEventTypes: timelineEventMix
    },
    auth: {
      challengeTotalCount: loginChallenges?.length || 0,
      recentChallengeCount24h,
      latestDeliveryStatus: latestChallenge?.delivery_status || null,
      latestChallengeAt: pickSnapshotValue(latestChallenge, ['created_at']),
      failedDeliveryCount24h,
      topDeliveryStatuses: deliveryStatusMix,
      activeSessionCount: activeSessions.length,
      idleRiskSessionCount: idleRiskSessions.length,
      latestSessionSeenAt: pickSnapshotValue(latestSession, ['last_seen_at', 'created_at'])
    }
  };
}

function buildOpsActivity({ customerConfirmationLinks, timelineEvents, loginChallenges, limit }) {
  const recentCustomerConfirmations = sortByTimestampDesc(customerConfirmationLinks || [], ['updated_at', 'confirmed_at', 'viewed_at', 'created_at'])
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      jobCaseId: item.job_case_id || item.jobCaseId || null,
      status: item.status,
      expiresAt: pickSnapshotValue(item, ['expires_at', 'expiresAt']),
      updatedAt: pickSnapshotValue(item, ['updated_at', 'updatedAt', 'confirmed_at', 'viewed_at', 'created_at']),
      confirmedAt: pickSnapshotValue(item, ['confirmed_at', 'confirmedAt'])
    }));

  const recentTimelineEvents = sortByTimestampDesc(timelineEvents || [], ['created_at'])
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      jobCaseId: item.job_case_id || item.jobCaseId || null,
      eventType: item.event_type || item.eventType,
      summary: item.summary,
      createdAt: pickSnapshotValue(item, ['created_at', 'createdAt'])
    }));

  const recentAuthChallenges = sortByTimestampDesc(loginChallenges || [], ['created_at'])
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      emailMasked: maskEmailAddress(item.email),
      status: item.status,
      deliveryProvider: item.delivery_provider || null,
      deliveryStatus: item.delivery_status || null,
      expiresAt: item.expires_at || null,
      createdAt: pickSnapshotValue(item, ['created_at'])
    }));

  return {
    recentCustomerConfirmations,
    recentTimelineEvents,
    recentAuthChallenges
  };
}

function buildLatestByJobCaseMap(items = [], jobCaseKeys = ['job_case_id', 'jobCaseId'], timestampKeys = ['updated_at', 'created_at']) {
  const map = new Map();
  for (const item of sortByTimestampDesc(items || [], timestampKeys)) {
    const jobCaseId = pickSnapshotValue(item, jobCaseKeys);
    if (!jobCaseId || map.has(jobCaseId)) {
      continue;
    }
    map.set(jobCaseId, item);
  }
  return map;
}

function buildOpsFocusCaseDescriptor({ jobCase, latestDraft, latestAgreement, latestConfirmation, latestTimeline }) {
  const currentStatus = jobCase.current_status || jobCase.currentStatus || 'UNEXPLAINED';
  const revisedQuoteAmount = jobCase.revised_quote_amount ?? jobCase.revisedQuoteAmount ?? null;
  const hasQuote = revisedQuoteAmount != null && Number.isFinite(Number(revisedQuoteAmount));
  const hasDraft = Boolean(latestDraft?.body);
  const hasAgreementRecord = Boolean(latestAgreement?.id);
  const confirmationStatus = latestConfirmation?.status || null;
  const latestConfirmationAt = pickSnapshotValue(latestConfirmation, ['updated_at', 'confirmed_at', 'viewed_at', 'created_at']);
  const latestTimelineAt = pickSnapshotValue(latestTimeline, ['created_at']);
  const isTerminal = currentStatus === 'AGREED' || currentStatus === 'EXCLUDED';
  const isStaleConfirmation = confirmationStatus && ['ISSUED', 'VIEWED'].includes(confirmationStatus)
    ? !isWithinHours(latestConfirmationAt, 24)
    : false;

  const descriptor = {
    jobCaseId: jobCase.id,
    customerLabel: jobCase.customer_label || jobCase.customerLabel || '이름 없는 작업 건',
    siteLabel: jobCase.site_label || jobCase.siteLabel || '',
    currentStatus,
    revisedQuoteAmount: hasQuote ? Number(revisedQuoteAmount) : null,
    hasDraft,
    hasAgreementRecord,
    latestConfirmationStatus: confirmationStatus,
    latestConfirmationUpdatedAt: latestConfirmationAt,
    latestTimelineEventType: latestTimeline?.event_type || latestTimeline?.eventType || null,
    latestTimelineAt,
    updatedAt: pickSnapshotValue(jobCase, ['updated_at', 'created_at']) || latestTimelineAt || latestConfirmationAt || null,
    focusTone: 'neutral',
    focusBadge: '기록 확인',
    focusReasonKey: 'record-check',
    focusTitle: '기록 확인이 필요한 작업 건입니다.',
    focusCopy: '진행을 다시 여는 단계는 아니고, 남은 기록이 빠지지 않았는지 확인하는 용도입니다.',
    focusWhyNow: '최근 흐름을 다시 보면서 기록 누락이 없는지만 짧게 확인하면 됩니다.',
    focusTargetId: 'timeline-card',
    score: 10
  };

  if (confirmationStatus === 'VIEWED' && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'warning',
      focusBadge: '열람됨',
      focusReasonKey: 'confirmation-viewed',
      focusTitle: '고객이 내용을 본 뒤 마지막 정리가 멈춘 작업 건입니다.',
      focusCopy: '고객 확인 카드와 합의 기록을 같이 보면, 지금 바로 정리해야 할 마지막 상태가 무엇인지 가장 빨리 보입니다.',
      focusWhyNow: '고객이 이미 링크를 열었으니, 지금 정리하면 왕복 연락을 줄일 수 있습니다.',
      focusTargetId: 'customer-confirm-card',
      score: 100
    };
  }

  if (isStaleConfirmation && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'warning',
      focusBadge: '응답 지연',
      focusReasonKey: 'confirmation-stale',
      focusTitle: '발급된 확인 링크가 오래 멈춘 작업 건입니다.',
      focusCopy: '고객 확인 링크는 발급됐지만 후속 정리가 멈춘 상태입니다. 링크 상태와 마지막 메모를 먼저 확인해 보세요.',
      focusWhyNow: '확인 흐름이 길어질수록 후속 연락 맥락이 흐려집니다. 지금 다시 보는 편이 안전합니다.',
      focusTargetId: 'customer-confirm-card',
      score: 92
    };
  }

  if (currentStatus === 'ON_HOLD') {
    return {
      ...descriptor,
      focusTone: 'warning',
      focusBadge: '답변 대기',
      focusReasonKey: 'on-hold-followup',
      focusTitle: '고객 답변을 기다리는 작업 건입니다.',
      focusCopy: '새 입력보다 마지막 반응과 보류 메모를 다시 확인하는 것이 우선입니다.',
      focusWhyNow: '보류 건은 다음 응답 시점을 놓치지 않는 것이 가장 중요합니다.',
      focusTargetId: 'agreement-card',
      score: 84
    };
  }

  if (!hasQuote && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'warning',
      focusBadge: '견적 병목',
      focusReasonKey: 'quote-missing',
      focusTitle: '변경 금액이 아직 비어 있는 작업 건입니다.',
      focusCopy: '견적이 비어 있으면 설명 초안과 고객 확인 흐름이 같이 밀립니다. 금액과 범위를 먼저 정리해 주세요.',
      focusWhyNow: '이 단계가 막히면 뒤 단계가 모두 멈춥니다.',
      focusTargetId: 'quote-card',
      score: 78
    };
  }

  if (hasQuote && !hasDraft && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'warning',
      focusBadge: '초안 필요',
      focusReasonKey: 'draft-missing',
      focusTitle: '설명 초안이 아직 없는 작업 건입니다.',
      focusCopy: '금액 정리는 끝났고, 이제 고객에게 보낼 설명 문장만 만들면 다음 단계로 넘어갈 수 있습니다.',
      focusWhyNow: '초안이 없으면 확인 링크 발급과 합의 기록도 자연스럽게 이어지지 않습니다.',
      focusTargetId: 'draft-card',
      score: 72
    };
  }

  if (hasDraft && !confirmationStatus && !hasAgreementRecord && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'neutral',
      focusBadge: '확인 전',
      focusReasonKey: 'confirm-link-needed',
      focusTitle: '설명은 준비됐지만 고객 확인 흐름이 아직 없는 작업 건입니다.',
      focusCopy: '고객 확인 링크를 발급하거나 합의 기록을 남기면 흐름이 마무리 단계로 넘어갑니다.',
      focusWhyNow: '이 단계는 짧게 처리할 수 있어서 지금 정리하면 전체 흐름이 빠르게 닫힙니다.',
      focusTargetId: 'customer-confirm-card',
      score: 66
    };
  }

  if (hasAgreementRecord && !isTerminal) {
    return {
      ...descriptor,
      focusTone: 'neutral',
      focusBadge: '상태 점검',
      focusReasonKey: 'status-review',
      focusTitle: '합의 기록은 있지만 최종 상태 확인이 더 필요한 작업 건입니다.',
      focusCopy: '합의 기록 카드와 고객 확인 상태를 함께 보면서 마지막 상태를 명확하게 정리해 주세요.',
      focusWhyNow: '이미 근거는 있으니, 최종 상태만 정리하면 흐름을 닫을 수 있습니다.',
      focusTargetId: 'agreement-card',
      score: 58
    };
  }

  return descriptor;
}

function buildOpsFocusCases({ jobCases, messageDrafts, agreementRecords, customerConfirmationLinks, timelineEvents, limit }) {
  const latestDraftByJobCase = buildLatestByJobCaseMap(messageDrafts, ['job_case_id', 'jobCaseId'], ['updated_at', 'created_at']);
  const latestAgreementByJobCase = buildLatestByJobCaseMap(agreementRecords, ['job_case_id', 'jobCaseId'], ['confirmed_at', 'created_at']);
  const latestConfirmationByJobCase = buildLatestByJobCaseMap(customerConfirmationLinks, ['job_case_id', 'jobCaseId'], ['updated_at', 'confirmed_at', 'viewed_at', 'created_at']);
  const latestTimelineByJobCase = buildLatestByJobCaseMap(timelineEvents, ['job_case_id', 'jobCaseId'], ['created_at']);

  return (jobCases || [])
    .map((jobCase) => buildOpsFocusCaseDescriptor({
      jobCase,
      latestDraft: latestDraftByJobCase.get(jobCase.id) || null,
      latestAgreement: latestAgreementByJobCase.get(jobCase.id) || null,
      latestConfirmation: latestConfirmationByJobCase.get(jobCase.id) || null,
      latestTimeline: latestTimelineByJobCase.get(jobCase.id) || null
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
      const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, limit);
}


function getAuthDeliveryProvider() {
  return String(config.mailProvider || (config.nodeEnv === "production" ? "RESEND" : "FILE")).trim().toUpperCase();
}

function parseTrustedOrigins(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildOpsRuntimeReadiness() {
  const mailProvider = getAuthDeliveryProvider();
  const trustedOrigins = parseTrustedOrigins(config.trustedOrigins);
  const mailFromConfigured = Boolean(String(config.mailFrom || "").trim());
  const resendConfigured = Boolean(String(config.resendApiKey || "").trim());
  const sentryConfigured = Boolean(String(config.sentryDsn || "").trim());
  const appBaseUrlConfigured = Boolean(String(config.appBaseUrl || "").trim());
  const authDebugLinks = Boolean(config.authDebugLinks);
  const authEnforceTrustedOrigin = Boolean(config.authEnforceTrustedOrigin);

  let authDeliveryMode = "FILE_PREVIEW";
  if (mailProvider === "RESEND") {
    authDeliveryMode = resendConfigured && mailFromConfigured ? "RESEND_LIVE" : "RESEND_CONFIG_REQUIRED";
  }

  let authOperationalReadiness = "PREVIEW_ONLY";
  if (mailProvider === "RESEND" && (!resendConfigured || !mailFromConfigured)) {
    authOperationalReadiness = "MAIL_CONFIG_REQUIRED";
  } else if (!authEnforceTrustedOrigin || authDebugLinks) {
    authOperationalReadiness = "HARDENING_REQUIRED";
  } else if (mailProvider === "RESEND" && resendConfigured && mailFromConfigured) {
    authOperationalReadiness = "READY";
  }

  return {
    mailProvider,
    mailFromConfigured,
    resendConfigured,
    sentryConfigured,
    sentryEnvironment: config.sentryEnvironment || config.nodeEnv,
    authDebugLinks,
    authEnforceTrustedOrigin,
    trustedOriginCount: trustedOrigins.length,
    trustedOriginsConfigured: trustedOrigins.length > 0,
    appBaseUrlConfigured,
    authDeliveryMode,
    authOperationalReadiness,
    ...buildCustomerNotificationRuntime(config)
  };
}

export async function getDataExplorer(datasetKey = "jobCases", limit = 8) {
  await ensureStorage();
  const database = getDb();
  const selectedConfig = DATA_EXPLORER_DATASETS[datasetKey] || DATA_EXPLORER_DATASETS.jobCases;
  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 20) : 8;

  const datasets = Object.values(DATA_EXPLORER_DATASETS).map((item) => {
    const preview = readOptionalTableRowsLimited(database, item.tableName, item.orderBy, 1)[0] || null;
    return {
      key: item.key,
      label: item.label,
      description: item.description,
      count: readOptionalTableCount(database, item.tableName),
      latestAt: pickSnapshotValue(preview, item.timestampKeys)
    };
  });

  const rows = readOptionalTableRowsLimited(database, selectedConfig.tableName, selectedConfig.orderBy, safeLimit)
    .map((row) => toExplorerRow(row, selectedConfig.columns));

  return {
    datasets,
    selected: {
      key: selectedConfig.key,
      label: selectedConfig.label,
      description: selectedConfig.description,
      tableName: selectedConfig.tableName,
      columns: selectedConfig.columns,
      count: readOptionalTableCount(database, selectedConfig.tableName),
      rows
    },
    generatedAt: new Date().toISOString()
  };
}

export async function getOpsSnapshot(limit = 5) {
  const backups = await listBackups(limit);
  const dbSnapshot = await readDb();
  const database = getDb();
  const customerConfirmationLinks = readOptionalTableRows(database, 'customer_confirmation_links');
  const loginChallenges = readOptionalTableRows(database, 'login_challenges');
  const sessions = readOptionalTableRows(database, 'sessions');
  const recentAuditLogs = [...(dbSnapshot.auditLogs || [])]
    .sort((left, right) => (left.created_at < right.created_at ? 1 : -1))
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      actorType: entry.actor_type,
      action: entry.action,
      resourceType: entry.resource_type,
      resourceId: entry.resource_id || null,
      createdAt: entry.created_at
    }));
  const signals = buildOpsSignals({
    agreementRecords: dbSnapshot.agreementRecords || [],
    customerConfirmationLinks,
    timelineEvents: dbSnapshot.timelineEvents || [],
    loginChallenges,
    sessions
  });
  const activity = buildOpsActivity({
    customerConfirmationLinks,
    timelineEvents: dbSnapshot.timelineEvents || [],
    loginChallenges,
    limit
  });
  const focusCases = buildOpsFocusCases({
    jobCases: dbSnapshot.jobCases || [],
    messageDrafts: dbSnapshot.messageDrafts || [],
    agreementRecords: dbSnapshot.agreementRecords || [],
    customerConfirmationLinks,
    timelineEvents: dbSnapshot.timelineEvents || [],
    limit
  });

  return {
    storage: await getStorageSummary(),
    backups,
    backupSummary: {
      totalRecentBackups: backups.length,
      latestBackupName: backups[0]?.name || null,
      latestBackupAt: backups[0]?.updatedAt || null
    },
    signals,
    focusCases,
    activity: {
      recentAuditLogs,
      recentCustomerConfirmations: activity.recentCustomerConfirmations,
      recentTimelineEvents: activity.recentTimelineEvents,
      recentAuthChallenges: activity.recentAuthChallenges
    },
    runtime: {
      nodeEnv: config.nodeEnv,
      appBaseUrl: config.appBaseUrl || null,
      objectStorageProvider: config.objectStorageProvider,
      storageEngine: config.storageEngine,
      ...buildOpsRuntimeReadiness()
    },
    generatedAt: new Date().toISOString()
  };
}

export function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function fileExtensionFromMime(mimeType) {
  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".bin";
  }
}

export async function saveUpload(filePart, assetContext = {}) {
  const photoId = createId("photo");
  const ext = path.extname(filePart.filename || "") || fileExtensionFromMime(filePart.contentType || "");
  const fileName = `${photoId}${ext}`;
  const savedAsset = await createObjectStorage(config).saveFieldRecordPhoto({
    photoId,
    fieldRecordId: assetContext.fieldRecordId || photoId,
    companyId: assetContext.companyId || null,
    ownerId: assetContext.ownerId || config.ownerId,
    fileName,
    contentType: filePart.contentType || "",
    data: filePart.data
  });

  return {
    id: photoId,
    fileName,
    storageProvider: savedAsset.storageProvider,
    objectKey: savedAsset.objectKey,
    publicUrl: savedAsset.publicUrl || savedAsset.url,
    url: savedAsset.url
  };
}





