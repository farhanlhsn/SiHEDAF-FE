/**
 * Geometry for the landing page's single continuous line ("satu garis").
 *
 * Anchors are measured from the DOM; this module turns them into one SVG path
 * plus a mapping from scroll position to drawn length. It is pure so it can be
 * unit tested and reused on any layout.
 */
import { rhythmWindow } from "@/components/landing/PulseWaveform";

export type ThreadDirection = "down" | "up" | "left" | "right";
export type ThreadSegment = "curve" | "line" | "jump" | "wave" | "loop" | "end";

export type ThreadAnchor = {
  x: number;
  y: number;
  /** Direction of travel at this anchor; shapes the curves around it. */
  dir?: ThreadDirection;
  /** How the line travels from this anchor to the next one. */
  to?: ThreadSegment;
  /** loop: circle radius, with the anchor sitting at the top of the circle. */
  radius?: number;
  /** wave: peak height in px above the baseline. */
  amplitude?: number;
  seed?: number;
  beats?: number;
  /** Shift (px) of the scroll position at which the head reaches this anchor. */
  lead?: number;
  /** Elements marked `data-thread-for="<target>"` receive `--thread-progress` for this segment. */
  target?: string;
};

export type ThreadCheckpoint = { scroll: number; length: number };
export type ThreadSpan = {
  target: string;
  kind: ThreadSegment;
  from: number;
  to: number;
};

export type ThreadModel = {
  d: string;
  total: number;
  xs: number[];
  ys: number[];
  lengths: number[];
  checkpoints: ThreadCheckpoint[];
  spans: ThreadSpan[];
};

const vectors: Record<ThreadDirection, [number, number]> = {
  down: [0, 1],
  up: [0, -1],
  left: [-1, 0],
  right: [1, 0],
};

function format(value: number) {
  return Number(value.toFixed(2)).toString();
}

function createPen(startX: number, startY: number) {
  const parts = [`M${format(startX)} ${format(startY)}`];
  const xs = [startX];
  const ys = [startY];
  const lengths = [0];
  let x = startX;
  let y = startY;
  let total = 0;

  function sample(nextX: number, nextY: number) {
    total += Math.hypot(nextX - x, nextY - y);
    x = nextX;
    y = nextY;
    xs.push(x);
    ys.push(y);
    lengths.push(total);
  }

  return {
    get total() {
      return total;
    },
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    moveTo(nextX: number, nextY: number) {
      parts.push(`M${format(nextX)} ${format(nextY)}`);
      x = nextX;
      y = nextY;
      xs.push(x);
      ys.push(y);
      lengths.push(total);
    },
    lineTo(nextX: number, nextY: number) {
      parts.push(`L${format(nextX)} ${format(nextY)}`);
      sample(nextX, nextY);
    },
    curveTo(
      c1x: number,
      c1y: number,
      c2x: number,
      c2y: number,
      endX: number,
      endY: number,
    ) {
      const startX = x;
      const startY = y;
      const roughLength =
        Math.hypot(c1x - startX, c1y - startY) +
        Math.hypot(c2x - c1x, c2y - c1y) +
        Math.hypot(endX - c2x, endY - c2y);
      const steps = Math.max(8, Math.ceil(roughLength / 6));

      parts.push(
        `C${format(c1x)} ${format(c1y)} ${format(c2x)} ${format(c2y)} ${format(endX)} ${format(endY)}`,
      );
      for (let step = 1; step <= steps; step += 1) {
        const t = step / steps;
        const u = 1 - t;
        sample(
          u * u * u * startX +
            3 * u * u * t * c1x +
            3 * u * t * t * c2x +
            t * t * t * endX,
          u * u * u * startY +
            3 * u * u * t * c1y +
            3 * u * t * t * c2y +
            t * t * t * endY,
        );
      }
    },
    loop(radius: number) {
      const topX = x;
      const topY = y;
      const steps = Math.max(48, Math.ceil((2 * Math.PI * radius) / 5));
      const r = format(radius);

      parts.push(
        `A${r} ${r} 0 1 1 ${format(topX)} ${format(topY + radius * 2)}A${r} ${r} 0 1 1 ${format(topX)} ${format(topY)}`,
      );
      for (let step = 1; step <= steps; step += 1) {
        const angle = -Math.PI / 2 + (step / steps) * Math.PI * 2;
        sample(
          topX + radius * Math.cos(angle),
          topY + radius + radius * Math.sin(angle),
        );
      }
    },
    path() {
      return parts.join("");
    },
    samples() {
      return { xs, ys, lengths };
    },
  };
}

