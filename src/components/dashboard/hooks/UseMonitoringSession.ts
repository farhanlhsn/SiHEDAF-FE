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
  RECORDING_WATCH_INTERVAL_MS,
  TOGGLE_TIMEOUT_MS,
  afterStopRefused,
  afterToggleTimeout,
  isFreshResult,
  isTimeoutError,
  pollForFreshResult,
  recordingClock,
  rememberInitial,
  rememberResult,
  rememberSession,
  requestSignal,
  runningSessionFrom,
  sessionStartFrom,
  toggleAnswer,
  waitFor,
  type MonitoringPhase,
  type ResultBaseline,
  type ResultModalView,
  type RunningSession,
} from "@/components/dashboard/MonitoringSession";
import type { MeasurementData } from "@/components/dashboard/hooks/UseDashboardOverview";

type UseMonitoringSessionOptions = {
  /** Called with a freshly analysed result so the overview can show it. */
  onFreshResult: (data: MeasurementData) => void;
};

// Server text (message, errors) is never read: every toast is fixed copy.
type Envelope<T = unknown> = { code?: unknown; data?: T };

type ToggleAction = "start" | "stop";

const TOGGLE_FAILED = "Gagal mengubah status monitoring.";
const TOGGLE_ERROR =
  "Terjadi kesalahan saat mengubah status monitoring. Coba lagi.";
const START_REFUSED =
  "Wristband belum siap untuk merekam. Pastikan wristband menyala, terhubung ke internet, dan tidak sedang merekam, lalu coba lagi.";

/** Start or stop a session; throws on network errors and timeouts. */
async function postMeasurement(
  action: ToggleAction,
  lifetime: AbortSignal,
): Promise<{ status: number; json: Envelope<MeasurementData> | null }> {
  const res = await apiFetch(`/api/v1/measurement/${action}`, {
    method: "POST",
    signal: requestSignal(lifetime, TOGGLE_TIMEOUT_MS),
  });

  return { status: res.status, json: await res.json() };
}

/** The latest record (null when there is none); throws when the read fails. */
async function fetchLatest(signal: AbortSignal) {
  const res = await apiFetch("/api/v1/measurement/latest", {
    signal: requestSignal(signal),
  });
  const json: Envelope<MeasurementData> = await res.json();

  if (!res.ok || json.code !== 200) {
    throw new Error("Gagal membaca data terakhir.");
  }

  return json.data ?? null;
}

/**
 * The session still recording, from the newest history row (any status);
 * /latest only ever returns COMPLETED rows. Throws when the read fails.
 */
async function fetchRunningSession(signal: AbortSignal) {
  const res = await apiFetch("/api/v1/measurement/history?page=1&limit=1", {
    signal: requestSignal(signal),
  });

  return res.ok ? runningSessionFrom(await res.json()) : null;
}

/**
 * While recording: the wristband stops by itself after 3 minutes and the
 * server completes the session, so /latest is checked every 5 s until a
 * fresh result arrives or `watch` is aborted.
 */
async function watchRecording(
  watch: AbortSignal,
  isFresh: (data: MeasurementData) => boolean,
) {
  await waitFor(RECORDING_WATCH_INTERVAL_MS, watch);

  return pollForFreshResult({
    fetchLatest: () => fetchLatest(watch),
    isFresh,
    wait: (ms) => waitFor(ms, watch),
    isCancelled: () => watch.aborted,
    // For as long as it records: a session the wristband lost stays open until Stop.
    maxAttempts: Number.POSITIVE_INFINITY,
    intervalMs: RECORDING_WATCH_INTERVAL_MS,
  });
}

