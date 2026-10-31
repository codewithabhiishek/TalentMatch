import React from 'react';
import { UserProfile } from '../store';

interface RecruiterAvatarProps {
  user?: Partial<UserProfile> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: 'active' | 'interviewing' | 'offline';
  className?: string;
}

/**
 * Executive Recruiter Portrait Avatar
 * Human, professional, friendly clinical recruiter avatar.
 * Replaces the generic initials and dark "hacker" style with a warm, authentic executive profile.
 */
export function RecruiterAvatar({
  user,
  size = 'md',
  showStatus = true,
  status = 'active',
  className = '',
}: RecruiterAvatarProps) {
  const sizeMap = {
    xs: { px: 24, dot: 'w-2 h-2 -bottom-0.5 -right-0.5' },
    sm: { px: 32, dot: 'w-2.5 h-2.5 bottom-0 right-0' },
    md: { px: 40, dot: 'w-3 h-3 bottom-0 right-0' },
    lg: { px: 52, dot: 'w-3.5 h-3.5 bottom-0.5 right-0.5' },
    xl: { px: 64, dot: 'w-4 h-4 bottom-0.5 right-0.5' },
  };

  const { px, dot } = sizeMap[size] || sizeMap.md;

  const statusColors = {
    active: 'bg-emerald-500 ring-2 ring-[var(--color-surface)]',
    interviewing: 'bg-amber-400 ring-2 ring-[var(--color-surface)]',
    offline: 'bg-slate-400 ring-2 ring-[var(--color-surface)]',
  };

  return (
    <div
      className={`relative inline-flex shrink-0 select-none ${className}`}
      style={{ width: px, height: px }}
    >
      {/* Friendly, Professional Recruiter Executive Portrait */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-full overflow-hidden shadow-xs border border-white/15 bg-slate-800"
      >
        <defs>
          {/* Warm Studio Background Gradient */}
          <linearGradient id="recruiterBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e293b" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>

          {/* Skin Tone */}
          <linearGradient id="skinTone" x1="32" y1="20" x2="32" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f8d5bc" />
            <stop offset="1" stopColor="#eec1a2" />
          </linearGradient>

          {/* Blazer Gradient */}
          <linearGradient id="blazerGradient" x1="16" y1="46" x2="48" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#334155" />
            <stop offset="1" stopColor="#1e293b" />
          </linearGradient>
        </defs>

        {/* Circular Canvas */}
        <rect width="64" height="64" rx="32" fill="url(#recruiterBg)" />

        {/* Hair - Back */}
        <ellipse cx="32" cy="27" rx="14" ry="15" fill="#2c1a10" />

        {/* Neck */}
        <rect x="28" y="38" width="8" height="9" rx="3" fill="#e2b192" />

        {/* Collar & White Inner Shirt */}
        <path d="M26 46L32 54L38 46H26Z" fill="#ffffff" />

        {/* Executive Professional Blazer */}
        <path
          d="M14 64C14 51.5 22.5 45 32 45C41.5 45 50 51.5 50 64H14Z"
          fill="url(#blazerGradient)"
        />
        {/* Blazer Lapel Left */}
        <path d="M20 64L27 45L32 54L26 64H20Z" fill="#1e293b" />
        {/* Blazer Lapel Right */}
        <path d="M44 64L37 45L32 54L38 64H44Z" fill="#1e293b" />

        {/* Head / Face */}
        <ellipse cx="32" cy="30" rx="10.5" ry="12" fill="url(#skinTone)" />

        {/* Friendly Facial Features */}
        {/* Hair - Styled Front */}
        <path
          d="M21 27C21 20 25 16 32 16C39 16 43 20 43 27C43 28 41 23 37 22C33 21 31 23 27 22C23 21 21 25 21 27Z"
          fill="#3b2314"
        />

        {/* Eyebrows */}
        <path d="M26 26C27.5 25.5 29 25.8 29.5 26.2" stroke="#2c1a10" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M34.5 26.2C35 25.8 36.5 25.5 38 26" stroke="#2c1a10" strokeWidth="1.2" strokeLinecap="round" />

        {/* Friendly Eyes */}
        <circle cx="28" cy="29" r="1.3" fill="#1e293b" />
        <circle cx="36" cy="29" r="1.3" fill="#1e293b" />
        <circle cx="28.4" cy="28.6" r="0.4" fill="#ffffff" />
        <circle cx="36.4" cy="28.6" r="0.4" fill="#ffffff" />

        {/* Gentle Smile */}
        <path
          d="M28.5 35.5C29.5 37.2 34.5 37.2 35.5 35.5"
          stroke="#9e5638"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>

      {/* Online / Duty Status Dot */}
      {showStatus && (
        <span
          className={`absolute ${dot} rounded-full ${statusColors[status]}`}
          title={`Recruiter Status: ${status === 'active' ? 'Available' : status}`}
        />
      )}
    </div>
  );
}
