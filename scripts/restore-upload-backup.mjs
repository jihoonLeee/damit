import { restoreUploadBackup } from "../src/store.js";

const dirArg = process.argv.find((item) => item.startsWith("--dir="));
const directoryPath = dirArg ? dirArg.slice("--dir=".length) : "";

if (!directoryPath) {
  console.error("Usage: node scripts/restore-upload-backup.mjs --dir=/absolute/or/relative/path/to/upload-backup-dir");
  process.exit(1);
}

const summary = await restoreUploadBackup(directoryPath);
console.log(JSON.stringify({ ok: true, restoredFrom: directoryPath, summary }, null, 2));
