import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk | SiHEDAF",
  description: "Masuk ke akun SiHEDAF",
};

export default function LoginPage() {
  return (
    <AuthShell
      description="Masuk untuk melihat hasil pemantauan irama jantungmu dan riwayat analisis AI."
      illustration="heart"
      journeyStep={1}
      title={{ strong: "Selamat datang", light: "kembali." }}
    >
      <LoginForm />
    </AuthShell>
  );
}
