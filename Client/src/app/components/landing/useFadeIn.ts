import { useEffect, useLayoutEffect, useRef } from "react";

// useLayoutEffect causes a warning in non-browser environments (SSR/tests).
// Use the browser version when window is available, useEffect otherwise.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useFadeIn<T extends HTMLElement = HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
