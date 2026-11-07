import Image from "next/image";
import Link from "next/link";

import {
  DashboardIcon,
  type DashboardIconName,
} from "@/components/dashboard/DashboardIcon";

type DashboardSidebarProps = {
  collapsed: boolean;
  onNavigate: () => void;
  pathname: string;
};

const navigation: Array<{
  href: string;
  icon: DashboardIconName;
  label: string;
}> = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/riwayat", icon: "history", label: "Riwayat Analisis" },
  { href: "/profil", icon: "profile", label: "Profil" },
];

/**
 * Navigation drawn as stops on one line, echoing the landing page thread:
 * the current page is the filled stop.
 */
export function DashboardSidebar({
  collapsed,
  onNavigate,
  pathname,
}: DashboardSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-paper">
      <Link
        aria-label="SiHEDAF"
        className={`flex h-[72px] shrink-0 items-center overflow-hidden border-b border-primary-900/10 ${
          collapsed ? "justify-center px-3" : "px-6"
        }`}
        href="/dashboard"
      >
        <Image
          alt="Logo SiHEDAF"
          height={30}
          preload
          src="/logo.png"
          width={30}
        />
        <span
          className={`ml-3 text-[1.1875rem] font-bold tracking-[-0.035em] whitespace-nowrap text-primary-900 transition-[opacity,max-width,margin] duration-300 ${
            collapsed ? "ml-0 max-w-0 opacity-0" : "max-w-28 opacity-100"
          }`}
        >
          SiHEDAF
        </span>
      </Link>

      <nav aria-label="Navigasi dashboard" className="relative px-4 py-8">
        <span
          aria-hidden="true"
          className={`absolute top-[60px] h-[128px] w-[2px] rounded-full bg-primary-900/15 transition-[left] duration-300 ${
            collapsed ? "left-[41px]" : "left-[45px]"
          }`}
          data-rail
        />
        <ul className="relative space-y-2">
          {navigation.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex h-14 items-center rounded-[14px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-primary-300 ${
                    collapsed ? "justify-center px-0" : "gap-3.5 px-3"
                  } ${isActive ? "bg-white" : "hover:bg-paper-deep"}`}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 ${
                      isActive
                        ? "border-primary-900 bg-primary-900 text-white"
                        : "border-primary-900/20 bg-paper text-primary-900 group-hover:border-primary-900/40"
                    }`}
                  >
                    <DashboardIcon
                      className="h-[18px] w-[18px]"
                      name={item.icon}
                    />
                  </span>
                  <span
                    className={`overflow-hidden text-[0.9375rem] whitespace-nowrap transition-[opacity,max-width] duration-300 ${
                      collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
                    } ${
                      isActive
                        ? "font-bold text-primary-900"
                        : "font-medium text-primary-900/75 group-hover:text-primary-900"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto px-6 pb-6">
        <p
          className={`overflow-hidden text-[0.8125rem] whitespace-nowrap text-primary-900/70 transition-opacity duration-200 ${
            collapsed ? "opacity-0" : "opacity-100"
          }`}
        >
          Bukan pengganti diagnosis dokter.
        </p>
      </div>
    </div>
  );
}
