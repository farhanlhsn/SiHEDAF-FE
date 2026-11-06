import { SessionExpiredError } from "@/features/auth/session/client/ApiFetch";

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
    message: "Ini bukan masalah di perangkatmu. Coba lagi beberapa saat lagi.",
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
  else if (!online || error instanceof TypeError) kind = "offline";

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
