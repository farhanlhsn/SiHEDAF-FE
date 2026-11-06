"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  apiFetch,
  SessionExpiredError,
} from "@/features/auth/session/client/ApiFetch";

import {
  EMPTY_BASELINE,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  TOGGLE_TIMEOUT_MS,
  afterToggleTimeout,
  formatElapsed,
  isFreshResult,
  isTimeoutError,
  pollForFreshResult,
  rememberInitial,
  rememberResult,
  requestSignal,
  sessionStartFrom,
  waitFor,
  type MonitoringPhase,
  type ResultBaseline,
  type ResultModalView,
} from "@/components/dashboard/MonitoringSession";
import type { MeasurementData } from "@/components/dashboard/hooks/UseDashboardOverview";

type UseMonitoringSessionOptions = {
  /** Called with a freshly analysed result so the overview can show it. */
  onFreshResult: (data: MeasurementData) => void;
};

type Envelope<T = unknown> = { code?: number; message?: string; data?: T };

type ToggleAction = "start" | "stop";

const TOGGLE_FAILED = "Gagal mengubah status monitoring.";
const TOGGLE_ERROR =
  "Terjadi kesalahan saat mengubah status monitoring. Coba lagi.";

/** Start or stop a session; throws on network errors and timeouts. */
async function postMeasurement(
  action: ToggleAction,
  lifetime: AbortSignal,
): Promise<Envelope> {
  const res = await apiFetch(`/api/v1/measurement/${action}`, {
    method: "POST",
    signal: requestSignal(lifetime, TOGGLE_TIMEOUT_MS),
  });

  return res.json();
}

/** The latest record (null when there is none); throws when the read fails. */
async function fetchLatest(signal: AbortSignal) {
  const res = await apiFetch("/api/v1/measurement/latest", {
    signal: requestSignal(signal),
  });
  const json: Envelope<MeasurementData> = await res.json();

  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || "Gagal membaca data terakhir.");
  }

  return json.data ?? null;
}

/**
 * Owns the monitoring moment: recording (wall-clock elapsed), analysing
 * (polling /latest for a fresh result) and the AI result modal.
 */
