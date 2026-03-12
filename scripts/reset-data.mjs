import { ensureStorage, resetDb } from "../src/store.js";

await ensureStorage();
await resetDb();
console.log("Pilot data reset complete.");
