import {
  NetworkError,
  SessionExpiredError,
} from "@/features/auth/session/client/ApiFetch";

export type FetchErrorKind = "offline" | "server" | "session";

type FetchErrorInput = {
  online: boolean;
  status?: number;
  error?: unknown;
};

const COPY: Record<FetchErrorKind, { title: string; message: string }> = {
  offline: {
    title: "Koneksi internet terputus",
    message: "Periksa koneksi internet HP atau laptopmu, lalu coba lagi.",
  },
  server: {
    title: "Server SiHEDAF sedang bermasalah",
    message: "Ini bukan masalah di HP atau laptopmu. Coba lagi beberapa saat lagi.",
  },
  // Not shown: the reader is being sent to /login.
  session: {
    title: "Sesi berakhir",
    message: "Silakan masuk kembali.",
  },
};

/** Plain-language copy for a failed request; never exposes raw error text. */
export function describeFetchError({ online, status, error }: FetchErrorInput): {
  kind: FetchErrorKind;
  title: string;
  message: string;
} {
  let kind: FetchErrorKind = "server";

  if (status === 401 || error instanceof SessionExpiredError) kind = "session";
  // Only a request that got no answer is a lost connection; any other error
  // (a plain TypeError from a bad body included) is the server's side.
  else if (!online || error instanceof NetworkError) kind = "offline";

  return { kind, ...COPY[kind] };
}

export type DataError = { title: string; message: string };

/** Reads the browser's connection state at the moment of the failure. */
export function describeCaughtError(error: unknown, status?: number): DataError {
  const { title, message } = describeFetchError({
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    status,
    error,
  });
  return { title, message };
}

export type LatestOutcome = "data" | "empty" | "error";

/**
 * Reads an answer from /api/v1/measurement/latest. "No measurement yet" is a
 * 404 or a 200 envelope whose data is null (the assumed backend contract);
 * every other answer without a 200 envelope is a failure, so a failure never
 * shows the first-run guide.
 */
export function latestOutcome({
  status,
  json,
}: {
  status: number;
  json: unknown;
}): LatestOutcome {
  if (status === 404) return "empty";
  if (status < 200 || status > 299) return "error";
  if (typeof json !== "object" || json === null) return "error";

  const body = json as { code?: unknown; data?: unknown };
  if (body.code !== 200) return "error";

  return body.data == null ? "empty" : "data";
}
