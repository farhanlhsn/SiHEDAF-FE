import { PulseLoader } from "@/components/ui/PulseLoader";

export default function DashboardLoading() {
  return (
    <div className="grid min-h-[calc(100dvh-72px)] place-items-center px-4">
      <PulseLoader label="Memuat halaman..." />
    </div>
  );
}
