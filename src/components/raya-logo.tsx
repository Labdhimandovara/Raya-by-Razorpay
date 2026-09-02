"use client";

import React from "react";

interface RayaLogoProps {
  variant?: "light" | "dark" | "icon";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RayaLogo({ variant = "light", size = "md", className = "" }: RayaLogoProps) {
  const isDark = variant === "dark";

  const sizeStyles = {
    sm: { height: 26, iconSize: 22, textClass: "text-lg", subClass: "text-[9px]" },
    md: { height: 34, iconSize: 28, textClass: "text-2xl", subClass: "text-[11px]" },
    lg: { height: 44, iconSize: 36, textClass: "text-3xl", subClass: "text-[13px]" },
  }[size];

  // The stylized Raya geometric "1" mark
  const BrandIcon = ({ className = "" }: { className?: string }) => (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize }}
    >
      {/* Left dark navy/slate pillar */}
      <path
        d="M6 34L14 12H20L12 34H6Z"
        fill={isDark ? "#6DA8FF" : "#0D1B2A"}
      />
      {/* Right vibrant Raya Blue forward chevron/arrow */}
      <path
        d="M17 34L29 6H35L23 34H17Z"
        fill="#0A63FF"
      />
      <path
        d="M26 6L35 6L29 18H20L26 6Z"
        fill={isDark ? "#FFFFFF" : "#0A63FF"}
      />
    </svg>
  );

  if (variant === "icon") {
    return <BrandIcon className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <BrandIcon />
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-black tracking-tight font-sans italic ${sizeStyles.textClass} ${
              isDark ? "text-white" : "text-raya-navy"
            }`}
          >
            Raya
          </span>
        </div>
        <div className="flex items-center gap-1 -mt-0.5">
          <span
            className={`font-medium ${sizeStyles.subClass} ${
              isDark ? "text-raya-lightGray" : "text-raya-coolGray"
            }`}
          >
            by
          </span>
          {/* Razorpay mini geometric mark */}
          <span
            className={`font-bold ${sizeStyles.subClass} ${
              isDark ? "text-white" : "text-raya-navy"
            }`}
          >
            Razorpay
          </span>
        </div>
      </div>
    </div>
  );
}
