"use client";

import { useCallback, useEffect, useState } from "react";

import {
  describeCaughtError,
  latestOutcome,
  type DataError,
  HttpError,
} from "@/components/ui/FetchError";

import { useOnlineStatus } from "@/components/ui/hooks/UseOnlineStatus";
import {
  apiFetch,
  SessionExpiredError,
} from "@/features/auth/session/client/ApiFetch";
import {
  DEVICE_REFRESH_MS,
  afterSessionRecheckDelay,
  deviceState,
  deviceStatusLabel,
  deviceStatusLive,
  sessionHoldsDevice,
} from "@/components/dashboard/DeviceState";
import {
  useMyDevice,
  type MeasurementDevice,
} from "@/components/dashboard/hooks/UseMyDevice";
import { firstRunSteps } from "@/components/dashboard/FirstRun";
import { classifyResult } from "@/components/dashboard/ResultKind";
import {
  requestSignal,
  restartAction,
  toggleBlock,
} from "@/components/dashboard/MonitoringSession";
import { useMonitoringSession } from "@/components/dashboard/hooks/UseMonitoringSession";
import { useProfile } from "@/features/profile/client/ProfileProvider";

export type { MeasurementDevice };

export type MeasurementData = {
  id?: number;
  resultLabel?: string;
  resultClass?: number;
  confidenceLevel?: number;
  requestedAt?: string;
  completedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  status?: string;
  deviceId?: string;
  ppgResult?: {
    rawPpgData?: number[];
  };
};

