import { InView } from "@/components/landing/InView";

/** "Hampir 50%" of AF cases go undiagnosed → 48 of 100 hollow. */
const undiagnosedOutOf100 = 48;

function UndiagnosedDots() {
  return (
    <div className="mt-8">
      <div
        aria-label={`Dari 100 kasus AF, sekitar ${undiagnosedOutOf100} tidak terdiagnosis`}
        className="grid w-full max-w-[300px] grid-cols-10 gap-[7px]"
        role="img"
      >
        {Array.from({ length: 100 }, (_, index) => {
          const isUndiagnosed = index >= 100 - undiagnosedOutOf100;

          return (
            <span
              className={`pop aspect-square rounded-full ${
                isUndiagnosed ? "border-2 border-af-500" : "bg-primary-300"
              }`}
              key={index}
              style={{ "--i": index } as React.CSSProperties}
            />
          );
        })}
      </div>
      <p
        aria-hidden="true"
        className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-medium text-primary-900/80"
      >
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-primary-300" /> terdiagnosis
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full border-2 border-af-500" /> tidak
          terdiagnosis
        </span>
      </p>
    </div>
  );
}

function RiskBars() {
  const rows = [
    {
      label: "Tanpa AF",
      value: "1×",
      solid: 1,
      range: 0,
      tone: "bg-primary-900/30",
    },
    {
      label: "Dengan AF",
      value: "5–7×",
      solid: 5,
      range: 2,
      tone: "bg-af-500",
    },
  ];

  return (
    <div
      aria-label="Risiko stroke: 1 kali tanpa AF, 5 sampai 7 kali dengan AF"
      className="mt-8 space-y-4"
      role="img"
    >
      {rows.map((row, index) => (
        <div
          className="grid grid-cols-[92px_1fr_52px] items-center gap-3"
          key={row.label}
        >
          <span className="text-[14px] font-medium text-primary-900/80">
            {row.label}
          </span>
          <span className="relative flex h-4">
            <span
              className={`grow-x h-full rounded-l-[4px] ${row.range === 0 ? "rounded-r-[4px]" : ""} ${row.tone}`}
              style={
                {
                  width: `${(row.solid / 7) * 100}%`,
                  "--i": index,
                } as React.CSSProperties
              }
            />
            {row.range > 0 ? (
              <span
                className="grow-x hatch-af ml-[2px] h-full rounded-r-[4px]"
                style={
                  {
                    width: `${(row.range / 7) * 100}%`,
                    "--i": index + 1,
                  } as React.CSSProperties
                }
              />
            ) : null}
          </span>
          <span className="text-right text-[15px] font-semibold tabular-nums text-primary-900">
            {row.value}
          </span>
        </div>
      ))}
      <p className="text-[14px] text-primary-900/75">
        Garis arsir: rentang 5–7 kali.
      </p>
    </div>
  );
}

function StrokeShare() {
  return (
    <div
      aria-label="20 sampai 25 persen stroke iskemik berasal dari AF"
      className="mt-8"
      role="img"
    >
      <span className="relative flex h-4 overflow-hidden rounded-[4px] bg-primary-900/10">
        <span className="grow-x h-full w-[20%] bg-af-500" />
        <span
          className="grow-x hatch-af ml-[2px] h-full w-[5%]"
          style={{ "--i": 1 } as React.CSSProperties}
        />
      </span>
      <span
        aria-hidden="true"
        className="mt-2 flex justify-between text-[13px] font-medium tabular-nums text-primary-900/75"
      >
        <span>0%</span>
        <span>100% stroke iskemik</span>
      </span>
    </div>
  );
}

const facts = [
  {
    figure: "≈ 1 dari 2",
    text: "kasus AF tidak terdiagnosis karena sering datang tanpa gejala (silent AF).",
    chart: <UndiagnosedDots />,
  },
  {
    figure: "5–7×",
    text: "lebih tinggi risiko stroke pada penderita AF dibanding populasi umum.",
    chart: <RiskBars />,
  },
  {
    figure: "20–25%",
    text: "stroke iskemik berasal dari gumpalan darah di jantung akibat AF.",
    chart: <StrokeShare />,
  },
];

export function AfFacts() {
  return (
    <InView className="mt-32 grid gap-16 pl-10 lg:mt-48 lg:grid-cols-3 lg:gap-0 lg:pl-14">
      {facts.map((fact, index) => (
        <div
          className="reveal lg:border-l lg:border-primary-900/10 lg:px-10 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
          key={fact.figure}
          style={{ "--i": index } as React.CSSProperties}
        >
          <p className="text-[clamp(3rem,5vw,4.75rem)] leading-none font-bold tracking-[-0.055em] text-primary-900 tabular-nums">
            {fact.figure}
          </p>
          <p className="mt-4 max-w-[360px] text-[17px] leading-[1.5] text-primary-900/80">
            {fact.text}
          </p>
          {fact.chart}
        </div>
      ))}
    </InView>
  );
}
