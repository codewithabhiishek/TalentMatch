import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Candidate, Job, JobMatch, ImportedFile, Notification, Page } from '../types';
import {
  candidates as mockCandidates,
  jobs as mockJobs,
  jobMatches as mockMatches,
  importedFiles as mockFiles,
  notifications as mockNotifications
} from '../data/mockData';
import { AIConfig, defaultAIConfig } from '../services/aiExtractionService';
import { calculateCandidateJobMatch } from '../services/matchEngine';

export type Theme = 'light' | 'dark' | 'black';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  timezone: string;
}

const defaultProfile: UserProfile = {
  firstName: 'Jordan',
  lastName: 'Rivera',
  email: 'jordan@talentflow.com',
  role: 'Senior Recruiter',
  timezone: 'Pacific Time (PT)',
};

export interface AppState {
  // Navigation & UI state
  currentPage: Page;
  selectedCandidateId: string | null;
  selectedJobId: string | null;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  shortcutsModalOpen: boolean;

  // Theme
  theme: Theme;

  // Profile
  userProfile: UserProfile;

  // AI Configuration (Local LLM / API Key / Heuristic)
  aiConfig: AIConfig;

  // Data (Stored in localStorage on user device)
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

  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateAIConfig: (config: Partial<AIConfig>) => void;

  updateCandidateStatus: (id: string, status: Candidate['status']) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  deleteCandidate: (id: string) => void;
  addCandidate: (candidate: Candidate) => void;
  addCandidateWithMatches: (candidate: Candidate) => void;

  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  addJob: (job: Job) => void;

  updateMatchStatus: (id: string, status: JobMatch['status']) => void;
  addImportedFile: (file: ImportedFile) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'> & { read?: boolean }) => void;
  clearNotifications: () => void;

  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;

  // Local Storage Management
  loadSampleData: () => void;
  clearAllData: () => void;
  resetAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonString: string) => boolean;
}

