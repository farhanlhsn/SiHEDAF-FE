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

import { DataErrorState } from "@/components/ui/DataErrorState";
import {
  describeCaughtError,
  type DataError,
} from "@/components/ui/FetchError";
import { PulseLoader } from "@/components/ui/PulseLoader";
import { SESSION_EXPIRED_PATH } from "@/features/auth/session/client/ApiFetch";

import type { UserProfile } from "@/features/profile/shared/ProfileTypes";

import { fetchCurrentProfile } from "./services/ProfileClient";

type ProfileContextValue = {
  error: DataError | null;
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
  const [error, setError] = useState<DataError | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchCurrentProfile();

    if (!result.success) {
      setIsLoading(false);
      if (result.status === 401) {
        router.replace(SESSION_EXPIRED_PATH);
        return;
      }
      setError(describeCaughtError(undefined, result.status));
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
          router.replace(SESSION_EXPIRED_PATH);
          return;
        }
        setError(describeCaughtError(undefined, result.status));
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
        <PulseLoader label="Memverifikasi sesi..." />
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper px-6">
        <div className="w-full max-w-md rounded-[24px] border border-primary-900/10 bg-white p-8 text-center">
          <h1 className="text-[1.5rem] font-bold tracking-[-0.035em] text-primary-900">
            Sesi belum dapat diverifikasi
          </h1>
          <DataErrorState
            message={
              error?.message ?? "Konten dashboard belum dapat ditampilkan."
            }
            onRetry={() => void reload()}
            title={error?.title ?? "Profil belum dapat dimuat"}
          />
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
