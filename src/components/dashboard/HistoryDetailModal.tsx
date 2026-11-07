"use client";

import Link from "next/link";

import {
  formatConfidence,
  formatWib,
} from "@/components/dashboard/DashboardFormat";
import {
  classifyResult,
  isAlertKind,
  RESULT_COPY,
} from "@/components/dashboard/ResultKind";
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
  const result = item ? classifyResult(item) : "pending";
  const copy = RESULT_COPY[result];
  const isAlert = isAlertKind(result);
  const isNormal = result === "normal";
  const isNeutral = !isAlert && !isNormal;
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
      title={copy.title}
    >
      {item ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {isNeutral ? null : (
              <StatusMark size="small" status={isNormal ? "normal" : "af"} />
            )}
            <p
              className={`text-[0.9375rem] font-semibold ${
                isNeutral
                  ? "text-primary-900/70"
                  : isNormal
                    ? "text-primary-500"
                    : "text-af-700"
              }`}
            >
              {copy.label}
            </p>
          </div>

          <PpgTrace
            className="h-40 w-full rounded-[16px] bg-paper"
            data={item.ppgResult?.rawPpgData}
            label={`Grafik sinyal PPG${isNeutral ? "" : `, ${copy.label.toLowerCase()}`}`}
            tone={isAlert ? "pink" : "blue"}
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
            {copy.sentence}
          </p>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              className={`${actionClassName} border-[1.5px] border-primary-900/20 text-primary-900 hover:bg-paper-deep`}
              onClick={onClose}
              type="button"
            >
              Tutup
            </button>
            {isAlert ? (
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
