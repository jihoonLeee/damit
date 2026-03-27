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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
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

function getBaseUrlHost(baseUrl) {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl.replace(/^https?:\/\//, "");
  }
}

function formatRoleLabel(role) {
  const normalized = String(role || "").trim().toUpperCase();
  if (normalized === "OWNER") {
    return "대표";
  }
  if (normalized === "MANAGER") {
    return "운영 관리자";
  }
  if (normalized === "MEMBER") {
    return "팀원";
  }
  return String(role || "").trim() || "팀원";
}

function buildEmailShell({
  baseUrl,
  eyebrow,
  title,
  summary,
  primaryLabel,
  primaryHref,
  bodyHtml,
  rawHref,
  rawLabel = "버튼이 열리지 않으면 아래 링크를 복사해 사용해 주세요."
}) {
  const serviceHost = getBaseUrlHost(baseUrl);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeTitle = escapeHtml(title);
  const safeSummary = escapeHtml(summary);
  const safePrimaryLabel = escapeHtml(primaryLabel);
  const safePrimaryHref = escapeHtml(primaryHref);
  const safeRawHref = escapeHtml(rawHref);
  const safeRawLabel = escapeHtml(rawLabel);

  return `<!doctype html>
<html lang="ko">
  <body style="margin:0;padding:0;background:#f5efe3;color:#162642;font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5efe3;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#fffaf0;border:1px solid #d6ccb8;">
            <tr>
              <td style="padding:28px 32px 20px;border-bottom:1px solid #e6dcc9;">
                <div style="font-size:12px;letter-spacing:0.18em;font-weight:700;color:#8d6c3d;text-transform:uppercase;">${safeEyebrow}</div>
                <div style="margin-top:12px;font-size:30px;line-height:1;font-weight:800;letter-spacing:0.18em;color:#10284a;">DAMIT</div>
                <div style="margin-top:16px;font-size:26px;line-height:1.35;font-weight:700;color:#10284a;">${safeTitle}</div>
                <div style="margin-top:12px;font-size:15px;line-height:1.7;color:#394b68;">${safeSummary}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 12px;font-size:15px;line-height:1.75;color:#243553;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 8px;">
                <a href="${safePrimaryHref}" style="display:inline-block;background:#10284a;color:#fffaf0;text-decoration:none;font-size:15px;font-weight:700;padding:14px 24px;border-radius:999px;">${safePrimaryLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 12px;">
                <div style="border:1px solid #e2d7c4;background:#f8f3e8;padding:14px 16px;">
                  <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7d6540;">직접 열기 링크</div>
                  <div style="margin-top:8px;font-size:13px;line-height:1.7;color:#394b68;">${safeRawLabel}</div>
                  <div style="margin-top:10px;word-break:break-all;font-size:13px;line-height:1.7;color:#10284a;">${safeRawHref}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 28px;font-size:12px;line-height:1.7;color:#5a6a82;">
                이 메일은 ${escapeHtml(serviceHost)} 운영 시스템에서 발송되었습니다.<br>
                본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildMagicLinkMessage({ baseUrl, email, challengeId, token, invitationToken }) {
  const magicLink = new URL(`${baseUrl}/login`);
  magicLink.searchParams.set("challengeId", challengeId);
  magicLink.searchParams.set("token", token);
  if (invitationToken) {
    magicLink.searchParams.set("invitationToken", invitationToken);
    magicLink.searchParams.set("email", email);
  }

  const href = magicLink.toString();
  const summary = "사장님이 현장 기록과 추가금 합의 내역을 바로 이어서 확인할 수 있도록 로그인 링크를 준비했습니다.";
  const ttlMinutes = config.authChallengeTtlMinutes;
  const html = buildEmailShell({
    baseUrl,
    eyebrow: "Secure sign-in",
    title: "로그인 링크가 도착했습니다",
    summary,
    primaryLabel: "로그인 링크 열기",
    primaryHref: href,
    rawHref: href,
    bodyHtml: `
      <p style="margin:0 0 14px;">안녕하세요. <strong>다밋</strong> 로그인 링크를 보내드립니다.</p>
      <p style="margin:0 0 14px;">아래 버튼을 누르면 사장님 운영 화면으로 바로 들어갈 수 있습니다.</p>
      <p style="margin:0 0 14px;"><strong>유효 시간:</strong> 발급 후 ${escapeHtml(ttlMinutes)}분</p>
      <p style="margin:0;">링크는 1회성 로그인 절차를 위한 용도이며, 문제가 생기면 다시 로그인 링크를 요청하시면 됩니다.</p>
    `
  });

  return {
    template: "magic-link",
    to: email,
    subject: "[다밋] 로그인 링크가 도착했습니다",
    text: [
      "[다밋] 로그인 링크가 도착했습니다",
      "",
      "안녕하세요. 다밋 로그인 링크를 보내드립니다.",
      `아래 링크를 열어 로그인해 주세요. 이 링크는 ${ttlMinutes}분 동안 유효합니다.`,
      href,
      "",
      "본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다."
    ].join("\n"),
    html,
    meta: {
      challengeId,
      debugLink: href
    }
  };
}

export function buildInvitationMessage({ baseUrl, email, role, companyName, invitationToken }) {
  const inviteLink = new URL(`${baseUrl}/login`);
  inviteLink.searchParams.set("invitationToken", invitationToken);
  inviteLink.searchParams.set("email", email);

  const href = inviteLink.toString();
  const roleLabel = formatRoleLabel(role);
  const safeCompanyName = escapeHtml(companyName);
  const html = buildEmailShell({
    baseUrl,
    eyebrow: "Team invitation",
    title: "팀 초대가 도착했습니다",
    summary: `${companyName} 운영 공간에서 함께 일할 수 있도록 초대 링크를 준비했습니다.`,
    primaryLabel: "초대 링크 열기",
    primaryHref: href,
    rawHref: href,
    bodyHtml: `
      <p style="margin:0 0 14px;"><strong>${safeCompanyName}</strong>에서 다밋 팀으로 초대했습니다.</p>
      <p style="margin:0 0 14px;"><strong>권한:</strong> ${escapeHtml(roleLabel)}</p>
      <p style="margin:0 0 14px;">아래 링크에서 로그인하면 회사 운영 화면과 작업 흐름에 바로 합류할 수 있습니다.</p>
      <p style="margin:0;">초대를 기대하지 않았다면 회사 운영 담당자에게 먼저 확인해 주세요.</p>
    `
  });

  return {
    template: "company-invitation",
    to: email,
    subject: `[다밋] ${companyName} 팀 초대가 도착했습니다`,
    text: [
      `[다밋] ${companyName} 팀 초대가 도착했습니다`,
      "",
      `${companyName}에서 ${roleLabel} 권한으로 다밋 팀에 초대했습니다.`,
      "아래 링크에서 로그인하면 바로 합류할 수 있습니다.",
      href,
      "",
      "초대를 기대하지 않았다면 회사 운영 담당자에게 확인해 주세요."
    ].join("\n"),
    html,
    meta: {
      debugLink: href,
      role,
      companyName
    }
  };
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
  const message = buildMagicLinkMessage({ baseUrl, email, challengeId, token, invitationToken });
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
  const message = buildInvitationMessage({ baseUrl, email, role, companyName, invitationToken });
  const result = await sendMessage(message);
  return {
    provider: result.provider,
    status: result.status,
    targetMasked: result.targetMasked,
    debugInvitationLink: result.debugLink,
    previewPath: result.previewPath
  };
}
