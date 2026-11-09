import Image from "next/image";
import Link from "next/link";

import { LivePulseMonitor } from "@/components/landing/LivePulseMonitor";
import { ThreadPoint } from "@/components/landing/ThreadPoint";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[calc(100svh-76px)] flex-col justify-between gap-12 pt-10 lg:pt-14"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 lg:px-10">
        <h1
          className="hero-stagger text-[clamp(3.1rem,7.6vw,8rem)] leading-[0.9] tracking-[-0.06em] text-primary-900"
          id="hero-title"
          style={{ "--stagger": 1 } as React.CSSProperties}
        >
          <span className="block font-extralight">Jantungmu bisa</span>
          <span className="block font-bold">
            berdetak <span className="text-af-500">kacau</span>
          </span>
          <span className="block font-extralight">tanpa terasa.</span>
        </h1>

        <div
          className="hero-stagger mt-10 grid gap-7 lg:grid-cols-12 lg:items-end"
          style={{ "--stagger": 2 } as React.CSSProperties}
        >
          <p className="max-w-[520px] text-[1.125rem] leading-[1.55] text-primary-900/80 lg:col-span-5">
            SiHEDAF memantau irama jantungmu dari pergelangan tangan dan memberi
            tahu kamu lebih awal, sebelum berujung stroke.
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4 lg:col-span-5 lg:col-start-8 lg:justify-end">
            <Link
              className="btn-primary group inline-flex h-14 items-center gap-3 rounded-full bg-primary-900 pr-6 pl-7 text-[1rem] font-semibold text-white"
              href="/register"
            >
              Daftar sekarang
              <ArrowIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <a
              className="link-underline text-[1rem] font-semibold text-primary-900"
              href="#cara-kerja"
            >
              Lihat cara kerjanya
            </a>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className="hero-stagger"
          style={{ "--stagger": 3 } as React.CSSProperties}
        >
          <LivePulseMonitor>
            <Image
              alt="Jam tangan pintar SiHEDAF untuk pemantauan jantung portabel"
              className="watch-float h-auto w-[clamp(104px,10vw,160px)] drop-shadow-[0_26px_30px_rgba(0,39,88,0.22)]"
              height={443}
              preload
              src="/watch.png"
              width={277}
            />
          </LivePulseMonitor>
        </div>
        {/* The thread starts where the monitor strip ends. */}
        <ThreadPoint className="bottom-0 left-[31px] lg:hidden" dir="down" />
        <ThreadPoint
          className="right-[12%] bottom-0 hidden lg:block"
          dir="down"
        />
      </div>
    </section>
  );
}
