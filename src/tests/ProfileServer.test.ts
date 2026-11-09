import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_EXPIRED,
  SessionServiceError,
} from "../features/auth/session/server/SessionServiceError";
import {
  getCurrentProfile,
  updateCurrentPassword,
  updateCurrentProfile,
} from "../features/profile/server/services/ProfileService";

const baseUrl = "https://sihedaf.xianly.cloud/api";
const user = {
  id: 1,
  fullname: "User Satu",
  email: "bsnzjsnsj0@gmail.com",
  profileImage: null,
};

function backendResponse(data: unknown) {
  return Response.json({
    code: 200,
    status: "OK",
    recordsTotal: 1,
    data,
    errors: null,
  });
}

test("gets the current profile with a bearer token", async () => {
  const result = await getCurrentProfile("access-token-test", {
    baseUrl,
    fetcher: async (url, init) => {
      assert.equal(
        String(url),
        "https://sihedaf.xianly.cloud/api/v1/auth/me",
      );
      assert.equal(init?.method, "GET");
      assert.equal(init?.cache, "no-store");
      assert.deepEqual(init?.headers, {
        Authorization: "Bearer access-token-test",
      });
      return backendResponse({ user });
    },
  });

  assert.deepEqual(result, user);
});

test("updates only fullname with a bearer token", async () => {
  let requestBody = "";
  const result = await updateCurrentProfile(
    "access-token-test",
    { fullname: "User Satu Update" },
    {
      baseUrl,
      fetcher: async (url, init) => {
        assert.equal(
          String(url),
          "https://sihedaf.xianly.cloud/api/v1/auth/me/update",
        );
        assert.equal(init?.method, "PUT");
        assert.deepEqual(init?.headers, {
          Authorization: "Bearer access-token-test",
          "Content-Type": "application/json",
        });
        requestBody = String(init?.body);
        return backendResponse({ message: "Profile updated successfully" });
      },
    },
  );

  assert.deepEqual(JSON.parse(requestBody), { fullname: "User Satu Update" });
  assert.deepEqual(result, { message: "Profil berhasil diperbarui." });
});

test("updates a password with the documented payload", async () => {
  const input = {
    old_password: "User!123",
    new_password: "User!1234",
    confirm_password: "User!1234",
  };
  let requestBody = "";
  const result = await updateCurrentPassword(
    "access-token-test",
    input,
    {
      baseUrl,
      fetcher: async (url, init) => {
        assert.equal(
          String(url),
          "https://sihedaf.xianly.cloud/api/v1/auth/me/update-password",
        );
        assert.equal(init?.method, "PATCH");
        requestBody = String(init?.body);
        return backendResponse({ message: "Password updated successfully" });
      },
    },
  );

  assert.deepEqual(JSON.parse(requestBody), input);
  assert.deepEqual(result, { message: "Kata sandi berhasil diperbarui." });
});

test("normalizes unauthorized, validation, and malformed responses", async () => {
  await assert.rejects(
    getCurrentProfile("expired-access-token", {
      baseUrl,
      fetcher: async () => Response.json({}, { status: 401 }),
    }),
    (error) => error instanceof SessionServiceError && error.status === 401,
  );

  // The backend answers an expired access token with 403, not 401.
  await assert.rejects(
    getCurrentProfile("expired-access-token", {
      baseUrl,
      fetcher: async () => Response.json({}, { status: 403 }),
    }),
    (error) =>
      error instanceof SessionServiceError &&
      error.status === 401 &&
      error.message === SESSION_EXPIRED,
  );

  await assert.rejects(
    updateCurrentProfile(
      "access-token-test",
      { fullname: "User Satu" },
      {
        baseUrl,
        fetcher: async () => Response.json({}, { status: 400 }),
      },
    ),
    (error) =>
      error instanceof SessionServiceError &&
      error.status === 400 &&
      error.message === "Data profil tidak valid.",
  );

  await assert.rejects(
    getCurrentProfile("access-token-test", {
      baseUrl,
      fetcher: async () => backendResponse({ user: { id: "invalid" } }),
    }),
    (error) => error instanceof SessionServiceError && error.status === 502,
  );
});
