"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import React from "react";

export type RevealVariant =
  | "fade-up"
  | "fade-down"
  | "fade-in"
  | "slide-left"
  | "slide-right"
  | "pop";

const variants: Record<RevealVariant, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -24 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-in": {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: 48 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: -48 },
    visible: { opacity: 1, x: 0 },
  },
  pop: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
};

interface RevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  /** Stagger delay in seconds (e.g. 0.1, 0.2) for cascading lists. */
  delay?: number;
  /**
   * Only animate once when scrolled into view.
   * Defaults to false — animations re-trigger every time the element
   * enters the viewport (scroll up, then back down = animates again).
   */
  once?: boolean;
  className?: string;
}

/**
 * Scroll-reveal wrapper. Elements fade/slide/pop every time they enter
 * the viewport (re-triggerable). Respects prefers-reduced-motion.
 */
export default function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  once = false,
  className,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px", amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
