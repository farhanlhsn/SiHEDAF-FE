"use client";

import { useSyncExternalStore } from "react";

export type OnlineStatus = { online: boolean; reconnectCount: number };

const SERVER_SNAPSHOT: OnlineStatus = { online: true, reconnectCount: 0 };

let snapshot: OnlineStatus = SERVER_SNAPSHOT;
let attached = false;
const listeners = new Set<() => void>();

function publish(next: OnlineStatus) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function handleOnline() {
  if (snapshot.online) return;
  publish({ online: true, reconnectCount: snapshot.reconnectCount + 1 });
}

function handleOffline() {
  if (!snapshot.online) return;
  publish({ online: false, reconnectCount: snapshot.reconnectCount });
}

function subscribe(listener: () => void) {
  if (!attached) {
    attached = true;
    // Catch up with the real state before the first listener hears anything.
    snapshot = {
      online: navigator.onLine,
      reconnectCount: snapshot.reconnectCount,
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      attached = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    }
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => SERVER_SNAPSHOT;

/** Connection state, plus a counter that grows each time the internet returns. */
export function useOnlineStatus(): OnlineStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
