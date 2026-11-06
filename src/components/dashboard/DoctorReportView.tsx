"use client";

import type { DateRange } from "@daypicker/react";
import { Printer } from "lucide-react";

import {
  formatConfidence,
  formatWib,
  shareOf,
} from "@/components/dashboard/DashboardFormat";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { PpgTrace } from "@/components/dashboard/PpgTrace";
import { StatusMark } from "@/components/dashboard/StatusMark";
import { useDoctorReport } from "@/components/dashboard/hooks/UseDoctorReport";
import {
  rangeFromDateRange,
  toDateRange,
} from "@/components/dashboard/ReportRange";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { PulseLoader } from "@/components/ui/PulseLoader";

type DoctorReportViewProps = {
  initialParams: { from?: string | string[]; to?: string | string[] };
};

const dayLabel = (day: string) =>
  formatWib(`${day}T12:00:00+07:00`, "date") ?? "—";

export function DoctorReportView({ initialParams }: DoctorReportViewProps) {
  const {
    range,
    setRange,
    report,
    isLoading,
    error,
    reload,
    user,
    device,
    generatedAt,
  } = useDoctorReport(initialParams);

  function handleRangeChange(next: DateRange | undefined) {
    const parsed = rangeFromDateRange(next);
    if (parsed) setRange(parsed);
  }

  const summary = report?.summary;
  const total = summary?.totalData ?? 0;
  const afShare = shareOf(summary?.totalAfib ?? 0, total);
  const normalShare = total > 0 ? 100 - afShare : 0;

  return (
    <section className="px-4 py-8 sm:px-7 lg:px-10 lg:py-10 print:p-0">
      <div className="mx-auto max-w-[900px]">
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <DateRangePicker
            onChange={handleRangeChange}
            value={toDateRange(range)}
          />
          <button
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary-900 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-primary-800 focus-visible:outline-2 focus-visible:outline-primary-300"
            onClick={() => window.print()}
            type="button"
          >
            <Printer aria-hidden="true" size={18} strokeWidth={1.8} />
            Cetak / Simpan PDF
          </button>
        </div>

        <article className="mt-6 rounded-[24px] border border-primary-900/10 bg-white p-6 sm:p-10 print:mt-0 print:rounded-none print:border-0 print:p-0">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-primary-900/10 pb-6">
            <div>
              <BrandLogo />
              <h1 className="mt-5 text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.1] font-bold tracking-[-0.04em] text-primary-900">
                Laporan Pemantauan Irama Jantung
              </h1>
            </div>
            <dl className="text-[14px] text-primary-900/80">
              <div className="flex gap-2">
                <dt className="font-semibold">Dibuat</dt>
                <dd>{formatWib(generatedAt.toISOString()) ?? "—"}</dd>
              </div>
              <div className="mt-1 flex gap-2">
                <dt className="font-semibold">Periode</dt>
                <dd>
                  {dayLabel(range.from)} – {dayLabel(range.to)}
                </dd>
              </div>
            </dl>
          </header>

          <section aria-label="Identitas" className="print-avoid-break mt-6">
            <h2 className="text-[17px] font-bold text-primary-900">Identitas</h2>
            <dl className="mt-3 grid gap-3 text-[15px] sm:grid-cols-3">
              <div>
                <dt className="text-[13px] font-semibold text-primary-900/70">Nama</dt>
                <dd className="text-primary-900">{user?.fullname || "—"}</dd>
              </div>
              <div>
                <dt className="text-[13px] font-semibold text-primary-900/70">Email</dt>
                <dd className="break-all text-primary-900">{user?.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-[13px] font-semibold text-primary-900/70">Device ID</dt>
                <dd className="text-primary-900">{device?.deviceNumber || "—"}</dd>
              </div>
            </dl>
          </section>

          {isLoading ? (
            <PulseLoader className="py-16" label="Menyusun laporan..." />
          ) : error ? (
            <div className="py-12 text-center" role="alert">
              <p className="text-[15px] font-medium text-af-700">{error}</p>
              <button
                className="mt-4 h-11 rounded-full border-[1.5px] border-primary-900/20 px-6 text-[15px] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300 print:hidden"
                onClick={reload}
                type="button"
              >
                Coba lagi
              </button>
            </div>
          ) : report ? (
            <>
              <section aria-label="Ringkasan" className="print-avoid-break mt-8">
                <h2 className="text-[17px] font-bold text-primary-900">Ringkasan</h2>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Total rekaman" value={String(report.summary.totalData)} />
                  <Stat
                    label="AF terdeteksi"
                    tone="text-af-700"
                    value={String(report.summary.totalAfib)}
                  />
                  <Stat
                    label="Ritme normal"
                    tone="text-primary-300"
                    value={String(report.summary.totalNormal)}
                  />
                  <Stat label="Persentase AF" value={`${afShare}%`} />
                </div>
                <div
                  aria-label={`${normalShare}% ritme normal, ${afShare}% terdeteksi AF`}
                  className="mt-5 flex h-4 overflow-hidden rounded-full bg-primary-900/10"
                  role="img"
                >
                  {total > 0 ? (
                    <>
                      <span className="h-full bg-primary-300" style={{ width: `${normalShare}%` }} />
                      <span className="ml-[2px] h-full bg-af-500" style={{ width: `${afShare}%` }} />
                    </>
                  ) : null}
                </div>
                <p className="mt-2 flex flex-wrap gap-x-6 text-[14px] font-medium text-primary-900/80">
                  <span>Ritme normal {normalShare}%</span>
                  <span>Terdeteksi AF {afShare}%</span>
                </p>
              </section>

              <section aria-label="Kejadian AF" className="mt-8">
                <h2 className="text-[17px] font-bold text-primary-900">
                  Kejadian AF terdeteksi
                </h2>
                {report.summary.totalData === 0 && report.scanned === 0 ? (
                  <p className="mt-3 text-[15px] text-primary-900/80">
                    Belum ada rekaman pada periode ini.
                  </p>
                ) : report.afEvents.length === 0 ? (
                  <p className="mt-3 text-[15px] text-primary-900/80">
                    Tidak ada AF terdeteksi pada periode ini.
                  </p>
                ) : (
                  <table className="mt-3 w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-primary-900/10 text-[14px] font-semibold text-primary-900/75">
                        <th className="w-12 pb-2 font-semibold">No</th>
                        <th className="pb-2 font-semibold">Waktu</th>
                        <th className="pb-2 font-semibold">Keyakinan AI</th>
                        <th className="w-[34%] pb-2 font-semibold">Grafik</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.afEvents.map((item, index) => (
                        <tr
                          className="print-avoid-break border-b border-primary-900/[0.07]"
                          key={item.id}
                        >
                          <td className="py-3 text-[15px] tabular-nums text-primary-900">
                            {index + 1}
                          </td>
                          <td className="py-3 text-[15px] text-primary-900">
                            <span className="flex items-center gap-2">
                              <StatusMark size="small" status="af" />
                              {formatWib(item.requestedAt) ?? "—"}
                            </span>
                          </td>
                          <td className="py-3 text-[15px] text-primary-900">
                            {formatConfidence(item.confidenceLevel) ?? "—"}
                          </td>
                          <td className="py-3">
                            <PpgTrace
                              className="h-12 w-full"
                              data={item.ppgResult?.rawPpgData}
                              label={`Grafik PPG kejadian AF nomor ${index + 1}`}
                              tone="pink"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {report.truncated ? (
                  <p className="mt-3 text-[14px] text-primary-900/80">
                    Menampilkan kejadian AF dari {report.scanned} rekaman pertama pada periode ini.
                  </p>
                ) : null}
              </section>
            </>
          ) : null}

          <p className="print-avoid-break mt-8 rounded-[16px] bg-paper p-4 text-[14px] leading-[1.55] text-primary-900/80">
            Hasil berasal dari klasifikasi AI atas sinyal PPG wearable dan bukan diagnosis. Mohon dievaluasi oleh tenaga kesehatan. Grafik ditampilkan tanpa skala waktu.
          </p>
        </article>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "text-primary-900",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className={`text-[2rem] leading-none font-bold tracking-[-0.04em] tabular-nums ${tone}`}>
        {value}
      </p>
      <p className="mt-1 text-[14px] font-medium text-primary-900/80">{label}</p>
    </div>
  );
}
