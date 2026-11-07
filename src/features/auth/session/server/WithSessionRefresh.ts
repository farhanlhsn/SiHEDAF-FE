import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  clearSessionCookies,
  type ReadableSessionCookieStore,
  REFRESH_TOKEN_COOKIE,
  writeAccessTokenCookie,
} from "./AuthCookies";
import { SESSION_EXPIRED, SessionServiceError } from "./SessionServiceError";
import { refreshAccessToken } from "./services/RefreshTokenService";
import type { AccessTokenResult } from "../shared/SessionTypes";

export type AccessTokenRefresher = (
  refreshToken: string,
) => Promise<AccessTokenResult>;

type SessionRefreshOptions = {
  cookieStore?: ReadableSessionCookieStore;
  refresher?: AccessTokenRefresher;
};

function expiredSession() {
  return new SessionServiceError(SESSION_EXPIRED, 401);
}

export async function withSessionRefresh<Result>(
  operation: (accessToken: string) => Promise<Result>,
  options: SessionRefreshOptions = {},
): Promise<Result> {
  const cookieStore = options.cookieStore ?? (await cookies());
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    try {
      return await operation(accessToken);
    } catch (error) {
      if (!(error instanceof SessionServiceError) || error.status !== 401) {
        throw error;
      }
    }
  }

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    clearSessionCookies(cookieStore);
    throw expiredSession();
  }

  let refreshed: AccessTokenResult;
  try {
    refreshed = await (options.refresher ?? refreshAccessToken)(refreshToken);
  } catch (error) {
    clearSessionCookies(cookieStore);
    throw error instanceof SessionServiceError ? error : expiredSession();
  }

  writeAccessTokenCookie(cookieStore, refreshed.accessToken);

  try {
    return await operation(refreshed.accessToken);
  } catch (error) {
    if (error instanceof SessionServiceError && error.status === 401) {
      clearSessionCookies(cookieStore);
    }
    throw error;
  }
}