export function useDashboardOverview() {
  const { user } = useProfile();
  const { online, reconnectCount } = useOnlineStatus();
  const [monitoringRange, setMonitoringRange] = useState("12");

  // Re-checked every 30 s so online, stale and offline stay current.
  const {
    device: deviceData,
    isLoading: isDeviceLoading,
    isRefreshing: isDeviceRefreshing,
    error: deviceError,
    checkedAt: deviceCheckedAt,
    requestedAt: deviceRequestedAt,
    reload: reloadDevice,
  } = useMyDevice({ refreshMs: DEVICE_REFRESH_MS });
  const [latestData, setLatestData] = useState<MeasurementData | null>(null);
  const [hasLoadedLatest, setHasLoadedLatest] = useState(false);
  const [latestError, setLatestError] = useState<DataError | null>(null);
  const [latestReloadKey, setLatestReloadKey] = useState(0);
  const [signalsData, setSignalsData] = useState<number[]>([]);
  // The last /signals read failed: the chart says so instead of "no signal".
  const [signalsError, setSignalsError] = useState<DataError | null>(null);
  const [signalsReloadKey, setSignalsReloadKey] = useState(0);
  const [isSignalsRetrying, setIsSignalsRetrying] = useState(false);

  const session = useMonitoringSession({ onFreshResult: setLatestData });
  const { adoptInitial, endedAt: sessionEndedAt, resumeChecked } = session;
  const isMonitoringActive = session.phase === "recording";

  // Once a session ends the wristband returns to its idle poll; ask for it
  // again after that so its state is judged on a fresh answer. Coming back
  // to /dashboard within the hold schedules the rest of the wait.
  useEffect(() => {
    if (sessionEndedAt === null) return;

    const timerId = setTimeout(
      reloadDevice,
      afterSessionRecheckDelay(sessionEndedAt, performance.now()),
    );

    return () => clearTimeout(timerId);
  }, [reloadDevice, sessionEndedAt]);

  useEffect(() => {
    let cancelled = false;

    async function fetchLatest() {
      setLatestError(null);
      try {
        const res = await apiFetch("/api/v1/measurement/latest");
        const json = res.ok ? await res.json() : null;
        if (cancelled) return;
        // 404 or 200 with data null is "no measurement yet" (first run); any
        // other answer without data is a failure, never the first-run state.
        const outcome = latestOutcome({ status: res.status, json });
        if (outcome === "error") throw new HttpError(res.status);
        // Ignored once the user started or stopped while this was loading.
        if (outcome === "data" && adoptInitial(json.data)) {
          setLatestData(json.data);
        }
      } catch (e) {
        // Navigating to /login: never reveal the first-run guide meanwhile.
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
      }
      if (!cancelled) setHasLoadedLatest(true);
    }
    fetchLatest();

    return () => {
      cancelled = true;
    };
  }, [adoptInitial, latestReloadKey, reconnectCount]);

  const reloadLatest = useCallback(() => {
    setHasLoadedLatest(false);
    setLatestReloadKey((key) => key + 1);
  }, []);

  // /signals only holds COMPLETED recordings, so it changes when a result
  // arrives, never during a recording: no polling. It is read once the first
  // /latest has answered (it sets the result keys, so a load reads /signals
  // once), then on a range change, on reconnect, when a new result lands and
  // on "Coba lagi".
  const resultId = latestData?.id;
  const resultCompletedAt = latestData?.completedAt;
  useEffect(() => {
    if (!hasLoadedLatest) return;
    // A newer run or unmounting aborts this one, so no late answer lands.
    const run = new AbortController();

    async function fetchSignals() {
      try {
        const res = await apiFetch(
          `/api/v1/measurement/signals?minutes=${monitoringRange}`,
          { signal: requestSignal(run.signal) },
        );
        const json = res.ok ? await res.json() : null;
        if (run.signal.aborted) return;
        if (json?.code !== 200 || !json.data) throw new HttpError(res.status);
        setSignalsData(json.data.rawPpgData || []);
        setSignalsError(null);
      } catch (e) {
        if (run.signal.aborted || e instanceof SessionExpiredError) return;
        console.error("Gagal memuat data sinyal:", e);
        setSignalsError(
          describeCaughtError(e, e instanceof HttpError ? e.status : undefined),
        );
      } finally {
        if (!run.signal.aborted) setIsSignalsRetrying(false);
      }
    }

    void fetchSignals();

    return () => run.abort();
  }, [
    hasLoadedLatest,
    monitoringRange,
    reconnectCount,
    resultId,
    resultCompletedAt,
    signalsReloadKey,
  ]);

  // The error panel stays while retrying, so focus stays on its button.
  const reloadSignals = useCallback(() => {
    setIsSignalsRetrying(true);
    setSignalsReloadKey((key) => key + 1);
  }, []);

  const firstName = user?.fullname ? user.fullname.split(" ")[0] : "Pengguna";
  const result = latestData ? classifyResult(latestData) : "pending";
  // The one source for every device claim: card, status value, toggle, modal.
  // Staleness is judged when the device answered (every 30 s here). While a
  // session holds the wristband (it does not update lastSeen while measuring)
  // it is "recording" instead, and the 30 s answers are not judged. After a
  // reload it stays "loading" until the page knows whether a session is still
  // recording, so a frozen lastSeen never flashes the offline card.
  const deviceStatus = deviceState({
    device: deviceData,
    isLoading: isDeviceLoading,
    error: deviceError,
    now: deviceCheckedAt,
    sessionActive: sessionHoldsDevice({
      phase: session.phase,
      endedAt: sessionEndedAt,
      answerRequestedAt: deviceRequestedAt,
    }),
    resumeChecked,
  });
  const firstRunGuideSteps = firstRunSteps({
    deviceOnline: deviceStatus === "online" || deviceStatus === "recording",
    monitoringActive:
      session.phase === "recording" || session.phase === "analysing",
    hasResult: Boolean(latestData),
  });

  // Wait for the device request (and the reload check) too, or step 1 flashes
  // "current" while loading.
  const showFirstRun =
    hasLoadedLatest &&
    !isDeviceLoading &&
    !latestData &&
    !latestError &&
    resumeChecked;

  return {
    user,
    firstName,
    deviceData,
    deviceStatus,
    deviceStatusLabel: deviceStatusLabel(deviceStatus, session.phase),
    deviceStatusLive: deviceStatusLive(deviceStatus, session.phase),
    deviceError,
    isDeviceRefreshing,
    reloadDevice,
    latestData,
    hasLoadedLatest,
    latestError,
    reloadLatest,
    showFirstRun,
    signalsData,
    signalsError,
    reloadSignals,
    isSignalsRetrying,
    result,
    firstRunGuideSteps,
    isMonitoringActive,
    phase: session.phase,
    clock: session.clock,
    autoFinished: session.autoFinished,
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
      device: deviceStatus,
      busy: session.isTogglingAction,
      networkOnline: online,
    }),
    toggleBlocked: toggleBlock(session.phase, {
      device: deviceStatus,
      networkOnline: online,
    }),
  };
}
