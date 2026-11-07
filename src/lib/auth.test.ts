import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, hashPassword, readSessionToken, verifyPassword } from "./auth";

test("hash y verificación de contraseña", async () => {
  const h = await hashPassword("perritos123");
  assert.notEqual(h, "perritos123");
  assert.equal(await verifyPassword("perritos123", h), true);
  assert.equal(await verifyPassword("gatitos123", h), false);
  assert.equal(await verifyPassword("x", "basura"), false);
});

test("token de sesión: válido, manipulado y caducado", () => {
  const now = Date.now();
  const t = createSessionToken("user_1", now);
  assert.equal(readSessionToken(t, now), "user_1");
  assert.equal(readSessionToken(t.replace("user_1", "user_2"), now), null);
  assert.equal(readSessionToken(t, now + 31 * 24 * 3600 * 1000), null);
  assert.equal(readSessionToken(undefined), null);
  assert.equal(readSessionToken("a.b"), null);
});
