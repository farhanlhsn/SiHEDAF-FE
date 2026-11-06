import { Check } from "lucide-react";

const journeySteps = [
  "Daftar akun",
  "Masuk",
  "Hubungkan perangkat",
  "Pantau di dashboard",
];

export type JourneyStep = 0 | 1 | 2;

type AuthJourneyProps = {
  current: JourneyStep;
};

/**
 * The onboarding route drawn as a line with stops, matching the landing
 * page's thread, so people always know which step they are on.
 */
export function AuthJourney({ current }: AuthJourneyProps) {
  return (
    <nav aria-label="Langkah memulai SiHEDAF">
      <p className="text-[0.875rem] font-semibold text-primary-900/80 lg:hidden">
        Langkah {current + 1} dari {journeySteps.length}:{" "}
        <span className="text-primary-900">{journeySteps[current]}</span>
      </p>
      <ol className="mt-3 flex items-center gap-2 lg:hidden" aria-hidden="true">
        {journeySteps.map((step, index) => (
          <li
            className={`h-1.5 flex-1 rounded-full ${
              index <= current ? "bg-primary-300" : "bg-primary-900/12"
            }`}
            key={step}
          />
        ))}
      </ol>

      <ol className="hidden lg:block">
        {journeySteps.map((step, index) => {
          const isDone = index < current;
          const isCurrent = index === current;

          return (
            <li
              aria-current={isCurrent ? "step" : undefined}
              className="relative flex items-center gap-4 pb-7 last:pb-0"
              key={step}
            >
              {index < journeySteps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`absolute top-[24px] bottom-[2px] left-[10px] ${
                    isDone
                      ? "w-[2.5px] bg-primary-300"
                      : "border-l-2 border-dashed border-primary-900/20"
                  }`}
                />
              ) : null}
              <span
                aria-hidden="true"
                className={`relative grid size-[22px] shrink-0 place-items-center rounded-full ${
                  isDone
                    ? "bg-primary-300 text-white"
                    : isCurrent
                      ? "border-[2.5px] border-primary-300 bg-paper"
                      : "border-2 border-dashed border-primary-900/30 bg-paper"
                }`}
              >
                {isDone ? <Check className="size-3.5" strokeWidth={3} /> : null}
                {isCurrent ? (
                  <span className="live-dot !bg-primary-300" />
                ) : null}
              </span>
              <span
                className={`text-[1rem] ${
                  isCurrent
                    ? "font-bold text-primary-900"
                    : "font-medium text-primary-900/75"
                }`}
              >
                {step}
              </span>
              {isDone ? <span className="sr-only">(selesai)</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