// Initialize theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    try {
      const storedTheme = localStorage.getItem('talentflow-theme') as Theme | null;
      if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'black') return storedTheme;

      const rawStorage = localStorage.getItem('talentflow-storage');
      if (rawStorage) {
        const parsed = JSON.parse(rawStorage);
        if (parsed?.state?.theme) return parsed.state.theme;
      }

      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch {
      // fallback
    }
  }
  return 'dark';
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 'overview',
      selectedCandidateId: null,
      selectedJobId: null,
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      shortcutsModalOpen: false,
      theme: getInitialTheme(),
      userProfile: defaultProfile,
      aiConfig: defaultAIConfig,

      // Default to empty workspace so new installations start clean and blank
      candidates: [],
      jobs: [],
      jobMatches: [],
      importedFiles: [],
      notifications: [],

      navigateTo: (page, candidateId, jobId) => set({
        currentPage: page,
        selectedCandidateId: candidateId || null,
        selectedJobId: jobId || null,
        mobileSidebarOpen: false,
      }),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),

      updateUserProfile: (profile) => set((state) => ({
        userProfile: { ...state.userProfile, ...profile },
      })),

      updateAIConfig: (config) => set((state) => ({
        aiConfig: { ...state.aiConfig, ...config },
      })),

      updateCandidateStatus: (id, status) => set((state) => ({
        candidates: state.candidates.map(c => c.id === id ? { ...c, status } : c),
      })),

      updateCandidate: (id, updates) => set((state) => ({
        candidates: state.candidates.map(c => c.id === id ? { ...c, ...updates } : c),
      })),

      deleteCandidate: (id) => set((state) => ({
        candidates: state.candidates.filter(c => c.id !== id),
        jobMatches: state.jobMatches.filter(m => m.candidateId !== id),
      })),

      addCandidate: (candidate) => set((state) => ({
        candidates: [candidate, ...state.candidates],
      })),

      addCandidateWithMatches: (candidate) => set((state) => {
        // Calculate matches with active jobs
        const activeJobs = state.jobs.filter(j => j.status === 'active');
        const newMatches: JobMatch[] = activeJobs.map(job =>
          calculateCandidateJobMatch(candidate, job)
        );

        let bestMatchStr = candidate.bestMatch;
        if (newMatches.length > 0) {
          const sorted = [...newMatches].sort((a, b) => b.score - a.score);
          const topMatch = sorted[0];
          const matchedJob = activeJobs.find(j => j.id === topMatch.jobId);
          if (matchedJob) {
            bestMatchStr = `${matchedJob.position} (${topMatch.score}%)`;
          }
        }

        const candidateWithBestMatch: Candidate = {
          ...candidate,
          bestMatch: bestMatchStr,
        };

        return {
          candidates: [candidateWithBestMatch, ...state.candidates],
          jobMatches: [...newMatches, ...state.jobMatches],
        };
      }),

      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map(j => j.id === id ? { ...j, ...updates } : j),
      })),

      deleteJob: (id) => set((state) => ({
        jobs: state.jobs.filter(j => j.id !== id),
        jobMatches: state.jobMatches.filter(m => m.jobId !== id),
      })),

      addJob: (job) => set((state) => ({
        jobs: [job, ...state.jobs],
      })),

      updateMatchStatus: (id, status) => set((state) => ({
        jobMatches: state.jobMatches.map(m => m.id === id ? { ...m, status } : m),
      })),

      addImportedFile: (file) => set((state) => ({
        importedFiles: [file, ...state.importedFiles],
      })),

      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      })),

      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),

      addNotification: (notif) => set((state) => ({
        notifications: [
          {
            read: notif.read ?? false,
            ...notif,
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString(),
          },
          ...state.notifications,
        ],
      })),

      clearNotifications: () => set({ notifications: [] }),

      toggleTheme: () => set((state) => {
        let newTheme: Theme;
        if (state.theme === 'dark') newTheme = 'black';
        else if (state.theme === 'black') newTheme = 'light';
        else newTheme = 'dark';

        if (typeof window !== 'undefined') {
          localStorage.setItem('talentflow-theme', newTheme);
        }
        return { theme: newTheme };
      }),

      setTheme: (theme) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('talentflow-theme', theme);
        }
        set({ theme });
      },

      loadSampleData: () => {
        set({
          candidates: mockCandidates,
          jobs: mockJobs,
          jobMatches: mockMatches,
          importedFiles: mockFiles,
          notifications: mockNotifications,
        });
      },

      clearAllData: () => {
        set({
          candidates: [],
          jobs: [],
          jobMatches: [],
          importedFiles: [],
          notifications: [],
        });
      },

      resetAllData: () => {
        set({
          candidates: [],
          jobs: [],
          jobMatches: [],
          importedFiles: [],
          notifications: [],
          userProfile: defaultProfile,
          aiConfig: defaultAIConfig,
        });
      },

      exportDataJSON: () => {
        const state = get();
        const exportPayload = {
          version: 1,
          exportedAt: new Date().toISOString(),
          userProfile: state.userProfile,
          aiConfig: state.aiConfig,
          candidates: state.candidates,
          jobs: state.jobs,
          jobMatches: state.jobMatches,
          importedFiles: state.importedFiles,
          notifications: state.notifications,
          theme: state.theme,
        };
        return JSON.stringify(exportPayload, null, 2);
      },

      importDataJSON: (jsonString: string) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (parsed && typeof parsed === 'object') {
            set((state) => ({
              candidates: Array.isArray(parsed.candidates) ? parsed.candidates : state.candidates,
              jobs: Array.isArray(parsed.jobs) ? parsed.jobs : state.jobs,
              jobMatches: Array.isArray(parsed.jobMatches) ? parsed.jobMatches : state.jobMatches,
              importedFiles: Array.isArray(parsed.importedFiles) ? parsed.importedFiles : state.importedFiles,
              notifications: Array.isArray(parsed.notifications) ? parsed.notifications : state.notifications,
              userProfile: parsed.userProfile ? { ...state.userProfile, ...parsed.userProfile } : state.userProfile,
              aiConfig: parsed.aiConfig ? { ...state.aiConfig, ...parsed.aiConfig } : state.aiConfig,
              theme: parsed.theme ? parsed.theme : state.theme,
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'talentflow-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist long-lived application state & device data in localStorage
      partialize: (state) => ({
        candidates: state.candidates,
        jobs: state.jobs,
        jobMatches: state.jobMatches,
        importedFiles: state.importedFiles,
        notifications: state.notifications,
        userProfile: state.userProfile,
        aiConfig: state.aiConfig,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
