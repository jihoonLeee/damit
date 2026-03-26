import { test } from "node:test";
import assert from "node:assert/strict";

import { isValidMailFrom } from "../src/mail-gateway.js";

test("mail from validator accepts plain and named sender formats", () => {
  assert.equal(isValidMailFrom("login@example.com"), true);
  assert.equal(isValidMailFrom("Damit Login <login@example.com>"), true);
});

test("mail from validator rejects invalid sender formats", () => {
  assert.equal(isValidMailFrom("damit.local"), false);
  assert.equal(isValidMailFrom("login@"), false);
  assert.equal(isValidMailFrom("Name login@example.com"), false);
});