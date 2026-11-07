"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthInput } from "@/components/auth/AuthInput";
import { useLogin } from "@/features/auth/session/client/hooks/UseLogin";
import {
  type LoginFormData,
  type LoginFormInput,
  type LoginRequest,
  LoginRequestSchema,
} from "@/features/auth/session/shared/SessionSchema";

const defaultValues: LoginFormInput = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const { login, isPending } = useLogin();
  const {
    control,
    formState: { isValid },
    handleSubmit,
    setError,
  } = useForm<LoginFormInput, unknown, LoginFormData>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(LoginRequestSchema),
  });

  async function onSubmit(data: LoginFormData) {
    const result = await login(data);
    if (!result) return;

    if (!result.success) {
      const fieldErrors = Object.entries(result.fieldErrors ?? {}) as [
        keyof LoginRequest,
        string[],
      ][];

      for (const [field, messages] of fieldErrors) {
        setError(field, { type: "server", message: messages[0] });
      }

      toast.error(result.message);
      return;
    }

    toast.success("Berhasil masuk.");

    if (result.hasDeviceBound) {
      router.replace("/dashboard");
    } else {
      router.replace("/hubungkan-perangkat");
    }
  }

  return (
    <div>
      <p className="text-[0.9375rem] font-semibold text-primary-500">
        Akun SiHEDAF
      </p>
      <h1 className="mt-3 text-[clamp(2.1rem,3vw,2.75rem)] leading-[1.02] font-bold tracking-[-0.045em] text-primary-900">
        Masuk ke Akun
      </h1>

      <form
        aria-busy={isPending}
        className="mt-10 space-y-7"
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
        <div>
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <AuthInput
                autoComplete="current-password"
                error={fieldState.error?.message}
                inputRef={field.ref}
                label="Kata sandi"
                name={field.name}
                onBlur={field.onBlur}
                onChange={field.onChange}
                placeholder="Masukkan kata sandi"
                type="password"
                value={field.value}
              />
            )}
          />
          <div className="mt-3 text-right">
            <Link
              className="text-[0.9375rem] font-semibold text-primary-500 underline-offset-4 hover:underline"
              href="/lupa-kata-sandi"
            >
              Lupa kata sandi?
            </Link>
          </div>
        </div>

        <button
          className="btn-primary h-14 w-full rounded-full bg-primary-900 text-[1rem] font-semibold text-white"
          disabled={!isValid || isPending}
          type="submit"
        >
          {isPending ? "Mencoba masuk..." : "Masuk"}
        </button>
      </form>

      <p className="mt-7 text-center text-[0.9375rem] text-primary-900/75">
        Belum punya akun?{" "}
        <Link
          className="font-semibold text-primary-500 underline-offset-4 hover:underline"
          href="/register"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
