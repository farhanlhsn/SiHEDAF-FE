"use client";

import { useEffect, useState } from "react";

import {
  useMyDevice,
  type MeasurementDevice,
} from "@/components/dashboard/hooks/UseMyDevice";
import { isNormalResult } from "@/components/dashboard/DashboardFormat";
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

export function useDashboardOverview() {
  const { user } = useProfile();
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [monitoringRange, setMonitoringRange] = useState("12");
  const [isTogglingAction, setIsTogglingAction] = useState(false);

  const { device: deviceData } = useMyDevice();
  const [latestData, setLatestData] = useState<MeasurementData | null>(null);
  const [signalsData, setSignalsData] = useState<number[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch("/api/v1/measurement/latest");
        const json = await res.json();
        if (json.code === 200 && json.data) {
          setLatestData(json.data);
          if (json.data.status === "IN_PROGRESS") {
            setIsMonitoringActive(true);
          }
        }
      } catch (e) {
        console.error("Gagal memuat data terakhir:", e);
      }
    }
    fetchLatest();
  }, []);

  useEffect(() => {
    async function fetchSignals() {
      try {
        const res = await fetch(
          `/api/v1/measurement/signals?minutes=${monitoringRange}`,
        );
        const json = await res.json();
        if (json.code === 200 && json.data) {
          setSignalsData(json.data.rawPpgData || []);
        }
      } catch (e) {
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

  async function handleToggleMonitoring() {
    setIsTogglingAction(true);
    try {
      const endpoint = isMonitoringActive
        ? "/api/v1/measurement/stop"
        : "/api/v1/measurement/start";
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (json.code === 200) {
        const nextActiveState = !isMonitoringActive;
        setIsMonitoringActive(nextActiveState);

        if (!nextActiveState) {
          const latestRes = await fetch("/api/v1/measurement/latest");
          const latestJson = await latestRes.json();
          if (latestJson.code === 200 && latestJson.data) {
            setLatestData(latestJson.data);
            setIsAiModalOpen(true);
          }
        }
      } else {
        alert(json.message || "Gagal mengubah status monitoring");
      }
    } catch {
      alert("Terjadi kesalahan saat mengubah status monitoring");
    } finally {
      setIsTogglingAction(false);
    }
  }

  const firstName = user?.fullname ? user.fullname.split(" ")[0] : "Pengguna";
  const isNormal = isNormalResult(latestData?.resultLabel);

  return {
    user,
    firstName,
    deviceData,
    latestData,
    signalsData,
    isNormal,
    isMonitoringActive,
    monitoringRange,
    setMonitoringRange,
    isTogglingAction,
    handleToggleMonitoring,
    isAiModalOpen,
    setIsAiModalOpen,
  };
}
