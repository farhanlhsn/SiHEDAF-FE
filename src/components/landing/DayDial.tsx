import { ThreadPoint } from "@/components/landing/ThreadPoint";

const center = 200;
/** One reading every 3 minutes → 480 readings in 24 hours. */
const readingsPerDay = (24 * 60) / 3;
/** 02.12 as a fraction of the day — the illustrative AF event. */
const afEventAt = (2 * 60 + 12) / (24 * 60);

function polar(angleTurns: number, radius: number) {
  const angle = angleTurns * Math.PI * 2;

  return {
    x: center + radius * Math.sin(angle),
    y: center - radius * Math.cos(angle),
  };
}

function fixed(value: number) {
  return Number(value.toFixed(2));
}

function tickPath() {
  return Array.from({ length: readingsPerDay }, (_, index) => {
    const turn = index / readingsPerDay;
    const isHour = index % 20 === 0;
    const inner = polar(turn, isHour ? 140 : 150);
    const outer = polar(turn, 162);

    return `M${fixed(inner.x)} ${fixed(inner.y)}L${fixed(outer.x)} ${fixed(outer.y)}`;
  }).join("");
}

function sleepBandPath() {
  // 22.00 → 06.00
  const from = 22 / 24;
  const to = 30 / 24;
  const outerStart = polar(from, 168);
  const outerEnd = polar(to, 168);
  const innerEnd = polar(to, 136);
  const innerStart = polar(from, 136);

  return [
    `M${fixed(outerStart.x)} ${fixed(outerStart.y)}`,
    `A168 168 0 0 1 ${fixed(outerEnd.x)} ${fixed(outerEnd.y)}`,
    `L${fixed(innerEnd.x)} ${fixed(innerEnd.y)}`,
    `A136 136 0 0 0 ${fixed(innerStart.x)} ${fixed(innerStart.y)}`,
    "Z",
  ].join("");
}

const ticks = tickPath();
const afTickStart = polar(afEventAt, 132);
const afTickEnd = polar(afEventAt, 168);
const afDot = polar(afEventAt, 176);
const hourLabels = [
  { label: "00.00", turn: 0 },
  { label: "06.00", turn: 0.25 },
  { label: "12.00", turn: 0.5 },
  { label: "18.00", turn: 0.75 },
];

export function DayDial() {
  return (
    <figure className="relative mx-auto w-full max-w-[540px] lg:mr-0">
      {/* Mobile: come down the rail past the feature list first. */}
      <ThreadPoint className="-top-12 -left-[29px] lg:hidden" dir="down" />

      <div
        className="@container relative aspect-square w-full"
        data-thread-for="dial"
      >
        {/* The page thread draws this ring, one full turn = one day. */}
        <ThreadPoint
          className="inset-[6%]"
          dir="right"
          target="dial"
          to="loop"
        />

        <svg
          aria-hidden="true"
          className="absolute inset-0 size-full"
          viewBox="0 0 400 400"
        >
          <path d={sleepBandPath()} fill="#ebe6dc" />
          <path d={ticks} stroke="rgb(0 39 88 / 0.2)" strokeWidth="1" />
        </svg>
        <svg
          aria-hidden="true"
          className="dial-progress absolute inset-0 size-full"
          viewBox="0 0 400 400"
        >
          <path d={ticks} stroke="#006efb" strokeWidth="1.3" />
        </svg>
        <svg
          aria-hidden="true"
          className="appear-at absolute inset-0 size-full"
          style={{ "--at": afEventAt } as React.CSSProperties}
          viewBox="0 0 400 400"
        >
          <path
            d={`M${fixed(afTickStart.x)} ${fixed(afTickStart.y)}L${fixed(afTickEnd.x)} ${fixed(afTickEnd.y)}`}
            stroke="#ff4572"
            strokeLinecap="round"
            strokeWidth="3.5"
          />
          <circle
            cx={fixed(afDot.x)}
            cy={fixed(afDot.y)}
            fill="#ff4572"
            r="6"
            stroke="#f5f3ee"
            strokeWidth="2.5"
          />
        </svg>

        {hourLabels.map((hour) => {
          const position = polar(hour.turn, 118);

          return (
            <span
              aria-hidden="true"
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[13px] font-semibold tabular-nums text-primary-900/75"
              key={hour.label}
              style={{ left: `${position.x / 4}%`, top: `${position.y / 4}%` }}
            >
              {hour.label}
            </span>
          );
        })}

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[clamp(2.25rem,13cqw,4.25rem)] leading-none font-bold tracking-[-0.055em] text-primary-900 tabular-nums">
            {readingsPerDay}×
          </p>
          <p className="mt-2 max-w-[11ch] text-[15px] leading-[1.35] font-medium text-primary-900/80">
            rekaman sinyal setiap hari
          </p>
        </div>

        <span
          aria-hidden="true"
          className="appear-at absolute hidden -translate-x-full rounded-full @min-[440px]:block bg-af-700 px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap text-white shadow-[0_10px_24px_rgba(200,38,79,0.25)]"
          style={
            {
              left: `${afDot.x / 4 - 3}%`,
              top: "27%",
              "--at": afEventAt + 0.02,
            } as React.CSSProperties
          }
        >
          02.12 · AF terdeteksi
        </span>

        {/* Leave the loop around the outside of the dial. */}
        <ThreadPoint className="top-1/2 left-[calc(100%+14px)]" dir="down" />
      </div>

      <figcaption className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 px-6 text-[14px] font-medium text-primary-900/80 lg:px-0">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-5 rounded-[3px] bg-paper-deep"
          />{" "}
          waktu tidur
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-[3px] rounded-full bg-primary-300"
          />{" "}
          satu rekaman, tiap 3 menit
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-full bg-af-500" />{" "}
          contoh AF terdeteksi
        </span>
      </figcaption>

      {/* Mobile: tuck under the legend before returning to the rail. */}
      <ThreadPoint className="-bottom-10 left-1/2 lg:hidden" dir="left" />
    </figure>
  );
}
