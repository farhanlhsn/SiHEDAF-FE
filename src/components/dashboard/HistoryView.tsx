"use client";

import type { DateRange } from "@daypicker/react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import {
  formatConfidence,
  formatWib,
  splitShares,
} from "@/components/dashboard/DashboardFormat";
import {
  classifyResult,
  isAlertKind,
  RESULT_COPY,
} from "@/components/dashboard/ResultKind";
import { HistoryDetailModal } from "@/components/dashboard/HistoryDetailModal";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StatusMark } from "@/components/dashboard/StatusMark";
import { DataErrorState } from "@/components/ui/DataErrorState";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useHistoryView } from "@/components/dashboard/hooks/UseHistoryView";
import {
  rangeFromDateRange,
  reportHref,
} from "@/components/dashboard/ReportRange";

const pagerButtonClassName =
  "flex h-11 items-center justify-center gap-1 rounded-full border-[1.5px] border-primary-900/20 bg-white px-3 text-[0.9375rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300 disabled:cursor-not-allowed disabled:border-primary-900/10 disabled:bg-transparent disabled:text-primary-900/70 sm:px-4";

export function HistoryView() {
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    dateRange,
    setDateRange,
    historyData,
    totalPages,
    isLoading,
    error,
    summaries,
    reload,
    selectedItem,
    setSelectedItem,
  } = useHistoryView();

  function handleRangeChange(range: DateRange | undefined) {
    setDateRange(range);
    setCurrentPage(1);
  }

  function handleItemsPerPageChange(value: number) {
    setItemsPerPage(value);
    setCurrentPage(1);
  }

  const [total, afCount, normalCount] = summaries.map(
    (summary) => summary.value,
  );
  const [normalShare, afShare] = splitShares([normalCount, afCount], total);

  return (
    <section className="px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-[clamp(2.2rem,3.8vw,3.4rem)] leading-[1] font-bold tracking-[-0.05em] text-primary-900">
              Riwayat Analisis
            </h1>
            <p className="mt-3 max-w-[560px] text-[1.0625rem] leading-[1.55] text-primary-900/80">
              Semua hasil analisis AI dari perangkat SiHEDAF-mu, urut dari yang
              terbaru.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker onChange={handleRangeChange} value={dateRange} />
            <Link
              className="inline-flex h-11 items-center rounded-full bg-primary-900 px-5 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-primary-800 focus-visible:outline-2 focus-visible:outline-primary-300"
              href={reportHref(rangeFromDateRange(dateRange))}
            >
              Buat laporan dokter
            </Link>
          </div>
        </div>

        <h2 className="mt-10 text-[1.0625rem] font-bold text-primary-900">
          Ringkasan sepanjang waktu
        </h2>
        {dateRange?.from ? (
          <p className="mt-1 text-[0.875rem] text-primary-900/80">
            Ringkasan mencakup seluruh riwayat, bukan hanya rentang tanggal yang dipilih.
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-3 border-y border-primary-900/10 py-6 sm:py-8">
          {summaries.map((summary, index) => (
            <div
              className="border-l border-primary-900/10 px-3 first:border-l-0 first:pl-0 sm:px-8"
              key={summary.label}
            >
              <p
                className={`text-[clamp(2rem,4vw,3.5rem)] leading-none font-bold tracking-[-0.05em] tabular-nums ${
                  index === 1
                    ? "text-af-500"
                    : index === 2
                      ? "text-primary-300"
                      : "text-primary-900"
                }`}
              >
                {summary.value}
              </p>
              <p className="mt-2 text-[0.875rem] leading-[1.35] font-medium text-primary-900/80 sm:text-[0.9375rem]">
                {summary.label}
              </p>
            </div>
          ))}
        </div>

        <figure className="mt-6">
          <div
            aria-label={`${normalShare}% ritme normal, ${afShare}% terdeteksi AF`}
            className="flex h-4 overflow-hidden rounded-full bg-primary-900/10"
            role="img"
          >
            {total > 0 ? (
              <>
                <span
                  className="h-full bg-primary-300"
                  style={{ width: `${normalShare}%` }}
                />
                <span
                  className="ml-[2px] h-full bg-af-500"
                  style={{ width: `${afShare}%` }}
                />
              </>
            ) : null}
          </div>
          <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[0.875rem] font-medium text-primary-900/80">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 rounded-full bg-primary-300"
              />
              Ritme normal {normalShare}%
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 rounded-full bg-af-500"
              />
              Terdeteksi AF {afShare}%
            </span>
          </figcaption>
        </figure>

        <article className="mt-10 overflow-hidden rounded-[24px] border border-primary-900/10 bg-white">
          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <h2 className="text-[1.25rem] font-bold tracking-[-0.03em] text-primary-900">
              Daftar Riwayat
            </h2>
          </div>

          <ScrollArea className="w-full" viewportClassName="pb-2">
            <table className="w-full min-w-[680px] table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-primary-900/10 text-[0.875rem] font-semibold text-primary-900/75">
                  <th className="w-[32%] px-6 pb-3 font-semibold">
                    Waktu Analisis
                  </th>
                  <th className="w-[30%] px-4 pb-3 font-semibold">
                    Hasil Klasifikasi
                  </th>
                  <th className="w-[14%] px-4 pb-3 font-semibold">
                    Keyakinan AI
                  </th>
                  <th className="w-[24%] px-6 pb-3 font-semibold">
                    Detail Hasil
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      className="px-6 py-12 text-center text-[0.9375rem] text-primary-900/75"
                      colSpan={4}
                    >
                      Memuat riwayat...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="px-6 py-4" colSpan={4}>
                      <DataErrorState {...error} onRetry={reload} />
                    </td>
                  </tr>
                ) : (
                  historyData.map((row) => {
                    const result = classifyResult(row);
                    const copy = RESULT_COPY[result];
                    const isAlert = isAlertKind(result);
                    const isNormal = result === "normal";
                    const isNeutral = !isAlert && !isNormal;
                    const dateLabel = formatWib(row.requestedAt, "date");
                    const timeLabel = formatWib(row.requestedAt, "time");

                    return (
                      <tr
                        className="stagger-item cursor-pointer hover:bg-paper border-b border-primary-900/[0.07] last:border-b-0"
                        key={row.id}
                        onClick={() => setSelectedItem(row)}
                      >
                        <td className="px-6 py-4">
                          <button
                            aria-label={
                              dateLabel
                                ? `Lihat detail analisis ${dateLabel} ${timeLabel ?? ""}`.trim()
                                : "Lihat detail analisis tanpa waktu"
                            }
                            className="block rounded-md text-left focus-visible:outline-2 focus-visible:outline-primary-300"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedItem(row);
                            }}
                            type="button"
                          >
                            <span className="block text-[0.9375rem] font-semibold text-primary-900">
                              {dateLabel ?? "—"}
                            </span>
                            <span className="mt-0.5 block text-[0.875rem] text-primary-900/75">
                              {timeLabel ?? ""}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {isNeutral ? null : (
                              <StatusMark
                                size="small"
                                status={isNormal ? "normal" : "af"}
                              />
                            )}
                            <div>
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
                              {isNeutral ? null : (
                                <p className="mt-0.5 text-[0.875rem] text-primary-900/75">
                                  {isNormal
                                    ? "Tidak ditemukan pola AF"
                                    : result === "flutter"
                                      ? "Pola AFL teridentifikasi"
                                      : "Pola AF teridentifikasi"}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[0.9375rem] font-semibold tabular-nums text-primary-900">
                          {formatConfidence(row.confidenceLevel) ?? "—"}
                        </td>
                        <td className="px-6 py-3">
                          <Sparkline
                            data={row.ppgResult?.rawPpgData}
                            tone={isAlert ? "pink" : "blue"}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {!isLoading && !error && historyData.length === 0 ? (
              <p className="px-6 py-12 text-center text-[0.9375rem] text-primary-900/75">
                Tidak ada riwayat pada rentang tanggal ini.
              </p>
            ) : null}
          </ScrollArea>

          <div className="flex flex-col gap-5 border-t border-primary-900/10 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-5">
            <nav
              aria-label="Pagination riwayat"
              className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-2"
            >
              <button
                aria-label="Halaman sebelumnya"
                className={pagerButtonClassName}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                type="button"
              >
                <ChevronLeft
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={2.5}
                />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1 sm:mx-1 sm:gap-1.5">
                {(() => {
                  type PageItem = {
                    val: number | "...";
                    hiddenOnMobile?: boolean;
                  };
                  const pages: PageItem[] = [];

                  if (totalPages <= 3) {
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push({
                        val: i,
                        hiddenOnMobile:
                          (i === 3 || i === 4) &&
                          i !== currentPage &&
                          i !== totalPages,
                      });
                    }
                  } else {
                    if (currentPage <= 3) {
                      pages.push(
                        { val: 1 },
                        { val: 2 },
                        { val: 3, hiddenOnMobile: currentPage !== 3 },
                        { val: "..." },
                        { val: totalPages },
                      );
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(
                        { val: 1 },
                        { val: "..." },
                        {
                          val: totalPages - 2,
                          hiddenOnMobile: currentPage !== totalPages - 2,
                        },
                        { val: totalPages - 1 },
                        { val: totalPages },
                      );
                    } else {
                      pages.push(
                        { val: 1 },
                        { val: "..." },
                        { val: currentPage },
                        { val: "..." },
                        { val: totalPages },
                      );
                    }
                  }

                  return pages.map((page, index) => {
                    if (page.val === "...") {
                      return (
                        <span
                          className={`px-1 text-[0.9375rem] text-primary-900/75 ${page.hiddenOnMobile ? "hidden sm:block" : "block"}`}
                          key={`ellipsis-${index}`}
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        aria-current={
                          page.val === currentPage ? "page" : undefined
                        }
                        className={`h-11 min-w-11 place-items-center rounded-full px-2 text-[0.9375rem] font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-primary-300 ${
                          page.hiddenOnMobile ? "hidden sm:grid" : "grid"
                        } ${
                          page.val === currentPage
                            ? "bg-primary-900 text-white"
                            : "text-primary-900 hover:bg-paper-deep"
                        }`}
                        key={page.val}
                        onClick={() => setCurrentPage(page.val as number)}
                        type="button"
                      >
                        {page.val}
                      </button>
                    );
                  });
                })()}
              </div>

              <button
                aria-label="Halaman berikutnya"
                className={pagerButtonClassName}
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                type="button"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={2.5}
                />
              </button>
            </nav>

            <label className="flex w-full items-center justify-between gap-3 text-[0.9375rem] text-primary-900/80 sm:w-auto sm:justify-start">
              <span>Tampilkan</span>
              <span className="relative">
                <select
                  aria-label="Jumlah riwayat per halaman"
                  className="h-11 appearance-none rounded-full border-[1.5px] border-primary-900/20 bg-white pr-9 pl-4 text-[0.9375rem] font-semibold text-primary-900 outline-none focus:border-primary-300 focus-visible:ring-4 focus-visible:ring-primary-100"
                  onChange={(event) =>
                    handleItemsPerPageChange(Number(event.target.value))
                  }
                  value={itemsPerPage}
                >
                  {[5, 10, 20].map((amount) => (
                    <option key={amount} value={amount}>
                      {amount}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-primary-900"
                  strokeWidth={2.25}
                />
              </span>
              <span>per halaman</span>
            </label>
          </div>
        </article>
      </div>
      <HistoryDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  );
}
