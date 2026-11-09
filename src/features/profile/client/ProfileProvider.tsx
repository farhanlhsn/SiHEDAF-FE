"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  const [user, setUser] = useState<UserProfile | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [error, setError] = useState<DataError | null>(null);
  // Expired: apiFetch is already sending the reader to /login. The page says
  // so, with a link in case that navigation was stopped; no error panel and
  // no second redirect.
  const [sessionExpired, setSessionExpired] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchCurrentProfile();

    if (!result.success) {
      setIsLoading(false);
      if (result.status === 401) setSessionExpired(true);
      else setError(describeCaughtError(result.cause, result.status));
      return;
    }

    setUser(result.user);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (initialUser) return;

    let isActive = true;

    void fetchCurrentProfile().then((result) => {
      if (!isActive) return;

      if (!result.success) {
        setIsLoading(false);
        if (result.status === 401) setSessionExpired(true);
        else setError(describeCaughtError(result.cause, result.status));
        return;
      }

      setUser(result.user);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [initialUser]);

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
        className="grid min-h-dvh place-items-center bg-white px-6"
      >
        <PulseLoader label="Memverifikasi sesi..." />
      </main>
    );
  }

  if (sessionExpired) {
    return (
      <main className="grid min-h-dvh place-items-center bg-white px-6">
        <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-[24px] border border-primary-900/15 bg-white p-8 text-center">
          <p
            className="text-[1rem] leading-[1.55] font-semibold text-primary-900"
            role="status"
          >
            Sesimu sudah berakhir. Mengalihkan ke halaman masuk…
          </p>
          <Link
            className="btn-primary inline-flex min-h-12 items-center justify-center rounded-full bg-primary-900 px-6 text-[0.9375rem] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
            href={SESSION_EXPIRED_PATH}
          >
            Masuk lagi
          </Link>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="grid min-h-dvh place-items-center bg-white px-6">
        <div className="w-full max-w-md rounded-[24px] border border-primary-900/15 bg-white p-8 text-center">
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
