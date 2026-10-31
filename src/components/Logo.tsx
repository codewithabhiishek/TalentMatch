import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  className?: string;
}

/**
 * TalentMatch Brand Mark: The Interlaced Möbius Cross
 *
 * Design Concept:
 * - Two continuous stadium ribbon loops (Talent & Healthcare Opportunity) intertwining
 *   in a seamless Möbius weave to form a clinical medical cross (+).
 * - A 4-point radiant precision match star at the central intersection, symbolizing
 *   the pinpoint alignment between clinician credentials and healthcare facility requisitions.
 * - Color Discipline: Deep Medical Obsidian (#0b1426 -> #02050e), Electric Cyan (#06b6d4),
 *   Luminous Sky (#38bdf8), Azure (#0284c7), and Pure White (#ffffff). Zero purple.
 */
export function Logo({ size = 'md', withText = true, className = '' }: LogoProps) {
  const pixelSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
  };

  const px = pixelSizes[size];
  const strokeW = size === 'sm' ? 5.5 : 4.5;
  const occludeW = size === 'sm' ? 7.5 : 6.5;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* The Interlaced Möbius Cross Mark */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        <defs>
          <linearGradient id={`tmBg-${size}`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0b1426" />
            <stop offset="1" stopColor="#02050e" />
          </linearGradient>

          <linearGradient id={`tmBorder-${size}`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="1" stopColor="#0284c7" stopOpacity="0.25" />
          </linearGradient>

          <linearGradient id={`tmV-${size}`} x1="24" y1="9" x2="24" y2="39" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.6" stopColor="#0284c7" />
            <stop offset="1" stopColor="#0369a1" />
          </linearGradient>

          <linearGradient id={`tmH-${size}`} x1="9" y1="24" x2="39" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#06b6d4" />
            <stop offset="0.5" stopColor="#0ea5e9" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>

          <filter id={`tmGlow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Squircle Base Canvas */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill={`url(#tmBg-${size})`}
          stroke={`url(#tmBorder-${size})`}
          strokeWidth="1.8"
        />

        {/* Subtle Ambient Core Radiance */}
        <circle cx="24" cy="24" r="12" fill="#0ea5e9" opacity="0.16" filter={`url(#tmGlow-${size})`} />

        {/* Vertical Ribbon Loop (Clinical Talent) */}
        <path
          d="M19 14.5C19 11.74 21.24 9.5 24 9.5C26.76 9.5 29 11.74 29 14.5V33.5C29 36.26 26.76 38.5 24 38.5C21.24 38.5 19 36.26 19 33.5V14.5Z"
          stroke={`url(#tmV-${size})`}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Horizontal Ribbon Loop (Healthcare Opportunity) */}
        <path
          d="M14.5 19C11.74 19 9.5 21.24 9.5 24C9.5 26.76 11.74 29 14.5 29H33.5C36.26 29 38.5 26.76 38.5 24C38.5 21.24 36.26 19 33.5 19H14.5Z"
          stroke={`url(#tmH-${size})`}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Depth Occlusion (Weave Overlap) */}
        <path d="M19 21.25V26.75" stroke="#040711" strokeWidth={occludeW} strokeLinecap="butt" />
        <path d="M19 21.25V26.75" stroke={`url(#tmV-${size})`} strokeWidth={strokeW} strokeLinecap="round" />

        <path d="M29 21.25V26.75" stroke="#040711" strokeWidth={occludeW} strokeLinecap="butt" />
        <path d="M29 21.25V26.75" stroke={`url(#tmV-${size})`} strokeWidth={strokeW} strokeLinecap="round" />

        {/* Center Radiant Match Precision Star */}
        <path
          d="M24 19.5L25.4 22.6L28.5 24L25.4 25.4L24 28.5L22.6 25.4L19.5 24L22.6 22.6L24 19.5Z"
          fill="#ffffff"
          filter={`url(#tmGlow-${size})`}
        />
        <circle cx="24" cy="24" r={size === 'sm' ? 1.3 : 1.6} fill="#38bdf8" />
      </svg>

      {/* Brand Typographic Lockup */}
      {withText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-[var(--color-text-primary)]">
              Talent<span className="text-sky-400">Match</span>
            </span>
            <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              ATS
            </span>
          </div>
          <span className="text-[10px] text-[var(--color-text-tertiary)] tracking-normal">
            Clinical Recruiting Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
