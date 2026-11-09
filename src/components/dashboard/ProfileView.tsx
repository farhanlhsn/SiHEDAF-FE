"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CircleAlert, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DashboardIcon } from "@/components/dashboard/DashboardIcon";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import { InstallGuide } from "@/components/dashboard/InstallGuide";
import { ProfileAvatar } from "@/components/dashboard/ProfileAvatar";
import { TextSizeSetting } from "@/components/dashboard/TextSizeSetting";
import { describeCaughtError } from "@/components/ui/FetchError";
import { PulseLoader } from "@/components/ui/PulseLoader";
import { useMyDevice } from "@/components/dashboard/hooks/UseMyDevice";
import { useLogout } from "@/features/profile/client/hooks/UseLogout";
import { useUpdatePassword } from "@/features/profile/client/hooks/UseUpdatePassword";
import { useProfile } from "@/features/profile/client/ProfileProvider";
import {
  type UpdatePasswordRequest,
  UpdatePasswordRequestSchema,
} from "@/features/profile/shared/ProfileSchema";

type ActiveModal = "logout" | "password" | null;

const passwordDefaults: UpdatePasswordRequest = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

const passwordInputClassName =
  "mt-2 h-13 w-full rounded-[14px] border-[1.5px] border-primary-900/15 bg-white px-4 text-[1rem] font-medium text-primary-900 outline-none transition-[border-color,box-shadow] focus:border-primary-300 focus:ring-4 focus:ring-primary-100";
const passwordLabelClassName =
  "block text-[0.9375rem] font-semibold text-primary-900";
const fieldErrorClassName =
  "mt-2 flex items-center gap-1.5 text-[0.875rem] font-medium text-af-700";
const secondaryButtonClassName =
  "h-12 rounded-full border-[1.5px] border-primary-900/20 text-[0.9375rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300";

