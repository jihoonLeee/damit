import { config } from "../src/config.js";
import { runPostgresPreflight } from "../src/db/postgres-preflight.js";

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