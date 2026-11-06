export const SESSION_EXPIRED_PATH = "/login?sesi=berakhir";

/** Thrown when the session is over; callers must stay silent (we redirect). */
export class SessionExpiredError extends Error {
  constructor() {
    super("Sesi berakhir.");
    this.name = "SessionExpiredError";
  }
}

type ApiFetchDeps = {
  fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  navigate: (url: string) => void;
};

/**
 * fetch for same-origin API calls: HTTP 401 means the session is over, so
 * send the reader to /login once and reject with SessionExpiredError.
 */
export function createApiFetch({ fetcher, navigate }: ApiFetchDeps) {
  let hasNavigated = false;

  return async function apiFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const response = await fetcher(input, init);

    if (response.status === 401) {
      if (!hasNavigated) {
        hasNavigated = true;
        navigate(SESSION_EXPIRED_PATH);
      }
      throw new SessionExpiredError();
    }

    return response;
  };
}

export const apiFetch = createApiFetch({
  fetcher: (input, init) => fetch(input, init),
  navigate: (url) => window.location.assign(url),
});
