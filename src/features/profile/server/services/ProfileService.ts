import { z } from "zod";

import {
  BackendConfigurationError,
  buildBackendApiUrl,
} from "@/features/auth/shared/server/BackendUrl";
import {
  SESSION_EXPIRED,
  SessionServiceError,
} from "@/features/auth/session/server/SessionServiceError";
import {
  ProfileUserSchema,
  type UpdatePasswordRequest,
  type UpdateProfileRequest,
} from "@/features/profile/shared/ProfileSchema";
import type { UserProfile } from "@/features/profile/shared/ProfileTypes";

export const PROFILE_SERVICE_UNAVAILABLE =
  "Layanan profil sedang bermasalah. Coba lagi beberapa saat.";
export const INVALID_PROFILE = "Data profil tidak valid.";
export const INVALID_PASSWORD_UPDATE = "Data kata sandi tidak valid.";

const BackendEnvelopeSchema = z.object({
  code: z.number(),
  status: z.string(),
  recordsTotal: z.number(),
  errors: z.unknown().nullable(),
});

const BackendProfileResponseSchema = BackendEnvelopeSchema.extend({
  data: z.object({ user: ProfileUserSchema }),
});

const BackendMutationResponseSchema = BackendEnvelopeSchema.extend({
  data: z.object({ message: z.string().min(1).optional() }),
});

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type ProfileServiceOptions = {
  baseUrl?: string;
  fetcher?: Fetcher;
  signal?: AbortSignal;
};

type AuthenticatedRequestOptions = ProfileServiceOptions & {
  accessToken: string;
  badRequestMessage: string;
  body?: unknown;
  method: "GET" | "PATCH" | "PUT";
  path: string;
};

async function authenticatedRequest({
  accessToken,
  badRequestMessage,
  baseUrl,
  body,
  fetcher,
  method,
  path,
  signal,
}: AuthenticatedRequestOptions): Promise<unknown> {
  let url: string;
  try {
    url = buildBackendApiUrl(path, baseUrl);
  } catch (error) {
    if (error instanceof BackendConfigurationError) {
      throw new SessionServiceError(PROFILE_SERVICE_UNAVAILABLE, 500);
    }
    throw error;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await (fetcher ?? fetch)(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(10_000),
    });
  } catch {
    throw new SessionServiceError(PROFILE_SERVICE_UNAVAILABLE, 502);
  }

  if (!response.ok) {
    // The backend answers an expired access token with 403, not 401.
    if (response.status === 401 || response.status === 403) {
      throw new SessionServiceError(SESSION_EXPIRED, 401);
    }
    if (response.status === 400 || response.status === 422) {
      throw new SessionServiceError(badRequestMessage, 400);
    }
    throw new SessionServiceError(PROFILE_SERVICE_UNAVAILABLE, 502);
  }

  try {
    return await response.json();
  } catch {
    throw new SessionServiceError(PROFILE_SERVICE_UNAVAILABLE, 502);
  }
}

export async function getCurrentProfile(
  accessToken: string,
  options: ProfileServiceOptions = {},
): Promise<UserProfile> {
  const body = await authenticatedRequest({
    ...options,
    accessToken,
    badRequestMessage: INVALID_PROFILE,
    method: "GET",
    path: "auth/me",
  });
  const parsed = BackendProfileResponseSchema.safeParse(body);

  if (!parsed.success || parsed.data.code !== 200) {
    throw new SessionServiceError(PROFILE_SERVICE_UNAVAILABLE, 502);
  }

  return parsed.data.data.user;
}

export async function updateCurrentProfile(
  accessToken: string,
  input: UpdateProfileRequest,
  options: ProfileServiceOptions = {},
) {
  const body = await authenticatedRequest({
    ...options,
    accessToken,
    badRequestMessage: INVALID_PROFILE,
    body: input,
    method: "PUT",
    path: "auth/me/update",
  });
  const parsed = BackendMutationResponseSchema.safeParse(body);

  if (!parsed.success || parsed.data.code !== 200) {
    throw new SessionServiceError(PROFILE_SERVICE_UNAVAILABLE, 502);
  }

  return { message: "Profil berhasil diperbarui." };
}

export async function updateCurrentPassword(
  accessToken: string,
  input: UpdatePasswordRequest,
  options: ProfileServiceOptions = {},
) {
  const body = await authenticatedRequest({
    ...options,
    accessToken,
    badRequestMessage: INVALID_PASSWORD_UPDATE,
    body: input,
    method: "PATCH",
    path: "auth/me/update-password",
  });
  const parsed = BackendMutationResponseSchema.safeParse(body);

  if (!parsed.success || parsed.data.code !== 200) {
    throw new SessionServiceError(PROFILE_SERVICE_UNAVAILABLE, 502);
  }

  return { message: "Kata sandi berhasil diperbarui." };
}
