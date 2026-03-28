import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = process.env.DATA_DIR || path.join(rootDir, "data");
const nodeEnv = process.env.NODE_ENV || "development";

function readBoolean(value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function readInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

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
  postgresApplicationName: process.env.POSTGRES_APPLICATION_NAME || "damit",
  postgresPoolMax: process.env.POSTGRES_POOL_MAX || "10",
  appBaseUrl: process.env.APP_BASE_URL || "",
  trustedOrigins: process.env.TRUSTED_ORIGINS || "",
  mailProvider: process.env.MAIL_PROVIDER || "",
  mailFrom: process.env.MAIL_FROM || "login@damit.local",
  resendApiKey: process.env.RESEND_API_KEY || "",
  sentryDsn: process.env.SENTRY_DSN || "",
  sentryEnvironment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
  sentryRelease: process.env.SENTRY_RELEASE || "",
  nodeEnv,
  objectStorageProvider: process.env.OBJECT_STORAGE_PROVIDER || "LOCAL_VOLUME",
  objectStorageBucket: process.env.OBJECT_STORAGE_BUCKET || "",
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "faa_session",
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || "faa_refresh",
  csrfCookieName: process.env.CSRF_COOKIE_NAME || "faa_csrf",
  sessionCookieSameSite: process.env.SESSION_COOKIE_SAMESITE || "Strict",
  csrfCookieSameSite: process.env.CSRF_COOKIE_SAMESITE || "Strict",
  sessionMaxAgeSeconds: readInteger(process.env.SESSION_MAX_AGE_SECONDS, 8 * 60 * 60),
  refreshSessionMaxAgeSeconds: readInteger(process.env.REFRESH_SESSION_MAX_AGE_SECONDS, 30 * 24 * 60 * 60),
  sessionIdleTimeoutSeconds: readInteger(process.env.SESSION_IDLE_TIMEOUT_SECONDS, 12 * 60 * 60),
  authChallengeTtlMinutes: readInteger(process.env.AUTH_CHALLENGE_TTL_MINUTES, 15),
  authEnforceTrustedOrigin: readBoolean(process.env.AUTH_ENFORCE_TRUSTED_ORIGIN, nodeEnv === "production"),
  authDebugLinks: readBoolean(process.env.AUTH_DEBUG_LINKS, nodeEnv !== "production"),
  trustProxyHeaders: readBoolean(process.env.TRUST_PROXY_HEADERS, nodeEnv === "production"),
  customerNotificationPrimary: process.env.CUSTOMER_NOTIFICATION_PRIMARY || "KAKAO_ALIMTALK",
  customerNotificationFallback: process.env.CUSTOMER_NOTIFICATION_FALLBACK || "SMS",
  kakaoBizMessageProvider: process.env.KAKAO_BIZMESSAGE_PROVIDER || "",
  smsProvider: process.env.SMS_PROVIDER || "",
  maxJsonBodyBytes: readInteger(process.env.MAX_JSON_BODY_BYTES, 64 * 1024),
  maxMultipartBodyBytes: readInteger(process.env.MAX_MULTIPART_BODY_BYTES, 15 * 1024 * 1024),
  maxUploadFileBytes: readInteger(process.env.MAX_UPLOAD_FILE_BYTES, 10 * 1024 * 1024),
  authChallengeIpRateLimitCount: readInteger(process.env.AUTH_CHALLENGE_IP_RATE_LIMIT_COUNT, 5),
  authChallengeIpRateLimitWindowSeconds: readInteger(process.env.AUTH_CHALLENGE_IP_RATE_LIMIT_WINDOW_SECONDS, 10 * 60),
  authVerifyRateLimitCount: readInteger(process.env.AUTH_VERIFY_RATE_LIMIT_COUNT, 12),
  authVerifyRateLimitWindowSeconds: readInteger(process.env.AUTH_VERIFY_RATE_LIMIT_WINDOW_SECONDS, 10 * 60),
  publicConfirmViewRateLimitCount: readInteger(process.env.PUBLIC_CONFIRM_VIEW_RATE_LIMIT_COUNT, 30),
  publicConfirmViewRateLimitWindowSeconds: readInteger(process.env.PUBLIC_CONFIRM_VIEW_RATE_LIMIT_WINDOW_SECONDS, 10 * 60),
  publicConfirmAckRateLimitCount: readInteger(process.env.PUBLIC_CONFIRM_ACK_RATE_LIMIT_COUNT, 6),
  publicConfirmAckRateLimitWindowSeconds: readInteger(process.env.PUBLIC_CONFIRM_ACK_RATE_LIMIT_WINDOW_SECONDS, 10 * 60),
  invitationCreateRateLimitCount: readInteger(process.env.INVITATION_CREATE_RATE_LIMIT_COUNT, 8),
  invitationCreateRateLimitWindowSeconds: readInteger(process.env.INVITATION_CREATE_RATE_LIMIT_WINDOW_SECONDS, 10 * 60),
  invitationReissueRateLimitCount: readInteger(process.env.INVITATION_REISSUE_RATE_LIMIT_COUNT, 12),
  invitationReissueRateLimitWindowSeconds: readInteger(process.env.INVITATION_REISSUE_RATE_LIMIT_WINDOW_SECONDS, 10 * 60),
  systemAdminEmails: readList(process.env.SYSTEM_ADMIN_EMAILS),
  ownerId: process.env.OWNER_ID || "system_owner"
};
