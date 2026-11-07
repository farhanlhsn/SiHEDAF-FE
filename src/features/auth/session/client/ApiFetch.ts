export const SESSION_EXPIRED_PATH = "/login?sesi=berakhir";

/** Thrown when the session is over; callers must stay silent (we redirect). */
export class SessionExpiredError extends Error {
  constructor() {
    super("Sesi berakhir.");
    this.name = "SessionExpiredError";
  }
}

/**
 * The request got no answer at all (no connection, DNS, blocked): the only
 * failure that means "check your internet". Aborts and timeouts are not
 * wrapped; callers tell those apart themselves.
 */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super("Permintaan tidak mendapat jawaban.", { cause });
    this.name = "NetworkError";
  }
}

function isAbort(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

type ApiFetchDeps = {
  fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  navigate: (url: string) => void;
};

/**
 * fetch for same-origin API calls: HTTP 401 means the session is over, so
 * send the reader to /login once and reject with SessionExpiredError. A fetch
 * that gets no answer rejects with NetworkError.
 */
export function createApiFetch({ fetcher, navigate }: ApiFetchDeps) {
  let hasNavigated = false;

  return async function apiFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    let response: Response;
    try {
      response = await fetcher(input, init);
    } catch (error) {
      if (init?.signal?.aborted || isAbort(error)) throw error;
      throw new NetworkError(error);
    }

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
