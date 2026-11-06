import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_EXPIRED_PATH,
  SessionExpiredError,
  createApiFetch,
} from "../features/auth/session/client/ApiFetch";

test("returns non-401 responses untouched", async () => {
  const navigated: string[] = [];
  const ok = new Response("{}", { status: 200 });
  const bad = new Response("{}", { status: 500 });
  const responses = [ok, bad];
  const apiFetch = createApiFetch({
    fetcher: async () => responses.shift() as Response,
    navigate: (url) => navigated.push(url),
  });

  assert.equal(await apiFetch("/api/v1/x"), ok);
  assert.equal(await apiFetch("/api/v1/x"), bad);
  assert.deepEqual(navigated, []);
});

test("redirects once and throws on 401", async () => {
  const navigated: string[] = [];
  const apiFetch = createApiFetch({
    fetcher: async () => new Response("{}", { status: 401 }),
    navigate: (url) => navigated.push(url),
  });

  for (let i = 0; i < 3; i += 1) {
    await assert.rejects(() => apiFetch("/api/v1/x"), SessionExpiredError);
  }
  assert.deepEqual(navigated, ["/login?sesi=berakhir"]);
  assert.equal(SESSION_EXPIRED_PATH, "/login?sesi=berakhir");
});

test("lets network errors through", async () => {
  const navigated: string[] = [];
  const failure = new TypeError("Failed to fetch");
  const apiFetch = createApiFetch({
    fetcher: async () => {
      throw failure;
    },
    navigate: (url) => navigated.push(url),
  });

  await assert.rejects(
    () => apiFetch("/api/v1/x"),
    (error) => error === failure,
  );
  assert.deepEqual(navigated, []);
});
