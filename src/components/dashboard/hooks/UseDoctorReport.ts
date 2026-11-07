"use client";

import type { DateRange } from "@daypicker/react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiFetch,
  SessionExpiredError,
} from "@/features/auth/session/client/ApiFetch";

import {
  describeCaughtError,
  type DataError,
} from "@/components/ui/FetchError";
import { useOnlineStatus } from "@/components/ui/hooks/UseOnlineStatus";
import { useMyDevice } from "@/components/dashboard/hooks/UseMyDevice";
import type { HistoryItem } from "@/components/dashboard/hooks/UseHistoryView";
import {
  collectReport,
  type FetchHistoryPage,
  type ReportData,
} from "@/components/dashboard/ReportData";
import {
  defaultReportRange,
  parseReportRange,
  rangeFromDateRange,
  reportHref,
  type ReportRange,
} from "@/components/dashboard/ReportRange";
import { useProfile } from "@/features/profile/client/ProfileProvider";

class HttpError extends Error {
  constructor(readonly status?: number) {
    super("Gagal mengambil riwayat.");
  }
}

type InitialParams = { from?: string | string[]; to?: string | string[] };

const fetchHistoryPage: FetchHistoryPage = async (page, pageSize, range) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
    startDate: range.from,
    endDate: range.to,
  });
  const res = await apiFetch(`/api/v1/measurement/history?${params.toString()}`);
  if (!res.ok) throw new HttpError(res.status);
  const json = await res.json();
  if (json.code !== 200 || !json.data) throw new HttpError(res.status);

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
  const { reconnectCount } = useOnlineStatus();
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
  const [error, setError] = useState<DataError | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await collectReport(fetchHistoryPage, range);
        if (!isCancelled) setReport(data);
      } catch (error) {
        // Navigating to /login: keep the loader instead of flashing no data.
        if (error instanceof SessionExpiredError) return;
        if (!isCancelled) {
          setReport(null);
          setError(
            describeCaughtError(
              error,
              error instanceof HttpError ? error.status : undefined,
            ),
          );
        }
      }
      if (!isCancelled) setIsLoading(false);
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, [range, reloadKey, reconnectCount]);

  const setRange = useCallback(
    (next: ReportRange) => {
      setRangeState(next);
      router.replace(reportHref(next));
    },
    [router],
  );

  /** Picker change: undefined = reset to default, partial range = ignore. */
  const changeRange = useCallback(
    (next: DateRange | undefined) => {
      if (next === undefined) {
        setRange(defaultReportRange(new Date()));
        return;
      }
      const parsed = rangeFromDateRange(next);
      if (parsed) setRange(parsed);
    },
    [setRange],
  );

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    range,
    setRange,
    changeRange,
    report,
    isLoading,
    error,
    reload,
    user,
    device,
    generatedAt: now,
  };
}
