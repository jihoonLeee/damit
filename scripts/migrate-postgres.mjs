import { config } from "../src/config.js";
import { applyPostgresMigrations } from "../src/db/postgres-migrator.js";

const summary = await applyPostgresMigrations({ databaseUrl: config.databaseUrl });
console.log(JSON.stringify({ ok: true, applied: summary }, null, 2));
