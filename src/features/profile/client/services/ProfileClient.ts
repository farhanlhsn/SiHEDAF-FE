import {
  apiFetch,
  SessionExpiredError,
} from "@/features/auth/session/client/ApiFetch";
import { AuthResponseSchema } from "@/features/auth/session/shared/SessionSchema";
import type { AuthResponse } from "@/features/auth/session/shared/SessionTypes";
import {
  ProfileMutationResponseSchema,
  ProfileResponseSchema,
  type UpdatePasswordRequest,
  type UpdateProfileRequest,
} from "@/features/profile/shared/ProfileSchema";
import type {
  ProfileFailure,
  ProfileMutationResponse,
  ProfileResponse,
} from "@/features/profile/shared/ProfileTypes";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * A request that threw. An expired session is a 401 (apiFetch is already
 * sending the reader to /login); anything else keeps what was thrown, so the
 * caller can tell a dropped connection apart.
 */
function thrownFailure(error: unknown, message: string): ProfileFailure {
  return error instanceof SessionExpiredError
    ? { success: false, message, status: 401 }
    : { success: false, message, cause: error };
}

async function readProfileResponse(
  response: Response,
  fallbackMessage: string,
): Promise<ProfileResponse> {
  try {
    const parsed = ProfileResponseSchema.safeParse(await response.json());
    if (!parsed.success || parsed.data.success !== response.ok) {
      return { success: false, message: fallbackMessage };
    }
    if (!parsed.data.success) {
      return { ...parsed.data, status: response.status };
    }
    return parsed.data;
  } catch {
    return { success: false, message: fallbackMessage };
  }
}

async function readMutationResponse(
  response: Response,
  fallbackMessage: string,
): Promise<ProfileMutationResponse> {
  try {
    const parsed = ProfileMutationResponseSchema.safeParse(
      await response.json(),
    );
    if (!parsed.success || parsed.data.success !== response.ok) {
      return { success: false, message: fallbackMessage };
    }
    if (!parsed.data.success) {
      return { ...parsed.data, status: response.status };
    }
    return parsed.data;
  } catch {
    return { success: false, message: fallbackMessage };
  }
}

export async function fetchCurrentProfile(
  fetcher: Fetcher = apiFetch,
): Promise<ProfileResponse> {
  const fallbackMessage = "Data profil tidak dapat dimuat.";
  try {
    const response = await fetcher("/api/v1/auth/me", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    return readProfileResponse(response, fallbackMessage);
  } catch (error) {
    return thrownFailure(error, fallbackMessage);
  }
}

export async function updateProfile(
  input: UpdateProfileRequest,
  fetcher: Fetcher = apiFetch,
): Promise<ProfileMutationResponse> {
  const fallbackMessage = "Profil tidak dapat diperbarui.";
  try {
    const response = await fetcher("/api/v1/auth/me/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      credentials: "same-origin",
    });
    return readMutationResponse(response, fallbackMessage);
  } catch (error) {
    return thrownFailure(error, fallbackMessage);
  }
}

export async function updatePassword(
  input: UpdatePasswordRequest,
  fetcher: Fetcher = apiFetch,
): Promise<ProfileMutationResponse> {
  const fallbackMessage = "Kata sandi tidak dapat diperbarui.";
  try {
    const response = await fetcher("/api/v1/auth/me/update-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      credentials: "same-origin",
    });
    return readMutationResponse(response, fallbackMessage);
  } catch (error) {
    return thrownFailure(error, fallbackMessage);
  }
}

// Plain fetch: a 401 here only means the session was already over.
export async function logoutAccount(
  fetcher: Fetcher = fetch,
): Promise<AuthResponse> {
  try {
    const response = await fetcher("/api/v1/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    const parsed = AuthResponseSchema.safeParse(await response.json());
    if (!parsed.success || parsed.data.success !== response.ok) {
      return { success: false, message: "Akun tidak dapat dikeluarkan." };
    }
    return parsed.data;
  } catch {
    return { success: false, message: "Akun tidak dapat dikeluarkan." };
  }
}
