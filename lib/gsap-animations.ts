"use client";

import { useRef, useEffect, useMemo, useState, useLayoutEffect } from "react";
import gsap from "gsap";

function toDepSignature(deps: unknown[]): string {
  if (deps.length === 0) return "__empty__";

  return deps
    .map((dep) => {
      if (dep === null) return "null";

      const depType = typeof dep;
      if (depType === "string" || depType === "number" || depType === "boolean") {
        return `${depType}:${String(dep)}`;
      }
      if (depType === "undefined") return "undefined";

      try {
        return `json:${JSON.stringify(dep)}`;
      } catch {
        return `string:${String(dep)}`;
      }
    })
    .join("|");
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

// ─── Shared easing + timing tokens ───────────────────────────────
export const GSAP = {
  /** Page transitions */
  page: { duration: 0.22, ease: "power2.out" },
  /** Content fade-in */
  fadeIn: { duration: 0.26, ease: "power2.out" },
  /** List stagger */
  stagger: { each: 0.028, from: "start" as const },
  /** Spring-like for interactive elements */
  spring: { duration: 0.32, ease: "back.out(1.15)" },
  /** Snap spring (snappier) */
  springSnap: { duration: 0.24, ease: "back.out(1.45)" },
  /** Modal overlay */
  overlay: { duration: 0.18, ease: "power2.out" },
  /** Drawer slide */
  drawer: { duration: 0.28, ease: "power3.out" },
  /** Dropdown pop */
  dropdown: { duration: 0.16, ease: "power2.out" },
  /** Step wizard */
  step: { duration: 0.24, ease: "power2.out" },
} as const;

// ─── useGsapStagger ──────────────────────────────────────────────
// Animates direct children of a container with a stagger entrance.
// Replaces framer-motion's listVariants + itemVariants pattern.
export function useGsapStagger<T extends HTMLElement = HTMLDivElement>(
  deps: unknown[] = [],
  opts?: { y?: number; x?: number; stagger?: number; duration?: number; ease?: string },
) {
  const ref = useRef<T>(null);
  const depSignature = useMemo(() => toDepSignature(deps), [deps]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = el.children;
    if (children.length === 0) return;

    if (prefersReducedMotion) {
      gsap.set(children, { opacity: 1, x: 0, y: 0, clearProps: "transform" });
      return;
    }

    gsap.fromTo(
      children,
      {
        opacity: 0,
        y: opts?.y ?? 6,
        x: opts?.x ?? 0,
      },
      {
        opacity: 1,
        y: 0,
        x: 0,
        duration: opts?.duration ?? GSAP.spring.duration,
        ease: opts?.ease ?? GSAP.spring.ease,
        stagger: opts?.stagger ?? GSAP.stagger.each,
        clearProps: "transform",
      },
    );

    return () => {
      gsap.killTweensOf(children);
    };
  }, [depSignature, opts?.y, opts?.x, opts?.duration, opts?.ease, opts?.stagger, prefersReducedMotion]);

  return ref;
}

// ─── useGsapFadeIn ───────────────────────────────────────────────
// Simple fade+slide entrance for a single element.
export function useGsapFadeIn<T extends HTMLElement = HTMLDivElement>(
  deps: unknown[] = [],
  opts?: { y?: number; x?: number; duration?: number; delay?: number },
) {
  const ref = useRef<T>(null);
  const depSignature = useMemo(() => toDepSignature(deps), [deps]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1, x: 0, y: 0, clearProps: "transform" });
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, y: opts?.y ?? 6, x: opts?.x ?? 0 },
      {
        opacity: 1,
        y: 0,
        x: 0,
        duration: opts?.duration ?? GSAP.fadeIn.duration,
        ease: GSAP.fadeIn.ease,
        delay: opts?.delay ?? 0,
        clearProps: "transform",
      },
    );

    return () => {
      gsap.killTweensOf(el);
    };
  }, [depSignature, opts?.y, opts?.x, opts?.duration, opts?.delay, prefersReducedMotion]);

  return ref;
}

