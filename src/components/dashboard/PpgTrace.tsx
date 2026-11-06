import { tracePath } from "@/components/dashboard/DashboardFormat";

type PpgTraceProps = {
  data?: number[];
  tone?: "blue" | "pink";
  label: string;
  className?: string;
};

/** Static PPG trace. Blue is a normal rhythm, pink is AF. No time axis. */
export function PpgTrace({
  data,
  tone = "blue",
  label,
  className = "",
}: PpgTraceProps) {
  const d = tracePath(data, 600, 120, 8);

  if (d === null) {
    return (
      <p
        className={`grid place-items-center text-[0.8125rem] text-primary-900/70 ${className}`}
      >
        Grafik tidak tersedia
      </p>
    );
  }

  return (
    <svg
      aria-label={label}
      className={className}
      fill="none"
      preserveAspectRatio="none"
      role="img"
      viewBox="0 0 600 120"
    >
      <path
        className={tone === "pink" ? "stroke-af-500" : "stroke-primary-300"}
        d={d}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
