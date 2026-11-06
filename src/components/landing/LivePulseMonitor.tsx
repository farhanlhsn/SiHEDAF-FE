"use client";

import type { ReactNode } from "react";
import { HeartPulse, TriangleAlert } from "lucide-react";

import { useLivePulse } from "@/components/landing/hooks/UseLivePulse";

type LivePulseMonitorProps = {
  children?: ReactNode;
};

export function LivePulseMonitor({ children }: LivePulseMonitorProps) {
  const { canvasRef, containerRef, readout } = useLivePulse();
  const isIrregular = readout.rhythm === "af";

  return (
    <figure className="relative">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-3 px-5 pb-3 lg:px-10">
        <p className="text-[0.75rem] font-semibold tracking-[0.08em] text-primary-900/70 uppercase">
          Ilustrasi sinyal PPG
        </p>
        <div aria-hidden="true" className="flex items-center gap-3 text-[0.8125rem]">
          <span className="inline-flex items-baseline gap-1.5 font-medium text-primary-900/75">
            <HeartPulse
              className="heartbeat size-4 self-center text-af-500"
              strokeWidth={2.25}
            />
            <span className="w-[3ch] text-right text-[1.25rem] font-semibold tabular-nums tracking-[-0.03em] text-primary-900">
              {readout.bpm}
            </span>
            bpm
          </span>
          <span
            className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[0.75rem] font-semibold transition-colors duration-300 ${
              isIrregular
                ? "bg-af-50 text-af-700"
                : "bg-primary-50 text-primary-500"
            }`}
          >
            {isIrregular ? (
              <TriangleAlert className="size-3.5" strokeWidth={2.25} />
            ) : (
              <span className="size-1.5 rounded-full bg-current" />
            )}
            {isIrregular ? "Irama tidak teratur" : "Irama normal"}
          </span>
        </div>
      </div>

      <div
        className="relative h-[210px] border-y border-primary-900/10 sm:h-[250px] lg:h-[270px]"
        ref={containerRef}
      >
        <canvas
          aria-hidden="true"
          className="absolute inset-0 size-full"
          ref={canvasRef}
        />

        {readout.afStart !== null ? (
          <div
            aria-hidden="true"
            className="af-tag pointer-events-none absolute top-3 z-20"
            key={Math.round(readout.afStart * 1000)}
            style={{ left: `${readout.afStart * 100}%` }}
          >
            <span className="flex items-center gap-1.5 rounded-md bg-af-700 px-2.5 py-1.5 text-[0.75rem] font-semibold whitespace-nowrap text-white shadow-[0_8px_20px_rgba(200,38,79,0.25)]">
              <TriangleAlert className="size-3.5" strokeWidth={2.25} />
              AF? Jarak detak acak
            </span>
            <span className="ml-1.5 block h-10 w-px bg-af-500/70" />
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-y-0 left-[66%] z-10 flex -translate-x-1/2 items-center lg:left-[72%]">
          {children}
        </div>
      </div>

      <figcaption className="sr-only">
        Ilustrasi sinyal PPG: garis biru menunjukkan irama normal dengan jarak
        antar detak yang rata, lalu berubah menjadi garis merah muda saat jarak
        antar detak menjadi acak seperti pada Atrial Fibrillation.
      </figcaption>
    </figure>
  );
}
