"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import type { UserProfile } from "@/features/profile/shared/ProfileTypes";

import { fetchCurrentProfile } from "./services/ProfileClient";

type ProfileContextValue = {
  error: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
  updateUser: (changes: Partial<Pick<UserProfile, "fullname">>) => void;
  user: UserProfile | null;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: UserProfile | null;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchCurrentProfile();

    if (!result.success) {
      setIsLoading(false);
      if (result.status === 401) {
        setError(result.message);
        router.replace("/login");
        return;
      }
      setError(result.message);
      return;
    }

    setUser(result.user);
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    if (initialUser) return;

    let isActive = true;

    void fetchCurrentProfile().then((result) => {
      if (!isActive) return;

      if (!result.success) {
        setIsLoading(false);
        if (result.status === 401) {
          setError(result.message);
          router.replace("/login");
          return;
        }
        setError(result.message);
        return;
      }

      setUser(result.user);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [router, initialUser]);

  const updateUser = useCallback(
    (changes: Partial<Pick<UserProfile, "fullname">>) => {
      setUser((current) => (current ? { ...current, ...changes } : current));
    },
    [],
  );

  const value = useMemo(
    () => ({ error, isLoading, reload, updateUser, user }),
    [error, isLoading, reload, updateUser, user],
  );

  if (isLoading) {
    return (
      <main
        aria-busy="true"
        className="grid min-h-dvh place-items-center bg-paper px-6"
      >
        <div className="text-center">
          <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-primary-100 border-t-primary-300" />
          <p className="mt-4 text-[15px] font-medium text-primary-900">
            Memverifikasi sesi...
          </p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper px-6">
        <div className="w-full max-w-md rounded-[24px] border border-primary-900/10 bg-white p-8 text-center">
          <h1 className="text-[24px] font-bold tracking-[-0.035em] text-primary-900">
            Sesi belum dapat diverifikasi
          </h1>
          <p className="mt-3 text-[16px] leading-[1.55] text-primary-900/80">
            {error ?? "Konten dashboard belum dapat ditampilkan."}
          </p>
          <p className="mt-2 text-[15px] text-primary-900/75">
            Konten dashboard belum dapat ditampilkan sebelum sesi terverifikasi.
          </p>
          <button
            className="btn-primary mt-6 h-12 rounded-full bg-primary-900 px-7 text-[15px] font-semibold text-white"
            onClick={() => void reload()}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      </main>
    );
  }

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider.");
  }
  return context;
}
