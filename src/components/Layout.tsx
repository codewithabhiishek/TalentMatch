import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Users, Briefcase, GitMerge, Upload, Settings,
  Search, Bell, Menu, X, ChevronLeft, ChevronRight, User, LogOut,
  CheckCircle, AlertTriangle, Info, XCircle
} from 'lucide-react';
import { useAppStore } from '../store';
import { Page } from '../types';

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { id: 'candidates', label: 'Candidates', icon: <Users size={18} /> },
  { id: 'jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
  { id: 'job-matches', label: 'Job Matches', icon: <GitMerge size={18} /> },
  { id: 'resume-import', label: 'Resume Imports', icon: <Upload size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    currentPage, sidebarCollapsed, mobileSidebarOpen, notifications,
    navigateTo, toggleSidebar, setMobileSidebarOpen, markNotificationRead
  } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

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
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 flex flex-col h-full bg-white border-r border-[var(--color-border)]
        transition-all duration-200 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'w-16' : 'w-60'}
      `}>
        {/* Logo */}
        <div className={`flex items-center h-14 px-4 border-b border-[var(--color-border)] ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
          <div className="w-7 h-7 rounded-md bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">TF</span>
          </div>
          {!sidebarCollapsed && <span className="font-semibold text-sm text-[var(--color-text-primary)]">TalentFlow</span>}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex ml-auto w-6 h-6 items-center justify-center rounded hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]"
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
                w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium
                transition-colors duration-150
                ${isActive(item.id)
                  ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
                }
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
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
        <header className="flex items-center h-14 px-4 lg:px-6 bg-white border-b border-[var(--color-border)] gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <h1 className="text-sm font-semibold text-[var(--color-text-primary)] hidden sm:block">{getPageTitle()}</h1>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto lg:mx-0 lg:ml-4">
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search candidates, jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-sm bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-md placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-border-hover)] focus:bg-white transition-colors"
              />
              <kbd className="hidden lg:inline-flex absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)] bg-white border border-[var(--color-border)] rounded">⌘K</kbd>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--color-error)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-[var(--color-border)]">
                  <p className="text-sm font-medium">Notifications</p>
                </div>
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`w-full text-left p-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-secondary)] transition-colors ${!n.read ? 'bg-[var(--color-info-bg)]/30' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
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

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">JR</span>
              </div>
              <span className="hidden sm:block text-xs font-medium text-[var(--color-text-primary)]">Jordan</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-50 py-1">
                <div className="px-3 py-2 border-b border-[var(--color-border)]">
                  <p className="text-xs font-medium">Jordan Rivera</p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">jordan@talentflow.com</p>
                </div>
                <button className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] flex items-center gap-2">
                  <User size={13} /> Profile Settings
                </button>
                <button className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] flex items-center gap-2">
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
