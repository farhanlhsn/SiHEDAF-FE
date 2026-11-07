"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { BrandLogo } from "@/components/ui/BrandLogo";
import { SignalLost } from "@/components/ui/SignalLost";

type ErrorPageProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function ErrorPage({ error, unstable_retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-primary-900">
      <header className="border-b border-primary-900/10">
        <div className="mx-auto flex h-[76px] w-full max-w-[1440px] items-center px-5 lg:px-10">
          <BrandLogo />
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center py-16 lg:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-5 lg:px-10">
          <p className="flex items-center gap-3 text-[0.9375rem] font-semibold text-af-700">
            Terjadi kendala
          </p>
          <h1 className="mt-5 max-w-[900px] text-[clamp(2.6rem,6vw,6rem)] leading-[0.95] tracking-[-0.055em]">
            <span className="font-bold">Ada yang</span>{" "}
            <span className="font-extralight">tidak berjalan semestinya.</span>
          </h1>
          <p className="mt-6 max-w-[540px] text-[1.125rem] leading-[1.6] text-primary-900/80">
            Coba muat ulang halaman ini. Jika masih terjadi, tunggu beberapa
            saat lalu coba lagi. Data pemantauanmu tetap aman.
          </p>
        </div>

        <SignalLost className="my-12 lg:my-16" />

        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-7 gap-y-4 px-5 lg:px-10">
          <button
            className="btn-primary inline-flex h-14 items-center gap-3 rounded-full bg-primary-900 px-7 text-[1rem] font-semibold text-white"
            onClick={() => unstable_retry()}
            type="button"
          >
            <RotateCcw
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.25}
            />
            Coba lagi
          </button>
          <Link
            className="link-underline text-[1rem] font-semibold text-primary-900"
            href="/"
          >
            Kembali ke beranda
          </Link>
          {error.digest ? (
            <p className="w-full text-[0.875rem] text-primary-900/75">
              Kode kendala: <span className="font-mono">{error.digest}</span>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
