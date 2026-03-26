import path from "node:path";
import fs from "node:fs/promises";

import { config } from "./config.js";

export function maskEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const [localPart = "", domainPart = ""] = normalized.split("@");
  if (!localPart || !domainPart) {
    return normalized;
  }

  const [domainName = "", ...domainRest] = domainPart.split(".");
  const maskSegment = (value, visible = 2) => {
    if (!value) {
      return "";
    }
    if (value.length <= visible) {
      return `${value[0]}*`;
    }
    return `${value.slice(0, visible)}${"*".repeat(Math.max(1, value.length - visible))}`;
  };

  return `${maskSegment(localPart, 2)}@${[maskSegment(domainName, 1), ...domainRest].filter(Boolean).join(".")}`;
}

export function isValidMailFrom(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return false;
  }

  const plainEmail = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const namedEmail = /^[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/;
  return plainEmail.test(normalized) || namedEmail.test(normalized);
}

export function assertValidMailFrom(value) {
  if (!isValidMailFrom(value)) {
    throw new Error("MAIL_FROM must use email@example.com or Name <email@example.com> format.");
  }
}

function getBaseUrl(request) {
  if (config.appBaseUrl) {
    return config.appBaseUrl.replace(/\/$/, "");
  }
  const host = request.headers.host;
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocol = forwardedProto || (host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}

async function sendWithFileGateway(message) {
  const outputDir = path.join(config.dataDir, "dev-emails");
  await fs.mkdir(outputDir, { recursive: true });
  const fileName = `${Date.now()}-${message.to.replace(/[^a-z0-9@._-]/gi, "_")}.json`;
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(message, null, 2), "utf8");
  return {
    provider: "FILE",
    status: "SENT",
    previewPath: filePath
  };
}

async function sendWithResend(message) {
  assertValidMailFrom(config.mailFrom);

  if (!config.resendApiKey) {
    throw new Error("RESEND_API_KEY is required for Resend delivery.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.mailFrom,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend delivery failed: ${text}`);
  }

  return {
    provider: "RESEND",
    status: "SENT"
  };
}

async function sendMessage(message) {
  const provider = (config.mailProvider || (config.nodeEnv === "production" ? "RESEND" : "FILE")).toUpperCase();
  const result = provider === "RESEND"
    ? await sendWithResend(message)
    : await sendWithFileGateway(message);

  return {
    ...result,
    debugLink: config.authDebugLinks ? message.meta?.debugLink : undefined,
    previewPath: config.authDebugLinks ? result.previewPath : undefined,
    targetMasked: maskEmail(message.to)
  };
}

export async function sendMagicLinkEmail({ request, email, challengeId, token, invitationToken }) {
  const baseUrl = getBaseUrl(request);
  const magicLink = new URL(`${baseUrl}/login`);
  magicLink.searchParams.set("challengeId", challengeId);
  magicLink.searchParams.set("token", token);
  if (invitationToken) {
    magicLink.searchParams.set("invitationToken", invitationToken);
    magicLink.searchParams.set("email", email);
  }

  const href = magicLink.toString();
  const message = {
    template: "magic-link",
    to: email,
    subject: "현장 추가금 합의 비서 로그인 링크",
    text: `아래 링크를 눌러 로그인하세요.\n${href}`,
    html: `<p>아래 링크를 눌러 로그인하세요.</p><p><a href="${href}">${href}</a></p>`,
    meta: {
      challengeId,
      debugLink: href
    }
  };

  const result = await sendMessage(message);
  return {
    provider: result.provider,
    status: result.status,
    targetMasked: result.targetMasked,
    debugMagicLink: result.debugLink,
    previewPath: result.previewPath
  };
}

export async function sendInvitationEmail({ request, email, role, companyName, invitationToken }) {
  const baseUrl = getBaseUrl(request);
  const inviteLink = new URL(`${baseUrl}/login`);
  inviteLink.searchParams.set("invitationToken", invitationToken);
  inviteLink.searchParams.set("email", email);

  const href = inviteLink.toString();
  const message = {
    template: "company-invitation",
    to: email,
    subject: `[${companyName}] 팀 초대가 도착했습니다`,
    text: `${companyName}에서 ${role} 역할로 초대했습니다. 아래 링크에서 로그인 후 합류하세요.\n${href}`,
    html: `<p><strong>${companyName}</strong>에서 <strong>${role}</strong> 역할로 초대했습니다.</p><p><a href="${href}">${href}</a></p>`,
    meta: {
      debugLink: href,
      role,
      companyName
    }
  };

  const result = await sendMessage(message);
  return {
    provider: result.provider,
    status: result.status,
    targetMasked: result.targetMasked,
    debugInvitationLink: result.debugLink,
    previewPath: result.previewPath
  };
}
