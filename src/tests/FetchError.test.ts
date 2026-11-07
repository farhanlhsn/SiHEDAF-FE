import assert from "node:assert/strict";
import test from "node:test";

import {
  NetworkError,
  SessionExpiredError,
} from "../features/auth/session/client/ApiFetch";
import { describeFetchError, latestOutcome } from "../components/ui/FetchError";

test("offline when the browser is offline", () => {
  const result = describeFetchError({ online: false, status: 500 });
  assert.equal(result.kind, "offline");
  assert.equal(result.title, "Koneksi internet terputus");
});

test("offline on a NetworkError (the request never reached the server)", () => {
  const result = describeFetchError({
    online: true,
    error: new NetworkError(new TypeError("Failed to fetch")),
  });
  assert.equal(result.kind, "offline");
  assert.equal(result.title, "Koneksi internet terputus");
});

test("a plain TypeError while online is a server problem, not a lost connection", () => {
  // e.g. reading `.code` of a null JSON body
  const result = describeFetchError({
    online: true,
    error: new TypeError("Cannot read properties of null (reading 'code')"),
  });
  assert.equal(result.kind, "server");
  assert.doesNotMatch(result.message, /Cannot read/);
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
      "Ini bukan masalah di HP atau laptopmu. Coba lagi beberapa saat lagi.",
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

test("latestOutcome: a labelled or running measurement is data", () => {
  assert.equal(
    latestOutcome({ status: 200, json: { code: 200, data: { id: 7 } } }),
    "data",
  );
});

test("latestOutcome: 404 or 200 with no data means no measurement yet", () => {
  assert.equal(latestOutcome({ status: 200, json: { code: 200, data: null } }), "empty");
  assert.equal(latestOutcome({ status: 404, json: null }), "empty");
  assert.equal(
    latestOutcome({ status: 404, json: { code: 404, message: "Not found" } }),
    "empty",
  );
  assert.equal(latestOutcome({ status: 404, json: "<html>" }), "empty");
});

test("latestOutcome: a failure is never mistaken for an empty account", () => {
  assert.equal(latestOutcome({ status: 200, json: { code: 500 } }), "error");
  assert.equal(
    latestOutcome({ status: 200, json: { code: 500, data: { id: 7 } } }),
    "error",
  );
  assert.equal(latestOutcome({ status: 500, json: null }), "error");
  assert.equal(latestOutcome({ status: 502, json: { code: 502 } }), "error");
  assert.equal(latestOutcome({ status: 200, json: null }), "error");
  assert.equal(latestOutcome({ status: 200, json: "ok" }), "error");
});
