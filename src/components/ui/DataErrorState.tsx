import { BrokenSignal } from "@/components/ui/BrokenSignal";

type DataErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  /** A retry is in flight: the button waits and says so. */
  retrying?: boolean;
  compact?: boolean;
  className?: string;
};

/** One honest error panel with a retry, shared across the dashboard. */
export function DataErrorState({
  title,
  message,
  onRetry,
  retrying = false,
  compact = false,
  className = "",
}: DataErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center text-center ${compact ? "gap-2 py-4" : "gap-3 py-10"} ${className}`}
      role="alert"
    >
      <BrokenSignal />
      <p className="text-[1rem] font-semibold text-primary-900">{title}</p>
      <p className="max-w-[420px] text-[0.9375rem] leading-[1.55] text-primary-900/80">
        {message}
      </p>
      {onRetry ? (
        <button
          aria-busy={retrying || undefined}
          className="mt-2 inline-flex h-12 items-center justify-center rounded-full border-[1.5px] border-primary-900/20 bg-white px-6 text-[0.9375rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300 disabled:cursor-wait disabled:border-primary-900/15 disabled:text-primary-900/70 disabled:hover:bg-white print:hidden"
          disabled={retrying}
          onClick={onRetry}
          type="button"
        >
          {retrying ? "Memuat ulang…" : "Coba lagi"}
        </button>
      ) : null}
    </div>
  );
}
