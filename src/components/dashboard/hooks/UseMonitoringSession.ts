"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { resultStatus } from "@/components/dashboard/DashboardFormat";
import {
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  formatElapsed,
  isFreshResult,
  sessionStartFrom,
  type MonitoringPhase,
} from "@/components/dashboard/MonitoringSession";
import type { MeasurementData } from "@/components/dashboard/hooks/UseDashboardOverview";

type UseMonitoringSessionOptions = {
  /** Called with a freshly analysed result so the overview can show it. */
  onFreshResult: (data: MeasurementData) => void;
};

/**
 * Owns the monitoring moment: recording (wall-clock elapsed), analysing
 * (polling /latest for a fresh result) and the AI result modal.
 */
export function useMonitoringSession({
  onFreshResult,
}: UseMonitoringSessionOptions) {
  const [phase, setPhase] = useState<MonitoringPhase>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [isTogglingAction, setIsTogglingAction] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const previousResultIdRef = useRef<number | null>(null);
  // Bumped to cancel a running poll loop; a loop only acts while its id is current.
  const pollRunRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFreshResultRef = useRef(onFreshResult);

  useEffect(() => {
    onFreshResultRef.current = onFreshResult;
  }, [onFreshResult]);

  const cancelPolling = useCallback(() => {
    pollRunRef.current += 1;
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Unmount: no pending poll may survive or set state afterwards.
  useEffect(() => cancelPolling, [cancelPolling]);

  // One-second tick for the elapsed time, only while recording.
  useEffect(() => {
    if (phase !== "recording") return;

    const intervalId = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(intervalId);
  }, [phase]);

  /** Called with the first /latest: remember its result and resume a running session. */
  const adoptInitial = useCallback((latest: MeasurementData) => {
    if (resultStatus(latest.resultLabel) !== "unknown" && latest.id != null) {
      previousResultIdRef.current = latest.id;
    }

    const resumedAt = sessionStartFrom(latest);

    if (latest.status?.toUpperCase() === "IN_PROGRESS") {
      const current = Date.now();
      setStartedAt(resumedAt ?? current);
      setNow(current);
      setPhase("recording");
    }
  }, []);

  const startPolling = useCallback(() => {
    cancelPolling();
    const run = pollRunRef.current;
    let attempts = 0;

    async function tick() {
      attempts += 1;
      let fresh: MeasurementData | null = null;

      try {
        const res = await fetch("/api/v1/measurement/latest");
        const json = await res.json();
        if (
          res.ok &&
          json.code === 200 &&
          isFreshResult(json.data, previousResultIdRef.current)
        ) {
          fresh = json.data as MeasurementData;
        }
      } catch {
        // A failed request counts as an attempt; try again until the cap.
      }

      if (pollRunRef.current !== run) return;

      if (fresh) {
        if (fresh.id != null) previousResultIdRef.current = fresh.id;
        onFreshResultRef.current(fresh);
        setPhase("result");
        return;
      }

      if (attempts >= POLL_MAX_ATTEMPTS) {
        setPhase("timeout");
        return;
      }

      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    }

    void tick();
  }, [cancelPolling]);

  const startSession = useCallback(async () => {
    setIsTogglingAction(true);
    try {
      const res = await fetch("/api/v1/measurement/start", { method: "POST" });
      const json = await res.json();
      if (json.code === 200) {
        cancelPolling();
        const current = Date.now();
        setStartedAt(current);
        setNow(current);
        setPhase("recording");
      } else {
        toast.error(json.message || "Gagal mengubah status monitoring.");
      }
    } catch {
      toast.error(
        "Terjadi kesalahan saat mengubah status monitoring. Coba lagi.",
      );
    } finally {
      setIsTogglingAction(false);
    }
  }, [cancelPolling]);

  const stopSession = useCallback(async () => {
    setIsTogglingAction(true);
    try {
      const res = await fetch("/api/v1/measurement/stop", { method: "POST" });
      const json = await res.json();
      if (json.code === 200) {
        setPhase("analysing");
        setIsModalOpen(true);
        startPolling();
      } else {
        toast.error(json.message || "Gagal mengubah status monitoring.");
      }
    } catch {
      toast.error(
        "Terjadi kesalahan saat mengubah status monitoring. Coba lagi.",
      );
    } finally {
      setIsTogglingAction(false);
    }
  }, [startPolling]);

  const handleToggleMonitoring = useCallback(async () => {
    if (isTogglingAction || phase === "analysing") return;
    if (phase === "recording") await stopSession();
    else await startSession();
  }, [isTogglingAction, phase, startSession, stopSession]);

  const restart = useCallback(async () => {
    if (isTogglingAction) return;
    setIsModalOpen(false);
    await startSession();
  }, [isTogglingAction, startSession]);

  const openResult = useCallback(() => setIsModalOpen(true), []);
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
    modalPhase:
      phase === "analysing" || phase === "timeout"
        ? (phase as "analysing" | "timeout")
        : ("result" as const),
    adoptInitial,
    handleToggleMonitoring,
    restart,
    openResult,
    closeModal,
  };
}
