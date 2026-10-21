import { useEffect, useRef } from 'react';
import { Keyboard, X, Sparkles, Navigation, Command, Zap } from 'lucide-react';
import { useAppStore } from '../store';
import { SHORTCUT_DEFINITIONS, isMac, MODIFIER_LABEL, ALT_LABEL } from '../hooks/useKeyboardShortcuts';

export function KeyboardShortcutsModal() {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useAppStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShortcutsModalOpen(false);
      }
    }
    if (shortcutsModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shortcutsModalOpen, setShortcutsModalOpen]);

  if (!shortcutsModalOpen) return null;

  const categories = [
    { name: 'Navigation', icon: <Navigation size={13} />, items: SHORTCUT_DEFINITIONS.filter(s => s.category === 'Navigation') },
    { name: 'General', icon: <Command size={13} />, items: SHORTCUT_DEFINITIONS.filter(s => s.category === 'General') },
    { name: 'Actions', icon: <Zap size={13} />, items: SHORTCUT_DEFINITIONS.filter(s => s.category === 'Actions') },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/40 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-tertiary)] border border-[var(--color-border)]/60 flex items-center justify-center text-[var(--color-text-primary)]">
              <Keyboard size={16} />
            </div>
            <div>
              <h3 id="shortcuts-dialog-title" className="text-sm font-semibold text-[var(--color-text-primary)] tracking-tight">
                Keyboard Shortcuts
              </h3>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                Universal controls for {isMac ? 'macOS (⌘ / ⌥)' : 'Windows & Linux (Ctrl / Alt)'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="btn-icon btn-icon-sm"
            aria-label="Close shortcuts modal"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {categories.map((cat) => (
            <div key={cat.name} className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                {cat.icon}
                <span>{cat.name}</span>
              </div>
              <div className="bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)] overflow-hidden">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 px-3 hover:bg-[var(--color-surface-tertiary)]/50 transition-colors"
                  >
                    <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          {idx > 0 && item.keys.length === 2 && item.keys[0] === 'G' ? (
                            <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium">then</span>
                          ) : null}
                          <kbd className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[10px] font-mono font-medium text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded shadow-xs select-none">
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/60 flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] flex-shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles size={12} className="text-[var(--color-info)]" />
            <span>Tip: Press <kbd className="px-1 py-0.2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded font-mono text-[9px]">?</kbd> anywhere to toggle</span>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="btn btn-secondary btn-sm h-7 text-[11px]"
          >
            Done (<kbd className="text-[9px] font-mono">Esc</kbd>)
          </button>
        </div>
      </div>
    </div>
  );
}
