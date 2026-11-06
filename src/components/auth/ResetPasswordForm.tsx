"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthInput } from "@/components/auth/AuthInput";
import { useResetPassword } from "@/features/auth/password-reset/client/hooks/UseResetPassword";
import { useVerifyResetToken } from "@/features/auth/password-reset/client/hooks/UseVerifyResetToken";
import {
  ResetPasswordFormSchema,
  ResetPasswordRequestSchema,
  type ResetPasswordFormData,
  type ResetPasswordFormInput,
} from "@/features/auth/password-reset/shared/PasswordResetSchema";

const defaultValues: ResetPasswordFormInput = {
  new_password: "",
  confirm_password: "",
};

type ResetPasswordFormProps = { token: string };

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isComplete, setIsComplete] = useState(false);
  const { status, error: verificationError } = useVerifyResetToken(token);
  const { resetPassword, isPending } = useResetPassword();
  const {
    control,
    formState: { isValid },
    handleSubmit,
    setError,
  } = useForm<ResetPasswordFormInput, unknown, ResetPasswordFormData>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(ResetPasswordFormSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    const input = ResetPasswordRequestSchema.parse({ ...data, token });
    const result = await resetPassword(input);
    if (!result) return;

    if (!result.success) {
      for (const field of ["new_password", "confirm_password"] as const) {
        const message = result.fieldErrors?.[field]?.[0];
        if (message) setError(field, { type: "server", message });
      }

      toast.error(result.message);
      return;
    }

    setIsComplete(true);
    toast.success(result.message);
  }

  if (status === "checking") {
    return (
      <div className="py-8 text-center" role="status">
        <LoaderCircle
          aria-hidden="true"
          className="mx-auto size-10 animate-spin text-primary-300"
        />
        <h1 className="mt-6 text-[1.75rem] font-bold tracking-[-0.04em] text-primary-900">
          Memeriksa Tautan
        </h1>
        <p className="mt-3 text-[1rem] text-primary-900/80">
          Tunggu sebentar, kami sedang memverifikasi tautan reset kamu.
        </p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="text-center sm:text-left">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-af-50 text-af-700 sm:mx-0">
          <CircleAlert aria-hidden="true" className="size-7" />
        </div>
        <p className="mt-6 text-[0.9375rem] font-semibold text-af-700">
          Tautan Tidak Valid
        </p>
        <h1 className="mt-3 text-[clamp(2.1rem,3vw,2.75rem)] leading-[1.02] font-bold tracking-[-0.045em] text-primary-900">
          Minta Tautan Baru
        </h1>
        <p className="mt-4 max-w-[500px] text-[1.0625rem] leading-[1.6] text-primary-900/80">
          {verificationError?.message ??
            "Tautan reset kata sandi tidak valid atau sudah kedaluwarsa."}
        </p>
        <Link
          className="btn-primary mt-9 inline-flex h-14 items-center justify-center rounded-full bg-primary-900 px-8 text-[1rem] font-semibold text-white"
          href="/lupa-kata-sandi"
        >
          Kirim Ulang Tautan
        </Link>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="text-center sm:text-left">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#E6F7E9] text-[#2E7D3A] sm:mx-0">
          <CheckCircle2 aria-hidden="true" className="size-7" />
        </div>
        <p className="mt-6 text-[0.9375rem] font-semibold text-[#2E7D3A]">
          Berhasil
        </p>
        <h1 className="mt-3 text-[clamp(2.1rem,3vw,2.75rem)] leading-[1.02] font-bold tracking-[-0.045em] text-primary-900">
          Kata Sandi Diperbarui
        </h1>
        <p className="mt-4 max-w-[500px] text-[1.0625rem] leading-[1.6] text-primary-900/80">
          Kata sandi baru sudah aktif. Silakan masuk kembali ke akun SiHEDAF.
        </p>
        <Link
          className="btn-primary mt-9 inline-flex h-14 items-center justify-center rounded-full bg-primary-900 px-8 text-[1rem] font-semibold text-white"
          href="/login"
        >
          Masuk ke Akun
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[0.9375rem] font-semibold text-primary-500">
        Pemulihan Akun
      </p>
      <h1 className="mt-3 text-[clamp(2.1rem,3vw,2.75rem)] leading-[1.02] font-bold tracking-[-0.045em] text-primary-900">
        Buat Kata Sandi Baru
      </h1>
      <p className="mt-3 max-w-[500px] text-[1.0625rem] leading-[1.6] text-primary-900/80">
        Gunakan minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan
        simbol.
      </p>

      <form
        aria-busy={isPending}
        className="mt-8 space-y-5"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller
          control={control}
          name="new_password"
          render={({ field, fieldState }) => (
            <AuthInput
              autoComplete="new-password"
              error={fieldState.error?.message}
              inputRef={field.ref}
              label="Kata sandi baru"
              name={field.name}
              onBlur={field.onBlur}
              onChange={field.onChange}
              placeholder="Buat kata sandi baru"
              type="password"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="confirm_password"
          render={({ field, fieldState }) => (
            <AuthInput
              autoComplete="new-password"
              error={fieldState.error?.message}
              inputRef={field.ref}
              label="Konfirmasi kata sandi baru"
              name={field.name}
              onBlur={field.onBlur}
              onChange={field.onChange}
              onPaste={(event) => {
                event.preventDefault();
                toast.error("Silakan ketik ulang kata sandi secara manual.");
              }}
              placeholder="Masukkan ulang kata sandi"
              type="password"
              value={field.value}
            />
          )}
        />

        <button
          className="btn-primary mt-2 h-14 w-full rounded-full bg-primary-900 text-[1rem] font-semibold text-white"
          disabled={!isValid || isPending}
          type="submit"
        >
          {isPending ? "Mengatur ulang..." : "Atur Ulang Kata Sandi"}
        </button>
      </form>
    </div>
  );
}
