"use client";

/**
 * MagneticCta — wraps the existing styled Button+Link with MagneticButton's
 * cursor-following spring effect. Falls back to a plain button on touch/no-motion.
 */

import Link from "next/link";
import MagneticButton from "@/components/smoothui/magnetic-button";

type MagneticCtaProps = {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function MagneticCta({
  href,
  children,
  variant = "default",
  size = "lg",
  className,
}: MagneticCtaProps) {
  return (
    <MagneticButton
      variant={variant}
      size={size}
      className={className}
      asChild
    >
      <Link href={href}>{children}</Link>
    </MagneticButton>
  );
}