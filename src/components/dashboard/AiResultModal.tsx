"use client";

import Link from "next/link";

import {
  formatConfidence,
  formatWib,
  resultStatus,
} from "@/components/dashboard/DashboardFormat";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import type { MeasurementData } from "@/components/dashboard/hooks/UseDashboardOverview";
import { analysisStatusLabel } from "@/components/dashboard/MonitoringSession";
import { PpgTrace } from "@/components/dashboard/PpgTrace";
import {
  rangeEndingOn,
  reportHref,
} from "@/components/dashboard/ReportRange";
import { StatusMark } from "@/components/dashboard/StatusMark";
import { PulseLoader } from "@/components/ui/PulseLoader";

type AiResultModalProps = Readonly<{
  canRestart: boolean;
  data: MeasurementData | null;
  onClose: () => void;
  onRestart: () => void;
  open: boolean;
  phase: "analysing" | "result" | "timeout";
}>;

const primaryActionClassName =
  "btn-primary flex h-12 flex-1 items-center justify-center rounded-full bg-primary-900 px-5 text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300";
const secondaryActionClassName =
  "flex h-12 flex-1 items-center justify-center rounded-full border-[1.5px] border-primary-900/20 px-5 text-[15px] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 disabled:cursor-not-allowed disabled:opacity-60";

const titles = {
  normal: "Irama Jantung Normal",
  af: "Terdeteksi Potensi AF",
  unknown: "Hasil analisis belum tersedia",
} as const;

const copy = {
  normal:
    "Jarak antar detak pada rekaman ini terlihat teratur. Tetap pantau secara berkala.",
  af: "AI menemukan pola tidak teratur yang mirip Atrial Fibrillation. Ini bukan diagnosis; tunjukkan hasil ini ke dokter, terutama bila ada keluhan.",
  unknown: "Rekaman ini belum memiliki hasil analisis AI.",
} as const;

export function AiResultModal({
  canRestart,
  data,
  onClose,
  onRestart,
  open,
  phase,
}: AiResultModalProps) {
  if (phase === "analysing") {
    return (
      <DashboardModal
        onClose={onClose}
        open={open}
        showCloseButton={false}
        size="wide"
        title="Menganalisis rekaman"
      >
        <div className="flex flex-col items-center text-center">
          <PulseLoader className="mt-2" label="Sedang dianalisis…" />
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.55] text-primary-900/80">
            AI sedang membaca sinyal PPG dari sesi ini. Kamu boleh menutup
            jendela ini; hasilnya akan muncul di dashboard dan Riwayat.
          </p>
          <div className="mt-7 flex w-full">
            <button
              className={secondaryActionClassName}
              onClick={onClose}
              type="button"
            >
              Tutup
            </button>
          </div>
        </div>
      </DashboardModal>
    );
  }

  if (phase === "timeout") {
    return (
      <DashboardModal
        onClose={onClose}
        open={open}
        showCloseButton={false}
        size="wide"
        title="Hasil belum tersedia"
      >
        <p className="text-[16px] leading-[1.55] text-primary-900/80">
          Analisis mungkin masih berjalan. Cek Riwayat beberapa saat lagi.
        </p>
        <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
          <Link
            className={primaryActionClassName}
            href="/riwayat"
            onClick={onClose}
          >
            Buka Riwayat
          </Link>
          <button
            className={secondaryActionClassName}
            onClick={onClose}
            type="button"
          >
            Tutup
          </button>
        </div>
      </DashboardModal>
    );
  }

  const status = resultStatus(data?.resultLabel);
  const confidence = formatConfidence(data?.confidenceLevel);
  const measuredAt = formatWib(
    data?.completedAt ?? data?.updatedAt ?? data?.createdAt,
  );

  const historyLink = (
    <Link
      className={secondaryActionClassName}
      href="/riwayat"
      onClick={onClose}
    >
      Lihat Riwayat
    </Link>
  );
  const restartButton = (
    <button
      className={secondaryActionClassName}
      disabled={!canRestart}
      onClick={onRestart}
      type="button"
    >
      Mulai monitoring lagi
    </button>
  );
  const closeButton = (
    <button
      className={status === "normal" ? primaryActionClassName : secondaryActionClassName}
      onClick={onClose}
      type="button"
    >
      Tutup
    </button>
  );

  return (
    <DashboardModal
      onClose={onClose}
      open={open}
      showCloseButton={false}
      size="wide"
      title={titles[status]}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          {status === "unknown" ? null : (
            <div className="shrink-0">
              <StatusMark size="large" status={status} />
            </div>
          )}
          <p className="text-[16px] leading-[1.55] text-primary-900/80">
            {copy[status]}
          </p>
        </div>

        <PpgTrace
          className="h-36 w-full rounded-[18px] bg-paper"
          data={data?.ppgResult?.rawPpgData}
          label="Grafik sinyal PPG sesi ini"
          tone={status === "af" ? "pink" : "blue"}
        />

        <dl className="grid gap-4 rounded-[18px] bg-paper p-5 text-[15px] sm:grid-cols-3">
          <div>
            <dt className="text-primary-900/75">Waktu</dt>
            <dd className="mt-1 font-semibold text-primary-900">
              {measuredAt ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-primary-900/75">Keyakinan AI</dt>
            <dd className="mt-1 font-semibold tabular-nums text-primary-900">
              {confidence ?? "Tidak tersedia"}
            </dd>
          </div>
          <div>
            <dt className="text-primary-900/75">Status analisis</dt>
            <dd className="mt-1 font-semibold text-primary-900">
              {analysisStatusLabel(data?.status)}
            </dd>
          </div>
        </dl>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          {status === "af" ? (
            <>
              <Link
                className={primaryActionClassName}
                href={reportHref(
                  rangeEndingOn(data?.completedAt ?? data?.createdAt),
                )}
                onClick={onClose}
              >
                Buat laporan dokter
              </Link>
              {historyLink}
              {restartButton}
              {closeButton}
            </>
          ) : status === "normal" ? (
            <>
              {closeButton}
              {historyLink}
              {restartButton}
            </>
          ) : (
            <>
              {historyLink}
              {closeButton}
            </>
          )}
        </div>
      </div>
    </DashboardModal>
  );
}
