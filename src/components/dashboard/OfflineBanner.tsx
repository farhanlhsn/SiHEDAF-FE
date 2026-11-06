"use client";

import { useEffect, useState } from "react";

import { BrokenSignal } from "@/components/ui/BrokenSignal";
import { useOnlineStatus } from "@/components/ui/hooks/UseOnlineStatus";

const RECONNECTED_MS = 4000;

/** Tells the reader when the internet drops, and briefly when it is back. */
export function OfflineBanner() {
  const { online, reconnectCount } = useOnlineStatus();
  const [seenCount, setSeenCount] = useState(reconnectCount);
  const justReconnected = online && reconnectCount > seenCount;

  useEffect(() => {
    if (!justReconnected) return;
    const timer = setTimeout(() => setSeenCount(reconnectCount), RECONNECTED_MS);

    return () => clearTimeout(timer);
  }, [justReconnected, reconnectCount]);

  const message = !online
    ? "Koneksi internet terputus. Data yang tampil mungkin bukan yang terbaru; SiHEDAF akan memuat ulang otomatis saat tersambung."
    : justReconnected
      ? "Tersambung kembali. Data sedang dimuat ulang."
      : null;

  return (
    <div
      aria-live="polite"
      className="print:hidden"
      role="status"
    >
      {message ? (
        <div
          className={`flex items-center gap-3 border-b px-4 py-3 text-[0.9375rem] font-medium text-primary-900 sm:px-7 ${
            online
              ? "border-primary-200 bg-primary-50"
              : "border-warn-500/40 bg-warn-50"
          }`}
        >
          {online ? null : <BrokenSignal className="shrink-0" />}
          <p>{message}</p>
        </div>
      ) : null}
    </div>
  );
}
