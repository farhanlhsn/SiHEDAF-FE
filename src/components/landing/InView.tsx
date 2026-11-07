"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";

import { useInView } from "@/components/landing/hooks/UseInView";

type InViewProps = {
  as?: "div" | "figure" | "ol" | "ul" | "section";
  children: ReactNode;
  className?: string;
  /** Keep playing only while visible (for looping illustrations). */
  loop?: boolean;
  style?: CSSProperties;
};

/**
 * Marks its subtree with `data-play="true"` once it scrolls into view, so CSS in
 * globals.css can start reveals and pause looping illustrations offscreen.
 */
export function InView({
  as = "div",
  children,
  className,
  loop = false,
  style,
}: InViewProps) {
  const { ref, isInView } = useInView<HTMLElement>({ once: !loop });
  const Component = as as ElementType;

  return (
    <Component
      className={className}
      data-play={isInView ? "true" : "false"}
      ref={ref}
      style={style}
    >
      {children}
    </Component>
  );
}
