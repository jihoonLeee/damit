import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "../src/app.js";
import { config } from "../src/config.js";
import { createAuthCookieHeaders } from "../src/contexts/auth/application/auth-runtime.js";
import { writeDb } from "../src/store.js";
import { createOwnerSession, getCookieValue } from "../tests/helpers/session-auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const outputDir = path.join(workspaceRoot, "output", "visual-review");
const edgeCandidates = [
  process.env.EDGE_PATH,
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].filter(Boolean);

async function resolveEdgePath() {
  for (const candidate of edgeCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(`Microsoft Edge executable was not found. Checked: ${edgeCandidates.join(", ")}`);
}


async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const edgePath = await resolveEdgePath();
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "field-agreement-review-"));
  const tempDataDir = path.join(tempRoot, "data");
  const tempUploadDir = path.join(tempDataDir, "uploads");
  const tempDbPath = path.join(tempDataDir, "app.sqlite");

  config.publicDir = path.join(workspaceRoot, "public");
  config.storageEngine = "SQLITE";
  config.dataDir = tempDataDir;
  config.uploadDir = tempUploadDir;
  config.dbFilePath = tempDbPath;
  config.authDebugLinks = true;
  config.systemAdminEmails = ["review-admin@example.com"];

  const app = createApp();
  const server = createServer((req, res) => {
    const requestUrl = new URL(req.url, "http://127.0.0.1");
    if (requestUrl.pathname === "/__visual-review-session") {
      return serveVisualReviewSessionRedirect(res, requestUrl, reviewSessions);
    }
    return app.handle(req, res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const ownerSession = await createOwnerSession(baseUrl, config, {
    email: "review-owner@example.com",
    displayName: "Review Owner",
    companyName: "Damit Review"
  });
  const adminSession = await createOwnerSession(baseUrl, config, {
    email: "review-admin@example.com",
    displayName: "Review Admin",
    companyName: "Damit Internal"
  });
  const meResponse = await fetch(`${baseUrl}/api/v1/me`, {
    headers: { Cookie: ownerSession.cookieHeader }
  });
  const mePayload = await meResponse.json();
  const reviewSessions = {
    owner: {
      sessionId: getCookieValue(ownerSession.cookieHeader, config.sessionCookieName),
      refreshToken: getCookieValue(ownerSession.cookieHeader, config.refreshCookieName),
      csrfToken: getCookieValue(ownerSession.cookieHeader, config.csrfCookieName)
    },
    admin: {
      sessionId: getCookieValue(adminSession.cookieHeader, config.sessionCookieName),
      refreshToken: getCookieValue(adminSession.cookieHeader, config.refreshCookieName),
      csrfToken: getCookieValue(adminSession.cookieHeader, config.csrfCookieName)
    }
  };

  await seedReviewData(tempUploadDir, {
    ownerId: mePayload.user.id,
    companyId: mePayload.company.id
  });

  try {
    await captureScreenshot({
      url: baseUrl,
      width: 1440,
      height: 1600,
      outputPath: path.join(outputDir, "desktop-overview.png"),
      timeBudget: 10000,
      edgePath
    });

    await captureScreenshot({
      url: baseUrl,
      width: 390,
      height: 844,
      outputPath: path.join(outputDir, "mobile-overview.png"),
      timeBudget: 10000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/app?review=detail"),
      width: 390,
      height: 900,
      outputPath: path.join(outputDir, "mobile-detail-top.png"),
      timeBudget: 14000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/app?review=agreement"),
      width: 390,
      height: 980,
      outputPath: path.join(outputDir, "mobile-agreement.png"),
      timeBudget: 16000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/app?review=copy"),
      width: 390,
      height: 844,
      outputPath: path.join(outputDir, "mobile-copy.png"),
      timeBudget: 12000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/home"),
      width: 1440,
      height: 2600,
      outputPath: path.join(outputDir, "desktop-home-authenticated.png"),
      timeBudget: 12000,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/app"),
      width: 1440,
      height: 1600,
      outputPath: path.join(outputDir, "desktop-app-authenticated.png"),
      timeBudget: 12000,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/app"),
      width: 390,
      height: 1280,
      outputPath: path.join(outputDir, "mobile-app-overview-hub.png"),
      timeBudget: 14000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/app/quote?caseId=jc_demo_3"),
      width: 390,
      height: 1180,
      outputPath: path.join(outputDir, "mobile-quote-stage.png"),
      timeBudget: 14000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/app/draft?caseId=jc_demo_3"),
      width: 390,
      height: 1180,
      outputPath: path.join(outputDir, "mobile-draft-stage.png"),
      timeBudget: 14000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/app/confirm?caseId=jc_demo_4"),
      width: 390,
      height: 1260,
      outputPath: path.join(outputDir, "mobile-confirm-stage.png"),
      timeBudget: 15000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/app?review=ops-return&caseId=jc_demo_2&source=ops&reason=quote-missing&target=quote-card"),
      width: 390,
      height: 980,
      outputPath: path.join(outputDir, "mobile-app-ops-return.png"),
      timeBudget: 14000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/ops"),
      width: 1440,
      height: 1800,
      outputPath: path.join(outputDir, "desktop-ops-authenticated.png"),
      timeBudget: 12000,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/ops?review=handoff"),
      width: 390,
      height: 1280,
      outputPath: path.join(outputDir, "mobile-ops-authenticated.png"),
      timeBudget: 14000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/account"),
      width: 1440,
      height: 3000,
      outputPath: path.join(outputDir, "desktop-account-authenticated.png"),
      timeBudget: 12000,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/account"),
      width: 390,
      height: 1720,
      outputPath: path.join(outputDir, "mobile-account-authenticated.png"),
      timeBudget: 14000,
      mobile: true,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/admin", "admin"),
      width: 1440,
      height: 2100,
      outputPath: path.join(outputDir, "desktop-admin-authenticated.png"),
      timeBudget: 12000,
      edgePath
    });

    await captureScreenshot({
      url: buildAuthenticatedReviewUrl(baseUrl, "/admin", "admin"),
      width: 390,
      height: 1500,
      outputPath: path.join(outputDir, "mobile-admin-authenticated.png"),
      timeBudget: 14000,
      mobile: true,
      edgePath
    });
  } finally {
    server.close();
  }
}

function buildAuthenticatedReviewUrl(baseUrl, targetPath, viewer = "owner") {
  const reviewUrl = new URL(`${baseUrl}/__visual-review-session`);
  reviewUrl.searchParams.set("target", targetPath);
  reviewUrl.searchParams.set("viewer", viewer);
  return reviewUrl.toString();
}

function serveVisualReviewSessionRedirect(res, requestUrl, reviewSessions) {
  const target = requestUrl.searchParams.get("target") || "/app";
  const viewer = requestUrl.searchParams.get("viewer") || "owner";
  const cookieHeaders = createAuthCookieHeaders(reviewSessions[viewer] || reviewSessions.owner);
  res.writeHead(302, {
    location: target,
    "set-cookie": cookieHeaders,
    "cache-control": "no-store"
  });
  res.end();
}

async function captureScreenshot({ url, width, height, outputPath, timeBudget, mobile = false, userDataDir = null, edgePath }) {
  console.log(`[visual-review] capture:start ${url}`);

  const args = [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-sync",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
    `--virtual-time-budget=${timeBudget}`,
    `--screenshot=${outputPath}`,
    url
  ];

  if (userDataDir) {
    args.push(`--user-data-dir=${userDataDir}`);
  }

  if (mobile) {
    args.push("--force-device-scale-factor=2");
  }

  const child = spawn(edgePath, args, {
    stdio: ["ignore", "ignore", "pipe"]
  });

  const errors = [];
  child.stderr.on("data", (chunk) => errors.push(chunk.toString()));

  const exitCode = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Edge screenshot timed out for ${url}`));
    }, Math.max(timeBudget + 8000, 15000));

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });

  if (exitCode !== 0) {
    throw new Error(`Edge screenshot failed for ${url}: ${errors.join(" ")}`);
  }

  console.log(`[visual-review] capture:done ${outputPath}`);
}

async function seedReviewData(tempUploadDir, { ownerId, companyId }) {
  await fs.mkdir(tempUploadDir, { recursive: true });
  const photo1 = "review-photo-1.svg";
  const photo2 = "review-photo-2.svg";

  await fs.writeFile(path.join(tempUploadDir, photo1), createSvg("#dbeafe", "니코틴 오염", "거실 벽면"), "utf8");
  await fs.writeFile(path.join(tempUploadDir, photo2), createSvg("#dcfce7", "베란다 추가", "창고/베란다"), "utf8");

  const now = new Date("2026-03-11T09:00:00Z");
  const plusMin = (minutes) => new Date(now.getTime() + minutes * 60000).toISOString();

  const db = {
    jobCases: [
      {
        id: "jc_demo_1",
        owner_id: ownerId,
        customer_label: "송파 힐스테이트 1203호",
        contact_memo: "당근 문의 고객",
        site_label: "송파 힐스테이트 1203호",
        original_quote_amount: 250000,
        revised_quote_amount: 320000,
        quote_delta_amount: 70000,
        current_status: "AGREED",
        created_at: plusMin(0),
        updated_at: plusMin(20),
        company_id: companyId,
        created_by_user_id: ownerId,
        assigned_user_id: ownerId,
        updated_by_user_id: ownerId
      },
      {
        id: "jc_demo_2",
        owner_id: ownerId,
        customer_label: "잠실 리센츠 804호",
        contact_memo: "전화 문의",
        site_label: "잠실 리센츠 804호",
        original_quote_amount: 280000,
        revised_quote_amount: 360000,
        quote_delta_amount: 80000,
        current_status: "ON_HOLD",
        created_at: plusMin(2),
        updated_at: plusMin(18),
        company_id: companyId,
        created_by_user_id: ownerId,
        assigned_user_id: ownerId,
        updated_by_user_id: ownerId
      },
      {
        id: "jc_demo_3",
        owner_id: ownerId,
        customer_label: "강동 센트럴 1504호",
        contact_memo: "네이버 예약 고객",
        site_label: "강동 센트럴 1504호",
        original_quote_amount: 290000,
        revised_quote_amount: 340000,
        quote_delta_amount: 50000,
        current_status: "EXPLAINED",
        created_at: plusMin(4),
        updated_at: plusMin(14),
        company_id: companyId,
        created_by_user_id: ownerId,
        assigned_user_id: ownerId,
        updated_by_user_id: ownerId
      },
      {
        id: "jc_demo_4",
        owner_id: ownerId,
        customer_label: "마포 스테이 602호",
        contact_memo: "카카오 채널 문의",
        site_label: "마포 스테이 602호",
        original_quote_amount: 310000,
        revised_quote_amount: 390000,
        quote_delta_amount: 80000,
        current_status: "EXPLAINED",
        created_at: plusMin(6),
        updated_at: plusMin(17),
        company_id: companyId,
        created_by_user_id: ownerId,
        assigned_user_id: ownerId,
        updated_by_user_id: ownerId
      }
    ],
    fieldRecords: [
      {
        id: "fr_demo_1",
        owner_id: ownerId,
        job_case_id: "jc_demo_1",
        primary_reason: "CONTAMINATION",
        secondary_reason: "NICOTINE",
        note: "거실 벽면과 주방 상판 니코틴 오염 심함",
        status: "LINKED",
        created_at: plusMin(3),
        company_id: companyId,
        created_by_user_id: ownerId
      },
      {
        id: "fr_demo_2",
        owner_id: ownerId,
        job_case_id: "jc_demo_1",
        primary_reason: "SPACE_ADDED",
        secondary_reason: "VERANDA_ADDED",
        note: "베란다와 창고 공간 추가 확인",
        status: "LINKED",
        created_at: plusMin(5),
        company_id: companyId,
        created_by_user_id: ownerId
      }
    ],
    fieldRecordPhotos: [
      {
        id: "photo_demo_1",
        field_record_id: "fr_demo_1",
        url: `/uploads/${photo1}`,
        sort_order: 0,
        created_at: plusMin(3)
      },
      {
        id: "photo_demo_2",
        field_record_id: "fr_demo_2",
        url: `/uploads/${photo2}`,
        sort_order: 0,
        created_at: plusMin(5)
      }
    ],
    scopeComparisons: [
      {
        id: "sc_demo_1",
        job_case_id: "jc_demo_1",
        base_scope_summary: "기본 입주청소 범위는 일반 생활 오염 기준의 바닥, 주방, 욕실, 창틀 청소를 전제로 합니다.",
        extra_work_summary: "니코틴 오염 제거, 베란다 추가, 창고 추가",
        reason_why_extra: "사전 기본 범위를 넘어서는 오염 제거와 공간 추가가 확인돼 별도 시간과 자재가 필요합니다.",
        updated_at: plusMin(10)
      },
      {
        id: "sc_demo_3",
        job_case_id: "jc_demo_3",
        base_scope_summary: "기본 입주청소 범위는 바닥, 주방, 욕실, 창틀 청소를 포함합니다.",
        extra_work_summary: "붙박이장 내부 정리와 창틀 오염 추가",
        reason_why_extra: "기본 범위를 넘어서는 내부 정리와 창틀 오염 제거 시간이 별도로 필요합니다.",
        updated_at: plusMin(13)
      },
      {
        id: "sc_demo_4",
        job_case_id: "jc_demo_4",
        base_scope_summary: "기본 입주청소 범위는 일반 생활 오염 기준의 공간 정리를 전제로 합니다.",
        extra_work_summary: "주방 후드 분해 세척, 욕실 실리콘 곰팡이 집중 제거",
        reason_why_extra: "현장 확인 결과 기본 범위를 넘어서는 분해 세척과 오염 제거 시간이 필요합니다.",
        updated_at: plusMin(16)
      }
    ],
    messageDrafts: [
      {
        id: "draft_demo_1",
        job_case_id: "jc_demo_1",
        tone: "CUSTOMER_MESSAGE",
        body: "현장 확인 결과 송파 힐스테이트 1203호에서 니코틴 오염과 베란다 추가 작업이 확인됐습니다. 추가 작업 항목은 니코틴 오염 제거, 베란다 추가, 창고 추가입니다. 사전 기본 범위를 넘어서는 오염 제거와 공간 추가가 확인돼 별도 시간과 자재가 필요합니다. 기존 견적 250,000원에서 320,000원으로 변경이 필요합니다. 진행 원하시면 확인 부탁드립니다.",
        created_at: plusMin(12),
        updated_at: plusMin(12),
        company_id: companyId,
        created_by_user_id: ownerId
      },
      {
        id: "draft_demo_4",
        job_case_id: "jc_demo_4",
        tone: "CUSTOMER_MESSAGE",
        body: "현장 확인 결과 마포 스테이 602호에서 주방 후드 분해 세척과 욕실 실리콘 곰팡이 제거가 추가로 필요합니다. 기존 견적 310,000원에서 390,000원으로 변경이 필요하며, 세부 확인을 위해 링크를 함께 보내드립니다.",
        created_at: plusMin(17),
        updated_at: plusMin(17),
        company_id: companyId,
        created_by_user_id: ownerId
      }
    ],
    agreementRecords: [
      {
        id: "ar_demo_1",
        job_case_id: "jc_demo_1",
        status: "AGREED",
        confirmation_channel: "KAKAO_OR_SMS",
        confirmed_at: plusMin(15),
        confirmed_amount: 320000,
        customer_response_note: "추가 비용 안내 후 진행 동의",
        created_at: plusMin(15),
        company_id: companyId,
        created_by_user_id: ownerId
      },
      {
        id: "ar_demo_2",
        job_case_id: "jc_demo_2",
        status: "ON_HOLD",
        confirmation_channel: "PHONE",
        confirmed_at: plusMin(16),
        confirmed_amount: null,
        customer_response_note: "배우자와 상의 후 연락 예정",
        created_at: plusMin(16),
        company_id: companyId,
        created_by_user_id: ownerId
      }
    ],
    timelineEvents: [
      {
        id: "tl_demo_1",
        job_case_id: "jc_demo_1",
        event_type: "FIELD_RECORD_LINKED",
        summary: "니코틴 오염 연결",
        payload_json: { fieldRecordId: "fr_demo_1" },
        created_at: plusMin(6),
        company_id: companyId,
        actor_user_id: ownerId
      },
      {
        id: "tl_demo_2",
        job_case_id: "jc_demo_1",
        event_type: "QUOTE_UPDATED",
        summary: "변경 견적 +70000원",
        payload_json: { revisedQuoteAmount: 320000 },
        created_at: plusMin(10),
        company_id: companyId,
        actor_user_id: ownerId
      },
      {
        id: "tl_demo_3",
        job_case_id: "jc_demo_1",
        event_type: "DRAFT_CREATED",
        summary: "고객 설명 초안 생성",
        payload_json: { draftId: "draft_demo_1" },
        created_at: plusMin(12),
        company_id: companyId,
        actor_user_id: ownerId
      },
      {
        id: "tl_demo_4",
        job_case_id: "jc_demo_1",
        event_type: "AGREEMENT_RECORDED",
        summary: "카카오톡/문자로 320,000원 합의완료",
        payload_json: { agreementId: "ar_demo_1" },
        created_at: plusMin(15),
        company_id: companyId,
        actor_user_id: ownerId
      },
      {
        id: "tl_demo_5",
        job_case_id: "jc_demo_3",
        event_type: "QUOTE_UPDATED",
        summary: "변경 견적 +50000원",
        payload_json: { revisedQuoteAmount: 340000 },
        created_at: plusMin(13),
        company_id: companyId,
        actor_user_id: ownerId
      },
      {
        id: "tl_demo_6",
        job_case_id: "jc_demo_4",
        event_type: "QUOTE_UPDATED",
        summary: "변경 견적 +80000원",
        payload_json: { revisedQuoteAmount: 390000 },
        created_at: plusMin(16),
        company_id: companyId,
        actor_user_id: ownerId
      },
      {
        id: "tl_demo_7",
        job_case_id: "jc_demo_4",
        event_type: "DRAFT_CREATED",
        summary: "고객 설명 초안 생성",
        payload_json: { draftId: "draft_demo_4" },
        created_at: plusMin(17),
        company_id: companyId,
        actor_user_id: ownerId
      }
    ]
  };

  await writeDb(db);
}

function createSvg(background, title, subtitle) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="320" viewBox="0 0 400 320">
  <rect width="400" height="320" fill="${background}" rx="24" />
  <rect x="24" y="24" width="352" height="272" rx="20" fill="#ffffff" opacity="0.92" />
  <text x="40" y="96" fill="#0f172a" font-size="28" font-family="Pretendard, Arial" font-weight="700">${title}</text>
  <text x="40" y="138" fill="#475569" font-size="20" font-family="Pretendard, Arial">${subtitle}</text>
  <text x="40" y="226" fill="#2563eb" font-size="18" font-family="Pretendard, Arial">현장 리뷰용 샘플 이미지</text>
</svg>`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});












