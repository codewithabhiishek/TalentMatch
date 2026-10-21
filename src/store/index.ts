import { create } from 'zustand';
import { Candidate, Job, JobMatch, ImportedFile, Notification, Page } from '../types';
import { candidates as mockCandidates, jobs as mockJobs, jobMatches as mockMatches, importedFiles as mockFiles, notifications as mockNotifications } from '../data/mockData';

export type Theme = 'light' | 'dark' | 'black';

interface AppState {
  // Navigation
  currentPage: Page;
  selectedCandidateId: string | null;
  selectedJobId: string | null;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  shortcutsModalOpen: boolean;
  
  // Theme
  theme: Theme;
  
  // Data
  candidates: Candidate[];
  jobs: Job[];
  jobMatches: JobMatch[];
  importedFiles: ImportedFile[];
  notifications: Notification[];
  
  // Actions
  navigateTo: (page: Page, candidateId?: string, jobId?: string) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  updateCandidateStatus: (id: string, status: Candidate['status']) => void;
  updateMatchStatus: (id: string, status: JobMatch['status']) => void;
  markNotificationRead: (id: string) => void;
  addCandidate: (candidate: Candidate) => void;
  addJob: (job: Job) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Initialize theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('talentflow-theme') as Theme | null;
    if (stored === 'dark' || stored === 'light' || stored === 'black') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'dark'; // default to existing dark (blue) or light
};

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'overview',
  selectedCandidateId: null,
  selectedJobId: null,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  shortcutsModalOpen: false,
  theme: getInitialTheme(),
  
  candidates: mockCandidates,
  jobs: mockJobs,
  jobMatches: mockMatches,
  importedFiles: mockFiles,
  notifications: mockNotifications,
  
  navigateTo: (page, candidateId, jobId) => set({
    currentPage: page,
    selectedCandidateId: candidateId || null,
    selectedJobId: jobId || null,
    mobileSidebarOpen: false,
  }),
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
  
  updateCandidateStatus: (id, status) => set((state) => ({
    candidates: state.candidates.map(c => c.id === id ? { ...c, status } : c)
  })),
  
  updateMatchStatus: (id, status) => set((state) => ({
    jobMatches: state.jobMatches.map(m => m.id === id ? { ...m, status } : m)
  })),
  
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  
  addCandidate: (candidate) => set((state) => ({
    candidates: [candidate, ...state.candidates]
  })),
  
  addJob: (job) => set((state) => ({
    jobs: [job, ...state.jobs]
  })),

  toggleTheme: () => set((state) => {
    let newTheme: Theme;
    if (state.theme === 'dark') newTheme = 'black';
    else if (state.theme === 'black') newTheme = 'light';
    else newTheme = 'dark';
    
    localStorage.setItem('talentflow-theme', newTheme);
    return { theme: newTheme };
  }),

  setTheme: (theme) => {
    localStorage.setItem('talentflow-theme', theme);
    set({ theme });
  },
}));
