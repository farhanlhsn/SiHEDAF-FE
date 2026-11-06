import type {
  ThreadDirection,
  ThreadSegment,
} from "@/components/landing/ThreadPath";

type ThreadPointProps = {
  className?: string;
  dir?: ThreadDirection;
  to?: ThreadSegment;
  amplitude?: number;
  seed?: number;
  beats?: number;
  lead?: number;
  target?: string;
};

/**
 * An invisible waypoint for `ScrollThread`. Position it absolutely inside a
 * relative parent; responsive `hidden lg:block` classes switch routes per
 * breakpoint. A `loop` point is sized to the circle it should draw.
 */
export function ThreadPoint({
  className = "",
  dir,
  to,
  amplitude,
  seed,
  beats,
  lead,
  target,
}: ThreadPointProps) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute block ${to === "loop" ? "" : "size-0"} ${className}`}
      data-thread=""
      data-thread-amplitude={amplitude}
      data-thread-beats={beats}
      data-thread-dir={dir}
      data-thread-lead={lead}
      data-thread-seed={seed}
      data-thread-target={target}
      data-thread-to={to}
    />
  );
}
