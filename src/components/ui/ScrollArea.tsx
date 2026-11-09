"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

type ScrollAreaProps = {
  children: ReactNode;
  className?: string;
  /** Names the region for assistive tech while it can scroll sideways. */
  label?: string;
  viewportClassName?: string;
};

export function ScrollArea({
  children,
  className = "",
  label = "Konten yang dapat digeser ke samping",
  viewportClassName = "",
}: ScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  // Radix can leave its scrollbar showing after a sub-pixel width change, so we
  // measure the overflow ourselves and only expose the scrollbar and the
  // keyboard-focusable region while the content really is wider.
  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    let active = true;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (active) {
          setOverflows(viewport.scrollWidth - viewport.clientWidth > 1);
        }
      });
    };
    const resizeObserver = new ResizeObserver(measure);
    // Rows slide in (stagger-item translates them 5px), and cells can spill while
    // the web font loads, without any box changing size. Watch the content, the
    // fonts and the end of those entrance animations too.
    const mutationObserver = new MutationObserver(measure);

    resizeObserver.observe(viewport);

    if (viewport.firstElementChild) {
      resizeObserver.observe(viewport.firstElementChild);
    }

    mutationObserver.observe(viewport, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    void document.fonts?.ready.then(measure);
    viewport.addEventListener("animationend", measure);
    viewport.addEventListener("animationcancel", measure);

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      viewport.removeEventListener("animationend", measure);
      viewport.removeEventListener("animationcancel", measure);
    };
  }, []);

  return (
    <ScrollAreaPrimitive.Root
      className={`relative overflow-hidden ${className}`}
      scrollHideDelay={500}
      type="auto"
    >
      <ScrollAreaPrimitive.Viewport
        {...(overflows
          ? { "aria-label": label, role: "region", tabIndex: 0 }
          : {})}
        className={`h-full w-full rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-300 ${viewportClassName}`}
        ref={viewportRef}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {overflows ? (
        <ScrollAreaPrimitive.Scrollbar
          className="flex h-2.5 touch-none select-none flex-col bg-primary-50/80 p-0.5 transition-colors data-[state=hidden]:opacity-0 data-[state=visible]:opacity-100"
          orientation="horizontal"
        >
          <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-primary-200 transition-colors hover:bg-primary-300" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null}
    </ScrollAreaPrimitive.Root>
  );
}
