"use client";

import { useScrollThread } from "@/components/landing/hooks/UseScrollThread";

/**
 * One continuous PPG line that is drawn down the page as the reader scrolls.
 * It reads `ThreadPoint` / `ThreadStation` anchors from its parent element.
 */
export function ScrollThread() {
  const { svgRef, lineRef, trailRef, headRef } = useScrollThread();

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] size-full overflow-visible"
      fill="none"
      ref={svgRef}
    >
      <path className="thread-trail" ref={trailRef} />
      <path className="thread-line" ref={lineRef} />
      <g className="thread-head" ref={headRef} style={{ opacity: 0 }}>
        <circle className="thread-head-glow" r="13" />
        <circle r="5" />
      </g>
    </svg>
  );
}
