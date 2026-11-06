"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DashboardModal } from "@/components/dashboard/DashboardModal";
import { ProfileAvatar } from "@/components/dashboard/ProfileAvatar";
import { useMyDevice } from "@/components/dashboard/hooks/UseMyDevice";
import { useUpdateProfile } from "@/features/profile/client/hooks/UseUpdateProfile";
import { useProfile } from "@/features/profile/client/ProfileProvider";
import {
  type UpdateProfileRequest,
  UpdateProfileRequestSchema,
} from "@/features/profile/shared/ProfileSchema";
import type { UserProfile } from "@/features/profile/shared/ProfileTypes";

const fieldClassName =
  "mt-2.5 h-14 w-full rounded-[14px] border-[1.5px] border-primary-900/15 bg-white px-5 text-[16px] font-medium text-primary-900 outline-none transition-[border-color,box-shadow] placeholder:text-primary-900/60 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:border-primary-900/10 disabled:bg-paper disabled:text-primary-900/75";
const labelClassName = "block text-[15px] font-semibold text-primary-900";
const hintClassName = "mt-2 block text-[14px] font-normal text-primary-900/75";
const secondaryButtonClassName =
  "h-13 rounded-full border-[1.5px] border-primary-900/20 text-[15px] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300";

function EditProfileForm({ user }: { user: UserProfile }) {
  const router = useRouter();
  const { submit, isPending, error: mutationError } = useUpdateProfile();
  const { device, isLoading: isDeviceLoading } = useMyDevice();
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    formState: { errors, isDirty, isValid },
    getValues,
    handleSubmit,
    register,
    setError,
  } = useForm<UpdateProfileRequest>({
    defaultValues: { fullname: user.fullname },
    mode: "onChange",
    resolver: zodResolver(UpdateProfileRequestSchema),
  });

  async function confirmSave() {
    const parsed = UpdateProfileRequestSchema.safeParse(getValues());
    if (!parsed.success) return;

    const result = await submit(parsed.data);
    if (!result) return;

    if (!result.success) {
      for (const [field, messages] of Object.entries(
        result.fieldErrors ?? {},
      )) {
        if (field === "fullname") {
          setError("fullname", { message: messages?.[0], type: "server" });
        }
      }
      toast.error(result.message);
      if (result.status === 401) router.replace("/login");
      setShowConfirm(false);
      return;
    }

    toast.success(result.message);
    setShowConfirm(false);
    router.push("/profil");
  }

  return (
    <>
      <form
        aria-busy={isPending}
        className="mt-8 rounded-[24px] border border-primary-900/10 bg-white p-6 sm:p-8"
        onSubmit={handleSubmit(() => setShowConfirm(true))}
      >
        <div className="flex items-center gap-5 border-b border-primary-900/10 pb-6">
          <ProfileAvatar
            fullname={user.fullname}
            profileImage={user.profileImage}
          />
          <div>
            <p className="text-[16px] font-semibold text-primary-900">
              Foto profil
            </p>
            <p className="mt-1 text-[15px] leading-[1.5] text-primary-900/75">
              Perubahan foto belum tersedia pada layanan akun.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <label className={labelClassName}>
            Nama Lengkap
            <input className={fieldClassName} {...register("fullname")} />
            {errors.fullname ? (
              <span
                className="mt-2 flex items-center gap-1.5 text-[14px] font-medium text-af-700"
                role="alert"
              >
                <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                {errors.fullname.message}
              </span>
            ) : null}
          </label>
          <label className={labelClassName}>
            Email
            <input
              className={fieldClassName}
              disabled
              name="email"
              type="email"
              value={user.email}
            />
            <span className={hintClassName}>Email tidak dapat diubah.</span>
          </label>
          <label className={labelClassName}>
            ID Perangkat
            <input
              className={`${fieldClassName} font-mono tracking-[0.08em]`}
              disabled
              name="deviceId"
              readOnly
              value={
                isDeviceLoading
                  ? "Memuat..."
                  : (device?.deviceNumber ?? "Belum terhubung")
              }
            />
            <span className={hintClassName}>
              ID perangkat tidak dapat diubah.
            </span>
          </label>
        </div>

        {mutationError ? (
          <p
            aria-live="polite"
            className="mt-5 text-[15px] font-medium text-af-700"
          >
            {mutationError.message}
          </p>
        ) : null}

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            className={secondaryButtonClassName}
            disabled={isPending}
            onClick={() => router.push("/profil")}
            type="button"
          >
            Batal
          </button>
          <button
            className="btn-primary h-13 rounded-full bg-primary-900 text-[15px] font-semibold text-white"
            disabled={!isDirty || !isValid || isPending}
            type="submit"
          >
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      <DashboardModal
        description="Nama lengkap baru akan disimpan ke akunmu."
        onClose={() => setShowConfirm(false)}
        open={showConfirm}
        title="Simpan perubahan profil?"
      >
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-50 text-primary-500">
            <Save aria-hidden="true" size={30} strokeWidth={1.8} />
          </span>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              className="h-12 rounded-full border-[1.5px] border-primary-900/20 text-[15px] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300"
              disabled={isPending}
              onClick={() => setShowConfirm(false)}
              type="button"
            >
              Batal
            </button>
            <button
              className="btn-primary h-12 rounded-full bg-primary-900 text-[15px] font-semibold text-white"
              disabled={isPending}
              onClick={() => void confirmSave()}
              type="button"
            >
              {isPending ? "Menyimpan..." : "Ya, simpan"}
            </button>
          </div>
        </div>
      </DashboardModal>
    </>
  );
}

export function EditProfileView() {
  const { user, isLoading, error, reload } = useProfile();

  return (
    <section className="px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="max-w-[760px]">
        <nav
          aria-label="Breadcrumb"
          className="text-[15px] text-primary-900/75"
        >
          <Link
            className="font-semibold text-primary-500 underline-offset-4 hover:underline"
            href="/profil"
          >
            Profil
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span aria-current="page">Ubah Profil</span>
        </nav>
        <h1 className="mt-3 text-[clamp(2.2rem,3.8vw,3.4rem)] leading-[1] font-bold tracking-[-0.05em] text-primary-900">
          Ubah Profil
        </h1>
        {isLoading ? (
          <div
            aria-busy="true"
            className="mt-8 h-96 animate-pulse rounded-[24px] bg-white"
          />
        ) : error || !user ? (
          <div className="mt-8 rounded-[24px] border border-af-500/30 bg-white p-7">
            <p className="text-[16px] font-medium text-af-700">
              {error ?? "Data profil tidak tersedia."}
            </p>
            <button
              className="btn-primary mt-5 h-12 rounded-full bg-primary-900 px-6 text-[15px] font-semibold text-white"
              onClick={() => void reload()}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <EditProfileForm key={`${user.id}-${user.fullname}`} user={user} />
        )}
      </div>
    </section>
  );
}
