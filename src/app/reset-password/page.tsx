import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Kata Sandi | SiHEDAF",
  description: "Buat kata sandi baru untuk akun SiHEDAF",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const rawToken = (await searchParams).token;
  const token = typeof rawToken === "string" ? rawToken.trim() : "";

  return (
    <AuthShell
      description="Buat kata sandi baru untuk menjaga akses dan data pemantauan kesehatanmu tetap terlindungi."
      illustration="lock"
      title={{ strong: "Akunmu", light: "tetap terlindungi." }}
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
