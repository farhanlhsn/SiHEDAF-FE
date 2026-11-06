"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import {
  publicNavigation,
  type PublicPage,
} from "@/components/sections/PublicNavigation";

type MobileNavigationProps = {
  activePage: PublicPage;
};

export function MobileNavigation({ activePage }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <button
        aria-controls="mobile-navigation-menu"
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
        className="grid h-10 w-10 place-items-center rounded-full text-primary-900 transition-colors duration-300 hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 md:hidden"
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        {isMenuOpen ? (
          <X aria-hidden="true" size={20} strokeWidth={2} />
        ) : (
          <Menu aria-hidden="true" size={20} strokeWidth={2} />
        )}
      </button>

      <div
        className={`absolute inset-x-0 top-[76px] z-10 transition-[opacity,visibility,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
          isMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "pointer-events-none invisible -translate-y-2 opacity-0"
        }`}
        data-mobile-menu-overlay
      >
        <div
          className="overflow-hidden border-b border-primary-900/10 bg-paper shadow-[0_24px_40px_rgba(0,39,88,0.08)]"
          id="mobile-navigation-menu"
        >
          <nav aria-label="Menu mobile" className="flex flex-col py-3">
            {publicNavigation.map((item) => {
              const isActive = item.page === "team" && activePage === "team";

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`px-5 py-3.5 text-[1.375rem] font-semibold tracking-[-0.03em] transition-colors duration-200 hover:bg-paper-deep ${
                    isActive ? "text-primary-300" : "text-primary-900"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-col gap-3 border-t border-primary-900/10 px-5 py-5">
            <Link
              className="flex h-12 items-center justify-center rounded-full bg-primary-900 text-[0.9375rem] font-semibold text-white transition-colors duration-300 hover:bg-primary-800"
              href="/register"
              onClick={() => setIsMenuOpen(false)}
            >
              Daftar
            </Link>
            <Link
              className="flex h-12 items-center justify-center rounded-full border border-primary-900/20 text-[0.9375rem] font-semibold text-primary-900 transition-colors duration-300 hover:bg-paper-deep"
              href="/login"
              onClick={() => setIsMenuOpen(false)}
            >
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
