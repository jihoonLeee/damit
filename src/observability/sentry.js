import * as Sentry from "@sentry/node";

import { config } from "../config.js";

let initialized = false;
let enabled = false;

export async function initializeObservability() {
  if (initialized) {
    return;
  }

  initialized = true;
  if (!String(config.sentryDsn || "").trim()) {
    return;
  }

  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.sentryEnvironment || config.nodeEnv,
    release: config.sentryRelease || undefined
  });
  enabled = true;
}

export function captureServerError(error, context = {}) {
  if (!enabled || !error) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context.requestId) {
      scope.setTag("request_id", String(context.requestId));
    }
    if (context.channel) {
      scope.setTag("channel", String(context.channel));
    }
    if (context.status) {
      scope.setTag("http_status", String(context.status));
    }
    if (context.code) {
      scope.setTag("app_error_code", String(context.code));
    }

    const request = context.request;
    if (request) {
      scope.setContext("request", {
        method: request.method || null,
        url: request.url || null,
        host: request.headers?.host || null,
        forwardedProto: request.headers?.["x-forwarded-proto"] || null,
        forwardedFor: request.headers?.["x-forwarded-for"] || null,
        userAgent: request.headers?.["user-agent"] || null
      });
    }

    scope.setContext("runtime", {
      nodeEnv: config.nodeEnv,
      storageEngine: config.storageEngine
    });

    Sentry.captureException(error);
  });
}

export async function flushObservability(timeoutMs = 2000) {
  if (!enabled) {
    return;
  }

  try {
    await Sentry.flush(timeoutMs);
  } catch {
    // Ignore flush errors during best-effort shutdown/reporting.
  }
}

export function getObservabilityStatus() {
  return {
    sentryConfigured: Boolean(String(config.sentryDsn || "").trim()),
    sentryEnabled: enabled,
    sentryEnvironment: config.sentryEnvironment || config.nodeEnv,
    sentryRelease: config.sentryRelease || null
  };
}
