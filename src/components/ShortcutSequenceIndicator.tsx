interface ShortcutSequenceIndicatorProps {
  sequence: string | null;
  onCancel?: () => void;
}

export function ShortcutSequenceIndicator({ sequence, onCancel }: ShortcutSequenceIndicatorProps) {
  if (!sequence) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2 bg-[var(--color-surface)] border border-[var(--color-primary)]/40 text-[var(--color-text-primary)] rounded-lg shadow-xl animate-scale-in"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1.5">
        <kbd className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-mono font-bold bg-[var(--color-primary)] text-[var(--color-surface)] rounded shadow-xs">
          {sequence}
        </kbd>
        <span className="text-xs font-semibold text-[var(--color-text-primary)]">then...</span>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)] font-medium border-l border-[var(--color-border)] pl-2.5">
        <span><kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)] font-mono text-[10px]">O</kbd>verview</span>
        <span>·</span>
        <span><kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)] font-mono text-[10px]">C</kbd>andidates</span>
        <span>·</span>
        <span><kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)] font-mono text-[10px]">J</kbd>obs</span>
        <span>·</span>
        <span><kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)] font-mono text-[10px]">M</kbd>atches</span>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="ml-1 text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] underline"
        >
          esc
        </button>
      )}
    </div>
  );
}
