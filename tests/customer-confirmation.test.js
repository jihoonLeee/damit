import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

import { createOwnerSession } from "./helpers/session-auth.js";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "field-agreement-confirm-"));
process.chdir(tempRoot);

const { createApp } = await import("../src/app.js");
const { config } = await import("../src/config.js");
const { resetPublicRateLimitState } = await import("../src/security/public-rate-limit.js");

config.rootDir = tempRoot;
config.publicDir = path.join(tempRoot, "public");
config.dataDir = path.join(tempRoot, "data");
config.uploadDir = path.join(tempRoot, "data", "uploads");
config.backupDir = path.join(tempRoot, "data", "backups");
config.dbFilePath = path.join(tempRoot, "data", "app.sqlite");
config.storageEngine = "SQLITE";
config.appBaseUrl = "";
config.trustProxyHeaders = true;

await fs.mkdir(config.publicDir, { recursive: true });
for (const fileName of ["landing.html", "login.html", "home.html", "ops.html", "index.html", "confirm.html"]) {
  await fs.writeFile(path.join(config.publicDir, fileName), "<html></html>", "utf8");
}

const app = createApp();
const server = createServer((req, res) => app.handle(req, res));
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

const ownerSession = await createOwnerSession(baseUrl, config, {
  email: "confirm@example.com",
  displayName: "담당자",
  companyName: "다밋 클린"
});

function sessionHeaders(extra = {}) {
  return {
    Cookie: ownerSession.cookieHeader,
    ...extra
  };
}

function writeSessionHeaders(extra = {}) {
  return {
    Cookie: ownerSession.cookieHeader,
    "x-csrf-token": ownerSession.csrfToken,
    ...extra
  };
}

