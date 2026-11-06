import Link from "next/link";

import { HeartDrawing } from "@/components/landing/LineArt";
import { ThreadPoint } from "@/components/landing/ThreadPoint";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

const startSteps = [
  "Daftar akun",
  "Hubungkan Device ID",
  "Pantau dari dashboard",
];

export function CtaSection() {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative pt-32 pb-28 lg:pt-40 lg:pb-32"
      id="cta"
    >
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <div className="grid items-center gap-14 pl-10 lg:grid-cols-12 lg:gap-10 lg:pl-14">
          <div
            className="relative flex justify-center lg:col-span-5"
            data-thread-for="heart"
          >
            <ThreadPoint className="top-0 left-1/2" target="heart" to="jump" />
            <HeartDrawing className="h-auto w-[240px] lg:w-[330px]" />
            <ThreadPoint
              className="bottom-[1%] left-1/2"
              lead={-180}
              to="end"
            />
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <h2
              className="text-[clamp(2.6rem,5vw,5rem)] leading-[0.95] tracking-[-0.05em] text-primary-900"
              id="cta-title"
            >
              <span className="block font-bold">
                Jantungmu kerja tanpa henti.
              </span>
              <span className="block font-extralight">
                Biar SiHEDAF yang berjaga.
              </span>
            </h2>

            <ol className="mt-10 flex flex-wrap gap-x-3 gap-y-3 text-[16px] font-medium text-primary-900">
              {startSteps.map((step, index) => (
                <li className="flex items-center gap-3" key={step}>
                  <span className="grid size-7 place-items-center rounded-full border-[1.5px] border-primary-300 text-[13px] font-semibold text-primary-500 tabular-nums">
                    {index + 1}
                  </span>
                  {step}
                  {index < startSteps.length - 1 ? (
                    <span aria-hidden="true" className="text-primary-900/70">
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                className="btn-primary group inline-flex h-14 items-center gap-3 rounded-full bg-primary-900 pr-6 pl-7 text-[16px] font-semibold text-white"
                href="/register"
              >
                Daftar sekarang
                <ArrowIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                className="link-underline text-[16px] font-semibold text-primary-900"
                href="/login"
              >
                Sudah punya akun? Masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
