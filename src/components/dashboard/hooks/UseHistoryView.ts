"use client";

import { useEffect, useState } from "react";
import {
  describeCaughtError,
  type DataError,
} from "@/components/ui/FetchError";
import type { DateRange } from "@daypicker/react";
import {
  apiFetch,
  SessionExpiredError,
} from "@/features/auth/session/client/ApiFetch";

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

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

export function useHistoryView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DataError | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

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

        const res = await apiFetch(
          `/api/v1/measurement/history?${params.toString()}`,
        );
        if (!res.ok) throw new HttpError(res.status);
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
        if (err instanceof SessionExpiredError) return;
        console.error("Gagal mengambil riwayat:", err);
        setError(
          describeCaughtError(
            err,
            err instanceof HttpError ? err.status : undefined,
          ),
        );
      }
      setIsLoading(false);
    }

    fetchHistory();
  }, [currentPage, itemsPerPage, dateRange, reloadCount]);

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
    reload: () => setReloadCount((count) => count + 1),
    selectedItem,
    setSelectedItem,
  };
}
