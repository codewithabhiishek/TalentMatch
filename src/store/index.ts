import { create } from 'zustand';
import { Candidate, Job, JobMatch, ImportedFile, Notification, Page } from '../types';
import { candidates as mockCandidates, jobs as mockJobs, jobMatches as mockMatches, importedFiles as mockFiles, notifications as mockNotifications } from '../data/mockData';

interface AppState {
  // Navigation
  currentPage: Page;
  selectedCandidateId: string | null;
  selectedJobId: string | null;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  
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
  updateCandidateStatus: (id: string, status: Candidate['status']) => void;
  updateMatchStatus: (id: string, status: JobMatch['status']) => void;
  markNotificationRead: (id: string) => void;
  addCandidate: (candidate: Candidate) => void;
  addJob: (job: Job) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'overview',
  selectedCandidateId: null,
  selectedJobId: null,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  
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
}));
