import { config } from "../src/config.js";
import { ensureStorage } from "../src/store.js";
import { ensureAuthStorage } from "../src/contexts/auth/infrastructure/sqlite-auth-store.js";
import { ensureCustomerConfirmationStorage } from "../src/contexts/customer-confirmation/infrastructure/sqlite-customer-confirmation-store.js";
import { createRepositoryBundle } from "../src/repositories/createRepositoryBundle.js";

function readArg(name, fallback = null) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const dataset = readArg("dataset", "jobCases");
const limit = Number.parseInt(readArg("limit", "8"), 10);
const jsonOnly = process.argv.includes("--json");

if (config.storageEngine !== "SQLITE") {
  console.error(`operator-data-explorer currently expects SQLITE runtime, got ${config.storageEngine}`);
  process.exit(1);
}

await ensureStorage();
await ensureAuthStorage();
await ensureCustomerConfirmationStorage();

const repositories = createRepositoryBundle();
const explorer = await repositories.systemRepository.getDataExplorer(dataset, limit);
const payload = {
  storageEngine: config.storageEngine,
  dbFilePath: config.dbFilePath,
  generatedAt: explorer.generatedAt,
  datasets: explorer.datasets,
  selected: explorer.selected
};

if (jsonOnly) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`DAMIT operator data explorer`);
  console.log(`db: ${config.dbFilePath}`);
  console.log(`generatedAt: ${explorer.generatedAt}`);
  console.log("");
  console.log("datasets:");
  for (const item of explorer.datasets) {
    console.log(`- ${item.label} (${item.key}) / ${item.count} rows / latest ${item.latestAt || "-"}`);
  }
  console.log("");
  console.log(`selected: ${explorer.selected.label} (${explorer.selected.tableName})`);
  console.log(`columns: ${explorer.selected.columns.join(", ")}`);
  console.log(JSON.stringify(explorer.selected.rows, null, 2));
}

await repositories.close?.();
