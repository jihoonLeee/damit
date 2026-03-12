import { config } from "../config.js";
import { assertRepositoryBundle } from "./contracts.js";
import { createPostgresRepositoryBundle } from "./postgres/createPostgresRepositoryBundle.js";
import { createSqliteRepositoryBundle } from "./sqlite/createSqliteRepositoryBundle.js";

export function createRepositoryBundle(options = {}) {
  const engine = (options.engine || config.storageEngine || "SQLITE").toUpperCase();

  if (engine === "POSTGRES") {
    return assertRepositoryBundle(
      createPostgresRepositoryBundle({
        databaseUrl: options.databaseUrl || config.databaseUrl,
        sslMode: options.sslMode || config.postgresSslMode,
        sslRequire: options.sslRequire || config.postgresSslRequire,
        sslCaPath: options.sslCaPath || config.postgresSslCaPath,
        applicationName: options.applicationName || config.postgresApplicationName,
        maxPoolSize: options.maxPoolSize || config.postgresPoolMax,
        pool: options.pool || null
      })
    );
  }

  return assertRepositoryBundle(createSqliteRepositoryBundle());
}