export function useMonitoringSession({
  onFreshResult,
}: UseMonitoringSessionOptions) {
  const [phase, setPhase] = useState<MonitoringPhase>("idle");
  const [modalView, setModalView] = useState<ResultModalView>("result");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [isTogglingAction, setIsTogglingAction] = useState(false);

  const baselineRef = useRef<ResultBaseline>(EMPTY_BASELINE);
  // Once the user started or stopped, a slow first /latest is out of date.
  const userActedRef = useRef(false);
  // Aborted when the component unmounts; every request and loop follows it.
  const lifetimeRef = useRef<AbortController | null>(null);
  const pollRef = useRef<AbortController | null>(null);
  const onFreshResultRef = useRef(onFreshResult);

  useEffect(() => {
    onFreshResultRef.current = onFreshResult;
  }, [onFreshResult]);

  const cancelPolling = useCallback(() => {
    pollRef.current?.abort();
    pollRef.current = null;
  }, []);

  // Created in the effect body so a StrictMode remount gets a live one again.
  useEffect(() => {
    const lifetime = new AbortController();
    lifetimeRef.current = lifetime;

    return () => {
      lifetime.abort();
      cancelPolling();
    };
  }, [cancelPolling]);

  // One-second tick for the elapsed time, only while recording.
  useEffect(() => {
    if (phase !== "recording") return;

    const intervalId = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(intervalId);
  }, [phase]);

  /**
   * Called with the first /latest: remember its result and resume a running
   * session. Returns false (ignored) once the user has started or stopped.
   */
  const adoptInitial = useCallback((latest: MeasurementData) => {
    // Even when ignored, the shown result must not count as fresh after Stop.
    baselineRef.current = rememberInitial(baselineRef.current, latest);
    if (userActedRef.current) return false;

    if (latest.status?.toUpperCase() === "IN_PROGRESS") {
      const current = Date.now();
      setStartedAt(sessionStartFrom(latest) ?? current);
      setNow(current);
      setPhase("recording");
    }

    return true;
  }, []);

  const pollForResult = useCallback(
    async (lifetime: AbortSignal) => {
      cancelPolling();
      const run = new AbortController();
      pollRef.current = run;
      const isCancelled = () => run.signal.aborted || lifetime.aborted;

      const outcome = await pollForFreshResult({
        fetchLatest: () => fetchLatest(run.signal),
        isFresh: (data) =>
          isFreshResult(
            data,
            baselineRef.current.previousResultId,
            baselineRef.current,
          ),
        wait: (ms) => waitFor(ms, run.signal),
        isCancelled,
        maxAttempts: POLL_MAX_ATTEMPTS,
        intervalMs: POLL_INTERVAL_MS,
      });

      if (outcome.kind === "cancelled" || isCancelled()) return;
      pollRef.current = null;

      if (outcome.kind === "fresh") {
        baselineRef.current = rememberResult(baselineRef.current, outcome.data);
        onFreshResultRef.current(outcome.data);
        setPhase("result");
        setModalView("result");
      } else {
        setPhase("timeout");
        setModalView("timeout");
      }
    },
    [cancelPolling],
  );

  const beginRecording = useCallback(
    (startedAtMs: number) => {
      userActedRef.current = true;
      cancelPolling();
      setStartedAt(startedAtMs);
      setNow(Date.now());
      setPhase("recording");
    },
    [cancelPolling],
  );

  const beginAnalysing = useCallback(
    (lifetime: AbortSignal) => {
      userActedRef.current = true;
      setPhase("analysing");
      setModalView("analysing");
      setIsModalOpen(true);
      void pollForResult(lifetime);
    },
    [pollForResult],
  );

  /** A start/stop timed out: read /latest once and adopt what it reports. */
  const recoverFromTimeout = useCallback(
    async (action: ToggleAction, lifetime: AbortSignal) => {
      let latest: MeasurementData | null;
      try {
        latest = await fetchLatest(lifetime);
      } catch (error) {
        if (error instanceof SessionExpiredError) return;
        if (!lifetime.aborted) toast.error(TOGGLE_ERROR);
        return;
      }
      if (lifetime.aborted) return;

      const { phase: next, tookEffect } = afterToggleTimeout(action, latest);
      if (next === "recording" && latest) {
        baselineRef.current = rememberResult(baselineRef.current, latest);
        beginRecording(sessionStartFrom(latest) ?? Date.now());
      } else if (next === "analysing") {
        beginAnalysing(lifetime);
      } else {
        userActedRef.current = true;
        cancelPolling();
        setPhase("idle");
      }
      if (!tookEffect) toast.error(TOGGLE_ERROR);
    },
    [beginAnalysing, beginRecording, cancelPolling],
  );

  const toggle = useCallback(
    async (action: ToggleAction) => {
      const lifetime = lifetimeRef.current?.signal;
      if (!lifetime || lifetime.aborted) return;

      setIsTogglingAction(true);
      try {
        const json = await postMeasurement(action, lifetime);
        if (lifetime.aborted) return;

        if (json.code !== 200) {
          toast.error(TOGGLE_FAILED);
        } else if (action === "start") {
          beginRecording(Date.now());
        } else {
          beginAnalysing(lifetime);
        }
      } catch (error) {
        if (lifetime.aborted || error instanceof SessionExpiredError) return;
        // A slow backend may still have done it: look before reporting.
        if (isTimeoutError(error)) await recoverFromTimeout(action, lifetime);
        else toast.error(TOGGLE_ERROR);
      } finally {
        if (!lifetime.aborted) setIsTogglingAction(false);
      }
    },
    [beginAnalysing, beginRecording, recoverFromTimeout],
  );

  const handleToggleMonitoring = useCallback(async () => {
    if (isTogglingAction || phase === "analysing") return;
    await toggle(phase === "recording" ? "stop" : "start");
  }, [isTogglingAction, phase, toggle]);

  /** "Mulai monitoring lagi": only once no session is running. */
  const restart = useCallback(async () => {
    if (isTogglingAction || phase === "recording" || phase === "analysing") {
      return;
    }
    setIsModalOpen(false);
    await toggle("start");
  }, [isTogglingAction, phase, toggle]);

  /** "Detail Hasil AI": the current result, or the analysing view while analysing. */
  const openResult = useCallback(() => {
    setModalView(phase === "analysing" ? "analysing" : "result");
    setIsModalOpen(true);
  }, [phase]);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const elapsed =
    phase === "recording" && startedAt !== null && now !== null
      ? formatElapsed(now - startedAt)
      : "00:00";

  return {
    phase,
    elapsed,
    isTogglingAction,
    isModalOpen,
    modalView,
    adoptInitial,
    handleToggleMonitoring,
    restart,
    openResult,
    closeModal,
  };
}
