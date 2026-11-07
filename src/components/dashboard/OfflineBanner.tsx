"use client";

import { useEffect, useState } from "react";

import { BrokenSignal } from "@/components/ui/BrokenSignal";
import { useOnlineStatus } from "@/components/ui/hooks/UseOnlineStatus";

const RECONNECTED_MS = 4000;

type OfflineBannerProps = {
  /**
   * The floating "Tampilkan notifikasi" button sits over the banner's right
   * edge on /dashboard; keep the text clear of it.
   */
  besideNotificationButton?: boolean;
};

/** Tells the reader when the internet drops, and briefly when it is back. */
export function OfflineBanner({
  besideNotificationButton = false,
}: OfflineBannerProps) {
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
          className={`flex flex-col items-start gap-1 border-b py-3 pl-4 text-[0.9375rem] font-medium text-primary-900 sm:flex-row sm:items-center sm:gap-3 sm:pl-7 ${
            besideNotificationButton ? "pr-20 sm:pr-24" : "pr-4 sm:pr-7"
          } ${
            online
              ? "border-primary-200 bg-primary-50"
              : "border-warn-500/40 bg-warn-50"
          }`}
        >
          {/* On phones the line sits above the text, which then gets the width. */}
          {online ? null : <BrokenSignal className="shrink-0" />}
          <p>{message}</p>
        </div>
      ) : null}
    </div>
  );
}
