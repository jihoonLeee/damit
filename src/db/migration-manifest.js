import fs from "node:fs/promises";
import path from "node:path";

import { config } from "../config.js";

const migrationsRoot = path.join(config.rootDir, "src", "db", "migrations");

export async function listMigrations(engine = "postgres") {
  const dir = path.join(migrationsRoot, engine);
  const entries = await fs.readdir(dir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => ({
      id: entry.name.replace(/\.sql$/i, ""),
      fileName: entry.name,
      filePath: path.join(dir, entry.name)
    }))
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}
