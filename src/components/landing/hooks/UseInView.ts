import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/components/landing/hooks/UseReducedMotion";

type UseInViewOptions = {
  /** Keep the element "in view" after the first reveal instead of toggling. */
  once?: boolean;
  rootMargin?: string;
  threshold?: number;
};

export function useInView<Element extends HTMLElement>({
  once = true,
  rootMargin = "0px 0px -12% 0px",
  threshold = 0.2,
}: UseInViewOptions = {}) {
  const ref = useRef<Element>(null);
  const [isInView, setIsInView] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);

          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  // With reduced motion every illustration shows its final, informative state.
  return { ref, isInView: isInView || reducedMotion };
}
