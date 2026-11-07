"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useId } from "react";

import {
  formatConfidence,
  formatWib,
} from "@/components/dashboard/DashboardFormat";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import type { MeasurementData } from "@/components/dashboard/hooks/UseDashboardOverview";
import {
  analysisStatusLabel,
  type RestartAction,
  type ResultModalView,
} from "@/components/dashboard/MonitoringSession";
import {
  classifyResult,
  isAlertKind,
  RESULT_COPY,
} from "@/components/dashboard/ResultKind";
import { PpgTrace } from "@/components/dashboard/PpgTrace";
import {
  recordingDuration,
  SAMPLE_RATE_HZ,
} from "@/components/dashboard/Signal";
import {
  rangeEndingOn,
  reportHref,
} from "@/components/dashboard/ReportRange";
import { StatusMark } from "@/components/dashboard/StatusMark";
import { PulseLoader } from "@/components/ui/PulseLoader";

type AiResultModalProps = Readonly<{
  /** The wristband ended the session after 3 minutes; the user did not press Stop. */
  autoFinished: boolean;
  data: MeasurementData | null;
  onClose: () => void;
  onRestart: () => void;
  open: boolean;
  /** "Mulai monitoring lagi": hidden while a session runs; disabled (with a reason) when busy, offline or unknown. */
  restart: RestartAction;
  view: ResultModalView;
}>;

// One column on phones, two from sm; with an odd number of actions the first
// (primary) one spans both columns. Grid, not flex-grow: a zero flex-basis in a
// column flexbox collapses the buttons below their 48px height.
const actionsClassName =
  "grid gap-3 sm:grid-cols-2 sm:[&>:first-child:nth-last-child(odd)]:col-span-2";
const actionClassName =
  "flex h-12 items-center justify-center whitespace-nowrap rounded-full px-5 text-center text-[0.9375rem] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300";
const primaryActionClassName = `btn-primary ${actionClassName} bg-primary-900 text-white`;
const secondaryActionClassName = `${actionClassName} border-[1.5px] border-primary-900/20 text-primary-900 transition-colors hover:bg-paper-deep disabled:cursor-not-allowed disabled:border-primary-900/15 disabled:text-primary-900/70 disabled:hover:bg-transparent`;

export function AiResultModal({
  autoFinished,
  data,
  onClose,
  onRestart,
  open,
  restart,
  view,
}: AiResultModalProps) {
  const kind = data ? classifyResult(data) : "pending";
  const title =
    view === "analysing"
      ? "Menganalisis rekaman"
      : view === "timeout"
        ? "Hasil belum tersedia"
        : RESULT_COPY[kind].title;

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
          autoFinished={autoFinished}
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
      <p className="mt-5 max-w-[520px] text-[1rem] leading-[1.55] text-primary-900/80">
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
      <p className="text-[1rem] leading-[1.55] text-primary-900/80">
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
  autoFinished,
  data,
  onClose,
  onRestart,
  restart,
}: Readonly<{
  autoFinished: boolean;
  data: MeasurementData | null;
  onClose: () => void;
  onRestart: () => void;
  restart: RestartAction;
}>) {
  const restartHintId = useId();
  const kind = data ? classifyResult(data) : "pending";
  const isAlert = isAlertKind(kind);
  const isNeutral = !isAlert && kind !== "normal";
  const confidence = formatConfidence(data?.confidenceLevel);
  const measuredAt = formatWib(
    data?.completedAt ?? data?.updatedAt ?? data?.createdAt,
  );
  const duration = recordingDuration(data?.ppgResult?.rawPpgData);

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
  // Pending has nothing to redo; a short or failed recording is fixed by a new one.
  const offersRestart = kind !== "pending" && restart !== "hidden";
  const restartHint =
    restart === "no-network"
      ? "Tidak ada koneksi internet."
      : restart === "device-unknown"
        ? "Status perangkat belum bisa dimuat."
        : restart === "offline"
          ? "Perangkat belum terhubung."
          : null;
  const restartButton = offersRestart ? (
    <button
      aria-describedby={restartHint ? restartHintId : undefined}
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
        kind === "normal" ? primaryActionClassName : secondaryActionClassName
      }
      onClick={onClose}
      type="button"
    >
      Tutup
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      {autoFinished ? (
        <p
          className="flex items-center gap-2.5 rounded-[14px] bg-primary-50 px-4 py-3 text-[0.9375rem] font-medium text-primary-900"
          role="note"
        >
          <Clock
            aria-hidden="true"
            className="size-4 shrink-0 text-primary-500"
            strokeWidth={2.25}
          />
          Rekaman selesai otomatis setelah 3 menit.
        </p>
      ) : null}
      <div className="flex items-start gap-4">
        {isNeutral ? null : (
          <div className="shrink-0">
            <StatusMark
              label={RESULT_COPY[kind].label}
              size="large"
              status={isAlert ? "af" : "normal"}
            />
          </div>
        )}
        <p className="text-[1rem] leading-[1.55] text-primary-900/80">
          {RESULT_COPY[kind].sentence}
        </p>
      </div>

      <PpgTrace
        className="h-36 w-full rounded-[18px] bg-paper"
        data={data?.ppgResult?.rawPpgData}
        label="Grafik sinyal PPG"
        sampleRate={SAMPLE_RATE_HZ}
        tone={isAlert ? "pink" : "blue"}
      />

      <dl className="grid gap-4 rounded-[18px] bg-paper p-5 text-[0.9375rem] sm:grid-cols-2">
        <div>
          <dt className="text-primary-900/75">Waktu</dt>
          <dd className="mt-1 font-semibold text-primary-900">
            {measuredAt ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-primary-900/75">Durasi rekaman</dt>
          <dd className="mt-1 font-semibold tabular-nums text-primary-900">
            {duration ?? "—"}
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
        {isAlert ? (
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
        ) : kind === "normal" ? (
          <>
            {closeButton}
            {historyLink}
            {restartButton}
          </>
        ) : (
          <>
            {restartButton}
            {historyLink}
            {closeButton}
          </>
        )}
      </div>
      {offersRestart && restartHint ? (
        <p
          className="-mt-2 text-[0.875rem] text-primary-900/75"
          id={restartHintId}
        >
          {restartHint}
        </p>
      ) : null}
    </div>
  );
}
