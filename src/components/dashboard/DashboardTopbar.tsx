"use client";

import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";

import {
  ProfileAvatar,
  profileInitials,
} from "@/components/dashboard/ProfileAvatar";
import { useProfile } from "@/features/profile/client/ProfileProvider";

type DashboardTopbarProps = {
  showNotificationLink: boolean;
  title: string;
  hasUnread?: boolean;
};

const notificationButtonClassName =
  "grid h-11 w-11 place-items-center rounded-[12px] border border-primary-900/15 bg-white text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300";

export function DashboardTopbar({
  showNotificationLink,
  title,
  hasUnread = false,
}: DashboardTopbarProps) {
  const { user } = useProfile();
  const fullname = user?.fullname ?? "Akun";

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
      <span className="truncate text-[1rem] font-bold tracking-[-0.02em] text-primary-900">
        {title}
      </span>

      <div className="flex shrink-0 items-center gap-3">
        {showNotificationLink ? (
          <Link
            aria-label="Buka notifikasi di dashboard"
            className={`${notificationButtonClassName} relative`}
            href="/dashboard"
          >
            <Bell aria-hidden="true" size={20} strokeWidth={1.9} />
            {hasUnread && (
              <span className="absolute top-[9px] right-[9px] h-2.5 w-2.5 rounded-full bg-af-500 ring-2 ring-white"></span>
            )}
          </Link>
        ) : null}
        <Link
          aria-label={`Buka profil ${fullname}`}
          className="flex h-11 items-center gap-2.5 rounded-full border border-primary-900/15 bg-white pr-3 pl-1.5 text-[0.875rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300 sm:pr-4"
          href="/profil"
        >
          <span aria-hidden="true" className="contents">
            {user ? (
              <ProfileAvatar
                className="h-8 w-8 border-0 text-[0.8125rem]"
                fullname={user.fullname}
                profileImage={user.profileImage}
              />
            ) : (
              <span
                className="grid h-8 w-8 place-items-center rounded-full bg-primary-800 text-[0.8125rem] font-semibold text-white before:content-[attr(data-initials)]"
                data-initials={profileInitials(fullname)}
              />
            )}
          </span>
          <span className="hidden max-w-40 truncate sm:inline">{fullname}</span>
          <ChevronRight
            aria-hidden="true"
            className="size-4 text-primary-900/70"
            strokeWidth={2}
          />
        </Link>
      </div>
    </div>
  );
}
