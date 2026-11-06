"use client";

import { useEffect, useState } from "react";

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
        const res = await fetch("/api/v1/measurement/my-device");
        const json = await res.json();
        if (!isCancelled && json.code === 200 && json.data) {
          setDevice(json.data);
        }
      } catch (e) {
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
