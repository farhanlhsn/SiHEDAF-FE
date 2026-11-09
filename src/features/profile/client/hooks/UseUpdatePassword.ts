"use client";

import { useCallback, useRef, useState } from "react";

import { updatePassword } from "@/features/profile/client/services/ProfileClient";
import type { UpdatePasswordRequest } from "@/features/profile/shared/ProfileSchema";
import type {
  ProfileFailure,
  ProfileMutationResponse,
} from "@/features/profile/shared/ProfileTypes";

export function useUpdatePassword() {
  const inFlight = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<ProfileFailure | null>(null);

  const submit = useCallback(
    async (
      input: UpdatePasswordRequest,
    ): Promise<ProfileMutationResponse | null> => {
      if (inFlight.current) return null;

      inFlight.current = true;
      setIsPending(true);
      setError(null);

      try {
        const result = await updatePassword(input);
        // Expired: apiFetch is already sending the reader to /login.
        if (!result.success && result.status !== 401) setError(result);
        return result;
      } finally {
        inFlight.current = false;
        setIsPending(false);
      }
    },
    [],
  );

  return { submit, isPending, error };
}
