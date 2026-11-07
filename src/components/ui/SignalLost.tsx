import { buildSvgPath, rhythmWindow } from "@/components/landing/PulseWaveform";

type SignalLostProps = {
  className?: string;
};

const strip = rhythmWindow({
  rhythm: "normal",
  seed: 4,
  beats: 3,
  samples: 160,
});
const wavePath = buildSvgPath(
  strip.points.map((point) => point.value * 0.9),
  380,
  110,
);

/**
 * A PPG trace that drops out in the middle, used for "page not found" and
 * error screens: the signal is lost, not the heartbeat.
 */
export function SignalLost({ className = "" }: SignalLostProps) {
  return (
    <div
      aria-hidden="true"
      className={`border-y border-primary-900/10 ${className}`}
    >
      <svg
        className="mx-auto block h-auto w-full max-w-[1440px]"
        fill="none"
        viewBox="0 0 1200 150"
      >
        <g transform="translate(0 20)">
          <path className="signal-lost-wave" d={wavePath} pathLength={1} />
        </g>
        <path className="signal-lost-gap" d="M392 130H808" />
        <g transform="translate(820 20)">
          <path
            className="signal-lost-wave signal-lost-wave-late"
            d={wavePath}
            pathLength={1}
          />
        </g>
      </svg>
    </div>
  );
}
