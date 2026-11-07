"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthInput } from "@/components/auth/AuthInput";
import { useRegister } from "@/features/auth/register/client/hooks/UseRegister";
import {
  RegisterFormSchema,
  RegisterRequestSchema,
  type RegisterFormData,
  type RegisterFormInput,
  type RegisterRequest,
} from "@/features/auth/register/shared/RegisterSchema";

const defaultValues: RegisterFormInput = {
  fullname: "",
  email: "",
  password: "",
  confirmation: "",
};

export function RegisterForm() {
  const router = useRouter();
  const { register, isPending } = useRegister();
  const {
    control,
    formState: { isValid },
    handleSubmit,
    setError,
  } = useForm<RegisterFormInput, unknown, RegisterFormData>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(RegisterFormSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    const input = RegisterRequestSchema.parse(data);
    const result = await register(input);
    if (!result) return;

    if (!result.success) {
      const fieldErrors = Object.entries(result.fieldErrors ?? {}) as [
        keyof RegisterRequest,
        string[],
      ][];

      for (const [field, messages] of fieldErrors) {
        setError(field, { type: "server", message: messages[0] });
      }

      toast.error(result.message);
      return;
    }

    toast.success("Akun berhasil dibuat. Silakan masuk.");
    router.replace("/login");
  }

  return (
    <div>
      <p className="text-[15px] font-semibold text-primary-500">Buat Akun</p>
      <h1 className="mt-3 text-[clamp(2.1rem,3vw,2.75rem)] leading-[1.02] font-bold tracking-[-0.045em] text-primary-900">
        Daftar Akun
      </h1>

      <form
        aria-busy={isPending}
        className="mt-9 space-y-5"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller
          control={control}
          name="fullname"
          render={({ field, fieldState }) => (
            <AuthInput
              autoComplete="name"
              error={fieldState.error?.message}
              inputRef={field.ref}
              label="Nama Lengkap"
              name={field.name}
              onBlur={field.onBlur}
              onChange={field.onChange}
              placeholder="Masukkan nama lengkap"
              value={field.value}
            />
          )}
        />
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
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <AuthInput
              autoComplete="new-password"
              error={fieldState.error?.message}
              inputRef={field.ref}
              label="Kata sandi"
              name={field.name}
              onBlur={field.onBlur}
              onChange={field.onChange}
              placeholder="Buat kata sandi"
              type="password"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmation"
          render={({ field, fieldState }) => (
            <AuthInput
              autoComplete="new-password"
              error={fieldState.error?.message}
              inputRef={field.ref}
              label="Konfirmasi Kata sandi"
              name={field.name}
              onBlur={field.onBlur}
              onChange={field.onChange}
              onPaste={(e) => {
                e.preventDefault();
                toast.error("Silakan ketik ulang kata sandi secara manual.");
              }}
              placeholder="Masukkan ulang kata sandi"
              type="password"
              value={field.value}
            />
          )}
        />

        <button
          className="btn-primary h-14 w-full rounded-full bg-primary-900 text-[16px] font-semibold text-white"
          disabled={!isValid || isPending}
          type="submit"
        >
          {isPending ? "Mendaftarkan..." : "Daftar"}
        </button>
      </form>

      <p className="mt-7 text-center text-[15px] text-primary-900/75">
        Sudah punya akun?{" "}
        <Link
          className="font-semibold text-primary-500 underline-offset-4 hover:underline"
          href="/login"
        >
          Masuk sekarang
        </Link>
      </p>
    </div>
  );
}
