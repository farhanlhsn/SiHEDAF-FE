import Link from "next/link";

import { MobileNavigation } from "@/components/sections/MobileNavigation";
import {
  publicNavigation,
  type PublicPage,
} from "@/components/sections/PublicNavigation";
import { BrandLogo } from "@/components/ui/BrandLogo";

type HeaderSectionProps = {
  activePage?: PublicPage;
};

export function HeaderSection({ activePage = "home" }: HeaderSectionProps) {
  return (
    <header className="relative z-50 h-[76px] md:sticky md:top-0" id="top">
      <div className="header-bar fixed inset-x-0 top-0 z-50 border-b md:static">
        <div className="relative mx-auto flex h-[76px] w-full max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <BrandLogo />

          <nav
            aria-label="Navigasi utama"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex"
          >
            {publicNavigation.map((item) => {
              const isActive = item.page === "team" && activePage === "team";

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`nav-pulse text-[0.9375rem] font-medium transition-colors duration-200 hover:text-primary-900 ${
                    isActive ? "text-primary-900" : "text-primary-900/75"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-6">
            <Link
              className="nav-pulse hidden text-[0.9375rem] font-semibold text-primary-900 sm:inline-flex"
              href="/login"
            >
              Masuk
            </Link>
            <Link
              className="btn-primary hidden h-11 items-center rounded-full bg-primary-900 px-6 text-[0.875rem] font-semibold text-white md:inline-flex"
              href="/register"
            >
              Daftar
            </Link>
            <MobileNavigation activePage={activePage} />
          </div>
        </div>
      </div>
    </header>
  );
}
