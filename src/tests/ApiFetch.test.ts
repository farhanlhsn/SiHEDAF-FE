import assert from "node:assert/strict";
import test from "node:test";

import {
  NetworkError,
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

test("wraps a failed fetch in NetworkError", async () => {
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
    (error) => error instanceof NetworkError && error.cause === failure,
  );
  assert.deepEqual(navigated, []);
});

test("lets aborts and timeouts through untouched", async () => {
  for (const name of ["AbortError", "TimeoutError"]) {
    const failure = new DOMException("stopped", name);
    const apiFetch = createApiFetch({
      fetcher: async () => {
        throw failure;
      },
      navigate: () => {},
    });

    await assert.rejects(
      () => apiFetch("/api/v1/x"),
      (error) => error === failure,
    );
  }
});
