import { assessPostgresReadiness } from "../src/db/postgres-readiness.js";

const report = assessPostgresReadiness(process.env);
const serialized = JSON.stringify(report, null, 2);

if (report.ok) {
  console.log(serialized);
} else {
  console.error(serialized);
  process.exit(1);
}
