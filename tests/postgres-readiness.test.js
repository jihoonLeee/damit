import test from "node:test";
import assert from "node:assert/strict";

import { assessPostgresReadiness } from "../src/db/postgres-readiness.js";

test("postgres readiness fails clearly when DATABASE_URL is missing", () => {
  const report = assessPostgresReadiness({
    POSTGRES_SSL_MODE: "require",
    POSTGRES_APPLICATION_NAME: "damit-production",
    POSTGRES_POOL_MAX: "10"
  });

  assert.equal(report.ok, false);
  assert.equal(report.provider, "UNKNOWN");
  assert.ok(report.errors.some((item) => item.key === "DATABASE_URL"));
});

test("postgres readiness recognizes a valid Supabase-style setup", () => {
  const report = assessPostgresReadiness({
    DATABASE_URL: "postgres://postgres:secret@db.abcdefghijkl.supabase.co:5432/postgres",
    POSTGRES_SSL_MODE: "require",
    POSTGRES_APPLICATION_NAME: "damit-production",
    POSTGRES_POOL_MAX: "10"
  });

  assert.equal(report.ok, true);
  assert.equal(report.provider, "SUPABASE");
  assert.equal(report.summary.hostname, "db.abcdefghijkl.supabase.co");
  assert.equal(report.summary.poolMax, 10);
  assert.equal(report.errors.length, 0);
});

test("postgres readiness warns when using a non-Supabase host", () => {
  const report = assessPostgresReadiness({
    DATABASE_URL: "postgres://postgres:secret@example.com:5432/postgres",
    POSTGRES_SSL_MODE: "require",
    POSTGRES_APPLICATION_NAME: "damit-production",
    POSTGRES_POOL_MAX: "10"
  });

  assert.equal(report.ok, true);
  assert.equal(report.provider, "CUSTOM_POSTGRES");
  assert.ok(report.warnings.some((item) => item.includes("Supabase")));
});
