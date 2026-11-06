"use client";

import Link from "next/link";
import { ShieldCheck, TriangleAlert } from "lucide-react";

import {
  formatConfidence,
  formatWib,
  isNormalResult,
} from "@/components/dashboard/DashboardFormat";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import { StatusMark } from "@/components/dashboard/StatusMark";

type AiResultData = {
  id?: number;
  resultLabel?: string;
  resultClass?: number;
  confidenceLevel?: number;
  completedAt?: string;
  updatedAt?: string;
  deviceId?: string;
};

type AiResultModalProps = Readonly<{
  data: AiResultData | null;
  onClose: () => void;
  open: boolean;
}>;

export function AiResultModal({ data, onClose, open }: AiResultModalProps) {
  if (!data) return null;

  const isNormal = isNormalResult(data.resultLabel) ?? true;
  const confidence = formatConfidence(data.confidenceLevel);
  const measuredAt = formatWib(data.completedAt ?? data.updatedAt);

  return (
    <DashboardModal
      description="Sistem AI SiHEDAF telah selesai menganalisis rekaman sinyal PPG terbarumu."
      onClose={onClose}
      open={open}
      showCloseButton={false}
      title="Hasil Analisis AI Selesai"
    >
      <div className="flex flex-col items-center text-center">
        <div className="mt-3">
          <StatusMark size="large" status={isNormal ? "normal" : "af"} />
        </div>

        <h3 className="mt-7 text-[22px] leading-[1.2] font-bold tracking-[-0.03em] text-primary-900">
          {isNormal
            ? "Irama Jantung Normal"
            : "Terdeteksi Potensi AF (Atrial Fibrillation)"}
        </h3>

        <p className="mt-2 text-[16px] leading-[1.55] text-primary-900/80">
          {isNormal
            ? "Sinyal PPG menunjukkan irama denyut jantung yang teratur dan stabil."
            : "Terdeteksi anomali pada ritme PPG. Pantau ulang atau konsultasikan ke dokter, terutama jika kamu merasakan keluhan."}
        </p>

        <div className="mt-6 w-full rounded-[18px] bg-paper p-5 text-left">
          <div className="flex items-center justify-between gap-3 border-b border-primary-900/10 pb-4">
            <span className="flex items-center gap-2 text-[15px] font-medium text-primary-900">
              {isNormal ? (
                <ShieldCheck
                  aria-hidden="true"
                  className="size-5 text-primary-300"
                  strokeWidth={2}
                />
              ) : (
                <TriangleAlert
                  aria-hidden="true"
                  className="size-5 text-af-700"
                  strokeWidth={2}
                />
              )}
              Tingkat Keyakinan AI
            </span>
            <span className="text-[18px] font-bold tabular-nums text-primary-900">
              {confidence ?? "Tidak tersedia"}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4 text-[15px]">
            <div>
              <dt className="text-primary-900/75">Waktu Pengukuran</dt>
              <dd className="mt-1 font-semibold text-primary-900">
                {measuredAt ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-primary-900/75">Status Analisis</dt>
              <dd className="mt-1 font-semibold text-primary-900">
                Selesai (COMPLETED)
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-7 flex w-full flex-col-reverse gap-3 sm:flex-row">
          <button
            className="flex h-12 flex-1 items-center justify-center rounded-full border-[1.5px] border-primary-900/20 text-[15px] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
            onClick={onClose}
            type="button"
          >
            Tutup
          </button>
          <Link
            className="btn-primary flex h-12 flex-1 items-center justify-center rounded-full bg-primary-900 text-[15px] font-semibold text-white"
            href="/riwayat"
            onClick={onClose}
          >
            Lihat Riwayat
          </Link>
        </div>
      </div>
    </DashboardModal>
  );
}
