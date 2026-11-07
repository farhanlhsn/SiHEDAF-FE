import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { ConnectDeviceForm } from "@/components/auth/ConnectDeviceForm";
import { buildBackendApiUrl } from "@/features/auth/shared/server/BackendUrl";

export const metadata: Metadata = {
  title: "Hubungkan Perangkat | SiHEDAF",
  description: "Hubungkan perangkat SiHEDAF",
};

export default async function ConnectDevicePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sihedaf_access_token")?.value;
  let isBound = false;

  if (accessToken) {
    try {
      const backendUrl = buildBackendApiUrl("measurement/my-device");
      const res = await fetch(backendUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.code === 200 && json.data?.deviceNumber) {
          isBound = true;
        }
      }
    } catch (e) {
      console.error(
        "Gagal memeriksa status perangkat di Hubungkan Perangkat:",
        e,
      );
    }
  }

  if (isBound) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      description="Masukkan Device ID yang tertera pada perangkatmu supaya sinyalnya terhubung ke akunmu."
      illustration="device"
      journeyStep={2}
      title={{ strong: "Satu langkah lagi:", light: "hubungkan perangkatmu." }}
    >
      <ConnectDeviceForm />
    </AuthShell>
  );
}
