"use client";

import { useCallback, useRef, useState } from "react";

import { useProfile } from "@/features/profile/client/ProfileProvider";
import { updateProfile } from "@/features/profile/client/services/ProfileClient";
import type { UpdateProfileRequest } from "@/features/profile/shared/ProfileSchema";
import type {
  ProfileFailure,
  ProfileMutationResponse,
} from "@/features/profile/shared/ProfileTypes";

export function useUpdateProfile() {
  const { updateUser } = useProfile();
  const inFlight = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<ProfileFailure | null>(null);

  const submit = useCallback(
    async (
      input: UpdateProfileRequest,
    ): Promise<ProfileMutationResponse | null> => {
      if (inFlight.current) return null;

      inFlight.current = true;
      setIsPending(true);
      setError(null);

      try {
        const result = await updateProfile(input);
        if (!result.success) {
          // Expired: apiFetch is already sending the reader to /login.
          if (result.status !== 401) setError(result);
        } else {
          updateUser({ fullname: input.fullname });
        }
        return result;
      } finally {
        inFlight.current = false;
        setIsPending(false);
      }
    },
    [updateUser],
  );

  return { submit, isPending, error };
}
