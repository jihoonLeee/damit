import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import { config } from "./config.js";
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
        id, owner_id, customer_label, contact_memo, site_label,
        original_quote_amount, revised_quote_amount, quote_delta_amount,
        current_status, created_at, updated_at,
        company_id, created_by_user_id, assigned_user_id, visibility, updated_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
