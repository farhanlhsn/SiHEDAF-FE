"use client";

import Link from "next/link";
import { useId } from "react";

import {
  formatConfidence,
  formatWib,
  resultStatus,
} from "@/components/dashboard/DashboardFormat";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import type { MeasurementData } from "@/components/dashboard/hooks/UseDashboardOverview";
import {
  analysisStatusLabel,
  type RestartAction,
  type ResultModalView,
} from "@/components/dashboard/MonitoringSession";
import { PpgTrace } from "@/components/dashboard/PpgTrace";
import {
  rangeEndingOn,
  reportHref,
} from "@/components/dashboard/ReportRange";
import { StatusMark } from "@/components/dashboard/StatusMark";
import { PulseLoader } from "@/components/ui/PulseLoader";

type AiResultModalProps = Readonly<{
  data: MeasurementData | null;
  onClose: () => void;
  onRestart: () => void;
  open: boolean;
  /** "Mulai monitoring lagi": hidden while a session runs, disabled when busy or offline. */
  restart: RestartAction;
  view: ResultModalView;
}>;

// One column on phones, two from sm; with an odd number of actions the first
// (primary) one spans both columns. Grid, not flex-grow: a zero flex-basis in a
// column flexbox collapses the buttons below their 48px height.
const actionsClassName =
  "grid gap-3 sm:grid-cols-2 sm:[&>:first-child:nth-last-child(odd)]:col-span-2";
const actionClassName =
  "flex h-12 items-center justify-center whitespace-nowrap rounded-full px-5 text-center text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300";
const primaryActionClassName = `btn-primary ${actionClassName} bg-primary-900 text-white`;
const secondaryActionClassName = `${actionClassName} border-[1.5px] border-primary-900/20 text-primary-900 transition-colors hover:bg-paper-deep disabled:cursor-not-allowed disabled:border-primary-900/15 disabled:text-primary-900/70 disabled:hover:bg-transparent`;

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
  data,
  onClose,
  onRestart,
  open,
  restart,
  view,
}: AiResultModalProps) {
  const status = resultStatus(data?.resultLabel);
  const title =
    view === "analysing"
      ? "Menganalisis rekaman"
      : view === "timeout"
        ? "Hasil belum tersedia"
        : titles[status];

  // Each view is a fresh dialog element (contentKey), so focus moves into it
  // and the new title is announced when the result arrives in an open modal;
  // the backdrop stays and focus still returns to the original opener.
  return (
    <DashboardModal
      contentKey={view}
      onClose={onClose}
      open={open}
      showCloseButton={false}
      size="wide"
      title={title}
    >
      {view === "analysing" ? (
        <AnalysingBody onClose={onClose} />
      ) : view === "timeout" ? (
        <TimeoutBody onClose={onClose} />
      ) : (
        <ResultBody
          data={data}
          onClose={onClose}
          onRestart={onRestart}
          restart={restart}
        />
      )}
    </DashboardModal>
  );
}

function AnalysingBody({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <div className="flex flex-col items-center text-center">
      <PulseLoader className="mt-2" label="Sedang dianalisis…" />
      <p className="mt-5 max-w-[520px] text-[16px] leading-[1.55] text-primary-900/80">
        AI sedang membaca sinyal PPG dari sesi ini. Kamu boleh menutup jendela
        ini; hasilnya akan muncul di dashboard dan Riwayat.
      </p>
      <div className={`mt-7 w-full ${actionsClassName}`}>
        <button
          className={secondaryActionClassName}
          onClick={onClose}
          type="button"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

function TimeoutBody({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <>
      <p className="text-[16px] leading-[1.55] text-primary-900/80">
        Analisis mungkin masih berjalan. Cek Riwayat beberapa saat lagi.
      </p>
      <div className={`mt-7 ${actionsClassName}`}>
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
    </>
  );
}

function ResultBody({
  data,
  onClose,
  onRestart,
  restart,
}: Readonly<{
  data: MeasurementData | null;
  onClose: () => void;
  onRestart: () => void;
  restart: RestartAction;
}>) {
  const restartHintId = useId();
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
  // Offered with a result only once no session runs, never while recording.
  const offersRestart = status !== "unknown" && restart !== "hidden";
  const restartButton = offersRestart ? (
    <button
      aria-describedby={restart === "offline" ? restartHintId : undefined}
      className={secondaryActionClassName}
      disabled={restart !== "ready"}
      onClick={onRestart}
      type="button"
    >
      Mulai monitoring lagi
    </button>
  ) : null;
  const closeButton = (
    <button
      className={
        status === "normal" ? primaryActionClassName : secondaryActionClassName
      }
      onClick={onClose}
      type="button"
    >
      Tutup
    </button>
  );

  return (
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
        label="Grafik sinyal PPG"
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

      <div className={actionsClassName}>
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
      {offersRestart && restart === "offline" ? (
        <p
          className="-mt-2 text-[14px] text-primary-900/75"
          id={restartHintId}
        >
          Perangkat belum terhubung.
        </p>
      ) : null}
    </div>
  );
}
