"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
}

const sizeClasses = {
  sm: { logo: "w-40 h-auto", subtitle: "text-xs" },
  md: { logo: "w-52 h-auto", subtitle: "text-sm" },
  lg: { logo: "w-64 h-auto", subtitle: "text-sm" },
  xl: { logo: "w-80 h-auto", subtitle: "text-base" },
};

export default function AnimatedLogo({ size = "md", variant = "light" }: AnimatedLogoProps) {
  const [mounted, setMounted] = useState(false);
  const classes = sizeClasses[size];
  const isLight = variant === "light";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <img
        src="/logo_juriscan.png"
        alt="Juriscan"
        className={cn(
          classes.logo,
          isLight && "brightness-0 invert",
          mounted ? "animate-fade-in" : "opacity-0"
        )}
      />

      <p
        className={cn(
          "mt-2",
          classes.subtitle,
          isLight ? "text-blue-200" : "text-gray-500",
          mounted ? "animate-fade-in" : "opacity-0"
        )}
        style={{ animationDelay: "200ms" }}
      >
        Inteligencia Juridica
      </p>
    </div>
  );
}
