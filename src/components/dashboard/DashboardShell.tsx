"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, PanelRightOpen } from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { OfflineBanner } from "@/components/dashboard/OfflineBanner";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { ProfileProvider } from "@/features/profile/client/ProfileProvider";

import type { UserProfile } from "@/features/profile/shared/ProfileTypes";

type DashboardShellProps = Readonly<{
  children: React.ReactNode;
  initialUser?: UserProfile | null;
}>;

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/profil": "Profil",
  "/profil/ubah": "Profil",
  "/riwayat": "Riwayat",
  "/riwayat/laporan": "Laporan",
};

export function DashboardShell({ children, initialUser }: DashboardShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // null = use CSS responsive defaults, true = user forced open, false = user forced closed
  const [notifState, setNotifState] = useState<boolean | null>(null);

  const isDashboardRoute = pathname === "/dashboard";

  const isNotifOpenMobile = notifState ?? false; // closed by default on mobile
  const isNotifOpenDesktop = notifState ?? true; // open by default on desktop

  return (
    <ProfileProvider initialUser={initialUser}>
      <div className="min-h-dvh bg-paper text-primary-900 print:min-h-0 print:bg-white">
        <div className="flex min-h-dvh print:block print:min-h-0">
          <button
            aria-label="Tutup menu navigasi"
            className={`fixed inset-0 z-30 bg-primary-900/30 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden print:hidden ${
              isMobileOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
            onClick={() => setIsMobileOpen(false)}
            tabIndex={isMobileOpen ? 0 : -1}
            type="button"
          />

          <aside
            className={`print:hidden fixed inset-y-0 left-0 z-40 w-[260px] shrink-0 border-r border-primary-900/10 bg-paper shadow-[12px_0_40px_rgba(0,39,88,0.12)] transition-[width,transform] duration-300 ease-out lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 lg:shadow-none ${
              isMobileOpen ? "translate-x-0" : "-translate-x-full"
            } ${isCollapsed ? "lg:w-[84px]" : "lg:w-[240px]"}`}
          >
            <DashboardSidebar
              collapsed={isCollapsed && !isMobileOpen}
              onNavigate={() => setIsMobileOpen(false)}
              pathname={pathname}
            />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col print:block">
            <header className="print:hidden sticky top-0 z-20 flex h-[72px] shrink-0 items-center gap-3.5 border-b border-primary-900/10 bg-paper/90 px-4 backdrop-blur-xl sm:px-7">
              <button
                aria-expanded={isMobileOpen}
                aria-label={
                  isMobileOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar"
                }
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-primary-900/15 bg-white text-primary-900 transition-[color,background-color,transform] duration-200 hover:bg-paper-deep active:scale-95 focus-visible:outline-2 focus-visible:outline-primary-300 lg:hidden"
                onClick={() => {
                  if (!isMobileOpen) {
                    setNotifState(false);
                  }
                  setIsMobileOpen(!isMobileOpen);
                }}
                type="button"
              >
                {isMobileOpen ? (
                  <PanelLeftClose
                    aria-hidden="true"
                    size={19}
                    strokeWidth={1.7}
                  />
                ) : (
                  <PanelLeftOpen
                    aria-hidden="true"
                    size={19}
                    strokeWidth={1.7}
                  />
                )}
              </button>
              <button
                aria-expanded={!isCollapsed}
                aria-label={
                  isCollapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"
                }
                className="hidden h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-primary-900/15 bg-white text-primary-900 transition-[color,background-color,transform] duration-200 hover:bg-paper-deep active:scale-95 focus-visible:outline-2 focus-visible:outline-primary-300 lg:grid"
                onClick={() => setIsCollapsed((current) => !current)}
                type="button"
              >
                {isCollapsed ? (
                  <PanelLeftOpen
                    aria-hidden="true"
                    size={19}
                    strokeWidth={1.7}
                  />
                ) : (
                  <PanelLeftClose
                    aria-hidden="true"
                    size={19}
                    strokeWidth={1.7}
                  />
                )}
              </button>
              <DashboardTopbar
                showNotificationLink={!isDashboardRoute}
                title={routeTitles[pathname] ?? "Dashboard"}
                hasUnread={hasUnread}
              />
            </header>
            <OfflineBanner />

            <div className="relative flex min-w-0 flex-1 flex-col xl:flex-row print:block">
              {isDashboardRoute ? (
                <button
                  aria-label="Tampilkan notifikasi"
                  className={`print:hidden fixed right-5 top-[96px] z-30 h-11 w-11 items-center justify-center rounded-[12px] border border-primary-900/15 bg-white text-primary-900 shadow-[0_10px_24px_rgba(0,39,88,0.08)] transition-all duration-200 sm:right-7 ${
                    isNotifOpenMobile ? "hidden" : "flex"
                  } ${isNotifOpenDesktop ? "xl:hidden" : "xl:flex"} ${
                    isMobileOpen
                      ? "opacity-40 blur-[1px] pointer-events-none"
                      : "hover:bg-paper-deep active:scale-95 focus-visible:outline-2 focus-visible:outline-primary-300"
                  }`}
                  onClick={() => {
                    setNotifState(true);
                    setIsMobileOpen(false);
                  }}
                  title="Tampilkan notifikasi"
                  type="button"
                >
                  <PanelRightOpen
                    aria-hidden="true"
                    size={19}
                    strokeWidth={1.7}
                  />
                  {hasUnread && (
                    <span className="absolute top-[9px] right-[9px] h-2.5 w-2.5 rounded-full bg-af-500 ring-2 ring-white"></span>
                  )}
                </button>
              ) : null}

              <main className="min-w-0 flex-1" key={pathname}>
                <div className="dashboard-enter min-h-full">{children}</div>
              </main>

              {isDashboardRoute ? (
                <>
                  <button
                    aria-label="Tutup notifikasi"
                    className={`fixed inset-0 z-30 bg-primary-900/30 backdrop-blur-[2px] transition-opacity duration-300 xl:hidden print:hidden ${
                      isNotifOpenMobile
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0"
                    }`}
                    onClick={() => setNotifState(false)}
                    tabIndex={isNotifOpenMobile ? 0 : -1}
                    type="button"
                  />
                  <div
                    className={`print:hidden fixed inset-y-0 right-0 z-40 shrink-0 overflow-hidden bg-paper shadow-[-12px_0_40px_rgba(0,39,88,0.12)] transition-[transform,width,opacity,visibility] duration-300 ease-out xl:sticky xl:top-[72px] xl:h-[calc(100dvh-72px)] xl:shadow-none ${
                      isNotifOpenMobile
                        ? "visible w-full max-w-[360px] translate-x-0 opacity-100"
                        : "invisible w-full max-w-[360px] translate-x-full opacity-0"
                    } xl:translate-x-0 ${
                      isNotifOpenDesktop
                        ? "xl:visible xl:w-[340px] xl:opacity-100"
                        : "xl:invisible xl:w-0 xl:opacity-0"
                    }`}
                  >
                    <NotificationPanel
                      onClose={() => setNotifState(false)}
                      onUnreadChange={setHasUnread}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </ProfileProvider>
  );
}
