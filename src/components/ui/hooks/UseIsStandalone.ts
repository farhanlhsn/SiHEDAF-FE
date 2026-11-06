"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(display-mode: standalone)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return (
    window.matchMedia(QUERY).matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// null = not known yet (server render), so nothing mismatches on hydration.
function getServerSnapshot(): boolean | null {
  return null;
}

export function useIsStandalone(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}
