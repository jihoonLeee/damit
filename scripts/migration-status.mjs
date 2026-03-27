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

const [{ config }, { getPostgresMigrationStatus }] = await Promise.all([
  import("../src/config.js"),
  import("../src/db/postgres-migrator.js")
]);

const status = await getPostgresMigrationStatus(config.databaseUrl);
console.log(JSON.stringify({ ok: true, status }, null, 2));
