"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AuthInput } from "@/components/auth/AuthInput";
import type { BindDeviceResponse } from "@/features/device/shared/DeviceTypes";

export function ConnectDeviceForm() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isComplete = deviceId.trim() !== "" && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isComplete) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/v1/measurement/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceNumber: deviceId }),
      });
      const data = (await res.json()) as BindDeviceResponse;

      if (!data.success) {
        setError(data.message);
        if (data.fieldErrors?.deviceNumber) {
          setError(data.fieldErrors.deviceNumber[0]);
        }
        return;
      }

      toast.success(data.message);
      router.push("/dashboard");
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-[0.9375rem] font-semibold text-primary-500">Perangkat</p>
      <h1 className="mt-3 text-[clamp(2.1rem,3vw,2.75rem)] leading-[1.02] font-bold tracking-[-0.045em] text-primary-900">
        Hubungkan Perangkat
      </h1>
      <p className="mt-3 max-w-[500px] text-[1.0625rem] leading-[1.6] text-primary-900/80">
        Setelah terhubung, hasil pemantauan langsung muncul di dashboard.
      </p>

      <form className="mt-9 space-y-8" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="off"
          hint="Ketik persis seperti yang tertera pada perangkatmu."
          label="Masukkan Device ID"
          mono
          name="deviceId"
          onChange={(val) => {
            setDeviceId(val);
            setError("");
          }}
          placeholder="308398DC47BC"
          required
          value={deviceId}
          error={error}
        />
        <button
          className="btn-primary h-14 w-full rounded-full bg-primary-900 text-[1rem] font-semibold text-white"
          disabled={!isComplete}
          type="submit"
        >
          {isSubmitting ? "Menghubungkan..." : "Hubungkan perangkat"}
        </button>
      </form>
    </div>
  );
}
