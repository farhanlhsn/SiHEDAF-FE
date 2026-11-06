"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    let isCancelled = false;

    async function fetchDevice() {
      try {
        const res = await apiFetch("/api/v1/measurement/my-device");
        const json = await res.json();
        if (!isCancelled && json.code === 200 && json.data) {
          setDevice(json.data);
        }
      } catch (e) {
        if (e instanceof SessionExpiredError) return;
        console.error("Gagal memuat status perangkat:", e);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchDevice();

    return () => {
      isCancelled = true;
    };
  }, []);

  return { device, isLoading };
}
