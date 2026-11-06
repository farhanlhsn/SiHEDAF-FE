"use client";

import { useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

function subscribeNoop() {
  return () => {};
}

type DashboardModalProps = Readonly<{
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
  showCloseButton?: boolean;
  size?: "default" | "wide";
}>;

export function DashboardModal({
  children,
  description,
  onClose,
  open,
  title,
  showCloseButton = false,
  size = "default",
}: DashboardModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  // False during server render and hydration, true on the client afterwards,
  // so an initially open modal never touches document before mount.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto px-4 py-8">
      <button
        aria-label="Tutup dialog"
        className="modal-backdrop fixed inset-0 bg-primary-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`modal-enter relative z-10 w-full ${size === "wide" ? "max-w-[760px]" : "max-w-[480px]"} rounded-[28px] bg-white p-6 text-primary-900 shadow-[0_24px_64px_rgba(0,39,88,0.2)] sm:p-8`}
        role="dialog"
      >
        {showCloseButton ? (
          <button
            aria-label="Tutup"
            className="absolute top-5 right-5 grid h-10 w-10 place-items-center rounded-full text-primary-900/75 transition-colors hover:bg-paper hover:text-primary-900 focus-visible:outline-2 focus-visible:outline-primary-300"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} strokeWidth={2} />
          </button>
        ) : null}

        <h2
          className="pr-12 text-[24px] leading-[1.15] font-bold tracking-[-0.035em]"
          id={titleId}
        >
          {title}
        </h2>
        {description ? (
          <p
            className="mt-2 pr-10 text-[16px] leading-[1.55] text-primary-900/80"
            id={descriptionId}
          >
            {description}
          </p>
        ) : null}
        <div className="mt-6">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
