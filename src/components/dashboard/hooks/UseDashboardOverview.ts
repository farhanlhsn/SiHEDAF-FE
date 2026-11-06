"use client";

import { useCallback, useEffect, useState } from "react";

import {
  describeCaughtError,
  type DataError,
} from "@/components/ui/FetchError";

import {
  apiFetch,
  SessionExpiredError,
} from "@/features/auth/session/client/ApiFetch";
import {
  useMyDevice,
  type MeasurementDevice,
} from "@/components/dashboard/hooks/UseMyDevice";
import { firstRunSteps } from "@/components/dashboard/FirstRun";
import { resultStatus } from "@/components/dashboard/DashboardFormat";
import { restartAction } from "@/components/dashboard/MonitoringSession";
import { useMonitoringSession } from "@/components/dashboard/hooks/UseMonitoringSession";
import { useProfile } from "@/features/profile/client/ProfileProvider";

export type { MeasurementDevice };

export type MeasurementData = {
  id?: number;
  resultLabel?: string;
  resultClass?: number;
  confidenceLevel?: number;
  completedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  status?: string;
  deviceId?: string;
  ppgResult?: {
    rawPpgData?: number[];
  };
};

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

export function useDashboardOverview() {
  const { user } = useProfile();
  const [monitoringRange, setMonitoringRange] = useState("12");

  const { device: deviceData, isLoading: isDeviceLoading } = useMyDevice();
  const [latestData, setLatestData] = useState<MeasurementData | null>(null);
  const [hasLoadedLatest, setHasLoadedLatest] = useState(false);
  const [latestError, setLatestError] = useState<DataError | null>(null);
  const [latestReloadKey, setLatestReloadKey] = useState(0);
  const [signalsData, setSignalsData] = useState<number[]>([]);

  const session = useMonitoringSession({ onFreshResult: setLatestData });
  const { adoptInitial } = session;
  const isMonitoringActive = session.phase === "recording";

  useEffect(() => {
    let cancelled = false;

    async function fetchLatest() {
      setLatestError(null);
      try {
        const res = await apiFetch("/api/v1/measurement/latest");
        // 404 means "no measurement yet", which is the first-run state.
        if (!res.ok && res.status !== 404) throw new HttpError(res.status);
        const json = await res.json();
        if (cancelled) return;
        // Ignored once the user started or stopped while this was loading.
        if (json.code === 200 && json.data && adoptInitial(json.data)) {
          setLatestData(json.data);
        }
      } catch (e) {
        if (e instanceof SessionExpiredError) return;
        console.error("Gagal memuat data terakhir:", e);
        if (!cancelled) {
          setLatestError(
            describeCaughtError(
              e,
              e instanceof HttpError ? e.status : undefined,
            ),
          );
        }
      } finally {
        if (!cancelled) setHasLoadedLatest(true);
      }
    }
    fetchLatest();

    return () => {
      cancelled = true;
    };
  }, [adoptInitial, latestReloadKey]);

  const reloadLatest = useCallback(() => {
    setHasLoadedLatest(false);
    setLatestReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    async function fetchSignals() {
      try {
        const res = await apiFetch(
          `/api/v1/measurement/signals?minutes=${monitoringRange}`,
        );
        const json = await res.json();
        if (json.code === 200 && json.data) {
          setSignalsData(json.data.rawPpgData || []);
        }
      } catch (e) {
        if (e instanceof SessionExpiredError) return;
        console.error("Gagal memuat data sinyal:", e);
      }
    }

    fetchSignals();

    let intervalId: NodeJS.Timeout;
    if (isMonitoringActive) {
      intervalId = setInterval(fetchSignals, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [monitoringRange, isMonitoringActive]);

  const firstName = user?.fullname ? user.fullname.split(" ")[0] : "Pengguna";
  const result = resultStatus(latestData?.resultLabel);
  const isDeviceOnline = deviceData?.status === "ONLINE";
  const firstRunGuideSteps = firstRunSteps({
    deviceOnline: isDeviceOnline,
    monitoringActive:
      session.phase === "recording" || session.phase === "analysing",
    hasResult: Boolean(latestData),
  });

  // Wait for the device request too, or step 1 flashes "current" while loading.
  const showFirstRun =
    hasLoadedLatest && !isDeviceLoading && !latestData && !latestError;

  return {
    user,
    firstName,
    deviceData,
    latestData,
    hasLoadedLatest,
    latestError,
    reloadLatest,
    showFirstRun,
    signalsData,
    result,
    firstRunGuideSteps,
    isMonitoringActive,
    phase: session.phase,
    elapsed: session.elapsed,
    monitoringRange,
    setMonitoringRange,
    isTogglingAction: session.isTogglingAction,
    handleToggleMonitoring: session.handleToggleMonitoring,
    isAiModalOpen: session.isModalOpen,
    modalView: session.modalView,
    openAiResult: session.openResult,
    closeAiModal: session.closeModal,
    restartMonitoring: session.restart,
    restartState: restartAction(session.phase, {
      deviceOnline: isDeviceOnline,
      deviceLoading: isDeviceLoading,
      busy: session.isTogglingAction,
    }),
  };
}
