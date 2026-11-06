import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { JourneyStep } from "@/components/auth/AuthJourney";
import {
  AuthVisualPanel,
  type AuthIllustration,
  type AuthTitle,
} from "@/components/auth/AuthVisualPanel";
import { BrandLogo } from "@/components/ui/BrandLogo";

type AuthShellProps = {
  title: AuthTitle;
  description: string;
  journeyStep?: JourneyStep;
  illustration: AuthIllustration;
  children: ReactNode;
};

export function AuthShell({
  title,
  description,
  journeyStep,
  illustration,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-primary-900">
      <header className="shrink-0 border-b border-primary-900/10">
        <div className="mx-auto flex h-[76px] w-full max-w-[1600px] items-center justify-between px-5 lg:px-10">
          <BrandLogo />
          <Link
            className="nav-pulse inline-flex items-center gap-2 text-[15px] font-semibold text-primary-900"
            href="/"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.25}
            />
            Beranda
          </Link>
        </div>
      </header>

      <main className="page-enter flex min-h-0 flex-1 flex-col lg:flex-row">
        <AuthVisualPanel
          description={description}
          illustration={illustration}
          journeyStep={journeyStep}
          title={title}
        />

        <section className="flex w-full flex-1 items-start justify-center px-5 py-10 sm:px-10 lg:items-center lg:py-14 xl:px-20">
          <div className="w-full max-w-[560px]">{children}</div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-primary-900/10">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1600px] flex-col justify-center gap-1 px-5 py-4 text-[13px] text-primary-900/75 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>© 2026 SiHEDAF</p>
          <p>Alat bantu deteksi dini, bukan pengganti diagnosis dokter.</p>
        </div>
      </footer>
    </div>
  );
}
