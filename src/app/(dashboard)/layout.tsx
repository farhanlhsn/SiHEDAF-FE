import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { readLayoutProfile } from "@/features/auth/session/server/ReadLayoutProfile";
import { SESSION_EXPIRED_PATH } from "@/features/auth/session/client/ApiFetch";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read-only: a layout cannot write cookies, so it never refreshes. Without
  // a profile the client ProfileProvider asks /api/v1/auth/me, which can.
  const session = await readLayoutProfile();

  // No session cookie at all (proxy.ts normally catches this first).
  if (!session.hasSession) redirect(SESSION_EXPIRED_PATH);

  return <DashboardShell initialUser={session.user}>{children}</DashboardShell>;
}
