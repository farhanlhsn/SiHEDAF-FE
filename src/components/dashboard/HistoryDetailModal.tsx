"use client";

import Link from "next/link";

import {
  formatConfidence,
  formatWib,
  resultStatus,
} from "@/components/dashboard/DashboardFormat";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import { PpgTrace } from "@/components/dashboard/PpgTrace";
import {
  rangeEndingOn,
  reportHref,
} from "@/components/dashboard/ReportRange";
import { StatusMark } from "@/components/dashboard/StatusMark";
import type { HistoryItem } from "@/components/dashboard/hooks/UseHistoryView";

type HistoryDetailModalProps = Readonly<{
  item: HistoryItem | null;
  onClose: () => void;
}>;

const actionClassName =
  "inline-flex h-12 items-center justify-center rounded-full px-6 text-[1rem] font-semibold focus-visible:outline-2 focus-visible:outline-primary-300";

export function HistoryDetailModal({ item, onClose }: HistoryDetailModalProps) {
  const result = resultStatus(item?.resultLabel);
  const isUnknown = result === "unknown";
  const isNormal = result === "normal";
  const facts = item
    ? [
        { label: "Waktu", value: formatWib(item.requestedAt) ?? "—" },
        {
          label: "Keyakinan AI",
          value: formatConfidence(item.confidenceLevel) ?? "Tidak tersedia",
        },
        { label: "Device ID", value: item.deviceId || "—" },
      ]
    : [];

  return (
    <DashboardModal
      onClose={onClose}
      open={item !== null}
      showCloseButton
      size="wide"
      title={
        isUnknown
          ? "Hasil analisis belum tersedia"
          : isNormal
            ? "Irama Jantung Normal"
            : "Terdeteksi Potensi AF"
      }
    >
      {item ? (
        <div className="space-y-6">
          {isUnknown ? null : (
            <div className="flex items-center gap-3">
              <StatusMark size="small" status={isNormal ? "normal" : "af"} />
              <p
                className={`text-[0.9375rem] font-semibold ${
                  isNormal ? "text-primary-500" : "text-af-700"
                }`}
              >
                {isNormal ? "Normal Rhythm" : "Terdeteksi AF"}
              </p>
            </div>
          )}

          <PpgTrace
            className="h-40 w-full rounded-[16px] bg-paper"
            data={item.ppgResult?.rawPpgData}
            label={`Grafik sinyal PPG${isUnknown ? "" : isNormal ? ", irama normal" : ", terdeteksi AF"}`}
            tone={isNormal || isUnknown ? "blue" : "pink"}
          />

          <dl className="grid gap-4 sm:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-[0.875rem] font-medium text-primary-900/75">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-[1rem] font-semibold break-words text-primary-900">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="text-[1rem] leading-[1.55] text-primary-900/80">
            {isUnknown
              ? "Rekaman ini belum memiliki hasil analisis AI."
              : isNormal
              ? "Jarak antar detak pada rekaman ini terlihat teratur. Tetap pantau secara berkala."
              : "AI menemukan pola tidak teratur yang mirip Atrial Fibrillation. Ini bukan diagnosis; tunjukkan hasil ini ke dokter, terutama bila ada keluhan."}
          </p>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              className={`${actionClassName} border-[1.5px] border-primary-900/20 text-primary-900 hover:bg-paper-deep`}
              onClick={onClose}
              type="button"
            >
              Tutup
            </button>
            {result === "af" ? (
              <Link
                className={`${actionClassName} bg-primary-900 text-white hover:bg-primary-800`}
                href={reportHref(rangeEndingOn(item.requestedAt))}
              >
                Buat laporan dokter
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </DashboardModal>
  );
}
