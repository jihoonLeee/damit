import { restoreSqliteBackup } from "../src/store.js";

const fileArg = process.argv.find((item) => item.startsWith("--file="));
const filePath = fileArg ? fileArg.slice("--file=".length) : "";

if (!filePath) {
  console.error("Usage: node scripts/restore-sqlite-backup.mjs --file=/absolute/or/relative/path/to/backup.db");
  process.exit(1);
}

const summary = await restoreSqliteBackup(filePath);
console.log(JSON.stringify({ ok: true, restoredFrom: filePath, summary }, null, 2));
