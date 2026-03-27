import crypto from "node:crypto";
import fs from "node:fs/promises";

import pg from "pg";

import { listMigrations } from "./migration-manifest.js";
import { buildPostgresConnectionOptions } from "./postgres-connection.js";

const { Client } = pg;

const LEGACY_MIGRATION_CHECKSUMS = new Map([
  ["0001_production_core", {
    canonicalChecksum: "2aa6bdae0ae8fd1715db933cafb4331cd41c025f2ba8ae57f0895a7229c794f2",
    compatible: new Set(["248c9c6b1626424147e352625da1005bb9aba61ace6cb9d65a0c9e2e9691e3aa"])
  }]
]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function normalizeMigrationSql(sql) {
  return String(sql).replace(/\r\n/g, "\n");
}

export function computePostgresMigrationChecksum(sql) {
  return sha256(normalizeMigrationSql(sql));
}

export function assessPostgresMigrationChecksum({ migrationId, sql, existingChecksum = "" } = {}) {
  const canonicalChecksum = computePostgresMigrationChecksum(sql);
  const legacyRule = LEGACY_MIGRATION_CHECKSUMS.get(migrationId) || null;
  const legacyCompatibleChecksums = Array.from(legacyRule?.compatible || []);

  if (!existingChecksum) {
    return {
      state: "missing",
      canonicalChecksum,
      legacyCompatibleChecksums
    };
  }

  if (existingChecksum === canonicalChecksum) {
    return {
      state: "match",
      canonicalChecksum,
      legacyCompatibleChecksums
    };
  }

  if (
    legacyCompatibleChecksums.includes(existingChecksum)
    && (!legacyRule?.canonicalChecksum || legacyRule.canonicalChecksum === canonicalChecksum)
  ) {
    return {
      state: "legacy_compatible",
      canonicalChecksum,
      legacyCompatibleChecksums
    };
  }

  return {
    state: "mismatch",
    canonicalChecksum,
    legacyCompatibleChecksums
  };
}

function createClient(databaseUrl, connectionOptions) {
  if (connectionOptions) {
    return new Client(connectionOptions);
  }
  return new Client(buildPostgresConnectionOptions({ databaseUrl }));
}

export async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function getAppliedMigrations(client) {
  await ensureMigrationTable(client);
  const result = await client.query(`SELECT id, checksum, applied_at FROM schema_migrations ORDER BY id ASC`);
  return result.rows;
}

export async function repairPostgresMigrationChecksums({ databaseUrl, connectionOptions = null } = {}) {
  if (!databaseUrl && !connectionOptions) {
    throw new Error("DATABASE_URL is required to repair Postgres migration checksums.");
  }

  const client = createClient(databaseUrl, connectionOptions);
  await client.connect();

  try {
    await ensureMigrationTable(client);
    const applied = await getAppliedMigrations(client);
    const appliedMap = new Map(applied.map((row) => [row.id, row]));
    const migrations = await listMigrations("postgres");
    const summary = [];

    for (const migration of migrations) {
      const existing = appliedMap.get(migration.id);
      if (!existing) {
        continue;
      }

      const sql = await fs.readFile(migration.filePath, "utf8");
      const assessment = assessPostgresMigrationChecksum({
        migrationId: migration.id,
        sql,
        existingChecksum: existing.checksum
      });

      if (assessment.state === "match") {
        summary.push({ id: migration.id, status: "unchanged" });
        continue;
      }

      if (assessment.state === "legacy_compatible") {
        await client.query(
          `UPDATE schema_migrations SET checksum = $2 WHERE id = $1`,
          [migration.id, assessment.canonicalChecksum]
        );
        summary.push({
          id: migration.id,
          status: "repaired",
          fromChecksum: existing.checksum,
          toChecksum: assessment.canonicalChecksum
        });
        continue;
      }

      throw new Error(`Migration checksum mismatch for ${migration.id}.`);
    }

    return summary;
  } finally {
    await client.end();
  }
}

export async function applyPostgresMigrations({ databaseUrl, dryRun = false, connectionOptions = null } = {}) {
  if (!databaseUrl && !connectionOptions) {
    throw new Error("DATABASE_URL is required to run Postgres migrations.");
  }

  const client = createClient(databaseUrl, connectionOptions);
  await client.connect();

  try {
    await ensureMigrationTable(client);
    const applied = await getAppliedMigrations(client);
    const appliedMap = new Map(applied.map((row) => [row.id, row]));
    const migrations = await listMigrations("postgres");
    const summary = [];

    for (const migration of migrations) {
      const sql = await fs.readFile(migration.filePath, "utf8");
      const checksumAssessment = assessPostgresMigrationChecksum({
        migrationId: migration.id,
        sql,
        existingChecksum: appliedMap.get(migration.id)?.checksum || ""
      });
      const checksum = checksumAssessment.canonicalChecksum;
      const existing = appliedMap.get(migration.id);

      if (existing) {
        if (checksumAssessment.state === "mismatch") {
          throw new Error(`Migration checksum mismatch for ${migration.id}.`);
        }
        summary.push({
          id: migration.id,
          status: checksumAssessment.state === "legacy_compatible" ? "already_applied_legacy_compatible" : "already_applied"
        });
        continue;
      }

      if (dryRun) {
        summary.push({ id: migration.id, status: "pending" });
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations (id, checksum) VALUES ($1, $2)`,
          [migration.id, checksum]
        );
        await client.query("COMMIT");
        summary.push({ id: migration.id, status: "applied" });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    return summary;
  } finally {
    await client.end();
  }
}

export async function getPostgresMigrationStatus(databaseUrl, options = {}) {
  if (!databaseUrl && !options.connectionOptions) {
    throw new Error("DATABASE_URL is required to inspect Postgres migrations.");
  }

  const client = createClient(databaseUrl, options.connectionOptions || null);
  await client.connect();

  try {
    const applied = await getAppliedMigrations(client);
    const migrations = await listMigrations("postgres");
    const appliedMap = new Map(applied.map((row) => [row.id, row]));
    const status = [];

    for (const migration of migrations) {
      const existing = appliedMap.get(migration.id);
      const sql = await fs.readFile(migration.filePath, "utf8");
      const assessment = assessPostgresMigrationChecksum({
        migrationId: migration.id,
        sql,
        existingChecksum: existing?.checksum || ""
      });

      status.push({
        id: migration.id,
        applied: Boolean(existing),
        appliedAt: existing?.applied_at || null,
        checksumState: existing ? assessment.state : "pending",
        checksum: assessment.canonicalChecksum
      });
    }

    return status;
  } finally {
    await client.end();
  }
}
