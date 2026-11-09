import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "../features/auth/session/server/AuthCookies";
import { readLayoutProfile } from "../features/auth/session/server/ReadLayoutProfile";
import {
  SESSION_EXPIRED,
  SessionServiceError,
} from "../features/auth/session/server/SessionServiceError";

const user = {
  id: 1,
  fullname: "User Satu",
  email: "user@example.com",
  profileImage: null,
};

/** A store like Next's, which records any write so the test can refuse it. */
function createCookieStore(values: Record<string, string> = {}) {
  const writes: unknown[] = [];

  return {
    writes,
    store: {
      get(name: string) {
        const value = values[name];
        return value === undefined ? undefined : { value };
      },
      set(cookie: unknown) {
        writes.push(cookie);
      },
      delete(name: string) {
        writes.push({ delete: name });
      },
    },
  };
}

test("an access token that reads the profile gives the user", async () => {
  const { store, writes } = createCookieStore({
    [ACCESS_TOKEN_COOKIE]: "access-token-test",
    [REFRESH_TOKEN_COOKIE]: "refresh-token-test",
  });
  const tokens: string[] = [];

  const result = await readLayoutProfile({
    cookieStore: store,
    profileReader: async (accessToken) => {
      tokens.push(accessToken);
      return user;
    },
  });

  assert.deepEqual(result, { hasSession: true, user });
  assert.deepEqual(tokens, ["access-token-test"]);
  assert.deepEqual(writes, []);
});

test("a refused access token or a failing backend leaves the profile to the client", async () => {
  for (const failure of [
    new SessionServiceError(SESSION_EXPIRED, 401),
    new SessionServiceError("Layanan profil sedang bermasalah.", 502),
    new TypeError("fetch failed"),
  ]) {
    const { store, writes } = createCookieStore({
      [ACCESS_TOKEN_COOKIE]: "expired-access-token",
      [REFRESH_TOKEN_COOKIE]: "refresh-token-test",
    });
    let reads = 0;

    const result = await readLayoutProfile({
      cookieStore: store,
      profileReader: async () => {
        reads += 1;
        throw failure;
      },
    });

    // Never a refresh here: one read, no cookie written or cleared.
    assert.deepEqual(result, { hasSession: true, user: null }, String(failure));
    assert.equal(reads, 1);
    assert.deepEqual(writes, []);
  }
});

test("only a refresh token left: no backend call, the client refreshes", async () => {
  const { store, writes } = createCookieStore({
    [REFRESH_TOKEN_COOKIE]: "refresh-token-test",
  });
  let reads = 0;

  const result = await readLayoutProfile({
    cookieStore: store,
    profileReader: async () => {
      reads += 1;
      return user;
    },
  });

  assert.deepEqual(result, { hasSession: true, user: null });
  assert.equal(reads, 0);
  assert.deepEqual(writes, []);
});

test("no session cookie at all means no session", async () => {
  const cases: Record<string, string>[] = [
    {},
    { [ACCESS_TOKEN_COOKIE]: "", [REFRESH_TOKEN_COOKIE]: "" },
  ];
  for (const values of cases) {
    const { store, writes } = createCookieStore(values);
    let reads = 0;

    const result = await readLayoutProfile({
      cookieStore: store,
      profileReader: async () => {
        reads += 1;
        return user;
      },
    });

    assert.deepEqual(result, { hasSession: false });
    assert.equal(reads, 0);
    assert.deepEqual(writes, []);
  }
});
