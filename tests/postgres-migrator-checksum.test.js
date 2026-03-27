import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import {
  assessPostgresMigrationChecksum,
  computePostgresMigrationChecksum,
  normalizeMigrationSql
} from "../src/db/postgres-migrator.js";

test("postgres migration checksum is stable across LF and CRLF line endings", () => {
  const lf = "CREATE TABLE test (\n  id TEXT PRIMARY KEY\n);\n";
  const crlf = "CREATE TABLE test (\r\n  id TEXT PRIMARY KEY\r\n);\r\n";

  assert.equal(normalizeMigrationSql(crlf), lf);
  assert.equal(computePostgresMigrationChecksum(lf), computePostgresMigrationChecksum(crlf));
});

test("postgres migration checksum assessment accepts known legacy checksum compatibility", async () => {
  const currentSql = await fs.readFile(path.join(process.cwd(), "src", "db", "migrations", "postgres", "0001_production_core.sql"), "utf8");
  const report = assessPostgresMigrationChecksum({
    migrationId: "0001_production_core",
    sql: currentSql,
    existingChecksum: "248c9c6b1626424147e352625da1005bb9aba61ace6cb9d65a0c9e2e9691e3aa"
  });

  assert.equal(report.state, "legacy_compatible");
  assert.ok(report.legacyCompatibleChecksums.includes("248c9c6b1626424147e352625da1005bb9aba61ace6cb9d65a0c9e2e9691e3aa"));
});

test("postgres migration checksum assessment still flags unknown mismatches", () => {
  const currentSql = "SELECT 1;\n";
  const report = assessPostgresMigrationChecksum({
    migrationId: "0001_production_core",
    sql: currentSql,
    existingChecksum: "deadbeef"
  });

  assert.equal(report.state, "mismatch");
});
