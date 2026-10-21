import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '../store';
import { Page } from '../types';

export const isMac = typeof navigator !== 'undefined' 
  ? /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent) 
  : false;

export const MODIFIER_LABEL = isMac ? '⌘' : 'Ctrl';
export const ALT_LABEL = isMac ? '⌥' : 'Alt';
export const SHIFT_LABEL = isMac ? '⇧' : 'Shift';

export interface ShortcutItem {
  id: string;
  category: 'Navigation' | 'General' | 'Actions';
  keys: string[];
  description: string;
}

export const SHORTCUT_DEFINITIONS: ShortcutItem[] = [
  // Navigation
  { id: 'nav-overview', category: 'Navigation', keys: ['G', 'O'], description: 'Go to Overview' },
  { id: 'nav-candidates', category: 'Navigation', keys: ['G', 'C'], description: 'Go to Candidates' },
  { id: 'nav-jobs', category: 'Navigation', keys: ['G', 'J'], description: 'Go to Jobs' },
  { id: 'nav-matches', category: 'Navigation', keys: ['G', 'M'], description: 'Go to Job Matches' },
  { id: 'nav-imports', category: 'Navigation', keys: ['G', 'R'], description: 'Go to Resume Imports' },
  { id: 'nav-settings', category: 'Navigation', keys: ['G', 'S'], description: 'Go to Settings' },
  { id: 'nav-direct', category: 'Navigation', keys: [ALT_LABEL, '1–6'], description: 'Quick jump to tabs 1 through 6' },

  // General
  { id: 'gen-search', category: 'General', keys: [MODIFIER_LABEL, 'K'], description: 'Focus global search' },
  { id: 'gen-slash', category: 'General', keys: ['/'], description: 'Quick search (unfocused)' },
  { id: 'gen-sidebar', category: 'General', keys: [MODIFIER_LABEL, 'B'], description: 'Toggle sidebar collapse' },
  { id: 'gen-theme', category: 'General', keys: ['T'], description: 'Cycle appearance theme' },
  { id: 'gen-help', category: 'General', keys: ['?'], description: 'Open keyboard shortcuts sheet' },
  { id: 'gen-escape', category: 'General', keys: ['Esc'], description: 'Close dialogs, menus, or blur search' },

  // Actions
  { id: 'act-new-cand', category: 'Actions', keys: ['N'], description: 'Navigate to Candidates (New)' },
  { id: 'act-import', category: 'Actions', keys: ['I'], description: 'Go to Import page' },
];

export function useKeyboardShortcuts(searchInputRef?: React.RefObject<HTMLInputElement | null>) {
  const {
    navigateTo,
    toggleSidebar,
    toggleTheme,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    setMobileSidebarOpen,
  } = useAppStore();

  const [sequencePending, setSequencePending] = useState<string | null>(null);
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSequence = useCallback(() => {
    if (sequenceTimerRef.current) {
      clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
    setSequencePending(null);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isTargetInput = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toUpperCase();
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      );
    };

    const inInput = isTargetInput(e.target);
    const isMod = isMac ? e.metaKey : e.ctrlKey;
    const key = e.key;
    const lowerKey = key.toLowerCase();

    // 1. Universal Global Search: Cmd+K / Ctrl+K (works everywhere, even inside inputs)
    if (isMod && lowerKey === 'k') {
      e.preventDefault();
      if (searchInputRef?.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
      return;
    }

    // 2. Escape: Close modals, clear/blur search, close menus
    if (key === 'Escape') {
      if (shortcutsModalOpen) {
        e.preventDefault();
        setShortcutsModalOpen(false);
        return;
      }
      if (sequencePending) {
        clearSequence();
        return;
      }
      if (inInput) {
        (e.target as HTMLElement).blur();
        return;
      }
      setMobileSidebarOpen(false);
      return;
    }

    // 3. Cmd+B / Ctrl+B: Toggle Sidebar (works anywhere)
    if (isMod && lowerKey === 'b') {
      e.preventDefault();
      toggleSidebar();
      return;
    }

    // 4. Alt + Number (1-6) direct tab jumps
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const pageMap: Record<string, Page> = {
        '1': 'overview',
        '2': 'candidates',
        '3': 'jobs',
        '4': 'job-matches',
        '5': 'resume-import',
        '6': 'settings',
      };
      if (pageMap[key]) {
        e.preventDefault();
        navigateTo(pageMap[key]);
        clearSequence();
        return;
      }
      if (lowerKey === 't') {
        e.preventDefault();
        toggleTheme();
        return;
      }
    }

    // Stop single-key handling if user is typing in an input
    if (inInput) {
      return;
    }

    // Don't trigger if Cmd/Ctrl is active with unrelated letters
    if (e.metaKey || e.ctrlKey) {
      return;
    }

    // 5. Help / Shortcuts Cheat Sheet: '?' (Shift + /)
    if (key === '?') {
      e.preventDefault();
      setShortcutsModalOpen(!shortcutsModalOpen);
      clearSequence();
      return;
    }

    // 6. Quick Slash '/' to focus search
    if (key === '/') {
      e.preventDefault();
      if (searchInputRef?.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
      clearSequence();
      return;
    }

    // 7. Sequence handling: 'G' then <key>
    if (sequencePending === 'G') {
      e.preventDefault();
      clearSequence();

      switch (lowerKey) {
        case 'o':
          navigateTo('overview');
          return;
        case 'c':
          navigateTo('candidates');
          return;
        case 'j':
          navigateTo('jobs');
          return;
        case 'm':
          navigateTo('job-matches');
          return;
        case 'r':
          navigateTo('resume-import');
          return;
        case 's':
          navigateTo('settings');
          return;
        default:
          return;
      }
    }

    // Start sequence with 'G'
    if (lowerKey === 'g') {
      e.preventDefault();
      setSequencePending('G');
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = setTimeout(() => {
        setSequencePending(null);
      }, 1500);
      return;
    }

    // 8. Single key shortcuts (when not in sequence or input)
    if (lowerKey === 't') {
      e.preventDefault();
      toggleTheme();
      return;
    }

    if (lowerKey === 'b') {
      e.preventDefault();
      toggleSidebar();
      return;
    }

    if (lowerKey === 'n') {
      e.preventDefault();
      navigateTo('candidates');
      return;
    }

    if (lowerKey === 'i') {
      e.preventDefault();
      navigateTo('resume-import');
      return;
    }
  }, [
    clearSequence,
    navigateTo,
    searchInputRef,
    sequencePending,
    setMobileSidebarOpen,
    setShortcutsModalOpen,
    shortcutsModalOpen,
    toggleSidebar,
    toggleTheme,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    };
  }, [handleKeyDown]);

  return {
    sequencePending,
    clearSequence,
    isMac,
    modifierLabel: MODIFIER_LABEL,
    altLabel: ALT_LABEL,
  };
}
