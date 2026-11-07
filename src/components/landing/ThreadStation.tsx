import type { ThreadDirection } from "@/components/landing/ThreadPath";

type ThreadStationProps = {
  index: string;
  label: string;
  className?: string;
  dir?: ThreadDirection;
};

/** A "stop" on the line, like a metro map: the ring fills once the line arrives. */
export function ThreadStation({
  index,
  label,
  className = "",
  dir,
}: ThreadStationProps) {
  return (
    <p className={`relative z-[2] flex items-center gap-4 ${className}`}>
      <span
        aria-hidden="true"
        className="thread-station grid size-[22px] shrink-0 place-items-center rounded-full border-[2.5px] border-primary-300 bg-paper"
        data-reached="false"
        data-thread=""
        data-thread-dir={dir}
        data-thread-station=""
      >
        <span className="thread-station-dot size-2 rounded-full bg-primary-300" />
      </span>
      <span className="text-[13px] font-semibold tracking-[0.08em] text-primary-700 uppercase">
        <span className="tabular-nums text-primary-500">{index}</span>
        <span aria-hidden="true" className="mx-2 text-primary-900/70">
          /
        </span>
        {label}
      </span>
    </p>
  );
}
