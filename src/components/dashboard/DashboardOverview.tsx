"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Hand,
  Pause,
  Play,
  TriangleAlert,
} from "lucide-react";

import { AiResultModal } from "@/components/dashboard/AiResultModal";
import {
  formatConfidence,
  formatWib,
} from "@/components/dashboard/DashboardFormat";
import {
  isAlertKind,
  RESULT_COPY,
} from "@/components/dashboard/ResultKind";
import { DataErrorState } from "@/components/ui/DataErrorState";
import { DeviceOfflineCard } from "@/components/dashboard/DeviceOfflineCard";
import { FirstRunGuide } from "@/components/dashboard/FirstRunGuide";
import { SignalChart } from "@/components/dashboard/SignalChart";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StatusMark } from "@/components/dashboard/StatusMark";
import { useDashboardOverview } from "@/components/dashboard/hooks/UseDashboardOverview";

const panelClassName = "rounded-[24px] border border-primary-900/10 bg-white";
const labelClassName = "text-[0.875rem] font-medium text-primary-900/75";
const toggleHintId = "monitoring-toggle-hint";
const stalledHintId = "monitoring-stalled-hint";
const valueClassName = "mt-1 text-[1rem] font-semibold text-primary-900";

export function DashboardOverview() {
  const {
    firstName,
    deviceData,
    deviceStatus,
    deviceStatusLabel,
    deviceError,
    isDeviceRefreshing,
    reloadDevice,
    latestData,
    hasLoadedLatest,
    latestError,
    reloadLatest,
    showFirstRun,
    firstRunGuideSteps,
    signalsData,
    result,
    isMonitoringActive,
    phase,
    clock,
    autoFinished,
    monitoringRange,
    setMonitoringRange,
    isTogglingAction,
    handleToggleMonitoring,
    isAiModalOpen,
    modalView,
    openAiResult,
    closeAiModal,
    restartMonitoring,
    restartState,
    toggleBlocked,
  } = useDashboardOverview();

  const isAnalysing = phase === "analysing";
  const isAlert = isAlertKind(result);
  const isNeutral = result === "pending" || result === "short" || result === "unavailable";
  const copy = RESULT_COPY[result];

  const confidence = formatConfidence(latestData?.confidenceLevel);
  const analysedAt = formatWib(
    latestData?.completedAt ?? latestData?.updatedAt,
  );
  const measuredAt = formatWib(latestData?.createdAt);
  const isDeviceOnline =
    deviceStatus === "online" || deviceStatus === "recording";
  const toggleHint =
    toggleBlocked === "no-network"
      ? "Tidak ada koneksi internet."
      : toggleBlocked === "device-unknown"
        ? "Status perangkat belum bisa dimuat."
        : null;
  // Overtime for more than 30 s without a result: only Stop finishes it now.
  const isStalled = isMonitoringActive && clock.overtime && clock.stalled;
  const toggleDescribedBy =
    [toggleHint ? toggleHintId : null, isStalled ? stalledHintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <section className="min-h-[calc(100dvh-72px)] min-w-0 px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1180px]">
        <p className="text-[1rem] font-semibold text-primary-500">
          Selamat Datang, {firstName}
        </p>

        <h1 className="mt-3 max-w-[900px] text-[clamp(2.3rem,4.4vw,4rem)] leading-[0.98] tracking-[-0.05em] text-primary-900">
          {!hasLoadedLatest ? (
            <span className="font-bold">Memuat hasil terakhir</span>
          ) : latestError && !latestData ? (
            <span className="font-bold">Hasil terakhir belum bisa dimuat.</span>
          ) : result === "pending" && isMonitoringActive ? (
            <span className="font-bold">Monitoring sedang berjalan.</span>
          ) : result === "pending" ? (
            <span className="font-bold">Belum ada hasil analisis.</span>
          ) : result === "short" || result === "unavailable" ? (
            <span className="font-bold">Rekaman terakhir belum bisa dianalisis.</span>
          ) : (
            <>
              <span className="font-extralight">Irama terakhirmu</span>{" "}
              <span
                className={`font-bold ${result === "normal" ? "text-primary-300" : "text-af-500"}`}
              >
                {result === "normal" ? "normal." : "tidak teratur."}
              </span>
            </>
          )}
        </h1>

        {latestError && !latestData ? (
          <DataErrorState
            {...latestError}
            className="mt-6 items-start text-left"
            onRetry={reloadLatest}
          />
        ) : null}

        {showFirstRun ? (
          <FirstRunGuide steps={firstRunGuideSteps} />
        ) : null}

        {latestData ? (
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-primary-900/80">
              {isNeutral ? null : (
                <StatusMark
                  label={copy.label}
                  size="small"
                  status={isAlert ? "af" : "normal"}
                />
              )}
              <span className="font-semibold text-primary-900">
                Hasil Analisis Terakhir
              </span>
              {isNeutral ? (
                <span className="font-semibold text-primary-900/70">
                  {copy.label}
                </span>
              ) : null}
              {analysedAt ? <span>{analysedAt}</span> : null}
              {confidence ? (
                <span>
                  Keyakinan AI{" "}
                  <span className="font-semibold text-primary-900">
                    {confidence}
                  </span>
                </span>
              ) : null}
            </p>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-primary-900/20 bg-white px-5 text-[0.9375rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
              onClick={openAiResult}
              type="button"
            >
              Detail Hasil AI
              <ArrowRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={2.25}
              />
            </button>
          </div>
        ) : null}

        {isAlert ? (
          <div
            className="mt-6 flex max-w-[760px] gap-3 rounded-[18px] bg-af-50 p-5 text-[1rem] leading-[1.55] text-primary-900"
            role="note"
          >
            <TriangleAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-af-700"
              strokeWidth={2.25}
            />
            <p>
              {result === "flutter"
                ? "AI menemukan pola yang mirip Atrial Flutter."
                : "AI menemukan pola yang mirip Atrial Fibrillation."}{" "}
              Hasil ini bukan
              diagnosis; pertimbangkan konsultasi ke dokter, terutama jika kamu
              merasakan keluhan seperti jantung berdebar atau pusing.
            </p>
          </div>
        ) : null}

        <DeviceOfflineCard
          error={deviceError}
          lastSeen={deviceData?.lastSeen}
          onRetry={reloadDevice}
          refreshing={isDeviceRefreshing}
          state={deviceStatus}
        />

        <article
          className={`mt-10 scroll-mt-24 ${panelClassName} px-5 pt-6 pb-5 sm:px-7`}
          id="monitor"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[1.375rem] font-bold tracking-[-0.03em] text-primary-900">
                Sinyal PPG Terbaru
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.9375rem]">
                <span className="flex items-center gap-2 font-semibold text-primary-900">
                  {isMonitoringActive ? (
                    <span
                      aria-hidden="true"
                      className="live-dot !bg-primary-300"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full border-2 border-primary-900/40"
                    />
                  )}
                  {/* Only the phase word is live; the timer would be read every second. */}
                  <span aria-live="polite">
                    {isMonitoringActive
                      ? clock.overtime
                        ? "Menunggu hasil dari wristband…"
                        : "Merekam"
                      : isAnalysing
                        ? "Menganalisis rekaman…"
                        : "Monitoring dijeda"}
                  </span>
                  {/* From 03:00 the wristband has stopped: the waiting text replaces the clock. */}
                  {isMonitoringActive && !clock.overtime ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span
                        aria-label={`Lama perekaman ${clock.elapsed} dari ${clock.limit}`}
                        aria-live="off"
                        className="tabular-nums"
                        role="timer"
                      >
                        {clock.text}
                      </span>
                    </>
                  ) : null}
                </span>
                <span className="text-primary-900/75">
                  {isMonitoringActive
                    ? `Pembaruan otomatis selama ${monitoringRange} menit`
                    : "Pembaruan dihentikan sementara"}
                </span>
              </div>
              {/* Not live: it appears once and is tied to the Stop button instead. */}
              {isStalled ? (
                <p
                  className="mt-2 max-w-[560px] text-[0.9375rem] leading-[1.55] font-medium text-primary-900/80"
                  id={stalledHintId}
                >
                  {"Belum ada hasil dari wristband. Tekan Hentikan Monitoring untuk menyelesaikan rekaman."}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="relative block">
                <span className="sr-only">Rentang waktu monitoring</span>
                <select
                  className="h-11 appearance-none rounded-full border-[1.5px] border-primary-900/20 bg-white pr-10 pl-5 text-[0.9375rem] font-medium text-primary-900 outline-none transition-colors hover:border-primary-900/40 focus:border-primary-300 focus-visible:ring-4 focus-visible:ring-primary-100"
                  onChange={(event) => setMonitoringRange(event.target.value)}
                  value={monitoringRange}
                >
                  {[3, 6, 12, 30].map((minute) => (
                    <option key={minute} value={minute}>
                      {minute} menit terakhir
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-primary-900"
                  strokeWidth={2.25}
                />
              </label>
              <button
                aria-pressed={isMonitoringActive}
                className={`flex h-11 items-center gap-2 rounded-full px-5 text-[0.9375rem] font-semibold transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 ${
                  isMonitoringActive
                    ? "border-[1.5px] border-primary-900/20 bg-white text-primary-900 hover:bg-paper-deep"
                    : "btn-primary bg-primary-900 text-white"
                }`}
                aria-describedby={toggleDescribedBy}
                disabled={
                  toggleBlocked !== null || isTogglingAction || isAnalysing
                }
                onClick={handleToggleMonitoring}
                type="button"
              >
                {isTogglingAction || isAnalysing ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isMonitoringActive ? (
                  <Pause aria-hidden="true" size={16} strokeWidth={2.25} />
                ) : (
                  <Play
                    aria-hidden="true"
                    fill="currentColor"
                    size={16}
                    strokeWidth={2}
                  />
                )}
                {isAnalysing
                  ? "Menganalisis…"
                  : isMonitoringActive
                    ? "Hentikan Monitoring"
                    : "Mulai Monitoring"}
              </button>
            </div>
          </div>
          {toggleHint ? (
            <p
              className="mt-3 text-[0.9375rem] font-medium text-primary-900/80"
              id={toggleHintId}
            >
              {toggleHint}
            </p>
          ) : null}
          {isMonitoringActive ? (
            <div
              className="mt-4 flex max-w-[760px] gap-3 rounded-[18px] bg-primary-50 p-4 text-[0.9375rem] leading-[1.55] text-primary-900"
              role="note"
            >
              <Hand
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-primary-500"
                strokeWidth={2}
              />
              <p>
                {"Biarkan wristband tetap terpasang dan usahakan tangan tidak banyak bergerak selama perekaman."}
              </p>
            </div>
          ) : null}
          {phase === "timeout" ? (
            <div
              className="mt-4 flex max-w-[760px] gap-3 rounded-[18px] bg-paper p-4 text-[0.9375rem] leading-[1.55] text-primary-900"
              role="note"
            >
              <Clock
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-primary-500"
                strokeWidth={2}
              />
              <p>
                {"Hasil sesi terakhir belum tersedia. Cek Riwayat beberapa saat lagi."}{" "}
                <Link
                  className="font-semibold text-primary-500 underline underline-offset-4 transition-colors hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
                  href="/riwayat"
                >
                  Buka Riwayat
                </Link>
              </p>
            </div>
          ) : null}
          <SignalChart
            data={signalsData}
            isActive={isMonitoringActive}
            rangeMinutes={Number(monitoringRange)}
          />
        </article>

        <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-2">
          <article
            className={`flex h-full flex-col p-6 sm:p-7 ${panelClassName}`}
          >
            <h2 className="text-[1.25rem] font-bold tracking-[-0.03em] text-primary-900">
              Monitoring Terakhir
            </h2>
            {latestData ? (
              <div className="mt-5 flex-1">
                <p className="flex items-center gap-3">
                  {isNeutral ? null : (
                    <StatusMark
                      label={copy.label}
                      size="small"
                      status={isAlert ? "af" : "normal"}
                    />
                  )}
                  <span
                    className={`text-[0.9375rem] font-semibold ${
                      isNeutral
                        ? "text-primary-900/70"
                        : result === "normal"
                          ? "text-primary-500"
                          : "text-af-700"
                    }`}
                  >
                    {copy.label}
                  </span>
                </p>
                <h3 className="mt-3 text-[1.1875rem] font-semibold text-primary-900">
                  {copy.title}
                </h3>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
                  <div>
                    <dt className={labelClassName}>Waktu Pengukuran</dt>
                    <dd className={valueClassName}>{measuredAt ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className={labelClassName}>Keyakinan AI</dt>
                    <dd className={valueClassName}>{confidence ?? "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className={labelClassName}>Grafik Sinyal</dt>
                    <dd className="mt-2">
                      <Sparkline
                        data={latestData.ppgResult?.rawPpgData}
                        tone={isAlert ? "pink" : "blue"}
                      />
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="flex-1 py-8 text-center text-[0.9375rem] text-primary-900/75">
                Belum ada riwayat terbaru.
              </p>
            )}
            <Link
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-primary-900/20 text-[0.9375rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
              href="/riwayat"
            >
              Lihat semua riwayat
              <ArrowRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={2.25}
              />
            </Link>
          </article>

          <article
            className={`flex h-full flex-col p-6 sm:p-7 ${panelClassName}`}
          >
            <h2 className="text-[1.25rem] font-bold tracking-[-0.03em] text-primary-900">
              Status Perangkat
            </h2>
            <div className="mt-5 flex flex-1 items-center gap-6">
              <Image
                alt="SiHEDAF Wristband"
                className="h-[150px] w-auto shrink-0 object-contain sm:h-[170px]"
                height={218}
                src="/watch2.png"
                width={63}
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[0.9375rem] font-semibold text-primary-900">
                  {isDeviceOnline ? (
                    <span
                      aria-hidden="true"
                      className="live-dot !bg-primary-300"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full border-2 border-primary-900/40"
                    />
                  )}
                  {deviceStatusLabel}
                </p>
                <h3 className="mt-2 text-[1.1875rem] font-semibold text-primary-900">
                  SiHEDAF Wristband
                </h3>
                <dl className="mt-5 grid gap-4">
                  <div className="min-w-0">
                    <dt className={labelClassName}>Device ID</dt>
                    <dd
                      className={`${valueClassName} truncate font-mono tracking-[0.06em]`}
                    >
                      {deviceData?.deviceNumber || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className={labelClassName}>Sinkronisasi terakhir</dt>
                    <dd className={valueClassName}>
                      {formatWib(deviceData?.lastSeen) ?? "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </article>
        </div>
      </div>

      <AiResultModal
        autoFinished={autoFinished}
        data={latestData}
        onClose={closeAiModal}
        onRestart={restartMonitoring}
        open={isAiModalOpen}
        restart={restartState}
        view={modalView}
      />
    </section>
  );
}
