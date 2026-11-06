"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Pause,
  Play,
  TriangleAlert,
} from "lucide-react";

import { AiResultModal } from "@/components/dashboard/AiResultModal";
import {
  formatConfidence,
  formatWib,
} from "@/components/dashboard/DashboardFormat";
import { FirstRunGuide } from "@/components/dashboard/FirstRunGuide";
import { SignalChart } from "@/components/dashboard/SignalChart";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StatusMark } from "@/components/dashboard/StatusMark";
import { useDashboardOverview } from "@/components/dashboard/hooks/UseDashboardOverview";

const panelClassName = "rounded-[24px] border border-primary-900/10 bg-white";
const labelClassName = "text-[14px] font-medium text-primary-900/75";
const valueClassName = "mt-1 text-[16px] font-semibold text-primary-900";

export function DashboardOverview() {
  const {
    firstName,
    deviceData,
    latestData,
    hasLoadedLatest,
    firstRunGuideSteps,
    signalsData,
    isNormal,
    isMonitoringActive,
    monitoringRange,
    setMonitoringRange,
    isTogglingAction,
    handleToggleMonitoring,
    isAiModalOpen,
    setIsAiModalOpen,
  } = useDashboardOverview();

  const confidence = formatConfidence(latestData?.confidenceLevel);
  const analysedAt = formatWib(
    latestData?.completedAt ?? latestData?.updatedAt,
  );
  const measuredAt = formatWib(latestData?.createdAt);
  const isDeviceOnline = deviceData?.status === "ONLINE";
  const status = isNormal === false ? "af" : "normal";

  return (
    <section className="min-h-[calc(100dvh-72px)] min-w-0 px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1180px]">
        <p className="text-[16px] font-semibold text-primary-500">
          Selamat Datang, {firstName}
        </p>

        <h1 className="mt-3 max-w-[900px] text-[clamp(2.3rem,4.4vw,4rem)] leading-[0.98] tracking-[-0.05em] text-primary-900">
          {!hasLoadedLatest ? (
            <span className="font-bold">Memuat hasil terakhir</span>
          ) : isNormal === null ? (
            <span className="font-bold">Belum ada hasil analisis.</span>
          ) : (
            <>
              <span className="font-extralight">Irama terakhirmu</span>{" "}
              <span
                className={`font-bold ${isNormal ? "text-primary-300" : "text-af-500"}`}
              >
                {isNormal ? "normal." : "tidak teratur."}
              </span>
            </>
          )}
        </h1>

        {hasLoadedLatest && !latestData ? (
          <FirstRunGuide steps={firstRunGuideSteps} />
        ) : null}

        {latestData ? (
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-primary-900/80">
              <StatusMark size="small" status={status} />
              <span className="font-semibold text-primary-900">
                Hasil Analisis Terakhir
              </span>
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
              className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-primary-900/20 bg-white px-5 text-[15px] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
              onClick={() => setIsAiModalOpen(true)}
              type="button"
            >
              Detail Diagnosa AI
              <ArrowRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={2.25}
              />
            </button>
          </div>
        ) : null}

        {isNormal === false ? (
          <div
            className="mt-6 flex max-w-[760px] gap-3 rounded-[18px] bg-af-50 p-5 text-[16px] leading-[1.55] text-primary-900"
            role="note"
          >
            <TriangleAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-af-700"
              strokeWidth={2.25}
            />
            <p>
              AI menemukan pola yang mirip Atrial Fibrillation. Hasil ini bukan
              diagnosis; pertimbangkan konsultasi ke dokter, terutama jika kamu
              merasakan keluhan seperti jantung berdebar atau pusing.
            </p>
          </div>
        ) : null}

        <article
          className={`mt-10 scroll-mt-24 ${panelClassName} px-5 pt-6 pb-5 sm:px-7`}
          id="monitor"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-primary-900">
                Sinyal PPG Terbaru
              </h2>
              <div
                aria-live="polite"
                className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]"
              >
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
                  {isMonitoringActive
                    ? "Monitoring aktif"
                    : "Monitoring dijeda"}
                </span>
                <span className="text-primary-900/75">
                  {isMonitoringActive
                    ? `Pembaruan otomatis selama ${monitoringRange} menit`
                    : "Pembaruan dihentikan sementara"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="relative block">
                <span className="sr-only">Rentang waktu monitoring</span>
                <select
                  className="h-11 appearance-none rounded-full border-[1.5px] border-primary-900/20 bg-white pr-10 pl-5 text-[15px] font-medium text-primary-900 outline-none transition-colors hover:border-primary-900/40 focus:border-primary-300 focus-visible:ring-4 focus-visible:ring-primary-100"
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
                className={`flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 ${
                  isMonitoringActive
                    ? "border-[1.5px] border-primary-900/20 bg-white text-primary-900 hover:bg-paper-deep"
                    : "btn-primary bg-primary-900 text-white"
                }`}
                disabled={
                  isTogglingAction ||
                  !deviceData ||
                  deviceData?.status !== "ONLINE"
                }
                onClick={handleToggleMonitoring}
                type="button"
              >
                {isTogglingAction ? (
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
                {isMonitoringActive
                  ? "Hentikan Monitoring"
                  : "Mulai Monitoring"}
              </button>
            </div>
          </div>
          {deviceData && !isDeviceOnline ? (
            <p className="mt-3 text-[14px] text-primary-900/75">
              Monitoring bisa dimulai setelah perangkat terhubung kembali.
            </p>
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
            <h2 className="text-[20px] font-bold tracking-[-0.03em] text-primary-900">
              Monitoring Terakhir
            </h2>
            {latestData ? (
              <div className="mt-5 flex-1">
                <p className="flex items-center gap-3">
                  <StatusMark size="small" status={status} />
                  <span
                    className={`text-[15px] font-semibold ${
                      isNormal ? "text-primary-500" : "text-af-700"
                    }`}
                  >
                    {isNormal ? "Normal Rhythm" : "Terdeteksi Potensi AF"}
                  </span>
                </p>
                <h3 className="mt-3 text-[19px] font-semibold text-primary-900">
                  {isNormal
                    ? "Irama Jantung Normal & Stabil"
                    : "Indikasi Anomali Irama Jantung"}
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
                        tone={isNormal ? "blue" : "pink"}
                      />
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="flex-1 py-8 text-center text-[15px] text-primary-900/75">
                Belum ada riwayat terbaru.
              </p>
            )}
            <Link
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-primary-900/20 text-[15px] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
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
            <h2 className="text-[20px] font-bold tracking-[-0.03em] text-primary-900">
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
                <p className="flex items-center gap-2 text-[15px] font-semibold text-primary-900">
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
                  {isDeviceOnline
                    ? "Terhubung"
                    : deviceData
                      ? "Terputus"
                      : "Memuat..."}
                </p>
                <h3 className="mt-2 text-[19px] font-semibold text-primary-900">
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
        data={latestData}
        onClose={() => setIsAiModalOpen(false)}
        open={isAiModalOpen}
      />
    </section>
  );
}
