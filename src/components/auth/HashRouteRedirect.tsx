"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Detects legacy hash-based routes from the BE redirect
 * (e.g. `/#/reset-password?verify=success&token=...`)
 * and redirects to the proper Next.js App Router path.
 *
 * Hash fragments are invisible to the server, so this must
 * run client-side.
 */
export function HashRouteRedirect() {
  const router = useRouter();

  useEffect(() => {
    const { hash } = window.location;
    if (!hash) return;

    // BE redirects to: /#/reset-password?verify=success&token=...
    // or:              /#/reset-password?verify=failed&message=...
    const match = hash.match(/^#\/reset-password\?(.+)$/);
    if (!match) return;

    const params = new URLSearchParams(match[1]);
    const verify = params.get("verify");
    const token = params.get("token");

    // Clear hash immediately to prevent re-triggering
    window.history.replaceState(null, "", window.location.pathname);

    if (verify === "success" && token) {
      router.replace(`/lupa-kata-sandi?token=${encodeURIComponent(token)}`);
    } else {
      // Token invalid or expired — send to email form with error context
      const message = params.get("message");
      const query = message ? `?error=${encodeURIComponent(message)}` : "";
      router.replace(`/lupa-kata-sandi${query}`);
    }
  }, [router]);

  return null;
}
