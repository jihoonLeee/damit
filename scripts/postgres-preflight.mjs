import path from "node:path";

import { loadEnvFile } from "./lib/env-file.mjs";

function readArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const rootDir = path.resolve(import.meta.dirname, "..");
const envFile = readArg("env-file", "");

if (envFile) {
  loadEnvFile(path.isAbsolute(envFile) ? envFile : path.join(rootDir, envFile), { override: true });
}

const [{ config }, { runPostgresPreflight }] = await Promise.all([
  import("../src/config.js"),
  import("../src/db/postgres-preflight.js")
]);

if (!config.databaseUrl) {
  console.error(JSON.stringify({
    ok: false,
    error: {
      code: "POSTGRES_NOT_CONFIGURED",
      message: "DATABASE_URL is required to run the Postgres preflight."
    }
  }, null, 2));
  process.exit(1);
}

const report = await runPostgresPreflight({
  databaseUrl: config.databaseUrl,
  sslMode: config.postgresSslMode,
  sslRequire: config.postgresSslRequire,
  sslCaPath: config.postgresSslCaPath,
  applicationName: config.postgresApplicationName,
  maxPoolSize: config.postgresPoolMax
});

console.log(JSON.stringify(report, null, 2));
