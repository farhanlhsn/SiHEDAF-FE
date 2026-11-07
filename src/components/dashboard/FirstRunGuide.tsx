import { Check } from "lucide-react";

import type { FirstRunStep, StepStatus } from "@/components/dashboard/FirstRun";

const copy: Record<FirstRunStep["id"], { title: string; body: string }> = {
  wear: {
    title: "Pakai wristband",
    body: "Kenakan SiHEDAF di pergelangan tangan dan pastikan statusnya Terhubung.",
  },
  monitor: {
    title: "Mulai monitoring",
    body: "Tekan Mulai Monitoring. Sinyal PPG akan direkam secara berkala.",
  },
  result: {
    title: "Tunggu hasil AI",
    body: "Hentikan monitoring untuk melihat hasil analisis pertamamu.",
  },
};

const statusText: Record<StepStatus, string> = {
  done: "Selesai",
  current: "Sedang berjalan",
  todo: "Belum",
};

type FirstRunGuideProps = {
  steps: FirstRunStep[];
};

/** Three-stop rail that walks a brand-new user to their first analysis. */
export function FirstRunGuide({ steps }: FirstRunGuideProps) {
  return (
    <ol
      aria-label="Langkah menjalankan analisis pertama"
      className="mt-7 max-w-[640px]"
    >
      {steps.map((step, index) => {
        const isDone = step.status === "done";
        const isCurrent = step.status === "current";

        return (
          <li
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex gap-4 pb-7 last:pb-0"
            key={step.id}
          >
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={`absolute top-[28px] bottom-[2px] left-[10px] ${
                  isDone
                    ? "w-[2.5px] bg-primary-300"
                    : "border-l-2 border-dashed border-primary-900/20"
                }`}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`relative mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full ${
                isDone
                  ? "bg-primary-300 text-white"
                  : isCurrent
                    ? "border-[2.5px] border-primary-300 bg-paper"
                    : "border-2 border-dashed border-primary-900/30 bg-paper"
              }`}
            >
              {isDone ? <Check className="size-3.5" strokeWidth={3} /> : null}
              {isCurrent ? <span className="live-dot !bg-primary-300" /> : null}
            </span>
            <div className="min-w-0">
              <p
                className={`text-[17px] ${
                  isCurrent
                    ? "font-bold text-primary-900"
                    : "font-semibold text-primary-900/80"
                }`}
              >
                {copy[step.id].title}
                <span className="sr-only"> ({statusText[step.status]})</span>
              </p>
              <p className="mt-1 text-[15px] leading-[1.55] text-primary-900/80">
                {copy[step.id].body}
              </p>
              {step.id === "monitor" ? (
                <a
                  className="mt-1.5 inline-block rounded-sm text-[15px] font-semibold text-primary-500 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
                  href="#monitor"
                >
                  Ke kartu sinyal PPG
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
