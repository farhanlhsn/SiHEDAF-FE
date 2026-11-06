"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useMyDevice } from "@/components/dashboard/hooks/UseMyDevice";
import type { HistoryItem } from "@/components/dashboard/hooks/UseHistoryView";
import {
  collectReport,
  type FetchHistoryPage,
  type ReportData,
} from "@/components/dashboard/ReportData";
import {
  parseReportRange,
  reportHref,
  type ReportRange,
} from "@/components/dashboard/ReportRange";
import { useProfile } from "@/features/profile/client/ProfileProvider";

const FETCH_ERROR = "Gagal mengambil riwayat.";

type InitialParams = { from?: string | string[]; to?: string | string[] };

const fetchHistoryPage: FetchHistoryPage = async (page, pageSize, range) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
    startDate: range.from,
    endDate: range.to,
  });
  const res = await fetch(`/api/v1/measurement/history?${params.toString()}`);
  if (!res.ok) throw new Error(FETCH_ERROR);
  const json = await res.json();
  if (json.code !== 200 || !json.data) throw new Error(FETCH_ERROR);

  const items: HistoryItem[] = json.data.data ?? [];
  return {
    items,
    totalPages: json.data.metadata?.totalPages ?? 1,
    summary: {
      totalData: json.data.summary?.totalData ?? 0,
      totalAfib: json.data.summary?.totalAfib ?? 0,
      totalNormal: json.data.summary?.totalNormal ?? 0,
    },
  };
};

export function useDoctorReport(initialParams: InitialParams) {
  const router = useRouter();
  const { user } = useProfile();
  const { device } = useMyDevice();
  const [now] = useState(() => new Date());
  const [range, setRangeState] = useState<ReportRange>(() =>
    parseReportRange(initialParams, now),
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await collectReport(fetchHistoryPage, range);
        if (!isCancelled) setReport(data);
      } catch (err) {
        if (!isCancelled) {
          setReport(null);
          setError(err instanceof Error && err.message ? err.message : FETCH_ERROR);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, [range, reloadKey]);

  const setRange = useCallback(
    (next: ReportRange) => {
      setRangeState(next);
      router.replace(reportHref(next));
    },
    [router],
  );

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    range,
    setRange,
    report,
    isLoading,
    error,
    reload,
    user,
    device,
    generatedAt: now,
  };
}
