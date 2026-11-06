import { TriangleAlert } from "lucide-react";

import {
  buildSvgPath,
  formatSeconds,
  rhythmWindow,
} from "@/components/landing/PulseWaveform";
import { ThreadPoint } from "@/components/landing/ThreadPoint";

/** Seed + beat count shared with the thread's wave anchor so peaks line up. */
const normalStrip = { seed: 21, beats: 7 };
const normal = rhythmWindow({ rhythm: "normal", samples: 420, ...normalStrip });
const irregular = rhythmWindow({
  rhythm: "af",
  seed: 8,
  beats: 8,
  samples: 420,
});

/** The systolic peak sits ~0.16 s after each beat onset. */
function peaksOf(strip: typeof normal) {
  return strip.intervals.map((interval) => ({
    at: interval.start + 0.16 / strip.duration,
    seconds: interval.seconds,
  }));
}

function pathOf(strip: typeof normal) {
  return buildSvgPath(
    strip.points.map((point) => point.value * 0.92),
    1000,
    100,
  );
}

type StripProps = {
  strip: typeof normal;
  tone: "normal" | "af";
};

function PeakGuides({ strip }: { strip: typeof normal }) {
  return peaksOf(strip).map((peak) => (
    <span
      aria-hidden="true"
      className="absolute inset-y-0 border-l border-dashed border-primary-900/15"
      key={peak.at}
      style={{ left: `${peak.at * 100}%` }}
    />
  ));
}

function IntervalBrackets({ strip, tone }: StripProps) {
  const peaks = peaksOf(strip);

  return (
    <div aria-hidden="true" className="relative mt-1 h-9">
      {peaks.slice(0, -1).map((peak, index) => {
        const next = peaks[index + 1];

        return (
          <div
            className="appear-at absolute top-0 flex flex-col items-center px-[3px]"
            key={peak.at}
            style={
              {
                left: `${peak.at * 100}%`,
                width: `${(next.at - peak.at) * 100}%`,
                "--at": next.at,
              } as React.CSSProperties
            }
          >
            <span
              className={`h-2 w-full rounded-b-[3px] border-x-[1.5px] border-b-[1.5px] ${
                tone === "af" ? "border-af-500/70" : "border-primary-300/60"
              }`}
            />
            <span
              className={`mt-1 hidden text-[0.75rem] font-semibold tabular-nums sm:block ${
                tone === "af" ? "text-af-700" : "text-primary-500"
              }`}
            >
              {formatSeconds(peak.seconds)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function RhythmCompare() {
  return (
    <figure
      className="relative mt-24 pl-10 lg:mt-28 lg:pr-24 lg:pl-14"
      data-thread-for="compare"
    >
      {/* Mobile: the rail runs straight down while both strips draw in. */}
      <ThreadPoint
        className="top-0 left-[11px] lg:hidden"
        target="compare"
        to="line"
      />

      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
        <h3 className="text-[clamp(1.75rem,2.6vw,2.5rem)] font-bold tracking-[-0.04em] text-primary-900">
          Bisa bedakan?
        </h3>
        <p className="max-w-[480px] text-[1.0625rem] leading-[1.55] text-primary-900/80">
          Dua rekaman PPG sekitar 6 detik. Perhatikan jarak antar puncaknya;
          angka di bawah garis adalah jarak antar detak dalam detik.
        </p>
      </div>

      <div className="mt-12">
        <p className="flex flex-wrap items-center gap-x-2 text-[1.0625rem] font-semibold text-primary-900">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-primary-300"
          />
          Irama normal
          <span className="font-normal text-primary-900/75">
            — jarak antar detak hampir sama
          </span>
        </p>
        <div className="relative mt-4 h-[96px] lg:h-[132px]">
          <PeakGuides strip={normal} />
          <svg
            aria-hidden="true"
            className="wipe-progress absolute inset-x-0 top-0 h-[calc(100%-8px)] w-full lg:hidden"
            preserveAspectRatio="none"
            viewBox="0 0 1000 100"
          >
            <path
              d={pathOf(normal)}
              fill="none"
              stroke="#006efb"
              strokeLinejoin="round"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* Desktop: the page's own thread draws this row. */}
          <ThreadPoint
            amplitude={124}
            beats={normalStrip.beats}
            className="bottom-[8px] left-0 hidden lg:block"
            dir="right"
            lead={-160}
            seed={normalStrip.seed}
            target="compare"
            to="wave"
          />
          <ThreadPoint
            className="right-0 bottom-[8px] hidden lg:block"
            dir="right"
            lead={140}
          />
        </div>
        <IntervalBrackets strip={normal} tone="normal" />
      </div>

      <div className="mt-10">
        <p className="flex flex-wrap items-center gap-x-2 text-[1.0625rem] font-semibold text-primary-900">
          <TriangleAlert
            aria-hidden="true"
            className="size-4 text-af-700"
            strokeWidth={2.25}
          />
          Atrial Fibrillation
          <span className="font-normal text-primary-900/75">
            — jarak antar detak acak
          </span>
        </p>
        <div className="relative mt-4 h-[96px] lg:h-[132px]">
          <PeakGuides strip={irregular} />
          <svg
            aria-hidden="true"
            className="wipe-progress absolute inset-x-0 top-0 h-[calc(100%-8px)] w-full"
            preserveAspectRatio="none"
            viewBox="0 0 1000 100"
          >
            <path
              d={pathOf(irregular)}
              fill="none"
              stroke="#ff4572"
              strokeLinejoin="round"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <IntervalBrackets strip={irregular} tone="af" />
      </div>

      <figcaption className="mt-6 max-w-[640px] text-[1.0625rem] leading-[1.55] text-primary-900/80">
        Pola acak seperti ini yang dicari AI SiHEDAF di setiap rekaman, bahkan
        ketika kamu sama sekali tidak merasakan apa-apa.
      </figcaption>

      <ThreadPoint className="bottom-0 left-[11px] lg:hidden" />
      {/* Desktop: leave the row on the right, then cross back to the rail below the caption. */}
      <ThreadPoint className="right-[40px] -bottom-[24px] hidden lg:block" />
      <ThreadPoint className="-bottom-[120px] left-[11px] hidden lg:block" />
    </figure>
  );
}
