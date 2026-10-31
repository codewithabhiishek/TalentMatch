import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { UserProfile } from '../store';

interface RecruiterAvatarProps {
  user?: Partial<UserProfile> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: 'active' | 'interviewing' | 'offline';
  className?: string;
}

export function RecruiterAvatar({
  user,
  size = 'md',
  showStatus = true,
  status = 'active',
  className = '',
}: RecruiterAvatarProps) {
  const firstInitial = user?.firstName?.[0] || 'J';
  const lastInitial = user?.lastName?.[0] || 'R';

  const sizeConfig = {
    xs: { dim: 'w-6 h-6', text: 'text-[9px]', dot: 'w-1.5 h-1.5 bottom-0 right-0' },
    sm: { dim: 'w-7.5 h-7.5', text: 'text-[11px]', dot: 'w-2 h-2 bottom-0 right-0' },
    md: { dim: 'w-9 h-9', text: 'text-xs', dot: 'w-2.5 h-2.5 bottom-0 right-0' },
    lg: { dim: 'w-11 h-11', text: 'text-sm', dot: 'w-3 h-3 bottom-0.5 right-0.5' },
    xl: { dim: 'w-14 h-14', text: 'text-base', dot: 'w-3.5 h-3.5 bottom-0.5 right-0.5' },
  };

  const { dim, text, dot } = sizeConfig[size] || sizeConfig.md;

  const statusColors = {
    active: 'bg-emerald-400 ring-emerald-500/30',
    interviewing: 'bg-amber-400 ring-amber-500/30',
    offline: 'bg-slate-500 ring-slate-600/30',
  };

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      {/* Luxury Clinical Recruiter Monogram Frame */}
      <div
        className={`${dim} rounded-xl bg-gradient-to-br from-[#0c1824] via-[#08111a] to-[#121c15] border border-emerald-500/35 shadow-xs flex items-center justify-center relative overflow-hidden ring-1 ring-amber-500/20 group-hover:border-emerald-400/60 transition-colors`}
      >
        {/* Subtle Ambient Depth Weave */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-amber-500/10 pointer-events-none" />

        {/* Micro Clinical Cross Watermark */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="absolute inset-0 w-full h-full opacity-10 text-emerald-400 pointer-events-none"
        >
          <path
            d="M9 4H15V9H20V15H15V20H9V15H4V9H9V4Z"
            fill="currentColor"
          />
        </svg>

        {/* Executive Initials with Dual Gold/Mint Gradient */}
        <span
          className={`${text} font-black tracking-tight bg-gradient-to-br from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent drop-shadow-xs relative z-10`}
        >
          {firstInitial}{lastInitial}
        </span>
      </div>

      {/* Online Recruiter Status Halo Dot */}
      {showStatus && (
        <span
          className={`absolute ${dot} rounded-full ring-2 ring-[var(--color-surface)] ${statusColors[status]} ${
            status === 'active' ? 'animate-pulse' : ''
          }`}
          title={status === 'active' ? 'Active Clinical Recruiter' : status}
        />
      )}
    </div>
  );
}

