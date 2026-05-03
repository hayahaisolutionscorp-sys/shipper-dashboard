"use client";

import { useRef, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { GSAP } from "@/lib/gsap-animations";

function usePrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─── PageTransition ──────────────────────────────────────────────
// Wraps page content with a GSAP fade-in on mount.
// Used in the dashboard layout to animate page transitions.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1 });
      return;
    }

    gsap.killTweensOf(el);
    gsap.set(el, { opacity: 0 });
    gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: GSAP.page.duration, ease: GSAP.page.ease },
    );

    return () => {
      gsap.killTweensOf(el);
    };
  }, [pathname, prefersReducedMotion]);

  return <div ref={ref}>{children}</div>;
}
