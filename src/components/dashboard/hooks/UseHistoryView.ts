"use client";

import { useEffect, useState } from "react";
import type { DateRange } from "@daypicker/react";

export type HistoryItem = {
  id?: number;
  resultLabel?: string;
  resultClass?: number;
  confidenceLevel?: number;
  requestedAt?: string;
  deviceId?: string;
  ppgData?: number[];
  ppgResult?: { rawPpgData?: number[] };
};

export function useHistoryView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const [summaries, setSummaries] = useState([
    { label: "Total jumlah monitoring", value: 0 },
    { label: "Terdeteksi AF", value: 0 },
    { label: "Ritme Normal", value: 0 },
  ]);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });

        if (dateRange?.from) {
          const fromDate = new Date(
            dateRange.from.getTime() -
              dateRange.from.getTimezoneOffset() * 60000,
          );
          params.append("startDate", fromDate.toISOString().split("T")[0]);
        }
        if (dateRange?.to) {
          const toDate = new Date(
            dateRange.to.getTime() - dateRange.to.getTimezoneOffset() * 60000,
          );
          params.append("endDate", toDate.toISOString().split("T")[0]);
        }

        const res = await fetch(
          `/api/v1/measurement/history?${params.toString()}`,
        );
        if (!res.ok) throw new Error("Gagal mengambil data");
        const json = await res.json();

        if (json.code === 200 && json.data) {
          setHistoryData(json.data.data || []);
          setTotalPages(json.data.metadata?.totalPages || 1);
          setSummaries([
            {
              label: "Total jumlah monitoring",
              value: json.data.summary?.totalData || 0,
            },
            {
              label: "Terdeteksi AF",
              value: json.data.summary?.totalAfib || 0,
            },
            {
              label: "Ritme Normal",
              value: json.data.summary?.totalNormal || 0,
            },
          ]);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [currentPage, itemsPerPage, dateRange]);

  return {
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
    selectedItem,
    setSelectedItem,
  };
}
