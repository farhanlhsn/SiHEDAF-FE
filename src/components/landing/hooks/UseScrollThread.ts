import { useEffect, useRef } from "react";

import {
  buildThread,
  lengthAtScroll,
  pointAtLength,
  spanProgress,
  type ThreadAnchor,
  type ThreadDirection,
  type ThreadModel,
  type ThreadSegment,
} from "@/components/landing/ThreadPath";
import { useReducedMotion } from "@/components/landing/hooks/UseReducedMotion";

/** The drawing head follows this line of the viewport (fraction of its height). */
const headLine = 0.64;

function readNumber(value: string | undefined) {
  return value === undefined || value === "" ? undefined : Number(value);
}

function readAnchor(
  element: HTMLElement,
  rootLeft: number,
  rootTop: number,
): ThreadAnchor {
  const bounds = element.getBoundingClientRect();
  const { dataset } = element;
  const to = dataset.threadTo as ThreadSegment | undefined;
  const isLoop = to === "loop";

  return {
    x: bounds.left + bounds.width / 2 - rootLeft,
    y: (isLoop ? bounds.top : bounds.top + bounds.height / 2) - rootTop,
    dir: dataset.threadDir as ThreadDirection | undefined,
    to,
    radius: isLoop ? bounds.height / 2 : undefined,
    amplitude: readNumber(dataset.threadAmplitude),
    seed: readNumber(dataset.threadSeed),
    beats: readNumber(dataset.threadBeats),
    lead: readNumber(dataset.threadLead),
    target: dataset.threadTarget,
  };
}

export function useScrollThread() {
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const svg = svgRef.current;
    const line = lineRef.current;
    const trail = trailRef.current;
    const head = headRef.current;
    const root = svg?.parentElement;

    if (!svg || !line || !trail || !head || !root) {
      return;
    }

    let model: ThreadModel | null = null;
    let rootPageTop = 0;
    let stations: Array<{ element: HTMLElement; y: number }> = [];
    let targets = new Map<string, HTMLElement[]>();
    let updateFrame = 0;
    let measureFrame = 0;

    function measure() {
      measureFrame = 0;

      const rootBounds = root!.getBoundingClientRect();
      const anchorElements = Array.from(
        root!.querySelectorAll<HTMLElement>("[data-thread]"),
      ).filter((element) => element.getClientRects().length > 0);
      const anchors = anchorElements.map((element) =>
        readAnchor(element, rootBounds.left, rootBounds.top),
      );

      rootPageTop = rootBounds.top + window.scrollY;
      model = buildThread(anchors);
      stations = anchorElements.flatMap((element, index) =>
        element.dataset.threadStation !== undefined
          ? [{ element, y: anchors[index].y }]
          : [],
      );
      targets = new Map();
      for (const element of root!.querySelectorAll<HTMLElement>(
        "[data-thread-for]",
      )) {
        for (const name of (element.dataset.threadFor ?? "").split(" ")) {
          targets.set(name, [...(targets.get(name) ?? []), element]);
        }
      }

      const total = String(Math.max(model.total, 1));
      for (const path of [line!, trail!]) {
        path.setAttribute("d", model.d);
        path.setAttribute("pathLength", total);
      }
      line!.style.strokeDasharray = `${total} ${total}`;
      update();
    }

    function update() {
      updateFrame = 0;

      if (!model) {
        return;
      }

      const scroll =
        window.scrollY + window.innerHeight * headLine - rootPageTop;
      const drawn = reducedMotion ? model.total : lengthAtScroll(model, scroll);
      const parked = model.spans.some(
        (span) =>
          span.kind === "jump" && scroll > span.from && scroll < span.to,
      );
      const point = pointAtLength(model, drawn);

      line!.style.strokeDashoffset = String(model.total - drawn);
      head!.setAttribute("transform", `translate(${point.x} ${point.y})`);
      head!.style.opacity =
        reducedMotion || parked || drawn <= 0 || drawn >= model.total
          ? "0"
          : "1";

      for (const span of model.spans) {
        const progress = reducedMotion ? 1 : spanProgress(span, scroll);
        for (const element of targets.get(span.target) ?? []) {
          element.style.setProperty("--thread-progress", progress.toFixed(4));
        }
      }

      for (const station of stations) {
        station.element.dataset.reached = String(
          reducedMotion || scroll >= station.y,
        );
      }
    }

    function scheduleUpdate() {
      if (updateFrame === 0) {
        updateFrame = requestAnimationFrame(update);
      }
    }

    function scheduleMeasure() {
      if (measureFrame === 0) {
        measureFrame = requestAnimationFrame(measure);
      }
    }

    const resizeObserver = new ResizeObserver(scheduleMeasure);

    resizeObserver.observe(root);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    window.addEventListener("load", scheduleMeasure);
    // Entrance animations and late web fonts shift anchors after the first paint.
    const settleTimer = window.setTimeout(scheduleMeasure, 1200);
    void document.fonts?.ready.then(scheduleMeasure);
    scheduleMeasure();

    return () => {
      cancelAnimationFrame(updateFrame);
      cancelAnimationFrame(measureFrame);
      window.clearTimeout(settleTimer);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("load", scheduleMeasure);
    };
  }, [reducedMotion]);

  return { svgRef, lineRef, trailRef, headRef };
}
