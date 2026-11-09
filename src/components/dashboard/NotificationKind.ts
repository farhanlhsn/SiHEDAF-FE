/**
 * What a notification's icon may claim. The backend titles every AF and AFL
 * alert "Medical Alert!" and marks it `type: "AF_DETECTED"`; "Pengukuran
 * Selesai" (`SYSTEM_INFO`) is also sent when the AI failed, so it is never a
 * rhythm claim. Only `type` decides; the title and message are content.
 */
export type NotificationKind = "alert" | "info";

export function notificationKind(notification: {
  type?: string | null;
  title?: string | null;
}): NotificationKind {
  return notification.type?.trim().toUpperCase() === "AF_DETECTED"
    ? "alert"
    : "info";
}

/** Accessible name of the icon beside each notification. */
export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  alert: "Peringatan AF atau AFL",
  info: "Informasi",
};
