import fs from "node:fs";
import path from "node:path";

function stripQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseEnvText(text) {
  const entries = [];
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separatorIndex = rawLine.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = rawLine.slice(0, separatorIndex).trim();
    const value = stripQuotes(rawLine.slice(separatorIndex + 1));
    if (!key) {
      continue;
    }
    entries.push([key, value]);
  }
  return entries;
}

export function loadEnvFile(filePath, { override = true } = {}) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`ENV_FILE_NOT_FOUND: ${absolutePath}`);
  }

  const text = fs.readFileSync(absolutePath, "utf8");
  const loadedKeys = [];
  for (const [key, value] of parseEnvText(text)) {
    if (!override && Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }
    process.env[key] = value;
    loadedKeys.push(key);
  }

  return {
    path: absolutePath,
    loadedKeys
  };
}