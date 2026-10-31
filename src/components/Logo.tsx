import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  className?: string;
}

/**
 * TalentMatch Brand Mark: Precision Matching Architecture
 *
 * Design Concept:
 * - Two dynamic precision brackets (Talent & Requisition) converging on a central match diamond.
 * - Solid, high-contrast, timeless: crisp white (#ffffff) on dark charcoal/slate (#0f172a).
 * - Basic colors only: zero AI gradients, zero rainbow text, zero neon glow artifacts.
 * - Typography: Project standard DM Sans / system font (strictly avoiding Inter).
 */
export function Logo({ size = 'md', withText = true, className = '' }: LogoProps) {
  const pixelSizes = {
    sm: 26,
    md: 32,
    lg: 40,
    xl: 48,
  };

  const px = pixelSizes[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Match Mark */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-150 hover:scale-105"
      >
        {/* Dark Slate Base Squircle */}
        <rect
          width="32"
          height="32"
          rx="8"
          fill="#0f172a"
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth="1"
        />

        {/* Talent Bracket (Top-Left) */}
        <path
          d="M 8.5 17 V 11 C 8.5 9.6 9.6 8.5 11 8.5 H 17"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Requisition Bracket (Bottom-Right) */}
        <path
          d="M 23.5 15 V 21 C 23.5 22.4 22.4 23.5 21 23.5 H 15"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Central Match Point Diamond */}
        <path
          d="M 16 13.5 L 18.5 16 L 16 18.5 L 13.5 16 Z"
          fill="#ffffff"
        />
      </svg>

      {/* Clean Solid Typographic Lockup (Zero Rainbow Gradients) */}
      {withText && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white">
              TalentMatch
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10 tracking-wider">
              ATS
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 tracking-normal font-normal">
            Clinical Recruiting Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
