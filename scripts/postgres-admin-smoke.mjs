import { config } from "../src/config.js";
import { createRepositoryBundle } from "../src/repositories/createRepositoryBundle.js";

const repositories = createRepositoryBundle({ engine: "POSTGRES" });

try {
  const summaryBefore = await repositories.systemRepository.getStorageSummary();
  const backup = await repositories.systemRepository.createBackup("staging-postgres-admin-smoke");
  const summaryAfterReset = await repositories.systemRepository.resetAllData();

  console.log(JSON.stringify({
    ok: true,
    summaryBefore,
    backup,
    summaryAfterReset
  }, null, 2));
} finally {
  if (typeof repositories.close === "function") {
    await repositories.close();
  }
}
