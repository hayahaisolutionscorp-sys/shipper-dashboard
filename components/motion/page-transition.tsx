"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import type { Variants, Transition } from "framer-motion";

/** Shared animation config for consistency across the app */
export const motionConfig = {
  /** Page transitions: subtle, quick */
  page: {
    duration: 0.2,
    ease: [0.25, 0.1, 0.25, 1] as const, // ease-out-ish
  },
  /** Content fade-in: gentle entrance */
  fadeIn: {
    duration: 0.25,
    ease: "easeOut",
  },
  /** Stagger for lists */
  stagger: {
    delayChildren: 0.03,
    staggerChildren: 0.04,
  },
  /** Spring for interactive elements */
  spring: {
    type: "spring" as const,
    stiffness: 400,
    damping: 28,
  },
  /** Tighter spring for snappier feel */
  springSnap: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
  },
} as const;

const pageTransition: Transition = {
  duration: motionConfig.page.duration,
  ease: motionConfig.page.ease,
};

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={pageTransition}
        style={{ minHeight: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: motionConfig.stagger.delayChildren,
      staggerChildren: motionConfig.stagger.staggerChildren,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: motionConfig.spring,
  },
};

/** Fade + slide up for sections/cards */
export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: motionConfig.fadeIn.duration, ease: motionConfig.fadeIn.ease },
  },
};

/** Step transition for wizards */
export const stepVariants: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: {
    opacity: 1,
    x: 0,
    transition: motionConfig.spring,
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};
