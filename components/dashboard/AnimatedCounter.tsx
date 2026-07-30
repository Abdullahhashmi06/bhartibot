"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  format?: "number" | "percentage";
  duration?: number;
}

export default function AnimatedCounter({
  value,
  format = "number",
  duration = 1,
}: AnimatedCounterProps) {
  const [mounted, setMounted] = useState(false);
  const springValue = useSpring(0, {
    bounce: 0,
    duration: duration * 1000,
  });

  useEffect(() => {
    setMounted(true);
    springValue.set(value);
  }, [value, springValue]);

  const displayValue = useTransform(springValue, (current) => {
    const rounded = Math.round(current);
    if (format === "percentage") {
      return `${rounded}%`;
    }
    return new Intl.NumberFormat("en-US").format(rounded);
  });

  if (!mounted) {
    return (
      <span>
        {format === "percentage" ? `${value}%` : new Intl.NumberFormat("en-US").format(value)}
      </span>
    );
  }

  return <motion.span>{displayValue}</motion.span>;
}
