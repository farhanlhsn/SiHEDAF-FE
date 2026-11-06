"use client";

import { useCallback, useEffect, useState } from "react";

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

/** The wearable bound to the signed-in account, read from the device API. */
export function useMyDevice() {
  const [device, setDevice] = useState<MeasurementDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DataError | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  // A "Periksa lagi" / "Coba lagi" check in flight. The device and its state
  // stay as they are meanwhile, so the card does not disappear.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { reconnectCount } = useOnlineStatus();

  useEffect(() => {
    let isCancelled = false;

    async function fetchDevice() {
      try {
        const res = await apiFetch("/api/v1/measurement/my-device");
        const json = await res.json();
        if (isCancelled) return;
        if (json.code === 200) {
          // 200 with no data means no wristband is bound yet.
          setDevice(json.data ?? null);
          setError(null);
        } else {
          setError(describeCaughtError(null, res.status));
        }
      } catch (e) {
        if (e instanceof SessionExpiredError) return;
        console.error("Gagal memuat status perangkat:", e);
        if (!isCancelled) setError(describeCaughtError(e));
      }
      if (!isCancelled) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }

    void fetchDevice();

    return () => {
      isCancelled = true;
    };
  }, [reconnectCount, reloadCount]);

  const reload = useCallback(() => {
    setIsRefreshing(true);
    setReloadCount((count) => count + 1);
  }, []);

  return { device, isLoading, isRefreshing, error, reload };
}
