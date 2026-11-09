import Link from "next/link";

import { InView } from "@/components/landing/InView";
import { buildSvgPath, rhythmWindow } from "@/components/landing/PulseWaveform";
import { BrandLogo } from "@/components/ui/BrandLogo";

const footerNavigation = [
  { label: "Tentang", href: "/#tentang" },
  { label: "Fitur", href: "/#fitur" },
  { label: "Cara Kerja", href: "/#cara-kerja" },
  { label: "Tim Kami", href: "/tim-kami" },
];

const accountNavigation = [
  { label: "Masuk", href: "/login" },
  { label: "Daftar", href: "/register" },
];

const wordmark = "SiHEDAF".split("");

/** Same normal-rhythm strip as the "Bisa bedakan?" comparison, drawn once through the wordmark. */
const pulsePath = buildSvgPath(
  rhythmWindow({
    rhythm: "normal",
    samples: 420,
    seed: 21,
    beats: 7,
  }).points.map((point) => point.value * 0.92),
  1000,
  100,
);

export function FooterSection() {
  return (
    <footer className="relative overflow-hidden bg-primary-900 text-white">
      <div className="mx-auto max-w-[1440px] px-5 pt-20 lg:px-10 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <BrandLogo tone="light" />
            <p className="mt-6 text-[1.125rem] font-semibold tracking-[-0.02em] text-white">
              Sistem Hemat Energi Detektor Atrial Fibrilasi
            </p>
            <p className="mt-4 max-w-[480px] text-[0.9375rem] leading-[1.6] text-white/75">
              SiHEDAF adalah alat bantu deteksi dini, bukan pengganti diagnosis
              dokter. Jika kamu merasakan keluhan, segera konsultasikan ke
              tenaga kesehatan.
            </p>
          </div>

          <nav
            aria-label="Navigasi footer"
            className="grid grid-cols-2 gap-8 lg:col-span-5 lg:col-start-8"
          >
            <div>
              <p className="text-[0.8125rem] font-semibold tracking-[0.08em] text-white/70 uppercase">
                Jelajahi
              </p>
              <ul className="mt-4 space-y-3">
                {footerNavigation.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="footer-link text-[1rem] font-medium text-white"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.8125rem] font-semibold tracking-[0.08em] text-white/70 uppercase">
                Akun
              </p>
              <ul className="mt-4 space-y-3">
                {accountNavigation.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="footer-link text-[1rem] font-medium text-white"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <InView className="relative mt-20 -mb-[0.16em]">
          <p
            aria-hidden="true"
            className="text-[clamp(5rem,23vw,21rem)] leading-[0.8] font-bold tracking-[-0.075em] text-primary-700/70 select-none"
          >
            {wordmark.map((letter, index) => (
              <span
                className="footer-letter"
                key={`${letter}-${index}`}
                style={{ "--i": index } as React.CSSProperties}
              >
                {letter}
              </span>
            ))}
          </p>
          <svg
            aria-hidden="true"
            className="footer-pulse pointer-events-none absolute inset-x-0 top-[38%] h-[28%] w-full overflow-visible"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1000 100"
          >
            <path
              className="stroke-primary-300"
              d={pulsePath}
              pathLength="1"
              strokeLinejoin="round"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-primary-900/70"
          />
        </InView>
      </div>

      <div className="relative border-t border-white/10 bg-primary-900">
        <div className="mx-auto flex min-h-[88px] max-w-[1440px] flex-col items-start justify-center gap-2 px-5 py-6 text-[0.875rem] text-white/70 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>© 2026 SiHEDAF. Hak cipta dilindungi.</p>
          <p>Dibuat untuk deteksi dini, dengan sepenuh hati.</p>
        </div>
      </div>
    </footer>
  );
}
