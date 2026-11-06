"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  TEXT_SIZE_EVENT,
  TEXT_SIZE_STORAGE_KEY,
  type TextSize,
  parseTextSize,
} from "@/components/ui/TextSize";

function applyToDocument(size: TextSize) {
  if (size === "normal") delete document.documentElement.dataset.textSize;
  else document.documentElement.dataset.textSize = size;
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== null && event.key !== TEXT_SIZE_STORAGE_KEY) return;
    applyToDocument(parseTextSize(event.newValue));
    onChange();
  }
  window.addEventListener(TEXT_SIZE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(TEXT_SIZE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// The head script (or setSize) keeps <html data-text-size> authoritative, so
// the first client render matches what the reader already sees.
function getSnapshot(): TextSize {
  return parseTextSize(document.documentElement.dataset.textSize);
}

function getServerSnapshot(): TextSize {
  return "normal";
}

export function useTextSize(): { size: TextSize; setSize(size: TextSize): void } {
  const size = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setSize = useCallback((next: TextSize) => {
    try {
      localStorage.setItem(TEXT_SIZE_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still applies for this page's lifetime.
    }
    applyToDocument(next);
    window.dispatchEvent(new Event(TEXT_SIZE_EVENT));
  }, []);

  return { size, setSize };
}
