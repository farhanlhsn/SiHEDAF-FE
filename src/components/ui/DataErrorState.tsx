"use client";

import { useLayoutEffect, useRef } from "react";

import { BrokenSignal } from "@/components/ui/BrokenSignal";

type DataErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  /** A retry is in flight: the button waits and says so. */
  retrying?: boolean;
  compact?: boolean;
  className?: string;
  /** `alert` interrupts the reader; secondary panels use `status`. */
  live?: "alert" | "status";
};

/**
 * Moves focus to the nearest heading when the panel disappears while it holds
 * focus (a successful retry replaced it), so focus is not dropped on <body>.
 */
function useFocusHeadingOnUnmount(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const panel = ref.current;
    return () => {
      const parent = panel?.parentElement;
      // The cleanup runs before React removes the panel, so focus is still in it.
      if (!panel || !parent || !panel.contains(document.activeElement)) return;
      requestAnimationFrame(() => {
        if (!parent.isConnected) return;
        const heading = parent.querySelector<HTMLElement>("h1, h2, h3, h4");
        if (!heading) return;
        if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      });
    };
  }, [ref]);
}

/** One honest error panel with a retry, shared across the dashboard. */
export function DataErrorState({
  title,
  message,
  onRetry,
  retrying = false,
  compact = false,
  className = "",
  live = "alert",
}: DataErrorStateProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusHeadingOnUnmount(panelRef);

  return (
    <div
      className={`flex flex-col items-center text-center ${compact ? "gap-2 py-4" : "gap-3 py-10"} ${className}`}
      ref={panelRef}
      role={live}
    >
      <BrokenSignal />
      <p className="text-[1rem] font-semibold text-primary-900">{title}</p>
      <p className="max-w-[420px] text-[0.9375rem] leading-[1.55] text-primary-900/80">
        {message}
      </p>
      {onRetry ? (
        <button
          aria-busy={retrying || undefined}
          aria-disabled={retrying || undefined}
          className="mt-2 inline-flex h-12 items-center justify-center rounded-full border-[1.5px] border-primary-900/20 bg-white px-6 text-[0.9375rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 aria-disabled:cursor-wait aria-disabled:border-primary-900/15 aria-disabled:text-primary-900/70 aria-disabled:hover:bg-white print:hidden"
          onClick={() => {
            // aria-disabled keeps focus on the button, so the click is ignored here.
            if (!retrying) onRetry();
          }}
          type="button"
        >
          {retrying ? "Memuat ulang…" : "Coba lagi"}
        </button>
      ) : null}
    </div>
  );
}
