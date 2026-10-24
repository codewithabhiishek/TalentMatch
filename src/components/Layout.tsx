import { useState, useRef, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Users, Briefcase, GitMerge, Upload, Settings,
  Search, Bell, BellOff, Menu, X, ChevronLeft, ChevronRight, User, LogOut,
  CheckCircle, CheckCircle2, AlertTriangle, Info, XCircle, Sun, Moon, Sparkles, ChevronDown,
  Keyboard, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useAppStore } from '../store';
import { Page, Notification } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ShortcutSequenceIndicator } from './ShortcutSequenceIndicator';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function getNotificationDestination(n: Notification): Page | null {
  const lowerTitle = n.title.toLowerCase();
  const lowerMsg = n.message.toLowerCase();
  
  if (lowerTitle.includes('match') || lowerMsg.includes('matched')) return 'job-matches';
  if (lowerTitle.includes('resume') || lowerMsg.includes('resume')) return 'resume-import';
  if (lowerTitle.includes('job') || lowerMsg.includes('positions')) return 'jobs';
  if (lowerTitle.includes('candidate') || lowerTitle.includes('interview')) return 'candidates';
  return null;
}

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
    currentPage, sidebarCollapsed, mobileSidebarOpen, notifications, theme, userProfile,
    candidates, jobs, loadSampleData,
    navigateTo, toggleSidebar, setMobileSidebarOpen, markNotificationRead, markAllNotificationsRead, toggleTheme,
    setShortcutsModalOpen
  } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsNavigating(true);
    const t = setTimeout(() => setIsNavigating(false), 240);
    return () => clearTimeout(t);
  }, [currentPage]);

  const { sequencePending, clearSequence, modifierLabel } = useKeyboardShortcuts(searchInputRef);

  const unreadCount = notifications.filter(n => !n.read).length;

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications]);

  const handleNotificationClick = (n: Notification) => {
    markNotificationRead(n.id);
    const dest = getNotificationDestination(n);
    if (dest) {
      navigateTo(dest);
    }
    setShowNotifications(false);
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
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
    <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[var(--color-surface-secondary)]">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 flex flex-col h-full max-h-[100dvh] bg-[var(--color-surface)] border-r border-[var(--color-border)]
        transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'w-16' : 'w-64 max-w-[85vw] sm:w-60'}
        safe-area-top safe-area-bottom
      `}>
        {/* Logo & Header */}
        <div className={`flex items-center h-14 border-b border-[var(--color-border)] ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {sidebarCollapsed ? (
            <button
              onClick={() => { navigateTo('overview'); }}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-tertiary)] transition-transform hover:scale-105 focus-visible:outline-none cursor-pointer"
              title="TalentFlow ATS — Overview"
            >
              <img
                src="/favicon.svg"
                alt="TalentFlow Logo"
                className="w-7 h-7 flex-shrink-0 object-contain shadow-xs"
              />
            </button>
          ) : (
            <>
              <button
                onClick={() => { navigateTo('overview'); setMobileSidebarOpen(false); }}
                className="flex items-center gap-2.5 focus-visible:outline-none text-left min-w-0 group cursor-pointer"
                title="TalentFlow ATS (G then O)"
              >
                <img
                  src="/favicon.svg"
                  alt="TalentFlow Logo"
                  className="w-7 h-7 flex-shrink-0 object-contain shadow-xs group-hover:scale-105 transition-transform"
                />
                <span className="font-semibold text-sm text-[var(--color-text-primary)] tracking-tight truncate">
                  TalentFlow
                </span>
              </button>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors ml-auto cursor-pointer"
                aria-label="Close sidebar menu"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                navigateTo(item.id);
                setMobileSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium
                transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group cursor-pointer
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-semibold flex items-center justify-center text-xs shadow-xs ring-1 ring-white/10 shrink-0" title="Jordan Rivera (Senior Recruiter)">
              <span>{userProfile?.firstName?.[0] || 'J'}{userProfile?.lastName?.[0] || 'R'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-semibold flex items-center justify-center text-xs shadow-xs ring-1 ring-white/10 shrink-0">
                <span>{userProfile?.firstName?.[0] || 'J'}{userProfile?.lastName?.[0] || 'R'}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{userProfile?.firstName || 'Jordan'} {userProfile?.lastName || 'Rivera'}</p>
                <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{userProfile?.role || 'Senior Recruiter'}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="relative flex items-center justify-between h-14 px-3 sm:px-4 lg:px-6 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0 z-30 transition-colors duration-150 gap-2 sm:gap-4">
          {isNavigating && <div className="top-nav-loader" />}
          {/* Left section: mobile menu toggle, desktop expand & page title */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden w-9 h-9 min-w-[36px] flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] transition-colors flex-shrink-0 cursor-pointer active:scale-95"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            {/* Desktop sidebar toggle - permanently fixed in header bar */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer active:scale-95"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={`${sidebarCollapsed ? "Expand" : "Collapse"} Sidebar (${modifierLabel}B)`}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>

            <div className="hidden lg:block h-4 w-px bg-[var(--color-border)]" />

            <h1 className="text-sm font-semibold text-[var(--color-text-primary)] hidden md:block whitespace-nowrap">
              {getPageTitle()}
            </h1>
          </div>

          {/* Center section: Global Search centered in the header */}
          <div className="flex-1 flex justify-center max-w-xl mx-auto min-w-0 px-1">
            <div className="relative w-full max-w-sm sm:max-w-md group min-w-0">
              <Search size={14} className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-text-primary)] transition-colors pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search candidates, jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigateTo('candidates');
                  }
                }}
                className="input w-full h-8.5 sm:h-9 pl-8 sm:pl-9 pr-2 sm:pr-14 text-xs sm:text-sm placeholder:text-[var(--color-text-tertiary)] bg-[var(--color-surface-secondary)] border-[var(--color-border)] focus:bg-[var(--color-surface)] truncate"
              />
              <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded pointer-events-none select-none">
                {modifierLabel}K
              </kbd>
            </div>
          </div>

          {/* Right section: Far-right anchored control group */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Quick Demo Data loader when workspace is blank */}
            {candidates.length === 0 && jobs.length === 0 && (
              <button
                onClick={loadSampleData}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] hover:border-[var(--color-info)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer shadow-xs active:scale-95"
                title="Populate workspace with sample clinical candidates & jobs"
              >
                <Sparkles size={12} className="text-sky-400" />
                <span>Load Sample Data</span>
              </button>
            )}

            {/* Keyboard shortcuts trigger - hidden on mobile screens, accessible from user menu */}
            <button
              onClick={() => setShortcutsModalOpen(true)}
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-150 cursor-pointer"
              title={`Keyboard Shortcuts (${modifierLabel}K, ?, G+key)`}
              aria-label="Keyboard Shortcuts"
            >
              <Keyboard size={16} />
            </button>

            {/* Theme toggle cycling light -> dark (blue) -> black */}
            <button
              onClick={toggleTheme}
              className="w-8.5 h-8.5 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-150 cursor-pointer active:scale-95"
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
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-8.5 h-8.5 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer active:scale-95 ${
                  showNotifications
                    ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] border border-transparent'
                }`}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={showNotifications}
                aria-haspopup="true"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[var(--color-info)] text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[var(--color-surface)] shadow-xs pointer-events-none">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="dropdown fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-15 sm:top-full mt-0 sm:mt-2 w-auto sm:w-[400px] max-w-[calc(100vw-1rem)] z-50 flex flex-col rounded-xl overflow-hidden animate-scale-in shadow-2xl border border-[var(--color-border)]"
                >
                  {/* Panel Header */}
                  <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0 bg-[var(--color-surface)]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">Notifications</span>
                      {unreadCount > 0 ? (
                        <span className="badge badge-info text-[10px] px-1.5 py-0 font-medium leading-none">
                          {unreadCount} unread
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--color-text-tertiary)] font-normal">All caught up</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllNotificationsRead();
                        }}
                        className="text-[11px] font-medium text-[var(--color-info)] hover:underline transition-colors cursor-pointer"
                        title="Mark all notifications as read"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notification List / Empty State */}
                  <div className="overflow-y-auto max-h-[380px] divide-y divide-[var(--color-border)]/50 notification-scroll">
                    {sortedNotifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center text-[var(--color-text-tertiary)] mb-2.5">
                          <BellOff size={18} />
                        </div>
                        <p className="text-xs font-semibold text-[var(--color-text-primary)]">No notifications</p>
                        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 max-w-[220px]">
                          You're all caught up! Updates regarding candidates, jobs, and matches will show up here.
                        </p>
                      </div>
                    ) : (
                      sortedNotifications.map(n => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer group hover:bg-[var(--color-surface-secondary)] ${
                            !n.read ? 'bg-[var(--color-surface-tertiary)]/35' : ''
                          }`}
                        >
                          {/* Type Icon */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            n.type === 'success' ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' :
                            n.type === 'warning' ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]' :
                            n.type === 'error' ? 'bg-[var(--color-error-bg)] text-[var(--color-error)]' :
                            'bg-[var(--color-info-bg)] text-[var(--color-info)]'
                          }`}>
                            {n.type === 'success' && <CheckCircle2 size={14} />}
                            {n.type === 'warning' && <AlertTriangle size={14} />}
                            {n.type === 'error' && <XCircle size={14} />}
                            {n.type === 'info' && <Info size={14} />}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2 mb-0.5">
                              <p className={`text-xs ${!n.read ? 'font-semibold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]'} truncate`}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-[var(--color-text-tertiary)] shrink-0 font-medium">
                                {formatRelativeTime(n.timestamp)}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 group-hover:text-[var(--color-text-primary)] transition-colors">
                              {n.message}
                            </p>
                          </div>

                          {/* Subtle Unread Dot */}
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-info)] shrink-0 mt-2 self-start" title="Unread" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors border border-transparent hover:border-[var(--color-border)] cursor-pointer select-none active:scale-98"
                aria-label="User account menu"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-semibold flex items-center justify-center text-xs shadow-xs shrink-0 ring-1 ring-white/10">
                  <span>
                    {userProfile?.firstName?.[0] || 'J'}{userProfile?.lastName?.[0] || 'R'}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {userProfile?.firstName || 'Jordan'}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">
                    {userProfile?.role || 'Senior Recruiter'}
                  </span>
                </div>
                <ChevronDown size={13} className={`hidden sm:block text-[var(--color-text-tertiary)] transition-transform duration-150 ${showUserMenu ? 'rotate-180 text-[var(--color-text-primary)]' : ''}`} />
              </button>

              {showUserMenu && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="dropdown fixed sm:absolute right-2 sm:right-0 top-15 sm:top-full mt-0 sm:mt-2 w-72 max-w-[calc(100vw-1.5rem)] z-50 p-2 animate-scale-in shadow-2xl border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]"
                >
                  {/* User Identity Header Card */}
                  <div className="p-3 bg-[var(--color-surface-secondary)]/70 border border-[var(--color-border)]/60 rounded-lg mb-1.5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 ring-2 ring-white/10">
                        <span>
                          {userProfile?.firstName?.[0] || 'J'}{userProfile?.lastName?.[0] || 'R'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--color-text-primary)] leading-snug">
                          {userProfile?.firstName || 'Jordan'} {userProfile?.lastName || 'Rivera'}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-tertiary)] truncate mt-0.5" title={userProfile?.email}>
                          {userProfile?.email || 'jordan@talentflow.com'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                            {userProfile?.role || 'Senior Recruiter'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setShowUserMenu(false); navigateTo('settings'); }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] flex items-center justify-between rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings size={14} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors" />
                        <span>Settings & Themes</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity">G S</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setShowUserMenu(false); setShortcutsModalOpen(true); }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] flex items-center justify-between rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Keyboard size={14} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors" />
                        <span>Keyboard Shortcuts</span>
                      </div>
                      <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] text-[var(--color-text-tertiary)]">?</kbd>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[var(--color-border)]/70 my-1.5" />

                  {/* Sign Out */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigateTo('overview');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error-bg)] flex items-center gap-2.5 rounded-lg transition-colors cursor-pointer"
                    title="Reset session to Overview"
                  >
                    <LogOut size={14} className="text-[var(--color-error)]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto no-overflow-x safe-area-bottom">
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
