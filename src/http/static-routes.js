import fs from "node:fs/promises";
import path from "node:path";
import { createReadStream } from "node:fs";

import { config } from "../config.js";
import { buildStandardHeaders, notFound } from "../http.js";
import { resolveLocalUploadPath } from "../object-storage/createObjectStorage.js";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const publicRouteMap = new Map([
  ["/", "landing.html"],
  ["/landing", "landing.html"],
  ["/start", "start.html"],
  ["/login", "login.html"],
  ["/home", "home.html"],
  ["/account", "account.html"],
  ["/app", "index.html"],
  ["/app/capture", "index.html"],
  ["/app/quote", "index.html"],
  ["/app/draft", "index.html"],
  ["/app/confirm", "index.html"],
  ["/ops", "ops.html"],
  ["/admin", "admin.html"]
]);

export function normalizePathname(urlValue) {
  return new URL(urlValue, "http://localhost").pathname;
}

export async function serveStaticRequest(pathname, response) {
  if (pathname.startsWith("/uploads/")) {
    if (String(config.objectStorageProvider || "LOCAL_VOLUME").toUpperCase() !== "LOCAL_VOLUME") {
      notFound(response);
      return true;
    }

    const uploadObjectKey = pathname.replace("/uploads/", "");
    await serveFile(response, resolveLocalUploadPath(config.uploadDir, uploadObjectKey));
    return true;
  }

  if (pathname.startsWith("/confirm/")) {
    await serveFile(response, path.join(config.publicDir, "confirm.html"));
    return true;
  }

  if (publicRouteMap.has(pathname)) {
    await serveFile(response, path.join(config.publicDir, publicRouteMap.get(pathname)));
    return true;
  }

  await serveFile(response, path.join(config.publicDir, pathname));
  return true;
}

async function serveFile(response, filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await serveFile(response, path.join(filePath, "index.html"));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    response.writeHead(200, buildStandardHeaders(mimeTypes[ext] || "application/octet-stream"));
    createReadStream(filePath).pipe(response);
  } catch {
    notFound(response);
  }
}
