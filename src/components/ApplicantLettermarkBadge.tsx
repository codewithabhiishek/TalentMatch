import React from 'react';

interface ApplicantLettermarkBadgeProps {
  firstName: string;
  lastName: string;
  specialty?: string;
  status?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  verified?: boolean;
  className?: string;
}

// Specialty-tuned clinical color palettes
const specialtyGradients: Record<string, { from: string; via?: string; to: string; text: string; glow: string }> = {
  'ICU': { from: '#0284c7', via: '#0ea5e9', to: '#38bdf8', text: '#ffffff', glow: 'rgba(56, 189, 248, 0.4)' },
  'Emergency': { from: '#e11d48', via: '#f43f5e', to: '#fb7185', text: '#ffffff', glow: 'rgba(244, 63, 94, 0.4)' },
  'Orthopedics': { from: '#0d9488', via: '#14b8a6', to: '#2dd4bf', text: '#ffffff', glow: 'rgba(20, 184, 166, 0.4)' },
  'MRI': { from: '#6366f1', via: '#818cf8', to: '#a855f7', text: '#ffffff', glow: 'rgba(129, 140, 248, 0.4)' },
  'Neonatal': { from: '#ec4899', via: '#f472b6', to: '#fbcfe8', text: '#ffffff', glow: 'rgba(244, 114, 182, 0.4)' },
  'Med-Surg': { from: '#2563eb', via: '#3b82f6', to: '#60a5fa', text: '#ffffff', glow: 'rgba(59, 130, 246, 0.4)' },
  'Pediatrics': { from: '#f59e0b', via: '#fbbf24', to: '#fde68a', text: '#78350f', glow: 'rgba(251, 191, 36, 0.4)' },
  'Oncology': { from: '#7c3aed', via: '#8b5cf6', to: '#c4b5fd', text: '#ffffff', glow: 'rgba(139, 92, 246, 0.4)' },
  'default': { from: '#475569', via: '#64748b', to: '#94a3b8', text: '#ffffff', glow: 'rgba(100, 116, 139, 0.3)' },
};

export function ApplicantLettermarkBadge({
  firstName,
  lastName,
  specialty = 'default',
  status,
  size = 'md',
  verified = true,
  className = '',
}: ApplicantLettermarkBadgeProps) {
  const firstLetter = (firstName?.[0] || 'C').toUpperCase();
  const lastLetter = (lastName?.[0] || 'P').toUpperCase();
  const initials = `${firstLetter}${lastLetter}`;

  const specTheme = specialtyGradients[specialty] || specialtyGradients.default;

  const sizeStyles = {
    sm: { box: 'w-7 h-7 text-[10px] rounded-lg', font: 'font-bold tracking-tight', ring: 'ring-1' },
    md: { box: 'w-10 h-10 text-xs rounded-xl', font: 'font-extrabold tracking-tight', ring: 'ring-1.5' },
    lg: { box: 'w-14 h-14 text-base rounded-2xl', font: 'font-black tracking-tight', ring: 'ring-2' },
    xl: { box: 'w-20 h-20 text-2xl rounded-3xl', font: 'font-black tracking-tight', ring: 'ring-2' },
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      {/* Outer ambient glow */}
      <div
        className={`absolute inset-0 ${sizeStyles.box} opacity-30 blur-xs transition-opacity duration-300`}
        style={{
          background: `linear-gradient(135deg, ${specTheme.from}, ${specTheme.to})`,
        }}
      />

      {/* Main Lettermark Container with Beveled Glass Aesthetics */}
      <div
        className={`relative ${sizeStyles.box} flex items-center justify-center shadow-sm overflow-hidden border border-white/20`}
        style={{
          background: `linear-gradient(135deg, ${specTheme.from} 0%, ${specTheme.via || specTheme.from} 50%, ${specTheme.to} 100%)`,
          color: specTheme.text,
        }}
      >
        {/* Subtle geometric diagonal overlay for technical rigor */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px] pointer-events-none" />

        {/* Highlight Specular Glare */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

        {/* Lettermark Typographic Monogram */}
        <span className={`relative z-10 ${sizeStyles.font} drop-shadow-xs font-mono`}>
          {initials}
        </span>
      </div>

      {/* Verified Clinician / Active Status Indicator Dot */}
      {verified && size !== 'sm' && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--color-surface)] shadow-xs flex items-center justify-center text-white"
          title="Verified Clinician Profile"
        >
          <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
      )}
    </div>
  );
}