export function ProfileView() {
  const router = useRouter();
  const { user, isLoading, error: profileError, reload } = useProfile();
  const { device, isLoading: isDeviceLoading } = useMyDevice();
  const {
    submit: submitPassword,
    isPending: isPasswordPending,
    error: passwordMutationError,
  } = useUpdatePassword();
  const {
    logout,
    isPending: isLogoutPending,
    error: logoutError,
  } = useLogout();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isPasswordSaved, setIsPasswordSaved] = useState(false);
  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<UpdatePasswordRequest>({
    defaultValues: passwordDefaults,
    mode: "onChange",
    resolver: zodResolver(UpdatePasswordRequestSchema),
  });

  function closeModal() {
    setActiveModal(null);
    setIsPasswordSaved(false);
    reset(passwordDefaults);
  }

  function openPasswordModal() {
    reset(passwordDefaults);
    setIsPasswordSaved(false);
    setActiveModal("password");
  }

  async function handlePasswordSubmit(input: UpdatePasswordRequest) {
    const result = await submitPassword(input);
    if (!result) return;

    if (!result.success) {
      // Expired: apiFetch is already sending the reader to /login.
      if (result.status === 401) return;
      for (const [field, messages] of Object.entries(
        result.fieldErrors ?? {},
      )) {
        setError(field as keyof UpdatePasswordRequest, {
          message: messages?.[0],
          type: "server",
        });
      }
      if (result.cause === undefined) {
        toast.error(result.message);
      } else {
        // No answer at all says "Koneksi internet terputus".
        const failure = describeCaughtError(result.cause, result.status);
        toast.error(failure.title, { description: failure.message });
      }
      return;
    }

    toast.success(result.message);
    setIsPasswordSaved(true);
    reset(passwordDefaults);
  }

  async function handleLogout() {
    const result = await logout();
    if (!result) return;
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.replace("/login");
    router.refresh();
  }

  if (isLoading) {
    return (
      <section aria-busy="true" className="px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
        <PulseLoader className="max-w-[760px] py-24" label="Memuat profil..." />
      </section>
    );
  }

  if (profileError || !user) {
    return (
      <section className="px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
        <div className="max-w-[760px] rounded-[24px] border border-af-500/30 bg-white p-7">
          <h1 className="text-[1.75rem] font-bold tracking-[-0.04em] text-primary-900">
            Profil Akun
          </h1>
          <p className="mt-3 text-[1rem] font-medium text-af-700">
            {profileError?.message ?? "Data profil tidak tersedia."}
          </p>
          <button
            className="btn-primary mt-5 h-12 rounded-full bg-primary-900 px-6 text-[0.9375rem] font-semibold text-white"
            onClick={() => void reload()}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="max-w-[760px]">
        <h1 className="text-[clamp(2.2rem,3.8vw,3.4rem)] leading-[1] font-bold tracking-[-0.05em] text-primary-900">
          Profil Akun
        </h1>
        <p className="mt-3 text-[1.0625rem] text-primary-900/80">
          Kelola profil kamu di sini.
        </p>

        <article className="mt-8 flex items-center gap-6 border-y border-primary-900/10 py-7">
          <ProfileAvatar
            fullname={user.fullname}
            profileImage={user.profileImage}
          />
          <div className="min-w-0">
            <h2 className="text-[1.625rem] font-bold tracking-[-0.035em] [overflow-wrap:anywhere] text-primary-900">
              {user.fullname}
            </h2>
            <p className="mt-1 text-[1rem] [overflow-wrap:anywhere] text-primary-900/80">
              {user.email}
            </p>
          </div>
        </article>

        <article className="mt-8 overflow-hidden rounded-[24px] border border-primary-900/10 bg-white">
          <div className="flex items-center justify-between gap-3 px-6 py-5 sm:px-7">
            <h2 className="text-[1.25rem] font-bold tracking-[-0.03em] text-primary-900">
              Informasi Profil
            </h2>
            <Link
              className="flex h-11 items-center gap-2 rounded-full border-[1.5px] border-primary-900/20 px-5 text-[0.9375rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300"
              href="/profil/ubah"
            >
              <DashboardIcon className="h-4 w-4" name="edit" />
              Edit Profil
            </Link>
          </div>

          <dl className="divide-y divide-primary-900/[0.07] border-t border-primary-900/10">
            <div className="grid grid-cols-[1fr_1.4fr] gap-5 px-6 py-5 text-[1rem] sm:px-7">
              <dt className="text-primary-900/75">Nama Lengkap</dt>
              <dd className="text-right font-semibold text-primary-900">
                {user.fullname}
              </dd>
            </div>
            <div className="grid grid-cols-[1fr_1.4fr] gap-5 px-6 py-5 text-[1rem] sm:px-7">
              <dt className="text-primary-900/75">Email</dt>
              <dd className="text-right font-semibold break-all text-primary-900">
                {user.email}
              </dd>
            </div>
            <div className="grid grid-cols-[1fr_1.4fr] gap-5 px-6 py-5 text-[1rem] sm:px-7">
              <dt className="text-primary-900/75">Perangkat Terdaftar</dt>
              <dd className="text-right font-semibold text-primary-900">
                {isDeviceLoading ? (
                  "Memuat..."
                ) : device?.deviceNumber ? (
                  <span className="font-mono tracking-[0.06em]">
                    {device.deviceNumber}
                  </span>
                ) : (
                  <Link
                    className="text-primary-500 underline-offset-4 hover:underline"
                    href="/hubungkan-perangkat"
                  >
                    Hubungkan perangkat
                  </Link>
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article className="mt-6 overflow-hidden rounded-[24px] border border-primary-900/10 bg-white">
          <h2 className="px-6 pt-5 text-[1.25rem] font-bold tracking-[-0.03em] text-primary-900 sm:px-7">
            Tampilan
          </h2>
          <TextSizeSetting />
        </article>

        <InstallGuide />

        <div className="mt-6 space-y-3">
          <button
            className="group flex h-16 w-full items-center rounded-[18px] border border-primary-900/10 bg-white px-6 text-[1rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300"
            onClick={openPasswordModal}
            type="button"
          >
            <DashboardIcon
              className="mr-3 h-5 w-5 text-primary-500"
              name="key"
            />
            Ubah kata sandi
            <DashboardIcon
              className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"
              name="chevron"
            />
          </button>
          <button
            className="group flex h-16 w-full items-center rounded-[18px] border border-primary-900/10 bg-white px-6 text-[1rem] font-semibold text-af-700 transition-colors hover:bg-af-50 focus-visible:outline-2 focus-visible:outline-primary-300"
            onClick={() => setActiveModal("logout")}
            type="button"
          >
            <DashboardIcon className="mr-3 h-5 w-5" name="logout" />
            Keluar akun
            <DashboardIcon
              className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"
              name="chevron"
            />
          </button>
        </div>
      </div>

      <DashboardModal
        description={
          isPasswordSaved
            ? "Kata sandi akunmu sudah berhasil diperbarui."
            : "Gunakan minimal 8 karakter dan jangan gunakan kata sandi lama."
        }
        onClose={closeModal}
        open={activeModal === "password"}
        title={
          isPasswordSaved ? "Kata sandi berhasil diubah" : "Ubah kata sandi"
        }
      >
        {isPasswordSaved ? (
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-50 text-primary-300">
              <CheckCircle2 aria-hidden="true" size={32} strokeWidth={1.9} />
            </span>
            <button
              className="btn-primary mt-7 h-12 w-full rounded-full bg-primary-900 text-[0.9375rem] font-semibold text-white"
              onClick={closeModal}
              type="button"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form
            aria-busy={isPasswordPending}
            className="space-y-5"
            onSubmit={handleSubmit(handlePasswordSubmit)}
          >
            <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-primary-50 text-primary-500">
              <KeyRound aria-hidden="true" size={26} strokeWidth={1.8} />
            </span>
            <label className={passwordLabelClassName}>
              Kata sandi saat ini
              <input
                autoComplete="current-password"
                className={passwordInputClassName}
                type="password"
                {...register("old_password")}
              />
              {errors.old_password ? (
                <span className={fieldErrorClassName} role="alert">
                  <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                  {errors.old_password.message}
                </span>
              ) : null}
            </label>
            <label className={passwordLabelClassName}>
              Kata sandi baru
              <input
                autoComplete="new-password"
                className={passwordInputClassName}
                type="password"
                {...register("new_password")}
              />
              {errors.new_password ? (
                <span className={fieldErrorClassName} role="alert">
                  <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                  {errors.new_password.message}
                </span>
              ) : null}
            </label>
            <label className={passwordLabelClassName}>
              Konfirmasi kata sandi baru
              <input
                autoComplete="new-password"
                className={passwordInputClassName}
                type="password"
                {...register("confirm_password")}
              />
              {errors.confirm_password ? (
                <span className={fieldErrorClassName} role="alert">
                  <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                  {errors.confirm_password.message}
                </span>
              ) : null}
            </label>
            {passwordMutationError ? (
              <p
                aria-live="polite"
                className="text-[0.9375rem] leading-[1.5] font-medium text-af-700"
              >
                {passwordMutationError.message}
              </p>
            ) : null}
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                className={secondaryButtonClassName}
                disabled={isPasswordPending}
                onClick={closeModal}
                type="button"
              >
                Batal
              </button>
              <button
                className="btn-primary h-12 rounded-full bg-primary-900 text-[0.9375rem] font-semibold text-white"
                disabled={!isValid || isPasswordPending}
                type="submit"
              >
                {isPasswordPending ? "Menyimpan..." : "Simpan kata sandi"}
              </button>
            </div>
          </form>
        )}
      </DashboardModal>

      <DashboardModal
        description="Kamu akan keluar dari dashboard dan diarahkan kembali ke halaman masuk."
        onClose={closeModal}
        open={activeModal === "logout"}
        title="Keluar dari akun?"
      >
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-af-50 text-af-700">
            <LogOut aria-hidden="true" size={30} strokeWidth={1.8} />
          </span>
          {logoutError ? (
            <p
              className="mt-5 text-[0.9375rem] font-medium text-af-700"
              role="alert"
            >
              {logoutError.message}
            </p>
          ) : null}
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              className={secondaryButtonClassName}
              disabled={isLogoutPending}
              onClick={closeModal}
              type="button"
            >
              Batal
            </button>
            <button
              className="h-12 rounded-full bg-af-700 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-af-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-af-700 disabled:cursor-not-allowed disabled:bg-af-50 disabled:text-af-700"
              disabled={isLogoutPending}
              onClick={() => void handleLogout()}
              type="button"
            >
              {isLogoutPending ? "Mengeluarkan..." : "Ya, keluar"}
            </button>
          </div>
        </div>
      </DashboardModal>
    </section>
  );
}
