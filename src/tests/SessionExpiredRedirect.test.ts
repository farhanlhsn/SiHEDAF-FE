import assert from "node:assert/strict";
import test from "node:test";

import { SESSION_EXPIRED_PATH } from "../features/auth/session/client/ApiFetch";
import {
  SESSION_EXPIRED_PATH as REDIRECT_PATH,
  createSessionExpiredRedirect,
} from "../features/auth/session/client/SessionExpiredRedirect";

type PageShowListener = (event: { persisted: boolean }) => void;

function setup(pathname = "/dashboard") {
  const navigated: string[] = [];
  const listeners: PageShowListener[] = [];
  const page = { pathname };
  const redirect = createSessionExpiredRedirect({
    navigate: (url) => navigated.push(url),
    currentPath: () => page.pathname,
    onPageShow: (listener) => listeners.push(listener),
  });
  const pageShow = (persisted: boolean) => {
    for (const listener of listeners) listener({ persisted });
  };

  return { navigated, listeners, page, redirect, pageShow };
}

test("one path for the expired-session login, shared with apiFetch", () => {
  assert.equal(REDIRECT_PATH, "/login?sesi=berakhir");
  assert.equal(SESSION_EXPIRED_PATH, REDIRECT_PATH);
});

test("navigates to the expired-session login at most once per page life", () => {
  const { navigated, redirect } = setup();

  redirect();
  redirect();
  redirect();

  assert.deepEqual(navigated, [SESSION_EXPIRED_PATH]);
});

test("does nothing on /login itself", () => {
  for (const pathname of ["/login", "/login/"]) {
    const { navigated, listeners, page, redirect } = setup(pathname);

    redirect();
    assert.deepEqual(navigated, [], pathname);
    assert.equal(listeners.length, 0);

    // Not spent there: elsewhere it still navigates.
    page.pathname = "/profil";
    redirect();
    assert.deepEqual(navigated, [SESSION_EXPIRED_PATH], pathname);
  }
  // Only the login page; other paths that start alike still redirect.
  const { navigated, redirect } = setup("/login-help");
  redirect();
  assert.deepEqual(navigated, [SESSION_EXPIRED_PATH]);
});

test("a back-forward cache restore resets the guard; an ordinary pageshow does not", () => {
  const { navigated, listeners, redirect, pageShow } = setup();

  redirect();
  assert.equal(listeners.length, 1);

  pageShow(false);
  redirect();
  assert.deepEqual(navigated, [SESSION_EXPIRED_PATH]);

  // The reader came back with Back: a 401 now must leave again.
  pageShow(true);
  redirect();
  redirect();
  assert.deepEqual(navigated, [SESSION_EXPIRED_PATH, SESSION_EXPIRED_PATH]);
  // Subscribed once, however often it navigated.
  assert.equal(listeners.length, 1);
});
