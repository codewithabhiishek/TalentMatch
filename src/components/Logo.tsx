import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  className?: string;
}

/**
 * TalentMatch Brand Mark: The Emerald-Amber Synergy Cross
 *
 * Design Concept:
 * - Two continuous interlocking stadium loops:
 *   1. Clinical Talent (Vibrant Mint to Forest Emerald: #34d399 -> #10b981)
 *   2. Requisition Match (Warm Golden Amber to Radiant Topaz: #fbbf24 -> #f59e0b)
 * - They interlock in a Möbius weave to form a clinical medical cross (+) and stylized T-M monogram.
 * - At the central nexus: A radiant white diamond match spark (#ffffff with golden core).
 * - Canvas: Deep Medical Obsidian (#080f1a -> #03060c).
 * - Zero purple, zero blue. Distinctive, high-contrast, and meaningful to Talent + Match.
 */
export function Logo({ size = 'md', withText = true, className = '' }: LogoProps) {
  const pixelSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
  };

  const px = pixelSizes[size];
  const strokeW = size === 'sm' ? 5.2 : 4.5;
  const occludeW = size === 'sm' ? 7.2 : 6.5;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* The Emerald-Amber Synergy Cross Mark */}
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
            <stop stopColor="#080f1a" />
            <stop offset="1" stopColor="#03060c" />
          </linearGradient>

          <linearGradient id={`tmBorder-${size}`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fbbf24" stopOpacity="0.85" />
          </linearGradient>

          {/* Vertical Ribbon Loop (Clinical Talent: Emerald Mint) */}
          <linearGradient id={`tmTalent-${size}`} x1="24" y1="9" x2="24" y2="39" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="0.5" stopColor="#10b981" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>

          {/* Horizontal Ribbon Loop (Requisition Match: Golden Amber) */}
          <linearGradient id={`tmMatch-${size}`} x1="9" y1="24" x2="39" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde047" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>

          <radialGradient id={`tmCore-${size}`} cx="24" cy="24" r="14" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" stopOpacity="0.25" />
            <stop offset="0.7" stopColor="#f59e0b" stopOpacity="0.15" />
            <stop offset="1" stopColor="#080f1a" stopOpacity="0" />
          </radialGradient>

          <filter id={`tmGlow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
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

        {/* Core Radiance */}
        <circle cx="24" cy="24" r="14" fill={`url(#tmCore-${size})`} />

        {/* Horizontal Loop (Requisition Match: Amber) */}
        <path
          d="M14.5 19C11.74 19 9.5 21.24 9.5 24C9.5 26.76 11.74 29 14.5 29H33.5C36.26 29 38.5 26.76 38.5 24C38.5 21.24 36.26 19 33.5 19H14.5Z"
          stroke={`url(#tmMatch-${size})`}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Vertical Loop (Clinical Talent: Emerald) */}
        <path
          d="M19 14.5C19 11.74 21.24 9.5 24 9.5C26.76 9.5 29 11.74 29 14.5V33.5C29 36.26 26.76 38.5 24 38.5C21.24 38.5 19 36.26 19 33.5V14.5Z"
          stroke={`url(#tmTalent-${size})`}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Interlaced Depth Occlusion (Emerald weaves over Amber on the left) */}
        <path d="M19 21V27" stroke="#040810" strokeWidth={occludeW} strokeLinecap="butt" />
        <path d="M19 21V27" stroke={`url(#tmTalent-${size})`} strokeWidth={strokeW} strokeLinecap="round" />

        {/* Interlaced Depth Occlusion (Amber weaves over Emerald on the right) */}
        <path d="M26 24H32" stroke="#040810" strokeWidth={occludeW} strokeLinecap="butt" />
        <path d="M26 24H32" stroke={`url(#tmMatch-${size})`} strokeWidth={strokeW} strokeLinecap="round" />

        {/* Center Radiant Match Precision Star */}
        <path
          d="M24 18.5L25.5 22.5L29.5 24L25.5 25.5L24 29.5L22.5 25.5L18.5 24L22.5 22.5Z"
          fill="#ffffff"
          filter={`url(#tmGlow-${size})`}
        />
        <circle cx="24" cy="24" r={size === 'sm' ? 1.3 : 1.6} fill="#fde047" />
      </svg>

      {/* Brand Typographic Lockup */}
      {withText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-[var(--color-text-primary)]">
              Talent<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">Match</span>
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
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
