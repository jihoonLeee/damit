import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { listMigrations } from "../src/db/migration-manifest.js";
import { createRepositoryBundle } from "../src/repositories/createRepositoryBundle.js";

test("postgres migration manifest includes the production base migration", async () => {
  const migrations = await listMigrations("postgres");
  assert.ok(migrations.some((item) => item.id === "0001_production_core"));
});

test("repository factory returns a contract-complete SQLite bundle by default", async () => {
  const bundle = createRepositoryBundle({ engine: "SQLITE" });
  assert.equal(bundle.engine, "SQLITE");
  const storage = await bundle.systemRepository.getStorageSummary();
  assert.equal(typeof storage.storageEngine, "string");
  assert.ok(Array.isArray(await bundle.jobCaseRepository.listByScope()));
});

test("postgres repository bundle requires a database url", () => {
  assert.throws(() => createRepositoryBundle({ engine: "POSTGRES", databaseUrl: "" }), /DATABASE_URL/);
});

test("production migration sql contains tenant and auth tables", async () => {
  const sql = await fs.readFile("D:/AI_CODEX_DESKTOP/src/db/migrations/postgres/0001_production_core.sql", "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS users/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS companies/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS job_cases/);
  assert.match(sql, /visibility TEXT NOT NULL DEFAULT 'PRIVATE_ASSIGNED'/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS customer_confirmation_links/);
});
