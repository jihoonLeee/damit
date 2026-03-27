import { test } from "node:test";
import assert from "node:assert/strict";

import { buildInvitationMessage, buildMagicLinkMessage, isValidMailFrom } from "../src/mail-gateway.js";

test("mail from validator accepts plain and named sender formats", () => {
  assert.equal(isValidMailFrom("login@example.com"), true);
  assert.equal(isValidMailFrom("Damit Login <login@example.com>"), true);
});

test("mail from validator rejects invalid sender formats", () => {
  assert.equal(isValidMailFrom("damit.local"), false);
  assert.equal(isValidMailFrom("login@"), false);
  assert.equal(isValidMailFrom("Name login@example.com"), false);
});

test("magic link message uses branded subject and html shell", () => {
  const message = buildMagicLinkMessage({
    baseUrl: "https://damit.kr",
    email: "owner@example.com",
    challengeId: "challenge_123",
    token: "token_123"
  });

  assert.equal(message.subject, "[다밋] 로그인 링크가 도착했습니다");
  assert.match(message.text, /다밋 로그인 링크/);
  assert.match(message.html, /DAMIT/);
  assert.match(message.html, /로그인 링크 열기/);
  assert.match(message.html, /15분/);
  assert.match(message.html, /https:\/\/damit\.kr\/login\?challengeId=challenge_123&amp;token=token_123/);
});

test("invitation message uses branded invitation copy", () => {
  const message = buildInvitationMessage({
    baseUrl: "https://damit.kr",
    email: "member@example.com",
    role: "MANAGER",
    companyName: "보리코리 클린",
    invitationToken: "invite_123"
  });

  assert.equal(message.subject, "[다밋] 보리코리 클린 팀 초대가 도착했습니다");
  assert.match(message.text, /운영 관리자/);
  assert.match(message.html, /DAMIT/);
  assert.match(message.html, /초대 링크 열기/);
  assert.match(message.html, /보리코리 클린/);
  assert.match(message.html, /https:\/\/damit\.kr\/login\?invitationToken=invite_123&amp;email=member%40example\.com/);
});
