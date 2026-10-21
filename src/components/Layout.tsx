import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Users, Briefcase, GitMerge, Upload, Settings,
  Search, Bell, Menu, X, ChevronLeft, ChevronRight, User, LogOut,
  CheckCircle, AlertTriangle, Info, XCircle, Sun, Moon, Sparkles, ChevronDown,
  Keyboard
} from 'lucide-react';
import { useAppStore } from '../store';
import { Page } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ShortcutSequenceIndicator } from './ShortcutSequenceIndicator';

const navItems: { id: Page; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} />, shortcut: 'G O' },
  { id: 'candidates', label: 'Candidates', icon: <Users size={18} />, shortcut: 'G C' },
  { id: 'jobs', label: 'Jobs', icon: <Briefcase size={18} />, shortcut: 'G J' },
  { id: 'job-matches', label: 'Job Matches', icon: <GitMerge size={18} />, shortcut: 'G M' },
  { id: 'resume-import', label: 'Resume Imports', icon: <Upload size={18} />, shortcut: 'G R' },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} />, shortcut: 'G S' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    currentPage, sidebarCollapsed, mobileSidebarOpen, notifications, theme,
    navigateTo, toggleSidebar, setMobileSidebarOpen, markNotificationRead, toggleTheme,
    setShortcutsModalOpen
  } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { sequencePending, clearSequence, modifierLabel } = useKeyboardShortcuts(searchInputRef);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'overview': return 'Overview';
      case 'candidates': return 'Candidates';
      case 'candidate-profile': return 'Candidate Profile';
      case 'jobs': return 'Jobs';
      case 'job-detail': return 'Job Details';
      case 'job-import': return 'Import Jobs';
      case 'job-matches': return 'Job Matches';
      case 'resume-import': return 'Resume Imports';
      case 'settings': return 'Settings';
      default: return '';
    }
  };

  const isActive = (page: Page) => {
    if (page === 'candidates' && currentPage === 'candidate-profile') return true;
    if (page === 'jobs' && (currentPage === 'job-detail' || currentPage === 'job-import')) return true;
    return currentPage === page;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-secondary)]">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)]
        transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'w-16' : 'w-60'}
      `}>
        {/* Logo */}
        <div className={`flex items-center h-14 px-4 border-b border-[var(--color-border)] ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
          <div className="w-7 h-7 rounded-md bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0 transition-colors">
            <span className="text-[var(--color-surface)] text-xs font-bold">TF</span>
          </div>
          {!sidebarCollapsed && <span className="font-semibold text-sm text-[var(--color-text-primary)]">TalentFlow</span>}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex ml-auto w-6 h-6 items-center justify-center rounded hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] transition-all duration-150 hover:scale-110"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group
                ${isActive(item.id)
                  ? 'bg-[var(--color-primary)] text-[var(--color-surface)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
                }
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
              title={sidebarCollapsed ? `${item.label} (${item.shortcut})` : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  <span className={`ml-auto text-[10px] font-mono px-1 py-0.2 rounded transition-opacity ${
                    isActive(item.id)
                      ? 'bg-[var(--color-surface)]/20 text-[var(--color-surface)]'
                      : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100'
                  }`}>
                    {item.shortcut}
                  </span>
                </>
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className={`border-t border-[var(--color-border)] p-3 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          {sidebarCollapsed ? (
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center">
              <User size={14} className="text-[var(--color-text-secondary)]" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">JR</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">Jordan Rivera</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Senior Recruiter</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-4 lg:px-6 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0 z-30 transition-colors duration-150">
          {/* Left section: mobile menu toggle, page title, global search */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <h1 className="text-sm font-semibold text-[var(--color-text-primary)] hidden sm:block whitespace-nowrap flex-shrink-0">
              {getPageTitle()}
            </h1>

            {/* Global Search with constrained width and responsive adaptation */}
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md group">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-text-primary)] transition-colors pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search candidates, jobs... (press /)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigateTo('candidates');
                  }
                }}
                className="input w-full h-9 pl-9 pr-14 text-xs sm:text-sm placeholder:text-[var(--color-text-tertiary)] bg-[var(--color-surface-secondary)] border-[var(--color-border)] focus:bg-[var(--color-surface)]"
              />
              <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded pointer-events-none select-none">
                {modifierLabel}K
              </kbd>
            </div>
          </div>

          {/* Right section: Far-right anchored control group */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
            {/* Keyboard shortcuts trigger */}
            <button
              onClick={() => setShortcutsModalOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-150"
              title={`Keyboard Shortcuts (${modifierLabel}K, ?, G+key)`}
              aria-label="Keyboard Shortcuts"
            >
              <Keyboard size={16} />
            </button>

            {/* Theme toggle cycling light -> dark (blue) -> black */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-150"
              title={
                theme === 'light'
                  ? 'Theme: White (Click or press T for Dark Blue)'
                  : theme === 'dark'
                  ? 'Theme: Dark Blue (Click or press T for Pure Black)'
                  : 'Theme: Pure Black (Click or press T for White)'
              }
              aria-label="Toggle theme mode"
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                {theme === 'light' && <Sun size={16} className="text-amber-500 animate-scale-in" />}
                {theme === 'dark' && <Moon size={16} className="text-sky-400 animate-scale-in" />}
                {theme === 'black' && <Sparkles size={16} className="text-emerald-400 animate-scale-in" />}
              </div>
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-150"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[var(--color-error)] text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[var(--color-surface)] shadow-sm pointer-events-none">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="dropdown absolute right-0 top-full mt-2 w-80 z-50 max-h-96 overflow-y-auto animate-scale-in shadow-xl">
                  <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">Notifications</p>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">{unreadCount} unread</span>
                  </div>
                  {notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`w-full text-left p-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-secondary)] transition-colors ${!n.read ? 'bg-[var(--color-info-bg)]/30' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex-shrink-0">
                          {n.type === 'success' && <CheckCircle size={14} className="text-[var(--color-success)]" />}
                          {n.type === 'warning' && <AlertTriangle size={14} className="text-[var(--color-warning)]" />}
                          {n.type === 'error' && <XCircle size={14} className="text-[var(--color-error)]" />}
                          {n.type === 'info' && <Info size={14} className="text-[var(--color-info)]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[var(--color-text-primary)]">{n.title}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-info)] mt-1.5 flex-shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors border border-transparent hover:border-[var(--color-border)]"
                aria-label="User account menu"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[var(--color-text-secondary)]">JR</span>
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight">Jordan</span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] leading-tight">Recruiter</span>
                </div>
                <ChevronDown size={12} className="hidden sm:block text-[var(--color-text-tertiary)] ml-0.5" />
              </button>
              {showUserMenu && (
                <div className="dropdown absolute right-0 top-full mt-2 w-52 z-50 py-1.5 animate-scale-in shadow-xl">
                  <div className="px-3.5 py-2.5 border-b border-[var(--color-border)]">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">Jordan Rivera</p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">jordan@talentflow.com</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); navigateTo('settings'); }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] flex items-center gap-2.5 transition-colors"
                  >
                    <Settings size={13} /> Settings & Themes
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); setShortcutsModalOpen(true); }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] flex items-center gap-2.5 transition-colors"
                  >
                    <Keyboard size={13} /> Keyboard Shortcuts
                  </button>
                  <button className="w-full text-left px-3.5 py-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] flex items-center gap-2.5 transition-colors">
                    <User size={13} /> Profile
                  </button>
                  <div className="my-1 border-t border-[var(--color-border)]" />
                  <button className="w-full text-left px-3.5 py-2 text-xs text-[var(--color-error)] hover:bg-[var(--color-error-bg)] flex items-center gap-2.5 transition-colors">
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Floating Sequence Indicator */}
      <ShortcutSequenceIndicator sequence={sequencePending} onCancel={clearSequence} />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal />
    </div>
  );
}