// ─── useGsapPresence ─────────────────────────────────────────────
// Handles animated mount/unmount — the GSAP equivalent of AnimatePresence.
// Returns { mounted, ref, show(), hide() }.
// `mounted` controls whether the element is in the DOM.
// Call `show()` to mount+animate-in, `hide()` to animate-out+unmount.
export function useGsapPresence(isOpen: boolean) {
  const [mounted, setMounted] = useState(isOpen);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      setMounted(isOpen);
      return;
    }

    if (isOpen) {
      setMounted(true);
    }
  }, [isOpen, prefersReducedMotion]);

  useLayoutEffect(() => {
    if (!mounted || !isOpen || prefersReducedMotion) return;

    const overlay = overlayRef.current;
    const panel = panelRef.current;

    if (overlay) {
      gsap.killTweensOf(overlay);
      gsap.set(overlay, { opacity: 0, willChange: "opacity" });
    }

    if (panel) {
      gsap.killTweensOf(panel);
      gsap.set(panel, {
        opacity: 0,
        scale: 0.96,
        y: 8,
        willChange: "transform,opacity",
        force3D: true,
      });
    }

    const tl = gsap.timeline();

    if (overlay) {
      tl.to(overlay, {
        opacity: 1,
        duration: GSAP.overlay.duration,
        ease: GSAP.overlay.ease,
        overwrite: "auto",
      }, 0);
    }

    if (panel) {
      tl.to(panel, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: GSAP.overlay.duration + 0.05,
        ease: GSAP.spring.ease,
        force3D: true,
        overwrite: "auto",
      }, 0);
    }

    return () => {
      tl.kill();
      if (overlay) gsap.set(overlay, { clearProps: "willChange" });
      if (panel) gsap.set(panel, { clearProps: "willChange" });
    };
  }, [mounted, isOpen, prefersReducedMotion]);

  useLayoutEffect(() => {
    if (isOpen || !mounted || prefersReducedMotion) return;

    const overlay = overlayRef.current;
    const panel = panelRef.current;

    if (overlay) {
      gsap.killTweensOf(overlay);
      gsap.set(overlay, { willChange: "opacity" });
    }

    if (panel) {
      gsap.killTweensOf(panel);
      gsap.set(panel, { willChange: "transform,opacity", force3D: true });
    }

    const tl = gsap.timeline({
      onComplete: () => setMounted(false),
    });

    if (panel) {
      tl.to(panel, {
        opacity: 0,
        scale: 0.95,
        y: 8,
        duration: GSAP.overlay.duration,
        ease: "power2.in",
        force3D: true,
        overwrite: "auto",
      }, 0);
    }

    if (overlay) {
      tl.to(overlay, {
        opacity: 0,
        duration: GSAP.overlay.duration,
        ease: "power2.in",
        overwrite: "auto",
      }, 0);
    }

    return () => {
      tl.kill();
      if (overlay) gsap.set(overlay, { clearProps: "willChange" });
      if (panel) gsap.set(panel, { clearProps: "willChange" });
    };
  }, [isOpen, mounted, prefersReducedMotion]);

  return { mounted, overlayRef, panelRef };
}

// ─── useGsapDrawerPresence ───────────────────────────────────────
// Same as useGsapPresence but for slide-in drawers (from right).
export function useGsapDrawerPresence(isOpen: boolean) {
  const [mounted, setMounted] = useState(isOpen);
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      setMounted(isOpen);
      return;
    }

    if (isOpen) {
      setMounted(true);
    }
  }, [isOpen, prefersReducedMotion]);

  useLayoutEffect(() => {
    if (!mounted || !isOpen || prefersReducedMotion) return;

    const overlay = overlayRef.current;
    const drawer = drawerRef.current;

    if (overlay) {
      gsap.killTweensOf(overlay);
      gsap.set(overlay, { opacity: 0, willChange: "opacity" });
    }

    if (drawer) {
      gsap.killTweensOf(drawer);
      gsap.set(drawer, {
        xPercent: 100,
        autoAlpha: 0,
        willChange: "transform,opacity",
        force3D: true,
      });
    }

    const tl = gsap.timeline();

    if (overlay) {
      tl.to(overlay, {
        opacity: 1,
        duration: GSAP.overlay.duration,
        ease: GSAP.overlay.ease,
        overwrite: "auto",
      }, 0);
    }

    if (drawer) {
      tl.to(drawer, {
        xPercent: 0,
        autoAlpha: 1,
        duration: GSAP.drawer.duration,
        ease: GSAP.drawer.ease,
        force3D: true,
        overwrite: "auto",
      }, 0);
    }

    return () => {
      tl.kill();
      if (overlay) gsap.set(overlay, { clearProps: "willChange" });
      if (drawer) gsap.set(drawer, { clearProps: "willChange" });
    };
  }, [mounted, isOpen, prefersReducedMotion]);

  useLayoutEffect(() => {
    if (isOpen || !mounted || prefersReducedMotion) return;

    const overlay = overlayRef.current;
    const drawer = drawerRef.current;

    if (overlay) {
      gsap.killTweensOf(overlay);
      gsap.set(overlay, { willChange: "opacity" });
    }

    if (drawer) {
      gsap.killTweensOf(drawer);
      gsap.set(drawer, { willChange: "transform,opacity", force3D: true });
    }

    const tl = gsap.timeline({
      onComplete: () => setMounted(false),
    });

    if (drawer) {
      tl.to(drawer, {
        xPercent: 100,
        autoAlpha: 0,
        duration: GSAP.drawer.duration,
        ease: "power3.in",
        force3D: true,
        overwrite: "auto",
      }, 0);
    }

    if (overlay) {
      tl.to(overlay, {
        opacity: 0,
        duration: GSAP.overlay.duration,
        ease: "power2.in",
        overwrite: "auto",
      }, 0);
    }

    return () => {
      tl.kill();
      if (overlay) gsap.set(overlay, { clearProps: "willChange" });
      if (drawer) gsap.set(drawer, { clearProps: "willChange" });
    };
  }, [isOpen, mounted, prefersReducedMotion]);

  return { mounted, overlayRef, drawerRef };
}