/**
 * Owns the monitoring moment: recording (wall-clock time against the 3-minute
 * limit, watching /latest for a session the wristband finished by itself),
 * analysing (polling /latest after Stop) and the AI result modal.
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
  // The shown result ended without Stop: the wristband finished after 3 minutes.
  const [autoFinished, setAutoFinished] = useState(false);

  const baselineRef = useRef<ResultBaseline>(EMPTY_BASELINE);
  // Once the user started or stopped, a slow first /latest is out of date.
  const userActedRef = useRef(false);
  // Aborted when the component unmounts; every request and loop follows it.
  const lifetimeRef = useRef<AbortController | null>(null);
  const pollRef = useRef<AbortController | null>(null);
  // The recording watch; owned by its effect, aborted at once by Stop.
  const watchRef = useRef<AbortController | null>(null);
  const onFreshResultRef = useRef(onFreshResult);

  useEffect(() => {
    onFreshResultRef.current = onFreshResult;
  }, [onFreshResult]);

  const cancelPolling = useCallback(() => {
    pollRef.current?.abort();
    pollRef.current = null;
  }, []);

  const stopWatching = useCallback(() => {
    watchRef.current?.abort();
    watchRef.current = null;
  }, []);

  /** The fresh-result rules against what is known right now. */
  const isFreshNow = useCallback(
    (data: MeasurementData) =>
      isFreshResult(
        data,
        baselineRef.current.previousResultId,
        baselineRef.current,
      ),
    [],
  );

  /** After a reload: resume a session the newest history row still records. */
  const resumeRunningSession = useCallback(async (lifetime: AbortSignal) => {
    let running: RunningSession | null;
    try {
      running = await fetchRunningSession(lifetime);
    } catch {
      // Expired session (redirecting), no network or a timeout: stay idle.
      return;
    }
    if (lifetime.aborted || !running || userActedRef.current) return;

    // Its own result will count as fresh once the server completes it.
    baselineRef.current = rememberSession(baselineRef.current, running);
    const current = Date.now();
    setStartedAt(running.startedAt ?? current);
    setNow(current);
    setPhase("recording");
  }, []);

  // Created in the effect body so a StrictMode remount gets a live one again.
  useEffect(() => {
    const lifetime = new AbortController();
    lifetimeRef.current = lifetime;
    void resumeRunningSession(lifetime.signal);

    return () => {
      lifetime.abort();
      cancelPolling();
    };
  }, [cancelPolling, resumeRunningSession]);

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

  /** Show a fresh result; automatic when the wristband ended the session. */
  const showResult = useCallback(
    (data: MeasurementData, { automatic }: { automatic: boolean }) => {
      baselineRef.current = rememberResult(baselineRef.current, data);
      onFreshResultRef.current(data);
      setAutoFinished(automatic);
      setPhase("result");
      setModalView("result");
      // After Stop the modal is open already, or the reader closed it on purpose.
      if (automatic) setIsModalOpen(true);
    },
    [],
  );

  const pollForResult = useCallback(
    async (lifetime: AbortSignal) => {
      cancelPolling();
      const run = new AbortController();
      pollRef.current = run;
      const isCancelled = () => run.signal.aborted || lifetime.aborted;

      const outcome = await pollForFreshResult({
        fetchLatest: () => fetchLatest(run.signal),
        isFresh: isFreshNow,
        wait: (ms) => waitFor(ms, run.signal),
        isCancelled,
        maxAttempts: POLL_MAX_ATTEMPTS,
        intervalMs: POLL_INTERVAL_MS,
      });

      if (outcome.kind === "cancelled" || isCancelled()) return;
      pollRef.current = null;

      if (outcome.kind === "fresh") {
        showResult(outcome.data, { automatic: false });
      } else {
        setPhase("timeout");
        setModalView("timeout");
      }
    },
    [cancelPolling, isFreshNow, showResult],
  );

  // The recording watch runs only while recording with no start/stop in
  // flight; recording ending, Stop being pressed or unmounting aborts it.
  useEffect(() => {
    if (phase !== "recording" || isTogglingAction) return;

    const watch = new AbortController();
    watchRef.current = watch;
    void watchRecording(watch.signal, isFreshNow).then((outcome) => {
      if (outcome.kind !== "fresh" || watch.signal.aborted) return;
      showResult(outcome.data, { automatic: true });
    });

    return () => {
      watch.abort();
      if (watchRef.current === watch) watchRef.current = null;
    };
  }, [isFreshNow, isTogglingAction, phase, showResult]);

  const beginRecording = useCallback(
    (startedAtMs: number, session?: MeasurementData | null) => {
      userActedRef.current = true;
      cancelPolling();
      // The new session's own result is fresh even before the first /latest lands.
      if (session) {
        baselineRef.current = rememberResult(baselineRef.current, session);
      }
      setAutoFinished(false);
      setStartedAt(startedAtMs);
      setNow(Date.now());
      setPhase("recording");
    },
    [cancelPolling],
  );

  const beginAnalysing = useCallback(
    (lifetime: AbortSignal) => {
      userActedRef.current = true;
      setAutoFinished(false);
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

  /**
   * Stop was refused, typically because the wristband had already finished:
   * read /latest once and show that result, otherwise go idle.
   */
  const recoverFromRefusedStop = useCallback(
    async (lifetime: AbortSignal) => {
      let latest: MeasurementData | null = null;
      try {
        latest = await fetchLatest(lifetime);
      } catch (error) {
        if (error instanceof SessionExpiredError) return;
      }
      if (lifetime.aborted) return;

      userActedRef.current = true;
      const next = afterStopRefused(latest, isFreshNow);
      if (next.kind === "result") {
        showResult(next.data, { automatic: true });
      } else {
        cancelPolling();
        setPhase("idle");
        toast.error(TOGGLE_FAILED);
      }
    },
    [cancelPolling, isFreshNow, showResult],
  );

  const toggle = useCallback(
    async (action: ToggleAction) => {
      const lifetime = lifetimeRef.current?.signal;
      if (!lifetime || lifetime.aborted) return;

      // Stop's own analysing poll replaces the recording watch: never two loops.
      if (action === "stop") stopWatching();
      setIsTogglingAction(true);
      try {
        const { status, json } = await postMeasurement(action, lifetime);
        if (lifetime.aborted) return;

        const answer = toggleAnswer(status, json?.code);
        if (answer === "ok") {
          if (action === "start") beginRecording(Date.now(), json?.data);
          else beginAnalysing(lifetime);
        } else if (answer === "failed") {
          // The server or the way to it failed: the session state is unchanged.
          toast.error(TOGGLE_ERROR);
        } else if (action === "start") {
          toast.error(START_REFUSED);
        } else {
          await recoverFromRefusedStop(lifetime);
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
    [
      beginAnalysing,
      beginRecording,
      recoverFromRefusedStop,
      recoverFromTimeout,
      stopWatching,
    ],
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

  // "01:12 / 03:00" while recording; overtime once the 3 minutes are over.
  const clock = recordingClock(
    phase === "recording" && startedAt !== null && now !== null
      ? now - startedAt
      : 0,
  );

  return {
    phase,
    clock,
    autoFinished,
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
