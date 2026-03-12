import assert from "node:assert/strict";

const baseUrl = (process.env.BASE_URL || "https://field-agreement-jihoon.fly.dev").replace(/\/$/, "");
const ownerToken = process.env.OWNER_TOKEN;
const shouldReset = process.env.RESET_AFTER !== "false";
const now = new Date().toISOString().replace(/[.:]/g, "-");
const smokeNote = `라이브 스모크 테스트 ${now}`;

if (!ownerToken) {
  console.error("OWNER_TOKEN environment variable is required.");
  process.exit(1);
}

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${ownerToken}`,
    ...extra
  };
}

async function requestJson(method, pathname, body, extraHeaders = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: authHeaders({
      ...(body != null ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders
    }),
    body: body != null ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return { response, payload };
}

async function run() {
  const summary = {
    baseUrl,
    startedAt: new Date().toISOString(),
    steps: [],
    resetAfter: shouldReset
  };

  const health = await fetch(`${baseUrl}/api/v1/health`);
  const healthPayload = await health.json();
  assert.equal(health.status, 200, "health endpoint should respond 200");
  assert.equal(healthPayload.status, "ok", "health payload should be ok");
  summary.steps.push({ step: "health", ok: true, storageEngine: healthPayload.storageEngine, counts: healthPayload.counts });

  const backupBefore = await requestJson("POST", "/api/v1/admin/backup", { label: `live-smoke-before-${now}` });
  assert.equal(backupBefore.response.status, 201, "backup before smoke should succeed");
  summary.steps.push({ step: "backup-before", ok: true, fileName: backupBefore.payload.fileName });

  const formData = new FormData();
  formData.append("primaryReason", "CONTAMINATION");
  formData.append("secondaryReason", "NICOTINE");
  formData.append("note", smokeNote);
  formData.append("photos[]", new File([new Uint8Array([137, 80, 78, 71])], "live-smoke.png", { type: "image/png" }));

  const fieldRecordResponse = await fetch(`${baseUrl}/api/v1/field-records`, {
    method: "POST",
    headers: authHeaders(),
    body: formData
  });
  const fieldRecord = await fieldRecordResponse.json();
  assert.equal(fieldRecordResponse.status, 201, "field record creation should succeed");
  assert.equal(fieldRecord.note, smokeNote, "field record response should preserve Korean note");
  summary.steps.push({ step: "field-record", ok: true, id: fieldRecord.id });

  const jobCaseResponse = await requestJson("POST", "/api/v1/job-cases", {
    customerLabel: `라이브 스모크 고객 ${now}`,
    contactMemo: "배포 후 자동 점검",
    siteLabel: `라이브 스모크 현장 ${now}`,
    originalQuoteAmount: 250000
  });
  assert.equal(jobCaseResponse.response.status, 201, "job case creation should succeed");
  const jobCase = jobCaseResponse.payload;
  summary.steps.push({ step: "job-case", ok: true, id: jobCase.id });

  const linkResponse = await requestJson("POST", `/api/v1/field-records/${fieldRecord.id}/link-job-case`, { jobCaseId: jobCase.id });
  assert.equal(linkResponse.response.status, 200, "link job case should succeed");
  summary.steps.push({ step: "link", ok: true, status: linkResponse.payload.status });

  const quoteResponse = await requestJson("PATCH", `/api/v1/job-cases/${jobCase.id}/quote`, { revisedQuoteAmount: 320000 });
  assert.equal(quoteResponse.response.status, 200, "quote update should succeed");
  summary.steps.push({ step: "quote", ok: true, revisedQuoteAmount: quoteResponse.payload.revisedQuoteAmount });

  const draftResponse = await requestJson("POST", `/api/v1/job-cases/${jobCase.id}/draft-message`, { tone: "CUSTOMER_MESSAGE" });
  assert.equal(draftResponse.response.status, 200, "draft generation should succeed");
  assert.match(draftResponse.payload.body, /320,000원/, "draft should mention the revised quote amount");
  summary.steps.push({ step: "draft", ok: true, draftId: draftResponse.payload.id });

  const agreementResponse = await requestJson("POST", `/api/v1/job-cases/${jobCase.id}/agreement-records`, {
    status: "AGREED",
    confirmationChannel: "KAKAO_OR_SMS",
    confirmedAmount: 320000,
    customerResponseNote: "라이브 스모크 확인 완료"
  });
  assert.equal(agreementResponse.response.status, 201, "agreement recording should succeed");
  summary.steps.push({ step: "agreement", ok: true, agreementId: agreementResponse.payload.id, currentStatus: agreementResponse.payload.currentStatus });

  const detailResponse = await requestJson("GET", `/api/v1/job-cases/${jobCase.id}`);
  assert.equal(detailResponse.response.status, 200, "detail fetch should succeed");
  assert.equal(detailResponse.payload.currentStatus, "AGREED", "job case detail should reflect AGREED status");
  assert.equal(detailResponse.payload.fieldRecords[0].note, smokeNote, "Korean field note should survive multipart decoding");
  summary.steps.push({ step: "detail", ok: true, currentStatus: detailResponse.payload.currentStatus });

  const timelineResponse = await requestJson("GET", `/api/v1/job-cases/${jobCase.id}/timeline`);
  assert.equal(timelineResponse.response.status, 200, "timeline fetch should succeed");
  assert.equal(timelineResponse.payload.items.length, 4, "timeline should include 4 core events");
  summary.steps.push({ step: "timeline", ok: true, itemCount: timelineResponse.payload.items.length });

  if (shouldReset) {
    const resetResponse = await requestJson("POST", "/api/v1/admin/reset-data", { confirm: "RESET_PILOT_DATA" });
    assert.equal(resetResponse.response.status, 200, "reset after smoke should succeed");
    summary.steps.push({ step: "reset-after", ok: true, counts: resetResponse.payload.counts });

    const healthAfter = await fetch(`${baseUrl}/api/v1/health`);
    const healthAfterPayload = await healthAfter.json();
    assert.equal(healthAfter.status, 200, "post-reset health should respond 200");
    assert.deepEqual(healthAfterPayload.counts, { jobCases: 0, fieldRecords: 0, agreements: 0 }, "post-reset counts should be empty");
    summary.steps.push({ step: "health-after-reset", ok: true, counts: healthAfterPayload.counts });
  }

  summary.finishedAt = new Date().toISOString();
  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error("LIVE_SMOKE_FAILED");
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
