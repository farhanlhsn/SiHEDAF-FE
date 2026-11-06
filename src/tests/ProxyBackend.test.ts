import assert from "node:assert/strict";
import test from "node:test";

import type { SessionCookie } from "../features/auth/session/server/AuthCookies";
import {
  BACKEND_UNAVAILABLE,
  proxyBackend,
} from "../features/auth/session/server/ProxyBackend";
import {
  SESSION_EXPIRED,
  SessionServiceError,
} from "../features/auth/session/server/SessionServiceError";

process.env.SIHEDAF_API_BASE_URL = "http://backend.test";

type Call = { url: string; init: RequestInit };

function setup(responses: Array<Response | Error>) {
  const calls: Call[] = [];
  const queue = [...responses];
  const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = queue.shift();
    if (next instanceof Error) throw next;
    return next ?? Response.json({});
  }) as typeof fetch;
  const store = new Map<string, string>([
    ["sihedaf_access_token", "old"],
    ["sihedaf_refresh_token", "refresh"],
  ]);
  const cookieStore = {
    get: (name: string) =>
      store.has(name) ? { value: store.get(name) as string } : undefined,
    set: (cookie: SessionCookie) => void store.set(cookie.name, cookie.value),
  };
  return { calls, fetcher, cookieStore };
}

function authOf(call: Call) {
  return (call.init.headers as Record<string, string>).Authorization;
}

test("passes a successful backend response through", async () => {
  const { calls, fetcher, cookieStore } = setup([
    Response.json({ code: 200, data: { x: 1 } }),
  ]);
  const response = await proxyBackend(
    "measurement/history",
    { search: "?page=2" },
    { fetcher, cookieStore },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { code: 200, data: { x: 1 } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "http://backend.test/api/v1/measurement/history?page=2");
  assert.equal(authOf(calls[0]), "Bearer old");
});

test("refreshes once and retries on 401", async () => {
  const { calls, fetcher, cookieStore } = setup([
    Response.json({ code: 401 }, { status: 401 }),
    Response.json({ code: 200, data: 1 }),
  ]);
  const response = await proxyBackend("notification", undefined, {
    fetcher,
    cookieStore,
    refresher: async () => ({ accessToken: "new" }) as never,
  });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
  assert.equal(authOf(calls[1]), "Bearer new");
});

test("reports an expired session when refresh fails", async () => {
  const { fetcher, cookieStore } = setup([
    Response.json({ code: 401 }, { status: 401 }),
  ]);
  const response = await proxyBackend("notification", undefined, {
    fetcher,
    cookieStore,
    refresher: async () => {
      throw new SessionServiceError(SESSION_EXPIRED, 401);
    },
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { code: 401, message: "Sesi berakhir." });
});

test("keeps backend error statuses", async () => {
  const { fetcher, cookieStore } = setup([
    Response.json({ code: 404, message: "x" }, { status: 404 }),
  ]);
  const response = await proxyBackend("measurement/latest", undefined, {
    fetcher,
    cookieStore,
  });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { code: 404, message: "x" });
});

test("turns a non-JSON body into 502", async () => {
  const { fetcher, cookieStore } = setup([
    new Response("<html>oops</html>", {
      status: 500,
      headers: { "content-type": "text/html" },
    }),
  ]);
  const response = await proxyBackend("measurement/latest", undefined, {
    fetcher,
    cookieStore,
  });
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    code: 502,
    message: BACKEND_UNAVAILABLE,
  });
  assert.equal(BACKEND_UNAVAILABLE, "Layanan SiHEDAF sedang bermasalah.");
});

test("turns a network failure into 502", async () => {
  const { fetcher, cookieStore } = setup([new TypeError("fetch failed")]);
  const response = await proxyBackend("measurement/latest", undefined, {
    fetcher,
    cookieStore,
  });
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    code: 502,
    message: BACKEND_UNAVAILABLE,
  });
});

test("forwards method, body and content type", async () => {
  const { calls, fetcher, cookieStore } = setup([Response.json({ code: 200 })]);
  await proxyBackend(
    "measurement/bind",
    { method: "POST", body: "{}", contentType: "application/json" },
    { fetcher, cookieStore },
  );
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.body, "{}");
  assert.equal(
    (calls[0].init.headers as Record<string, string>)["Content-Type"],
    "application/json",
  );
});
