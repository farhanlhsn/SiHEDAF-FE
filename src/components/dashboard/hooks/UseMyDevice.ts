"use client";

import { useCallback, useEffect, useState } from "react";

import { answeredAt } from "@/components/dashboard/DeviceState";
import { requestSignal } from "@/components/dashboard/MonitoringSession";
import { useOnlineStatus } from "@/components/ui/hooks/UseOnlineStatus";
import {
  describeCaughtError,
  type DataError,
} from "@/components/ui/FetchError";
import {
  apiFetch,
  SessionExpiredError,
} from "@/features/auth/session/client/ApiFetch";
export type MeasurementDevice = {
  status?: string;
  deviceNumber?: string;
  lastSeen?: string;
};

type UseMyDeviceOptions = {
  /** Ask again this often (ms) in the background, without a loader; off when omitted. */
  refreshMs?: number;
};

/** The wearable bound to the signed-in account, read from the device API. */
export function useMyDevice({ refreshMs }: UseMyDeviceOptions = {}) {
  const [device, setDevice] = useState<MeasurementDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DataError | null>(null);
  // When the latest answer was given (server clock): staleness is judged then.
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  // A "Periksa lagi" / "Coba lagi" check in flight. The device and its state
  // stay as they are meanwhile, so the card does not disappear.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { reconnectCount } = useOnlineStatus();

  useEffect(() => {
    // One per effect run: a reload, a reconnect or unmounting aborts every
    // request of the run before, so no late answer lands afterwards.
    const run = new AbortController();

    async function fetchDevice() {
      try {
        const res = await apiFetch("/api/v1/measurement/my-device", {
          signal: requestSignal(run.signal),
        });
        const json = await res.json();
        if (run.signal.aborted) return;
        if (json.code === 200) {
          // 200 with no data means no wristband is bound yet.
          setDevice(json.data ?? null);
          setCheckedAt(answeredAt(res.headers.get("date"), Date.now()));
          setError(null);
        } else {
          setError(describeCaughtError(null, res.status));
        }
      } catch (e) {
        if (run.signal.aborted || e instanceof SessionExpiredError) return;
        console.error("Gagal memuat status perangkat:", e);
        setError(describeCaughtError(e));
      }
      if (!run.signal.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }

    void fetchDevice();

    // Background re-checks keep online/stale/offline current. They pause
    // while the browser is offline; the reconnect reload covers that.
    const intervalId = refreshMs
      ? setInterval(() => {
          if (navigator.onLine !== false) void fetchDevice();
        }, refreshMs)
      : undefined;

    return () => {
      run.abort();
      clearInterval(intervalId);
    };
  }, [reconnectCount, refreshMs, reloadCount]);

  const reload = useCallback(() => {
    setIsRefreshing(true);
    setReloadCount((count) => count + 1);
  }, []);

  return { device, isLoading, isRefreshing, error, checkedAt, reload };
}
