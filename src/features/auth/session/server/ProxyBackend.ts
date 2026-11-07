import { buildBackendApiUrl } from "@/features/auth/shared/server/BackendUrl";

import type { ReadableSessionCookieStore } from "./AuthCookies";
import { SESSION_EXPIRED, SessionServiceError } from "./SessionServiceError";
import {
  type AccessTokenRefresher,
  withSessionRefresh,
} from "./WithSessionRefresh";

export const BACKEND_UNAVAILABLE = "Layanan SiHEDAF sedang bermasalah.";
const SESSION_ENDED = "Sesi berakhir.";

type ProxyInit = {
  method?: string;
  body?: BodyInit | null;
  search?: string;
  contentType?: string;
  timeoutMs?: number;
};

type ProxyOptions = {
  fetcher?: typeof fetch;
  cookieStore?: ReadableSessionCookieStore;
  refresher?: AccessTokenRefresher;
};

type BackendResult = { status: number; body: unknown };

function failure(code: number, message: string) {
  return Response.json({ code, message }, { status: code });
}

async function callBackend(
  accessToken: string,
  path: string,
  init: ProxyInit,
  fetcher: typeof fetch,
): Promise<BackendResult> {
  const url = `${buildBackendApiUrl(path)}${init.search ?? ""}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (init.contentType) headers["Content-Type"] = init.contentType;

  const response = await fetcher(url, {
    method: init.method ?? "GET",
    headers,
    body: init.body ?? undefined,
    cache: "no-store",
    signal: init.timeoutMs ? AbortSignal.timeout(init.timeoutMs) : undefined,
  });

  // The backend answers an expired or invalid access token with 403, not 401.
  if (response.status === 401 || response.status === 403) {
    throw new SessionServiceError(SESSION_EXPIRED, 401);
  }

  // A non-JSON body (HTML error page, empty reply) throws and becomes a 502.
  return { status: response.status, body: await response.json() };
}

export async function proxyBackend(
  path: string,
  init: ProxyInit = {},
  options: ProxyOptions = {},
): Promise<Response> {
  const fetcher = options.fetcher ?? fetch;

  try {
    const result = await withSessionRefresh(
      (accessToken) => callBackend(accessToken, path, init, fetcher),
      { cookieStore: options.cookieStore, refresher: options.refresher },
    );
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    // Any SessionServiceError comes from the refresh step (the backend call
    // only throws one for a 401/403); the cookies are already cleared then.
    if (error instanceof SessionServiceError) {
      return failure(401, SESSION_ENDED);
    }
    return failure(502, BACKEND_UNAVAILABLE);
  }
}
