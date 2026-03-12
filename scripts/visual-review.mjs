import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "../src/app.js";
import { config } from "../src/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const outputDir = path.join(workspaceRoot, "output", "visual-review");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "field-agreement-review-"));
  const tempDataDir = path.join(tempRoot, "data");
  const tempUploadDir = path.join(tempDataDir, "uploads");
  const tempDbPath = path.join(tempDataDir, "db.json");

  config.publicDir = path.join(workspaceRoot, "public");
  config.storageEngine = "JSON_FILE";
  config.dataDir = tempDataDir;
  config.uploadDir = tempUploadDir;
  config.dbFilePath = tempDbPath;

  await seedReviewData(tempUploadDir, tempDbPath);

  const app = createApp();
  const server = createServer((req, res) => app.handle(req, res));
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await captureScreenshot({
      url: baseUrl,
      width: 1440,
      height: 1600,
      outputPath: path.join(outputDir, "desktop-overview.png"),
      timeBudget: 10000
    });

    await captureScreenshot({
      url: `${baseUrl}/?review=detail`,
      width: 390,
      height: 844,
      outputPath: path.join(outputDir, "mobile-detail-top.png"),
      timeBudget: 12000,
      mobile: true
    });

    await captureScreenshot({
      url: `${baseUrl}/?review=agreement`,
      width: 390,
      height: 1200,
      outputPath: path.join(outputDir, "mobile-agreement.png"),
      timeBudget: 14000,
      mobile: true
    });

    await captureScreenshot({
      url: `${baseUrl}/?review=copy`,
      width: 390,
      height: 844,
      outputPath: path.join(outputDir, "mobile-copy.png"),
      timeBudget: 12000,
      mobile: true
    });

    await captureScreenshot({
      url: baseUrl,
      width: 390,
      height: 844,
      outputPath: path.join(outputDir, "mobile-overview.png"),
      timeBudget: 10000,
      mobile: true
    });
  } finally {
    server.close();
  }
}

async function captureScreenshot({ url, width, height, outputPath, timeBudget, mobile = false }) {
  const args = [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
    `--virtual-time-budget=${timeBudget}`,
    `--screenshot=${outputPath}`,
    url
  ];

  if (mobile) {
    args.push("--force-device-scale-factor=2");
  }

  const child = spawn(edgePath, args, {
    stdio: ["ignore", "ignore", "pipe"]
  });

  const errors = [];
  child.stderr.on("data", (chunk) => errors.push(chunk.toString()));

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`Edge screenshot failed for ${url}: ${errors.join(" ")}`);
  }
}

async function seedReviewData(tempUploadDir, tempDbPath) {
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
        owner_id: "owner_demo",
        customer_label: "송파 힐스테이트 1203호",
        contact_memo: "당근 문의 고객",
        site_label: "송파 힐스테이트 1203호",
        original_quote_amount: 250000,
        revised_quote_amount: 320000,
        quote_delta_amount: 70000,
        current_status: "AGREED",
        created_at: plusMin(0),
        updated_at: plusMin(20)
      },
      {
        id: "jc_demo_2",
        owner_id: "owner_demo",
        customer_label: "잠실 리센츠 804호",
        contact_memo: "전화 문의",
        site_label: "잠실 리센츠 804호",
        original_quote_amount: 280000,
        revised_quote_amount: 360000,
        quote_delta_amount: 80000,
        current_status: "ON_HOLD",
        created_at: plusMin(2),
        updated_at: plusMin(18)
      }
    ],
    fieldRecords: [
      {
        id: "fr_demo_1",
        owner_id: "owner_demo",
        job_case_id: "jc_demo_1",
        primary_reason: "CONTAMINATION",
        secondary_reason: "NICOTINE",
        note: "거실 벽면과 주방 상판 니코틴 오염 심함",
        status: "LINKED",
        created_at: plusMin(3)
      },
      {
        id: "fr_demo_2",
        owner_id: "owner_demo",
        job_case_id: "jc_demo_1",
        primary_reason: "SPACE_ADDED",
        secondary_reason: "VERANDA_ADDED",
        note: "베란다와 창고 공간 추가 확인",
        status: "LINKED",
        created_at: plusMin(5)
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
      }
    ],
    messageDrafts: [
      {
        id: "draft_demo_1",
        job_case_id: "jc_demo_1",
        tone: "CUSTOMER_MESSAGE",
        body: "현장 확인 결과 송파 힐스테이트 1203호에서 니코틴 오염과 베란다 추가 작업이 확인됐습니다. 추가 작업 항목은 니코틴 오염 제거, 베란다 추가, 창고 추가입니다. 사전 기본 범위를 넘어서는 오염 제거와 공간 추가가 확인돼 별도 시간과 자재가 필요합니다. 기존 견적 250,000원에서 320,000원으로 변경이 필요합니다. 진행 원하시면 확인 부탁드립니다.",
        created_at: plusMin(12),
        updated_at: plusMin(12)
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
        created_at: plusMin(15)
      },
      {
        id: "ar_demo_2",
        job_case_id: "jc_demo_2",
        status: "ON_HOLD",
        confirmation_channel: "PHONE",
        confirmed_at: plusMin(16),
        confirmed_amount: null,
        customer_response_note: "배우자와 상의 후 연락 예정",
        created_at: plusMin(16)
      }
    ],
    timelineEvents: [
      {
        id: "tl_demo_1",
        job_case_id: "jc_demo_1",
        event_type: "FIELD_RECORD_LINKED",
        summary: "니코틴 오염 연결",
        payload_json: { fieldRecordId: "fr_demo_1" },
        created_at: plusMin(6)
      },
      {
        id: "tl_demo_2",
        job_case_id: "jc_demo_1",
        event_type: "QUOTE_UPDATED",
        summary: "변경 견적 +70000원",
        payload_json: { revisedQuoteAmount: 320000 },
        created_at: plusMin(10)
      },
      {
        id: "tl_demo_3",
        job_case_id: "jc_demo_1",
        event_type: "DRAFT_CREATED",
        summary: "고객 설명 초안 생성",
        payload_json: { draftId: "draft_demo_1" },
        created_at: plusMin(12)
      },
      {
        id: "tl_demo_4",
        job_case_id: "jc_demo_1",
        event_type: "AGREEMENT_RECORDED",
        summary: "카카오톡/문자로 320,000원 합의완료",
        payload_json: { agreementId: "ar_demo_1" },
        created_at: plusMin(15)
      }
    ]
  };

  await fs.writeFile(tempDbPath, JSON.stringify(db, null, 2), "utf8");
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


