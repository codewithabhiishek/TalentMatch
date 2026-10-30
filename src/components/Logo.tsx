import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  className?: string;
}

/**
 * TalentMatch Brand Mark: The Clinical Pulse Cross
 *
 * Meaning:
 * 1. Medical Cross (+) — Universal healthcare authority (Nursing, Medical, Allied Health).
 * 2. Vital ECG Pulse (/\_) — Real-time candidate matching, active clinical telemetry.
 * 3. Match Focal Core (●) — Pinpoint precision alignment between clinician & healthcare facility.
 *
 * Color Discipline: Strictly Clinical Sky Blue (#0ea5e9, #38bdf8), Deep Medical Obsidian (#0b1329),
 * and Crisp Pure White (#ffffff). Zero purple / extraneous hues.
 */
export function Logo({ size = 'md', withText = true, className = '' }: LogoProps) {
  const pixelSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
  };

  const px = pixelSizes[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Clinical Care Cross + Vital ECG Pulse Emblem */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        <defs>
          <linearGradient id={`tmBg-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b1329" />
            <stop offset="50%" stopColor="#080e1e" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>

          <linearGradient id={`tmBorder-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id={`tmCross-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="45%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <filter id={`tmGlow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Squircle Base Canvas */}
        <rect
          x="2.5"
          y="2.5"
          width="43"
          height="43"
          rx="12"
          fill={`url(#tmBg-${size})`}
          stroke={`url(#tmBorder-${size})`}
          strokeWidth="1.5"
        />

        {/* Soft Radial Ambient Glow */}
        <circle cx="24" cy="24" r="14" fill="#0ea5e9" opacity="0.12" filter={`url(#tmGlow-${size})`} />

        {/* Clinical Medical Cross (+) */}
        {/* Vertical Arm */}
        <rect x="19.5" y="9.5" width="9" height="29" rx="4.5" fill={`url(#tmCross-${size})`} />
        {/* Horizontal Arm */}
        <rect x="9.5" y="19.5" width="29" height="9" rx="4.5" fill={`url(#tmCross-${size})`} />

        {/* The Vital ECG Pulse & Match Waveform */}
        <path
          d="M 11.5 24 H 17 L 19.5 26.5 L 23 14 L 26.5 34 L 28.5 22 L 30 24 H 36.5"
          stroke="#ffffff"
          strokeWidth={size === 'sm' ? 2.8 : 2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#tmGlow-${size})`}
        />

        {/* Precision Match Focal Node */}
        <circle cx="23" cy="14" r={size === 'sm' ? 1.5 : 1.8} fill="#38bdf8" />
        <circle cx="23" cy="14" r={size === 'sm' ? 0.7 : 0.9} fill="#ffffff" />
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
