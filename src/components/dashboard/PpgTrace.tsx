import { tracePath } from "@/components/dashboard/DashboardFormat";
import { traceTicks } from "@/components/dashboard/Signal";

type PpgTraceProps = {
  data?: number[];
  tone?: "blue" | "pink";
  label: string;
  className?: string;
  /**
   * Samples per second of `data`: adds start, middle and end time labels
   * under the trace (the duration fact says the same for screen readers).
   */
  sampleRate?: number;
};

/** Static PPG trace. Blue is a normal rhythm, pink is AF or AFL. */
export function PpgTrace({
  data,
  tone = "blue",
  label,
  className = "",
  sampleRate,
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

  const trace = (
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
  const ticks =
    sampleRate === undefined ? null : traceTicks(data?.length ?? 0, sampleRate);

  if (ticks === null) return trace;

  return (
    <div className="min-w-0">
      {trace}
      <div
        aria-hidden="true"
        className="mt-1.5 flex justify-between gap-3 text-[0.8125rem] leading-[1.3] font-medium tabular-nums text-primary-900/70"
      >
        <span>{ticks[0]}</span>
        <span className="text-center">{ticks[1]}</span>
        <span className="text-right">{ticks[2]}</span>
      </div>
    </div>
  );
}
