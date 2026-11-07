import { useEffect, useRef, useState } from "react";

import {
  createPulseStream,
  type Rhythm,
} from "@/components/landing/PulseWaveform";
import { useReducedMotion } from "@/components/landing/hooks/UseReducedMotion";

/** Seconds of signal drawn across the full width, like a bedside monitor in sweep mode. */
const sweepSeconds = 6;
/** Blank gap in front of the sweep head that erases the previous pass. */
const eraseGap = 30;
const colors = { normal: "#006efb", af: "#ff4572" } as const;

const pulseStream = createPulseStream({
  baseBpm: 72,
  seed: 11,
  schedule: [
    { rhythm: "normal", beats: 10 },
    { rhythm: "af", beats: 9 },
    { rhythm: "normal", beats: 7 },
  ],
});

export type PulseReadout = {
  bpm: number;
  rhythm: Rhythm;
  /** Left edge (0–1) of the irregular segment currently on screen, if any. */
  afStart: number | null;
};

const initialReadout: PulseReadout = {
  bpm: 72,
  rhythm: "normal",
  afStart: null,
};

export function useLivePulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [readout, setReadout] = useState<PulseReadout>(initialReadout);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !container || !context) {
      return;
    }

    let width = 0;
    let height = 0;
    let values = new Float32Array(0);
    let irregular = new Uint8Array(0);
    let cursor = 0;
    let clock = 3;
    let frame = 0;
    let lastTimestamp: number | null = null;
    let isOnScreen = false;
    let reported = initialReadout;

    function fillColumns(from: number, to: number, sweepStart: number) {
      for (let column = from; column < to; column += 1) {
        const sample = pulseStream.sampleAt(
          sweepStart + (column / width) * sweepSeconds,
        );
        values[column] = sample.value;
        irregular[column] = sample.rhythm === "af" ? 1 : 0;
      }
    }

    function yFor(value: number) {
      return height * 0.84 - value * height * 0.56;
    }

    function strokeRuns(from: number, to: number, alpha: number) {
      let start = from;

      while (start < to) {
        const flag = irregular[start];
        let end = start + 1;

        while (end < to && irregular[end] === flag) {
          end += 1;
        }

        context!.beginPath();
        context!.moveTo(start, yFor(values[start]));
        for (
          let column = start + 1;
          column <= Math.min(end, to - 1);
          column += 1
        ) {
          context!.lineTo(column, yFor(values[column]));
        }
        context!.globalAlpha = alpha;
        context!.strokeStyle = flag ? colors.af : colors.normal;
        context!.stroke();
        start = end;
      }
    }

    function draw() {
      context!.clearRect(0, 0, width, height);
      context!.lineWidth = 2.25;
      context!.lineJoin = "round";
      context!.lineCap = "round";
      strokeRuns(Math.min(width, cursor + eraseGap), width, 0.32);
      strokeRuns(0, cursor, 1);

      if (!reducedMotion && cursor > 0) {
        const headY = yFor(values[cursor - 1]);
        const headColor = irregular[cursor - 1] ? colors.af : colors.normal;

        context!.globalAlpha = 0.18;
        context!.fillStyle = headColor;
        context!.beginPath();
        context!.arc(cursor - 1, headY, 11, 0, Math.PI * 2);
        context!.fill();
        context!.globalAlpha = 1;
        context!.beginPath();
        context!.arc(cursor - 1, headY, 4, 0, Math.PI * 2);
        context!.fill();
      }

      context!.globalAlpha = 1;
    }

    function findIrregularStart() {
      for (let column = 0; column < cursor; column += 1) {
        if (irregular[column] && (column === 0 || !irregular[column - 1])) {
          return column;
        }
      }

      for (let column = cursor + eraseGap + 1; column < width; column += 1) {
        if (irregular[column] && !irregular[column - 1]) {
          return column;
        }
      }

      return null;
    }

    function report() {
      const sample = pulseStream.sampleAt(clock);
      const startColumn = findIrregularStart();
      const next: PulseReadout = {
        bpm: sample.bpm,
        rhythm: sample.rhythm,
        afStart: startColumn === null ? null : startColumn / width,
      };

      if (
        next.bpm !== reported.bpm ||
        next.rhythm !== reported.rhythm ||
        next.afStart !== reported.afStart
      ) {
        reported = next;
        setReadout(next);
      }
    }

    function resize() {
      const bounds = container!.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      canvas!.width = width * pixelRatio;
      canvas!.height = height * pixelRatio;
      context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      values = new Float32Array(width);
      irregular = new Uint8Array(width);

      if (reducedMotion) {
        // A still frame that shows the regular rhythm turning irregular.
        clock = pulseStream.firstBeatOf("af") + 2.8;
        cursor = width;
        fillColumns(0, width, pulseStream.firstBeatOf("af") - 2.6);
      } else {
        const sweepStart = Math.floor(clock / sweepSeconds) * sweepSeconds;
        cursor = Math.floor(((clock - sweepStart) / sweepSeconds) * width);
        fillColumns(0, cursor, sweepStart);
        fillColumns(cursor, width, sweepStart - sweepSeconds);
      }

      draw();
    }

    function tick(timestamp: number) {
      const delta =
        lastTimestamp === null
          ? 0
          : Math.min(0.1, (timestamp - lastTimestamp) / 1000);
      const previousSweep = Math.floor(clock / sweepSeconds);

      lastTimestamp = timestamp;
      clock += delta;

      const sweep = Math.floor(clock / sweepSeconds);
      const sweepStart = sweep * sweepSeconds;
      const nextCursor = Math.min(
        width,
        Math.floor(((clock - sweepStart) / sweepSeconds) * width),
      );

      if (sweep !== previousSweep) {
        fillColumns(cursor, width, previousSweep * sweepSeconds);
        fillColumns(0, nextCursor, sweepStart);
      } else {
        fillColumns(cursor, nextCursor, sweepStart);
      }

      cursor = nextCursor;
      draw();
      report();
      frame = requestAnimationFrame(tick);
    }

    function start() {
      if (frame !== 0) {
        return;
      }

      lastTimestamp = null;
      frame = requestAnimationFrame(tick);
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    function syncPlayback() {
      if (
        !reducedMotion &&
        isOnScreen &&
        document.visibilityState === "visible"
      ) {
        start();
      } else {
        stop();
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion) {
        requestAnimationFrame(report);
      }
    });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isOnScreen = entry.isIntersecting;
      syncPlayback();
    });

    resizeObserver.observe(container);
    visibilityObserver.observe(container);
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, [reducedMotion]);

  return { canvasRef, containerRef, readout };
}
