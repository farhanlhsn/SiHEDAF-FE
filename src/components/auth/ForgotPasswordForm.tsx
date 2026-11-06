"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthInput } from "@/components/auth/AuthInput";
import { usePasswordResetEmail } from "@/features/auth/password-reset/client/hooks/UsePasswordResetEmail";
import {
  ResetPasswordEmailSchema,
  type ResetPasswordEmailInput,
  type ResetPasswordEmailRequest,
} from "@/features/auth/password-reset/shared/PasswordResetSchema";

const defaultValues: ResetPasswordEmailInput = { email: "" };

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { sendEmail, isPending } = usePasswordResetEmail();
  const {
    control,
    formState: { isValid },
    handleSubmit,
    setError,
  } = useForm<ResetPasswordEmailInput, unknown, ResetPasswordEmailRequest>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(ResetPasswordEmailSchema),
  });

  async function onSubmit(data: ResetPasswordEmailRequest) {
    const result = await sendEmail(data);
    if (!result) return;

    if (!result.success) {
      const fieldErrors = Object.entries(result.fieldErrors ?? {}) as [
        keyof ResetPasswordEmailRequest,
        string[],
      ][];

      for (const [field, messages] of fieldErrors) {
        setError(field, { type: "server", message: messages[0] });
      }

      toast.error(result.message);
      return;
    }

    setIsSubmitted(true);
    toast.success(result.message);
  }

  if (isSubmitted) {
    return (
      <div className="text-center sm:text-left">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary-50 text-primary-300 sm:mx-0">
          <MailCheck aria-hidden="true" className="size-7" />
        </div>
        <p className="mt-6 text-[15px] font-semibold text-primary-500">
          Periksa Email
        </p>
        <h1 className="mt-3 text-[clamp(2.1rem,3vw,2.75rem)] leading-[1.02] font-bold tracking-[-0.045em] text-primary-900">
          Tautan Reset Dikirim
        </h1>
        <p className="mt-4 max-w-[500px] text-[17px] leading-[1.6] text-primary-900/80">
          Jika email terdaftar, tautan reset kata sandi telah dikirim. Periksa
          kotak masuk dan folder spam kamu.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            className="btn-primary inline-flex h-14 items-center justify-center rounded-full bg-primary-900 px-8 text-[16px] font-semibold text-white"
            href="/login"
          >
            Kembali ke Login
          </Link>
          <button
            className="h-14 rounded-full border-[1.5px] border-primary-900/20 px-7 text-[16px] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
            onClick={() => setIsSubmitted(false)}
            type="button"
          >
            Gunakan email lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[15px] font-semibold text-primary-500">
        Pemulihan Akun
      </p>
      <h1 className="mt-3 text-[clamp(2.1rem,3vw,2.75rem)] leading-[1.02] font-bold tracking-[-0.045em] text-primary-900">
        Lupa Kata Sandi
      </h1>
      <p className="mt-3 max-w-[500px] text-[17px] leading-[1.6] text-primary-900/80">
        Masukkan email akunmu. Kami akan mengirimkan tautan untuk membuat kata
        sandi baru.
      </p>

      <form
        aria-busy={isPending}
        className="mt-9 space-y-7"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <AuthInput
              autoComplete="email"
              error={fieldState.error?.message}
              inputRef={field.ref}
              label="Email"
              name={field.name}
              onBlur={field.onBlur}
              onChange={field.onChange}
              placeholder="Masukkan email"
              type="email"
              value={field.value}
            />
          )}
        />

        <button
          className="btn-primary h-14 w-full rounded-full bg-primary-900 text-[16px] font-semibold text-white"
          disabled={!isValid || isPending}
          type="submit"
        >
          {isPending ? "Mengirim tautan..." : "Kirim Tautan Reset"}
        </button>
      </form>

      <p className="mt-7 text-center text-[15px] text-primary-900/75">
        Ingat kata sandimu?{" "}
        <Link
          className="font-semibold text-primary-500 underline-offset-4 hover:underline"
          href="/login"
        >
          Kembali ke login
        </Link>
      </p>
    </div>
  );
}