async function createConfirmationToken(seed) {
  const formData = new FormData();
  formData.append("primaryReason", "CONTAMINATION");
  formData.append("secondaryReason", "NICOTINE");
  formData.append("note", `confirmation setup ${seed}`);
  formData.append("photos[]", new File([new Uint8Array([137, 80, 78, 71])], `sample-${seed}.png`, { type: "image/png" }));

  const fieldRecordResponse = await fetch(`${baseUrl}/api/v1/field-records`, {
    method: "POST",
    headers: writeSessionHeaders(),
    body: formData
  });
  const fieldRecord = await fieldRecordResponse.json();

  const jobCaseResponse = await fetch(`${baseUrl}/api/v1/job-cases`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      customerLabel: `Customer ${seed}`,
      contactMemo: `Memo ${seed}`,
      siteLabel: `Site ${seed}`,
      originalQuoteAmount: 250000
    })
  });
  const jobCase = await jobCaseResponse.json();

  await fetch(`${baseUrl}/api/v1/field-records/${fieldRecord.id}/link-job-case`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ jobCaseId: jobCase.id })
  });

  await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/quote`, {
    method: "PATCH",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ revisedQuoteAmount: 320000 })
  });

  await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/draft-message`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ tone: "CUSTOMER_MESSAGE" })
  });

  const createLinkResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/customer-confirmation-links`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ expiresInHours: 72 })
  });
  const createdLink = await createLinkResponse.json();
  const confirmUrl = new URL(createdLink.confirmationUrl, baseUrl);
  return decodeURIComponent(confirmUrl.pathname.replace(/^\/confirm\//, ""));
}

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test.afterEach(() => {
  resetPublicRateLimitState();
});

test("customer confirmation link can be issued, viewed, acknowledged, and exposed in detail", async () => {
  const formData = new FormData();
  formData.append("primaryReason", "CONTAMINATION");
  formData.append("secondaryReason", "NICOTINE");
  formData.append("note", "거실 벽면 니코틴 오염 심함");
  formData.append("photos[]", new File([new Uint8Array([137, 80, 78, 71])], "sample.png", { type: "image/png" }));

  const fieldRecordResponse = await fetch(`${baseUrl}/api/v1/field-records`, {
    method: "POST",
    headers: writeSessionHeaders(),
    body: formData
  });
  assert.equal(fieldRecordResponse.status, 201);
  const fieldRecord = await fieldRecordResponse.json();

  const jobCaseResponse = await fetch(`${baseUrl}/api/v1/job-cases`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      customerLabel: "송파 힐스테이트 1203호",
      contactMemo: "당근 문의 고객",
      siteLabel: "송파 힐스테이트 1203호",
      originalQuoteAmount: 250000
    })
  });
  assert.equal(jobCaseResponse.status, 201);
  const jobCase = await jobCaseResponse.json();

  const linkJobCaseResponse = await fetch(`${baseUrl}/api/v1/field-records/${fieldRecord.id}/link-job-case`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ jobCaseId: jobCase.id })
  });
  assert.equal(linkJobCaseResponse.status, 200);

  const quoteResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/quote`, {
    method: "PATCH",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ revisedQuoteAmount: 320000 })
  });
  assert.equal(quoteResponse.status, 200);

  const draftResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/draft-message`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ tone: "CUSTOMER_MESSAGE" })
  });
  assert.equal(draftResponse.status, 200);

  const createLinkResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/customer-confirmation-links`, {
    method: "POST",
    headers: writeSessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ expiresInHours: 72 })
  });
  assert.equal(createLinkResponse.status, 201);
  const createdLink = await createLinkResponse.json();
  assert.match(createdLink.confirmationUrl, /\/confirm\//);
  const confirmUrl = new URL(createdLink.confirmationUrl, baseUrl);
  const token = decodeURIComponent(confirmUrl.pathname.replace(/^\/confirm\//, ""));

  const publicViewResponse = await fetch(`${baseUrl}/api/v1/public/confirm/${encodeURIComponent(token)}`);
  assert.equal(publicViewResponse.status, 200);
  assert.match(publicViewResponse.headers.get("cache-control") || "", /no-store/);
  const publicView = await publicViewResponse.json();
  assert.equal(publicView.link.status, "VIEWED");
  assert.equal(publicView.jobCase.siteLabel, "송파 힐스테이트 1203호");
  assert.match(publicView.draftMessage.body, /320,000원/);

  const publicAckResponse = await fetch(`${baseUrl}/api/v1/public/confirm/${encodeURIComponent(token)}/acknowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmationNote: "추가 작업 내용 확인했습니다" })
  });
  assert.equal(publicAckResponse.status, 200);
  const publicAck = await publicAckResponse.json();
  assert.equal(publicAck.status, "CONFIRMED");

  const detailResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}`, {
    headers: sessionHeaders()
  });
  assert.equal(detailResponse.status, 200);
  const detail = await detailResponse.json();
  assert.equal(detail.latestCustomerConfirmationLink.status, "CONFIRMED");
  assert.ok(detail.latestCustomerConfirmationLink.confirmedAt);

  const confirmPageResponse = await fetch(`${baseUrl}/confirm/${encodeURIComponent(token)}`);
  assert.equal(confirmPageResponse.status, 200);

  const timelineResponse = await fetch(`${baseUrl}/api/v1/job-cases/${jobCase.id}/timeline`, {
    headers: sessionHeaders()
  });
  assert.equal(timelineResponse.status, 200);
  const timeline = await timelineResponse.json();
  assert.ok(timeline.items.some((item) => item.type === "CUSTOMER_CONFIRMATION_LINK_CREATED"));
  assert.ok(timeline.items.some((item) => item.type === "CUSTOMER_CONFIRMATION_ACKNOWLEDGED"));
});

test("public confirmation endpoints are rate limited by request IP", async () => {
  const previousViewCount = config.publicConfirmViewRateLimitCount;
  const previousViewWindow = config.publicConfirmViewRateLimitWindowSeconds;
  const previousAckCount = config.publicConfirmAckRateLimitCount;
  const previousAckWindow = config.publicConfirmAckRateLimitWindowSeconds;
  config.publicConfirmViewRateLimitCount = 1;
  config.publicConfirmViewRateLimitWindowSeconds = 600;
  config.publicConfirmAckRateLimitCount = 1;
  config.publicConfirmAckRateLimitWindowSeconds = 600;

  try {
    const viewToken = await createConfirmationToken("view-limit");
    const firstView = await fetch(`${baseUrl}/api/v1/public/confirm/${encodeURIComponent(viewToken)}`, {
      headers: { "x-forwarded-for": "203.0.113.31" }
    });
    const secondView = await fetch(`${baseUrl}/api/v1/public/confirm/${encodeURIComponent(viewToken)}`, {
      headers: { "x-forwarded-for": "203.0.113.31" }
    });

    assert.equal(firstView.status, 200);
    assert.equal(secondView.status, 429);
    assert.equal((await secondView.json()).error.code, "PUBLIC_CONFIRM_VIEW_RATE_LIMITED");
    assert.equal(secondView.headers.get("retry-after"), "600");

    const ackToken = await createConfirmationToken("ack-limit");
    const firstAck = await fetch(`${baseUrl}/api/v1/public/confirm/${encodeURIComponent(ackToken)}/acknowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.32"
      },
      body: JSON.stringify({ confirmationNote: "Looks good" })
    });
    const secondAck = await fetch(`${baseUrl}/api/v1/public/confirm/${encodeURIComponent(ackToken)}/acknowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.32"
      },
      body: JSON.stringify({ confirmationNote: "Looks good" })
    });

    assert.equal(firstAck.status, 200);
    assert.equal(secondAck.status, 429);
    assert.equal((await secondAck.json()).error.code, "PUBLIC_CONFIRM_ACK_RATE_LIMITED");
    assert.equal(secondAck.headers.get("retry-after"), "600");
  } finally {
    config.publicConfirmViewRateLimitCount = previousViewCount;
    config.publicConfirmViewRateLimitWindowSeconds = previousViewWindow;
    config.publicConfirmAckRateLimitCount = previousAckCount;
    config.publicConfirmAckRateLimitWindowSeconds = previousAckWindow;
  }
});
