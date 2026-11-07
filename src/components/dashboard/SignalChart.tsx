type SignalChartProps = {
  isActive?: boolean;
  data?: number[];
  /** Window shown on the chart, in minutes. */
  rangeMinutes?: number;
};

const placeholderPath =
  "M0 69h10l8-34 9 23 9-9 9 27 9 8 9-18 9 2 8-56 9 42 9-8 9 28 9 5 9-40 9-5 9 24 9 23 9 2 9-18 8 5 9-65 9 50 9 10 9-38 9-2 9 48 9 8 9-8 9-38 9 2 9 33 9 10 9-25 9-3 8 23 9 11 9-26 9-47 9 59 9-6 9 33 9 8 9-27 9-10 9 19 9 15 9-21 9-15 9 20 9-70 8 57 9 8 9 18 9-20 9-4 9 21 9 5 9-23 9-31 9 54 9-6 9 16 9-14 9 2 9-60 9 48 8 14 9 8 9-17 9-2 9-30 9 45h10";

function buildPath(data?: number[]) {
  if (!data || data.length < 2) {
    return placeholderPath;
  }

  let maxVal = -Infinity;
  let minVal = Infinity;
  for (const value of data) {
    if (value > maxVal) maxVal = value;
    if (value < minVal) minVal = value;
  }
  const range = maxVal - minVal || 1;

  return data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 760;
      const y = 104 - ((value - minVal) / range) * 96;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function minutesLabel(minutes: number) {
  return `−${Number(minutes.toFixed(1)).toString().replace(".", ",")} menit`;
}

/**
 * Latest PPG signal on a monitor strip. While monitoring is active a sweep
 * line passes over the trace, like a bedside monitor.
 */
export function SignalChart({
  isActive = true,
  data,
  rangeMinutes = 12,
}: SignalChartProps) {
  const hasData = Boolean(data && data.length > 1);

  return (
    <div className="mt-6">
      <div className="relative h-[180px] overflow-hidden border-y border-primary-900/10 sm:h-[200px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col justify-between py-3"
        >
          {[0, 1, 2, 3].map((line) => (
            <span className="h-px w-full bg-primary-900/[0.06]" key={line} />
          ))}
        </div>
        <svg
          aria-label={
            isActive
              ? "Grafik sinyal PPG terbaru sedang aktif"
              : "Grafik sinyal PPG dijeda"
          }
          className={`absolute inset-x-0 top-1/2 h-[140px] w-full -translate-y-1/2 overflow-visible transition-[color,opacity] duration-300 ${
            hasData ? "text-primary-300" : "text-primary-200"
          } ${isActive ? "opacity-100" : "opacity-70"}`}
          fill="none"
          preserveAspectRatio="none"
          role="img"
          viewBox="0 0 760 112"
        >
          <path
            className={isActive ? "signal-draw" : undefined}
            d={buildPath(data)}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.25"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {isActive ? (
          <span aria-hidden="true" className="monitor-sweep" />
        ) : null}
        {!hasData ? (
          <p className="absolute inset-0 grid place-items-center text-[15px] font-medium text-primary-900/75">
            Belum ada sinyal pada rentang ini.
          </p>
        ) : null}
      </div>
      <div className="mt-2 flex justify-between text-[13px] font-medium tabular-nums text-primary-900/70">
        <span>{minutesLabel(rangeMinutes)}</span>
        <span>{minutesLabel(rangeMinutes / 2)}</span>
        <span>Sekarang</span>
      </div>
    </div>
  );
}
