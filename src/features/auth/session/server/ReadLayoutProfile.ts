import { cookies } from "next/headers";

import { getCurrentProfile } from "@/features/profile/server/services/ProfileService";
import type { UserProfile } from "@/features/profile/shared/ProfileTypes";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./AuthCookies";

/** Read access only: a Server Component cannot set or clear cookies. */
export type ReadOnlyCookieStore = {
  get(name: string): { value: string } | undefined;
};

export type LayoutProfile =
  /** No session cookie at all: the layout sends the reader to /login. */
  | { hasSession: false }
  /**
   * A session cookie is there. `user` is null when the profile could not be
   * read with the access token (expired, refused, backend down) or only a
   * refresh token is left: the client ProfileProvider then asks
   * /api/v1/auth/me, whose route handler can refresh and write cookies, and
   * goes to /login on a 401.
   */
  | { hasSession: true; user: UserProfile | null };

type ReadLayoutProfileOptions = {
  cookieStore?: ReadOnlyCookieStore;
  profileReader?: (accessToken: string) => Promise<UserProfile>;
};

/**
 * The dashboard layout's session check. It never refreshes or writes
 * cookies (a layout renders as a Server Component, where cookies are
 * read-only); refreshing is left to the route handlers the client calls.
 */
export async function readLayoutProfile(
  options: ReadLayoutProfileOptions = {},
): Promise<LayoutProfile> {
  const cookieStore = options.cookieStore ?? (await cookies());
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    try {
      const user = await (options.profileReader ?? getCurrentProfile)(
        accessToken,
      );
      return { hasSession: true, user };
    } catch {
      return { hasSession: true, user: null };
    }
  }

  if (cookieStore.get(REFRESH_TOKEN_COOKIE)?.value) {
    return { hasSession: true, user: null };
  }

  return { hasSession: false };
}
