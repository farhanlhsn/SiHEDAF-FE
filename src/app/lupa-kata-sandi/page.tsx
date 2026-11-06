import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi | SiHEDAF",
  description: "Minta tautan reset kata sandi akun SiHEDAF",
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const rawToken = (await searchParams).token;
  const token = typeof rawToken === "string" ? rawToken.trim() : "";

  if (token) {
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

  return (
    <AuthShell
      description="Pulihkan akses dengan tautan aman yang dikirim langsung ke email akun SiHEDAF kamu."
      illustration="lock"
      title={{ strong: "Tenang,", light: "akunmu bisa dipulihkan." }}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
