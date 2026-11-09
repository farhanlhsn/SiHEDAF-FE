"use client";

import { useIsStandalone } from "@/components/ui/hooks/UseIsStandalone";

const steps = [
  {
    platform: "iPhone / iPad",
    text: "Buka di Safari → ketuk Bagikan → pilih Tambahkan ke Layar Utama.",
  },
  {
    platform: "Android",
    text: "Buka di Chrome → ketuk menu ⋮ → pilih Instal aplikasi atau Tambahkan ke layar utama.",
  },
];

export function InstallGuide() {
  const isStandalone = useIsStandalone();
  if (isStandalone !== false) return null;

  return (
    <article className="mt-6 overflow-hidden rounded-[24px] border border-primary-900/15 bg-white">
      <h2 className="px-6 pt-5 text-[1.25rem] font-bold tracking-[-0.03em] text-primary-900 sm:px-7">
        Pasang SiHEDAF di HP
      </h2>
      <p className="px-6 pt-2 text-[0.9375rem] text-primary-900/80 sm:px-7">
        Tambahkan ke layar utama supaya bisa dibuka seperti aplikasi.
      </p>
      <dl className="mt-4 divide-y divide-primary-900/[0.07] border-t border-primary-900/10">
        {steps.map((step) => (
          <div className="px-6 py-4 sm:px-7" key={step.platform}>
            <dt className="text-[0.9375rem] font-semibold text-primary-900">
              {step.platform}
            </dt>
            <dd className="mt-1 text-[0.9375rem] leading-[1.5] text-primary-900/80">
              {step.text}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