// ─── useGsapDropdownPresence ─────────────────────────────────────
// For dropdowns/popovers that need animated mount/unmount.
export function useGsapDropdownPresence(isOpen: boolean) {
  const [mounted, setMounted] = useState(isOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setMounted(isOpen);
      return;
    }

    if (isOpen) {
      setMounted(true);
    } else if (mounted) {
      if (dropdownRef.current) {
        gsap.to(dropdownRef.current, {
          opacity: 0,
          y: -4,
          scale: 0.98,
          duration: GSAP.dropdown.duration * 0.8,
          ease: "power2.in",
          onComplete: () => setMounted(false),
        });
      } else {
        setMounted(false);
      }
    }
  }, [isOpen, prefersReducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted) return;
    if (prefersReducedMotion) return;

    const frame = requestAnimationFrame(() => {
      if (dropdownRef.current) {
        gsap.fromTo(dropdownRef.current, {
          opacity: 0,
          y: -6,
          scale: 0.97,
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: GSAP.dropdown.duration,
          ease: GSAP.dropdown.ease,
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [mounted, prefersReducedMotion]);

  return { mounted, dropdownRef };
}

// ─── useGsapPageTransition ───────────────────────────────────────
// Animates a page container on mount (fade + slide up).
export function useGsapPageTransition<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1, y: 0, clearProps: "transform" });
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, y: 4 },
      {
        opacity: 1,
        y: 0,
        duration: GSAP.page.duration,
        ease: GSAP.page.ease,
        clearProps: "transform",
      },
    );

    return () => {
      gsap.killTweensOf(el);
    };
  }, [prefersReducedMotion]);

  return ref;
}

// ─── useGsapStepTransition ───────────────────────────────────────
// For wizard step transitions (slide from right on enter).
export function useGsapStepTransition<T extends HTMLElement = HTMLDivElement>(
  stepKey: string,
  direction: "forward" | "back" = "forward",
) {
  const ref = useRef<T>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1, x: 0, clearProps: "transform" });
      return;
    }

    const offset = direction === "back" ? -10 : 10;

    gsap.fromTo(
      el,
      { opacity: 0, x: offset },
      {
        opacity: 1,
        x: 0,
        duration: GSAP.step.duration,
        ease: GSAP.step.ease,
        clearProps: "transform",
      },
    );

    return () => {
      gsap.killTweensOf(el);
    };
  }, [stepKey, direction, prefersReducedMotion]);

  return ref;
}

// ─── useGsapCardEntrance ─────────────────────────────────────────
// For individual card entrance with spring-like animation.
export function useGsapCardEntrance<T extends HTMLElement = HTMLDivElement>(
  deps: unknown[] = [],
  opts?: { y?: number; delay?: number },
) {
  const ref = useRef<T>(null);
  const depSignature = useMemo(() => toDepSignature(deps), [deps]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1, y: 0, clearProps: "transform" });
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, y: opts?.y ?? 8 },
      {
        opacity: 1,
        y: 0,
        duration: GSAP.spring.duration,
        ease: GSAP.spring.ease,
        delay: opts?.delay ?? 0,
        clearProps: "transform",
      },
    );

    return () => {
      gsap.killTweensOf(el);
    };
  }, [depSignature, opts?.y, opts?.delay, prefersReducedMotion]);

  return ref;
}
