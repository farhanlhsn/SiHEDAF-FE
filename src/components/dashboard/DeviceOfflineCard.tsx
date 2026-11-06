import Link from "next/link";

import type { DeviceState } from "@/components/dashboard/DeviceState";
import { formatWib } from "@/components/dashboard/DashboardFormat";
import { DataErrorState } from "@/components/ui/DataErrorState";
import type { DataError } from "@/components/ui/FetchError";

type DeviceOfflineCardProps = {
  state: DeviceState;
  lastSeen?: string;
  error?: DataError | null;
  onRetry: () => void;
};

const steps = [
  "Pastikan wristband menyala dan terpasang di pergelangan tangan.",
  "Pastikan baterainya cukup; isi daya bila perlu.",
  "Pastikan wristband berada di dekat jaringan yang biasa dipakai saat penyambungan, lalu tunggu beberapa menit.",
];

const cardClassName =
  "mt-10 rounded-[24px] border border-primary-900/10 bg-white px-5 py-6 sm:px-7";
const linkClassName =
  "font-semibold text-primary-500 underline underline-offset-4 transition-colors hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300";

/** Guides the reader when the wristband is not connected, bound, or readable. */
export function DeviceOfflineCard({
  state,
  lastSeen,
  error,
  onRetry,
}: DeviceOfflineCardProps) {
  if (state === "error" && error) {
    return (
      <div className={cardClassName}>
        <DataErrorState {...error} onRetry={onRetry} />
      </div>
    );
  }

  if (state === "none") {
    return (
      <section aria-labelledby="device-none-title" className={cardClassName}>
        <h2
          className="text-[1.25rem] font-bold tracking-[-0.03em] text-primary-900"
          id="device-none-title"
        >
          Belum ada perangkat terhubung
        </h2>
        <p className="mt-2 text-[0.9375rem] leading-[1.55] text-primary-900/80">
          Hubungkan wristband SiHEDAF agar monitoring bisa dimulai.
        </p>
        <Link
          className="btn-primary mt-4 inline-flex h-12 items-center justify-center rounded-full bg-primary-900 px-6 text-[0.9375rem] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
          href="/hubungkan-perangkat"
        >
          Hubungkan perangkat
        </Link>
      </section>
    );
  }

  if (state !== "offline") return null;

  const seen = formatWib(lastSeen);

  return (
    <section aria-labelledby="device-offline-title" className={cardClassName}>
      <h2
        className="text-[1.25rem] font-bold tracking-[-0.03em] text-primary-900"
        id="device-offline-title"
      >
        Wristband belum terhubung
      </h2>
      <p className="mt-1 text-[0.9375rem] text-primary-900/80">
        {seen ? `Terakhir terlihat ${seen}` : "Belum pernah terlihat"}
      </p>
      <ol className="mt-4 grid max-w-[640px] list-decimal gap-2 pl-6 text-[0.9375rem] leading-[1.55] text-primary-900 marker:font-semibold">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
        <li>
          <Link className={linkClassName} href="/hubungkan-perangkat">
            Masih belum terhubung? Sambungkan ulang perangkat.
          </Link>
        </li>
      </ol>
      <button
        className="mt-5 inline-flex h-12 items-center justify-center rounded-full border-[1.5px] border-primary-900/20 bg-white px-6 text-[0.9375rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
        onClick={onRetry}
        type="button"
      >
        Periksa lagi
      </button>
    </section>
  );
}
