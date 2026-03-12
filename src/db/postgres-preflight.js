import pg from "pg";

import { getPostgresMigrationStatus } from "./postgres-migrator.js";
import { buildPostgresConnectionOptions, redactDatabaseUrl, summarizeConnectionOptions } from "./postgres-connection.js";

const { Client } = pg;

export async function runPostgresPreflight(options = {}) {
  const connectionOptions = buildPostgresConnectionOptions(options);
  const client = new Client(connectionOptions);

  await client.connect();

  try {
    const serverResult = await client.query(`
      SELECT
        current_database() AS current_database,
        current_user AS current_user,
        current_setting('server_version') AS server_version,
        current_setting('ssl', true) AS ssl_setting
    `);
    const server = serverResult.rows[0] || {};
    const migrationStatus = await getPostgresMigrationStatus(options.databaseUrl, { connectionOptions });
    const appliedCount = migrationStatus.filter((item) => item.applied).length;

    return {
      ok: true,
      checkedAt: new Date().toISOString(),
      databaseUrl: redactDatabaseUrl(options.databaseUrl),
      connection: summarizeConnectionOptions(connectionOptions),
      server: {
        currentDatabase: server.current_database || null,
        currentUser: server.current_user || null,
        serverVersion: server.server_version || null,
        sslSetting: server.ssl_setting || null
      },
      migrations: {
        total: migrationStatus.length,
        applied: appliedCount,
        pending: migrationStatus.length - appliedCount,
        items: migrationStatus
      }
    };
  } finally {
    await client.end();
  }
}