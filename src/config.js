import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = process.env.DATA_DIR || path.join(rootDir, "data");

export const config = {
  rootDir,
  publicDir: path.join(rootDir, "public"),
  dataDir,
  uploadDir: process.env.UPLOAD_DIR || path.join(dataDir, "uploads"),
  backupDir: process.env.BACKUP_DIR || path.join(dataDir, "backups"),
  dbFilePath: process.env.DB_FILE_PATH || path.join(dataDir, "app.sqlite"),
  storageEngine: process.env.STORAGE_ENGINE || "SQLITE",
  databaseUrl: process.env.DATABASE_URL || "",
  postgresSslMode: process.env.POSTGRES_SSL_MODE || process.env.PGSSLMODE || "",
  postgresSslRequire: process.env.POSTGRES_SSL_REQUIRE || "",
  postgresSslCaPath: process.env.POSTGRES_SSL_CA_PATH || "",
  postgresApplicationName: process.env.POSTGRES_APPLICATION_NAME || "field-agreement-assistant",
  postgresPoolMax: process.env.POSTGRES_POOL_MAX || "10",
  appBaseUrl: process.env.APP_BASE_URL || "",
  mailProvider: process.env.MAIL_PROVIDER || "",
  mailFrom: process.env.MAIL_FROM || "login@field-agreement.local",
  resendApiKey: process.env.RESEND_API_KEY || "",
  nodeEnv: process.env.NODE_ENV || "development",
  objectStorageProvider: process.env.OBJECT_STORAGE_PROVIDER || "LOCAL_VOLUME",
  objectStorageBucket: process.env.OBJECT_STORAGE_BUCKET || "",
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "faa_session",
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || "faa_refresh",
  csrfCookieName: process.env.CSRF_COOKIE_NAME || "faa_csrf",
  ownerToken: process.env.OWNER_TOKEN || "dev-owner-token",
  ownerId: process.env.OWNER_ID || "owner_demo"
};