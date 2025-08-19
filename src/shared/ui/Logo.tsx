"use client";

import Image from "next/image";
import { BRAND } from "./brand";

// Aspect ratio based on provided logo.svg (approx 370.98 x 77.04)
export const LOGO_ASPECT = 370.98 / 77.04; // ~4.81

interface LogoProps {
  height?: number; // desired height in px; width will be auto by aspect ratio
  className?: string;
}

export function Logo({ height = 28, className }: LogoProps) {
  const width = Math.round(height * LOGO_ASPECT);
  return (
    <Image
      src={BRAND.logoSrc}
      alt={`${BRAND.name} logo`}
      width={width}
      height={height}
      priority
      className={className}
    />
  );
}
