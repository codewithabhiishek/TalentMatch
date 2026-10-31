import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Volume2,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '../store';
import { Notification, Page } from '../types';

function getNotificationDestination(n: Notification): Page | null {
  const t = (n.title + ' ' + n.message).toLowerCase();
  if (t.includes('candidate') || t.includes('resume') || t.includes('folder')) return 'candidates';
  if (t.includes('job') || t.includes('match') || t.includes('requisition')) return 'job-matches';
  if (t.includes('setting') || t.includes('api') || t.includes('storage')) return 'settings';
  return null;
}

export function ToastNotification() {
  const { activeToast, dismissToast, navigateTo, notificationSettings } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activeToast) return;

    if (!isHovered) {
      timerRef.current = setTimeout(() => {
        dismissToast();
      }, 5000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeToast, isHovered, dismissToast]);

  if (!activeToast) return null;

  const dest = getNotificationDestination(activeToast);

  const handleAction = () => {
    if (dest) navigateTo(dest);
    dismissToast();
  };

  const getIcon = () => {
    switch (activeToast.type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;
      case 'warning':
      case 'error':
        return <AlertCircle size={18} className="text-amber-400 shrink-0" />;
      default:
        return <Info size={18} className="text-sky-400 shrink-0" />;
    }
  };

  return (
    <div
      className="fixed bottom-5 right-5 z-[150] max-w-sm w-full animate-slide-up"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-start gap-3 relative overflow-hidden ring-1 ring-white/5">
        {/* Accent glow bar */}
        <div
          className={`absolute top-0 left-0 bottom-0 w-1 ${
            activeToast.type === 'success'
              ? 'bg-emerald-400'
              : activeToast.type === 'warning' || activeToast.type === 'error'
              ? 'bg-amber-400'
              : 'bg-sky-400'
          }`}
        />

        <div className="pl-1 pt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-[var(--color-text-primary)] leading-tight">
              {activeToast.title}
            </span>
            {notificationSettings?.soundEnabled && (
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-400 font-mono">
                <Volume2 size={10} /> Chime
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
            {activeToast.message}
          </p>

          {dest && (
            <button
              type="button"
              onClick={handleAction}
              className="mt-2 text-[11px] font-semibold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View details</span>
              <ArrowRight size={11} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={dismissToast}
          className="absolute top-3 right-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 rounded-md hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
