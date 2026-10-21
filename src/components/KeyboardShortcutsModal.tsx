import { useState, useEffect, useRef, useMemo } from 'react';
import { Keyboard, X, Sparkles, Navigation, Command, Zap, Search } from 'lucide-react';
import { useAppStore } from '../store';
import { SHORTCUT_DEFINITIONS, isMac, MODIFIER_LABEL } from '../hooks/useKeyboardShortcuts';

export function KeyboardShortcutsModal() {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Navigation' | 'General' | 'Actions'>('All');
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShortcutsModalOpen(false);
      }
    }
    if (shortcutsModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input when opening modal
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setActiveCategory('All');
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shortcutsModalOpen, setShortcutsModalOpen]);

  // Keyboard escape handler specifically for the modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && shortcutsModalOpen) {
        setShortcutsModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsModalOpen, setShortcutsModalOpen]);

  const filteredShortcuts = useMemo(() => {
    let list = SHORTCUT_DEFINITIONS;
    if (activeCategory !== 'All') {
      list = list.filter(s => s.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        s.description.toLowerCase().includes(q) ||
        s.keys.some(k => k.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  const navItems = useMemo(() => 
    filteredShortcuts.filter(s => s.category === 'Navigation'),
    [filteredShortcuts]
  );
  const generalItems = useMemo(() => 
    filteredShortcuts.filter(s => s.category === 'General'),
    [filteredShortcuts]
  );
  const actionItems = useMemo(() => 
    filteredShortcuts.filter(s => s.category === 'Actions'),
    [filteredShortcuts]
  );

  if (!shortcutsModalOpen) return null;

  const renderKeyCap = (key: string, idx: number, totalKeys: number, firstKey?: string) => {
    const isSequence = totalKeys === 2 && firstKey === 'G';
    return (
      <span key={idx} className="inline-flex items-center gap-1">
        {idx > 0 && isSequence && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] px-0.5">
            then
          </span>
        )}
        <kbd className="shortcut-kbd">{key}</kbd>
      </span>
    );
  };

  const renderShortcutRow = (item: typeof SHORTCUT_DEFINITIONS[0]) => (
    <div
      key={item.id}
      className="group flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-[var(--color-surface-secondary)] transition-all duration-150"
    >
      <span className="text-xs font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors pr-3">
        {item.description}
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {item.keys.map((k, idx) => renderKeyCap(k, idx, item.keys.length, item.keys[0]))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-3xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]"
      >
        {/* Header with Search and Title */}
        <div className="px-5 pt-5 pb-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/30 flex-shrink-0 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] shadow-xs flex-shrink-0">
                <Keyboard size={18} className="text-[var(--color-info)]" />
              </div>
              <div>
                <h3 id="shortcuts-dialog-title" className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] tracking-tight">
                  Keyboard Shortcuts
                </h3>
                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                  Universal hotkeys for {isMac ? 'macOS (⌘ / ⌥)' : 'Windows & Linux (Ctrl / Alt)'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShortcutsModalOpen(false)}
              className="btn-icon btn-icon-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              aria-label="Close shortcuts modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search bar & Category filter chips */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search shortcuts or keys... (e.g. Candidates, G O, Theme)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full h-8.5 pl-8.5 pr-8 text-xs bg-[var(--color-surface)] border-[var(--color-border)] focus:border-[var(--color-info)] placeholder:text-[var(--color-text-tertiary)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {(['All', 'Navigation', 'General', 'Actions'] as const).map((cat) => {
                const count = cat === 'All' 
                  ? SHORTCUT_DEFINITIONS.length 
                  : SHORTCUT_DEFINITIONS.filter(s => s.category === cat).length;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[var(--color-text-primary)] text-[var(--color-surface)] font-semibold shadow-xs'
                        : 'bg-[var(--color-surface-tertiary)]/70 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]/50'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] opacity-75`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Body - 2 Column Balanced Layout */}
        <div className="p-5 overflow-y-auto shortcuts-scroll flex-1">
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                No shortcuts found for "{searchQuery}"
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="text-xs text-[var(--color-info)] hover:underline"
              >
                Reset search & filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Navigation */}
              {navItems.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[var(--color-border)]/60">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                      <Navigation size={12} className="text-[var(--color-info)]" />
                      <span>Navigation</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                      {navItems.length}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {navItems.map(renderShortcutRow)}
                  </div>
                </div>
              )}

              {/* Right Column: General & Quick Actions */}
              <div className="space-y-6">
                {/* General Group */}
                {generalItems.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--color-border)]/60">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                        <Command size={12} className="text-[var(--color-accent)]" />
                        <span>General & App Controls</span>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                        {generalItems.length}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {generalItems.map(renderShortcutRow)}
                    </div>
                  </div>
                )}

                {/* Actions Group */}
                {actionItems.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--color-border)]/60">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                        <Zap size={12} className="text-amber-400" />
                        <span>Quick Actions</span>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                        {actionItems.length}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {actionItems.map(renderShortcutRow)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/40 flex items-center justify-between text-xs text-[var(--color-text-tertiary)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-[var(--color-info)] flex-shrink-0" />
            <span className="hidden sm:inline">
              Tip: Press <kbd className="shortcut-kbd !h-4.5 !min-w-[18px] !text-[9px] !px-1">?</kbd> anywhere to open or toggle this sheet
            </span>
            <span className="sm:hidden">
              Press <kbd className="shortcut-kbd !h-4.5 !min-w-[18px] !text-[9px] !px-1">?</kbd> to toggle
            </span>
          </div>

          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="btn btn-secondary btn-sm h-7 text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[var(--color-surface-tertiary)]"
          >
            <span>Close</span>
            <kbd className="shortcut-kbd !h-4.5 !min-w-[20px] !text-[9px] !px-1">Esc</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