export function buildThread(anchors: ReadonlyArray<ThreadAnchor>): ThreadModel {
  if (anchors.length === 0) {
    return {
      d: "",
      total: 0,
      xs: [],
      ys: [],
      lengths: [],
      checkpoints: [],
      spans: [],
    };
  }

  const pen = createPen(anchors[0].x, anchors[0].y);
  const checkpoints: ThreadCheckpoint[] = [];
  const spans: ThreadSpan[] = [];

  function checkpoint(scroll: number) {
    const previous = checkpoints[checkpoints.length - 1];
    const safeScroll = previous
      ? Math.max(scroll, previous.scroll + 1)
      : scroll;

    checkpoints.push({ scroll: safeScroll, length: pen.total });
    return safeScroll;
  }

  checkpoint(anchors[0].y + (anchors[0].lead ?? 0));

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const anchor = anchors[index];
    const next = anchors[index + 1];
    const segment = anchor.to ?? "curve";
    const startScroll = checkpoints[checkpoints.length - 1].scroll;
    let departure = anchor.dir ?? "down";
    let spanEnd: number | null = null;

    if (segment === "loop") {
      const radius = anchor.radius ?? 0;

      pen.loop(radius);
      spanEnd = checkpoint(anchor.y + radius * 2);
      // A clockwise loop leaves the top of the circle heading right.
      departure = "right";
    }

    if (segment === "jump") {
      pen.moveTo(next.x, next.y);
    } else if (segment === "line") {
      pen.lineTo(next.x, next.y);
    } else if (segment === "wave") {
      const width = next.x - pen.x;
      const amplitude = anchor.amplitude ?? 40;
      const strip = rhythmWindow({
        rhythm: "normal",
        seed: anchor.seed ?? 1,
        beats: anchor.beats ?? 6,
        samples: Math.max(8, Math.round(Math.abs(width) / 3)),
      });
      const baseX = pen.x;
      const baseY = pen.y;

      for (const point of strip.points) {
        pen.lineTo(
          baseX + point.t * width,
          baseY - point.value * amplitude * 0.9,
        );
      }
      pen.lineTo(next.x, next.y);
    } else if (segment !== "end") {
      const [startX, startY] = vectors[departure];
      const [endX, endY] = vectors[next.dir ?? "down"];
      const deltaX = Math.abs(next.x - pen.x);
      const deltaY = Math.abs(next.y - pen.y);
      const reach = Math.min(160, Math.hypot(deltaX, deltaY) * 0.45);
      // Don't let a handle overshoot far past the target along its own axis.
      const reachAlong = (x: number) =>
        Math.min(reach, (x !== 0 ? deltaX : deltaY) * 0.9 + 10);
      const departReach = reachAlong(startX);
      const arriveReach = reachAlong(endX);

      pen.curveTo(
        pen.x + startX * departReach,
        pen.y + startY * departReach,
        next.x - endX * arriveReach,
        next.y - endY * arriveReach,
        next.x,
        next.y,
      );
    }

    const arrival = checkpoint(next.y + (next.lead ?? 0));

    if (anchor.target) {
      spans.push({
        target: anchor.target,
        kind: segment,
        from: startScroll,
        to: segment === "loop" && spanEnd !== null ? spanEnd : arrival,
      });
    }
  }

  return {
    d: pen.path(),
    total: pen.total,
    ...pen.samples(),
    checkpoints,
    spans,
  };
}

export function lengthAtScroll(model: ThreadModel, scroll: number) {
  const { checkpoints } = model;

  if (checkpoints.length === 0) {
    return 0;
  }
  if (scroll <= checkpoints[0].scroll) {
    return checkpoints[0].length;
  }

  for (let index = 1; index < checkpoints.length; index += 1) {
    const previous = checkpoints[index - 1];
    const current = checkpoints[index];

    if (scroll < current.scroll) {
      const progress =
        (scroll - previous.scroll) / (current.scroll - previous.scroll);
      return previous.length + (current.length - previous.length) * progress;
    }
  }

  return checkpoints[checkpoints.length - 1].length;
}

export function pointAtLength(model: ThreadModel, length: number) {
  const { xs, ys, lengths } = model;

  if (lengths.length === 0) {
    return { x: 0, y: 0 };
  }

  let low = 0;
  let high = lengths.length - 1;

  while (low < high) {
    const middle = (low + high) >> 1;
    if (lengths[middle] < length) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  if (low === 0) {
    return { x: xs[0], y: ys[0] };
  }

  const span = lengths[low] - lengths[low - 1];
  const progress = span === 0 ? 1 : (length - lengths[low - 1]) / span;

  return {
    x: xs[low - 1] + (xs[low] - xs[low - 1]) * progress,
    y: ys[low - 1] + (ys[low] - ys[low - 1]) * progress,
  };
}

export function spanProgress(span: ThreadSpan, scroll: number) {
  if (span.to <= span.from) {
    return scroll >= span.to ? 1 : 0;
  }

  return Math.min(1, Math.max(0, (scroll - span.from) / (span.to - span.from)));
}
