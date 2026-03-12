import crypto from "node:crypto";
import fs from "node:fs/promises";

import pg from "pg";

import { listMigrations } from "./migration-manifest.js";
import { buildPostgresConnectionOptions } from "./postgres-connection.js";

const { Client } = pg;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
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
      const checksum = sha256(sql);
      const existing = appliedMap.get(migration.id);

      if (existing) {
        if (existing.checksum !== checksum) {
          throw new Error(`Migration checksum mismatch for ${migration.id}.`);
        }
        summary.push({ id: migration.id, status: "already_applied" });
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

    return migrations.map((migration) => ({
      id: migration.id,
      applied: appliedMap.has(migration.id),
      appliedAt: appliedMap.get(migration.id)?.applied_at || null
    }));
  } finally {
    await client.end();
  }
}