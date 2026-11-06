"use client";

import { Info } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function SessionExpiredNotice() {
  const searchParams = useSearchParams();

  if (searchParams.get("sesi") !== "berakhir") return null;

  return (
    <div
      className="mb-5 flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-[0.9375rem] leading-snug text-primary-900"
      role="status"
    >
      <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary-500" />
      <p>Sesimu sudah berakhir. Silakan masuk lagi untuk melanjutkan.</p>
    </div>
  );
}
