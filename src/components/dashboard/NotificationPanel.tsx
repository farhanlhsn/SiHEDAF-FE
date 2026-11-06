"use client";

import { useEffect, useState } from "react";
import { Check, PanelRightClose } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { formatWib } from "@/components/dashboard/DashboardFormat";
import { StatusMark } from "@/components/dashboard/StatusMark";
import {
  apiFetch,
  SessionExpiredError,
} from "@/features/auth/session/client/ApiFetch";

type Notification = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationPanelProps = {
  onClose: () => void;
  onUnreadChange?: (hasUnread: boolean) => void;
};

export function NotificationPanel({
  onClose,
  onUnreadChange,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await apiFetch("/api/v1/notification");
        const json = await res.json();
        if (json.code === 200 && json.data) {
          setNotifications(json.data);
        }
      } catch (e) {
        if (e instanceof SessionExpiredError) return;
        console.error("Gagal memuat notifikasi:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const hasUnread = notifications.some((n) => !n.isRead);
      onUnreadChange?.(hasUnread);
    }
  }, [notifications, isLoading, onUnreadChange]);

  async function handleMarkAsRead(id: number, isRead: boolean) {
    if (isRead) return; // already read

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );

    try {
      await apiFetch(`/api/v1/notification/${id}/read`, { method: "PATCH" });
    } catch (e) {
      if (e instanceof SessionExpiredError) return;
      console.error("Gagal menandai dibaca:", e);
      // Revert if failed
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
    }
  }

  // Group notifications per day
  const grouped = notifications.reduce(
    (acc, notif) => {
      const date = new Date(notif.createdAt);
      let dayLabel = format(date, "d MMMM yyyy", { locale: localeId });
      if (isToday(date)) dayLabel = "Hari ini";
      else if (isYesterday(date)) dayLabel = "Kemarin";

      if (!acc[dayLabel]) acc[dayLabel] = [];
      acc[dayLabel].push(notif);
      return acc;
    },
    {} as Record<string, Notification[]>,
  );
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <aside className="h-full w-full overflow-y-auto bg-paper px-6 py-7 xl:min-h-[calc(100dvh-72px)] xl:w-[340px] xl:border-l xl:border-primary-900/10">
      <div className="flex items-center gap-3">
        <button
          aria-label="Sembunyikan notifikasi"
          className="grid h-10 w-10 place-items-center rounded-[12px] border border-primary-900/15 bg-white text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300"
          onClick={onClose}
          type="button"
        >
          <PanelRightClose aria-hidden="true" size={19} strokeWidth={1.9} />
        </button>
        <h2 className="text-[1.25rem] font-bold tracking-[-0.03em] text-primary-900">
          Notifikasi
        </h2>
        {unreadCount > 0 ? (
          <span className="ml-auto rounded-full bg-af-50 px-2.5 py-1 text-[0.8125rem] font-semibold text-af-700">
            {unreadCount} baru
          </span>
        ) : null}
      </div>

      <div className="mt-8 space-y-8">
        {isLoading ? (
          <p className="text-center text-[0.9375rem] text-primary-900/75">
            Memuat notifikasi...
          </p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-[0.9375rem] text-primary-900/75">
            Belum ada notifikasi.
          </p>
        ) : (
          Object.entries(grouped).map(([dayLabel, items]) => (
            <section key={dayLabel}>
              <h3 className="text-[0.8125rem] font-semibold tracking-[0.08em] text-primary-900/75 uppercase">
                {dayLabel}
              </h3>
              <ol className="relative mt-4">
                <span
                  aria-hidden="true"
                  className="absolute top-[18px] bottom-[18px] left-[17px] w-[2px] bg-primary-900/10"
                />
                {items.map((notif) => {
                  const lowerTitle = notif.title.toLowerCase();
                  const isAf =
                    lowerTitle.includes("af") || lowerTitle.includes("atrial");

                  return (
                    <li
                      className="stagger-item relative flex items-start gap-3 pb-6 last:pb-0"
                      key={notif.id}
                    >
                      <StatusMark
                        size="small"
                        status={isAf ? "af" : "normal"}
                      />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="flex items-center gap-2 text-[0.9375rem] font-semibold text-primary-900">
                          {notif.title}
                          {!notif.isRead ? (
                            <span
                              aria-label="Belum dibaca"
                              className="h-2 w-2 rounded-full bg-af-500"
                              role="img"
                            />
                          ) : null}
                        </p>
                        <p className="mt-1 text-[0.875rem] leading-[1.55] text-primary-900/80">
                          {notif.message}
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[0.8125rem] font-medium text-primary-900/70">
                            Pukul {formatWib(notif.createdAt, "time") ?? "—"}
                          </span>
                          {!notif.isRead ? (
                            <button
                              className="flex h-9 items-center gap-1.5 rounded-full border border-primary-900/20 bg-white px-3 text-[0.8125rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300"
                              onClick={() =>
                                handleMarkAsRead(notif.id, notif.isRead)
                              }
                              type="button"
                            >
                              <Check size={14} strokeWidth={2.5} />
                              Tandai dibaca
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-[0.8125rem] font-medium text-primary-900/70">
                              <Check size={14} strokeWidth={2.5} />
                              Telah dibaca
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))
        )}
      </div>
    </aside>
  );
}
