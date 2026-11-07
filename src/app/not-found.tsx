import Link from "next/link";

import { FooterSection } from "@/components/sections/FooterSection";
import { HeaderSection } from "@/components/sections/HeaderSection";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { SignalLost } from "@/components/ui/SignalLost";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-primary-900">
      <HeaderSection />
      <main className="page-enter flex flex-1 flex-col justify-center py-16 lg:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-5 lg:px-10">
          <p className="flex items-center gap-3 text-[0.9375rem] font-semibold text-primary-500">
            <span className="tabular-nums">404</span>
            <span aria-hidden="true" className="h-px w-8 bg-primary-300" />
            Sinyal hilang
          </p>
          <h1 className="mt-5 max-w-[900px] text-[clamp(2.6rem,6vw,6rem)] leading-[0.95] tracking-[-0.055em]">
            <span className="font-bold">Halaman ini</span>{" "}
            <span className="font-extralight">tidak ditemukan.</span>
          </h1>
          <p className="mt-6 max-w-[520px] text-[1.125rem] leading-[1.6] text-primary-900/80">
            Tautannya mungkin salah ketik, atau halamannya sudah dipindahkan.
            Coba mulai lagi dari beranda.
          </p>
        </div>

        <SignalLost className="my-12 lg:my-16" />

        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-7 gap-y-4 px-5 lg:px-10">
          <Link
            className="btn-primary group inline-flex h-14 items-center gap-3 rounded-full bg-primary-900 pr-6 pl-7 text-[1rem] font-semibold text-white"
            href="/"
          >
            Kembali ke beranda
            <ArrowIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <Link
            className="link-underline text-[1rem] font-semibold text-primary-900"
            href="/dashboard"
          >
            Buka dashboard
          </Link>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
