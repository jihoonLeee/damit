import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

import { buildPostgresConnectionOptions, redactDatabaseUrl } from "../src/db/postgres-connection.js";
import { createOwnerSession } from "./helpers/session-auth.js";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "field-agreement-pg-runtime-"));
process.chdir(tempRoot);

const { createApp } = await import("../src/app.js");
const { config } = await import("../src/config.js");

config.rootDir = tempRoot;
config.publicDir = path.join(tempRoot, "public");
config.dataDir = path.join(tempRoot, "data");
config.uploadDir = path.join(tempRoot, "data", "uploads");
config.backupDir = path.join(tempRoot, "data", "backups");
config.dbFilePath = path.join(tempRoot, "data", "app.sqlite");
config.storageEngine = "SQLITE";
config.databaseUrl = "";
config.postgresSslMode = "";
config.postgresSslRequire = "";
config.postgresSslCaPath = "";
config.postgresApplicationName = "field-agreement-assistant-test";
config.postgresPoolMax = "5";

await fs.mkdir(config.publicDir, { recursive: true });
for (const fileName of ["landing.html", "login.html", "home.html", "ops.html", "index.html", "confirm.html"]) {
  await fs.writeFile(path.join(config.publicDir, fileName), "<html></html>", "utf8");
}

const app = createApp();
const server = createServer((req, res) => app.handle(req, res));
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("postgres connection helper redacts passwords and usernames", () => {
  const redacted = redactDatabaseUrl("postgres://field_user:supersecret@example.com:5432/appdb");
  assert.match(redacted, /field_user|fi\*\*\*/i);
  assert.doesNotMatch(redacted, /supersecret/);
  assert.match(redacted, /:\*\*\*@/);
});

test("postgres connection helper builds ssl options for require mode", () => {
  const options = buildPostgresConnectionOptions({
    databaseUrl: "postgres://user:pass@example.com:5432/appdb",
    sslMode: "require",
    applicationName: "faa-test",
    maxPoolSize: 7
  });

  assert.equal(options.connectionString, "postgres://user:pass@example.com:5432/appdb");
  assert.equal(options.application_name, "faa-test");
  assert.equal(options.max, 7);
  assert.equal(options.ssl.rejectUnauthorized, false);
});

test("postgres connection helper loads a custom CA when provided", async () => {
  const caPath = path.join(tempRoot, "ca.pem");
  await fs.writeFile(caPath, "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----\n", "utf8");
  const options = buildPostgresConnectionOptions({
    databaseUrl: "postgres://user:pass@example.com:5432/appdb",
    sslCaPath: caPath
  });

  assert.equal(options.ssl.rejectUnauthorized, true);
  assert.match(options.ssl.ca, /BEGIN CERTIFICATE/);
});

test("admin postgres preflight returns a clear guard error when database url is missing", async () => {
  const ownerSession = await createOwnerSession(baseUrl, config, {
    email: "postgres@example.com",
    displayName: "포스트그레스운영자",
    companyName: "다밋 PG"
  });

  const response = await fetch(`${baseUrl}/api/v1/admin/postgres-preflight`, {
    headers: {
      Cookie: ownerSession.cookieHeader
    }
  });

  assert.equal(response.status, 409);
  const payload = await response.json();
  assert.equal(payload.error.code, "POSTGRES_NOT_CONFIGURED");
});