import path from "node:path";

import { loadEnvFile } from "./lib/env-file.mjs";
import { assessPostgresReadiness } from "../src/db/postgres-readiness.js";

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

const report = assessPostgresReadiness(process.env);
const serialized = JSON.stringify(report, null, 2);

if (report.ok) {
  console.log(serialized);
} else {
  console.error(serialized);
  process.exit(1);
}
