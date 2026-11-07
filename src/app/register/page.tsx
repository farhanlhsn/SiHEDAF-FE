import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Daftar | SiHEDAF",
  description: "Buat akun SiHEDAF",
};

export default function RegisterPage() {
  return (
    <AuthShell
      description="Buat akun untuk mulai memantau risiko stroke melalui deteksi Atrial Fibrillation."
      illustration="wear"
      journeyStep={0}
      title={{ strong: "Langkah awal pencegahan", light: "dimulai dari sini." }}
    >
      <RegisterForm />
    </AuthShell>
  );
}
