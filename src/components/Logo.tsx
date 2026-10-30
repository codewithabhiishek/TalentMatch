import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  className?: string;
}

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
      {/* Lettermark SVG Monogram */}
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
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#090d16" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id={`tmBorder-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id={`tmTGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          <linearGradient id={`tmMGrad-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          <filter id={`tmGlow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Squircle Background Base */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill={`url(#tmBg-${size})`} />
        <rect x="2" y="2" width="44" height="44" rx="12" stroke={`url(#tmBorder-${size})`} strokeWidth="1.5" />

        {/* Subtle Ambient Glow Meshes */}
        <circle cx="16" cy="14" r="10" fill="#38bdf8" opacity="0.15" filter={`url(#tmGlow-${size})`} />
        <circle cx="32" cy="30" r="12" fill="#6366f1" opacity="0.15" filter={`url(#tmGlow-${size})`} />

        {/* 'T' Top Crossbar */}
        <path
          d="M11 14.5C11 13.67 11.67 13 12.5 13H35.5C36.33 13 37 13.67 37 14.5V16C37 16.83 36.33 17.5 35.5 17.5H12.5C11.67 17.5 11 16.83 11 16V14.5Z"
          fill={`url(#tmTGrad-${size})`}
        />

        {/* 'T' Central Spine Stem */}
        <path
          d="M22 17.5H26V33.5C26 34.33 25.33 35 24.5 35H23.5C22.67 35 22 34.33 22 33.5V17.5Z"
          fill={`url(#tmTGrad-${size})`}
        />

        {/* 'M' Left Wing */}
        <path
          d="M12.5 18.5C13.2 18.5 13.78 18.98 13.95 19.65L17.5 32.5C17.7 33.25 17.15 34 16.37 34H14.5C13.8 34 13.22 33.52 13.05 32.85L11.1 24.5H11V20C11 19.17 11.67 18.5 12.5 18.5Z"
          fill={`url(#tmMGrad-${size})`}
        />

        {/* 'M' Right Wing */}
        <path
          d="M35.5 18.5C34.8 18.5 34.22 18.98 34.05 19.65L30.5 32.5C30.3 33.25 30.85 34 31.63 34H33.5C34.2 34 34.78 33.52 34.95 32.85L36.9 24.5H37V20C37 19.17 36.33 18.5 35.5 18.5Z"
          fill={`url(#tmMGrad-${size})`}
        />

        {/* Clinical Match Precision Diamond Sparkle */}
        <path
          d="M37 9L38.2 11.8L41 13L38.2 14.2L37 17L35.8 14.2L33 13L35.8 11.8L37 9Z"
          fill="#38bdf8"
          filter={`url(#tmGlow-${size})`}
        />
        <circle cx="37" cy="13" r="1.2" fill="#ffffff" />
      </svg>

      {/* Stylized Brand Typographic Lockup */}
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
