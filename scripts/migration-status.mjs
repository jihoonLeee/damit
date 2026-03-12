import { config } from "../src/config.js";
import { getPostgresMigrationStatus } from "../src/db/postgres-migrator.js";

const status = await getPostgresMigrationStatus(config.databaseUrl);
console.log(JSON.stringify({ ok: true, status }, null, 2));
