import assert from "node:assert/strict";
import test from "node:test";

import { SessionExpiredError } from "../features/auth/session/client/ApiFetch";
import { describeFetchError } from "../components/ui/FetchError";

test("offline when the browser is offline", () => {
  const result = describeFetchError({ online: false, status: 500 });
  assert.equal(result.kind, "offline");
  assert.equal(result.title, "Koneksi internet terputus");
});

test("offline on a network TypeError", () => {
  const result = describeFetchError({
    online: true,
    error: new TypeError("Failed to fetch"),
  });
  assert.equal(result.kind, "offline");
});

test("session on 401 or SessionExpiredError", () => {
  assert.equal(describeFetchError({ online: true, status: 401 }).kind, "session");
  assert.equal(
    describeFetchError({ online: true, error: new SessionExpiredError() }).kind,
    "session",
  );
});

test("server otherwise", () => {
  for (const input of [
    { online: true, status: 500 },
    { online: true, status: 502 },
    { online: true, error: new Error("x") },
  ]) {
    const result = describeFetchError(input);
    assert.equal(result.kind, "server");
    assert.equal(result.title, "Server SiHEDAF sedang bermasalah");
    assert.equal(
      result.message,
      "Ini bukan masalah di perangkatmu. Coba lagi beberapa saat lagi.",
    );
  }
});

test("never leaks the raw error text", () => {
  const result = describeFetchError({
    online: true,
    error: new Error("Unexpected token <"),
  });
  assert.doesNotMatch(result.message, /Unexpected/);
  assert.doesNotMatch(result.title, /Unexpected/);
});
