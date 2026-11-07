type PulseLoaderProps = {
  label?: string;
  className?: string;
};

const pulsePath = "M2 30h34l6-12 8 22 7-34 7 34 6-10h30l5-8 6 12 5-4h42";

/** A short signal travelling along a PPG trace — the SiHEDAF loading state. */
export function PulseLoader({
  label = "Memuat...",
  className = "",
}: PulseLoaderProps) {
  return (
    <div
      aria-live="polite"
      className={`flex flex-col items-center gap-3 ${className}`}
      role="status"
    >
      <svg
        aria-hidden="true"
        className="h-12 w-40"
        fill="none"
        viewBox="0 0 160 48"
      >
        <path className="pulse-loader-track" d={pulsePath} pathLength={1} />
        <path className="pulse-loader-line" d={pulsePath} pathLength={1} />
      </svg>
      <span className="text-[15px] font-medium text-primary-900/80">
        {label}
      </span>
    </div>
  );
}
