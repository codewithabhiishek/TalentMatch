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
import { notificationAudio, ChimeSound } from '../services/notificationAudioService';
import { safeJsonParse, sanitizeObject } from '../services/securityService';
import { haptics } from '../services/hapticsService';
import {
  BASE_STORAGE_KEY,
  DEFAULT_WORKSPACE_ID,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  sanitizeWorkspaceId,
  getScopedStorageKey,
  getAvailableWorkspaces,
  deleteWorkspaceData,
  workspaceStorageAdapter,
  migrateLegacyStorageIfNeeded,
} from '../services/storageService';

export type Theme = 'light' | 'dark' | 'black';

export interface NotificationSettings {
  soundEnabled: boolean;
  soundChoice?: ChimeSound;
  desktopEnabled: boolean;
  resumeAlerts: boolean;
  matchAlerts: boolean;
}

const defaultNotificationSettings: NotificationSettings = {
  soundEnabled: true,
  soundChoice: 'clinical-chime',
  desktopEnabled: true,
  resumeAlerts: true,
  matchAlerts: true,
};

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  timezone: string;
  department?: string;
  facility?: string;
  recruiterStatus?: 'active' | 'interviewing' | 'offline';
}

const getInitialTimezone = (): string => {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India')) {
        return 'India Standard Time (IST)';
      }
    }
  } catch {}
  return 'India Standard Time (IST)';
};

const defaultProfile: UserProfile = {
  firstName: 'Jordan',
  lastName: 'Rivera',
  email: 'jordan.rivera@talentmatch.ai',
  role: 'Senior Clinical Recruiter',
  timezone: getInitialTimezone(),
  department: 'Acute & ICU Talent Division',
  facility: 'Pacific Health System · Level 1 Trauma',
  recruiterStatus: 'active',
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
  notificationSettings: NotificationSettings;
  activeToast: Notification | null;

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
  addJobsBatch: (jobs: Job[]) => void;

  updateMatchStatus: (id: string, status: JobMatch['status']) => void;
  addImportedFile: (file: ImportedFile) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'> & { read?: boolean }) => void;
  clearNotifications: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  dismissToast: () => void;

  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;

  // Local Storage Management
  loadSampleData: () => void;
  clearAllData: () => void;
  resetAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonString: string) => boolean;

  // Multi-Workspace / Multi-User Isolation
  activeWorkspaceId: string;
  switchWorkspace: (workspaceId: string) => void;
  getAvailableWorkspaces: () => string[];
  deleteWorkspace: (workspaceId: string) => void;
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

      activeWorkspaceId: getActiveWorkspaceId(),

      // Default to empty workspace so new installations start clean and blank
      candidates: [],
      jobs: [],
      jobMatches: [],
      importedFiles: [],
      notifications: [],
      notificationSettings: defaultNotificationSettings,
      activeToast: null,

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
        userProfile: { ...state.userProfile, ...sanitizeObject(profile) },
      })),

      updateAIConfig: (config) => set((state) => ({
        aiConfig: { ...state.aiConfig, ...sanitizeObject(config) },
      })),

      updateCandidateStatus: (id, status) => {
        if (status === 'placed') haptics.accept();
        else if (status === 'rejected') haptics.reject();
        else haptics.select();
        set((state) => ({
          candidates: state.candidates.map(c => c.id === id ? { ...c, status } : c),
        }));
      },

      updateCandidate: (id, updates) => set((state) => ({
        candidates: state.candidates.map(c => c.id === id ? { ...c, ...sanitizeObject(updates) } : c),
      })),

      deleteCandidate: (id) => {
        haptics.delete();
        set((state) => ({
          candidates: state.candidates.filter(c => c.id !== id),
          jobMatches: state.jobMatches.filter(m => m.candidateId !== id),
        }));
      },

      addCandidate: (candidate) => {
        haptics.match();
        set((state) => ({
          candidates: [sanitizeObject(candidate), ...state.candidates],
        }));
      },

      addCandidateWithMatches: (rawCandidate) => {
        haptics.match();
        set((state) => {
        const candidate = sanitizeObject(rawCandidate);
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
      });
      },

      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map(j => j.id === id ? { ...j, ...sanitizeObject(updates) } : j),
      })),

      deleteJob: (id) => {
        haptics.delete();
        set((state) => ({
          jobs: state.jobs.filter(j => j.id !== id),
          jobMatches: state.jobMatches.filter(m => m.jobId !== id),
        }));
      },

      addJob: (job) => set((state) => ({
        jobs: [sanitizeObject(job), ...state.jobs],
      })),

      addJobsBatch: (newJobs) => set((state) => {
        const sanitizedJobs = newJobs.map(j => sanitizeObject(j));
        // Compute matches for each candidate against the newly imported jobs
        const activeCandidates = state.candidates;
        const newMatches: JobMatch[] = [];

        for (const candidate of activeCandidates) {
          for (const job of sanitizedJobs) {
            if (job.status === 'active') {
              newMatches.push(calculateCandidateJobMatch(candidate, job));
            }
          }
        }

        return {
          jobs: [...sanitizedJobs, ...state.jobs],
          jobMatches: [...newMatches, ...state.jobMatches],
        };
      }),

      updateMatchStatus: (id, status) => {
        if (status === 'accepted') haptics.accept();
        else if (status === 'rejected') haptics.reject();
        else haptics.select();
        set((state) => ({
          jobMatches: state.jobMatches.map(m => m.id === id ? { ...m, status } : m),
        }));
      },

      addImportedFile: (file) => set((state) => ({
        importedFiles: [file, ...state.importedFiles],
      })),

      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      })),

      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),

      addNotification: (notif) => {
        const newNotif: Notification = {
          read: notif.read ?? false,
          ...notif,
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
        };

        const currentSettings = get().notificationSettings || defaultNotificationSettings;

        const isMatch = newNotif.title.toLowerCase().includes('match');
        const isResume = newNotif.title.toLowerCase().includes('resume') ||
                         newNotif.title.toLowerCase().includes('candidate') ||
                         newNotif.title.toLowerCase().includes('folder');

        if (newNotif.type === 'error' || newNotif.type === 'warning') {
          haptics.error();
        } else if (newNotif.type === 'success' || isMatch) {
          haptics.match();
        } else {
          haptics.tap();
        }

        let shouldAlert = true;
        if (isMatch && !currentSettings.matchAlerts) shouldAlert = false;
        if (isResume && !currentSettings.resumeAlerts) shouldAlert = false;

        if (shouldAlert) {
          notificationAudio.dispatchAlert({
            title: newNotif.title,
            message: newNotif.message,
            type: newNotif.type,
            soundEnabled: currentSettings.soundEnabled,
            soundChoice: currentSettings.soundChoice || 'clinical-chime',
            desktopEnabled: currentSettings.desktopEnabled,
          });
        }

        set((state) => ({
          notifications: [newNotif, ...state.notifications],
          activeToast: shouldAlert ? newNotif : state.activeToast,
        }));
      },

      dismissToast: () => set({ activeToast: null }),

      updateNotificationSettings: (settings) => set((state) => ({
        notificationSettings: { ...state.notificationSettings, ...settings },
      })),

      clearNotifications: () => set({ notifications: [] }),

      toggleTheme: () => set((state) => {
        let newTheme: Theme;
        if (state.theme === 'dark') newTheme = 'black';
        else if (state.theme === 'black') newTheme = 'light';
        else newTheme = 'dark';

        haptics.select();

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
        haptics.match();
        set({
          candidates: mockCandidates,
          jobs: mockJobs,
          jobMatches: mockMatches,
          importedFiles: mockFiles,
          notifications: mockNotifications,
        });
      },

      clearAllData: () => {
        haptics.delete();
        set({
          candidates: [],
          jobs: [],
          jobMatches: [],
          importedFiles: [],
          notifications: [],
        });
      },

      resetAllData: () => {
        haptics.delete();
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
          activeWorkspaceId: state.activeWorkspaceId,
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
          const parsed = safeJsonParse<any>(jsonString, null);
          if (parsed && typeof parsed === 'object') {
            set((state) => ({
              candidates: Array.isArray(parsed.candidates) ? sanitizeObject(parsed.candidates) : state.candidates,
              jobs: Array.isArray(parsed.jobs) ? sanitizeObject(parsed.jobs) : state.jobs,
              jobMatches: Array.isArray(parsed.jobMatches) ? sanitizeObject(parsed.jobMatches) : state.jobMatches,
              importedFiles: Array.isArray(parsed.importedFiles) ? sanitizeObject(parsed.importedFiles) : state.importedFiles,
              notifications: Array.isArray(parsed.notifications) ? sanitizeObject(parsed.notifications) : state.notifications,
              userProfile: parsed.userProfile ? { ...state.userProfile, ...sanitizeObject(parsed.userProfile) } : state.userProfile,
              aiConfig: parsed.aiConfig ? { ...state.aiConfig, ...sanitizeObject(parsed.aiConfig) } : state.aiConfig,
              theme: (parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'black') ? parsed.theme : state.theme,
            }));
            haptics.match();
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      switchWorkspace: (workspaceId: string) => {
        const sanitized = sanitizeWorkspaceId(workspaceId);
        setActiveWorkspaceId(sanitized);
        haptics.select();

        const raw = workspaceStorageAdapter.getItem(BASE_STORAGE_KEY);
        if (raw) {
          const parsed = safeJsonParse<{ state?: Partial<AppState> }>(raw, {});
          if (parsed && parsed.state) {
            set({
              ...parsed.state,
              activeWorkspaceId: sanitized,
            });
            return;
          }
        }

        // Fresh isolated workspace state
        set({
          activeWorkspaceId: sanitized,
          candidates: [],
          jobs: [],
          jobMatches: [],
          importedFiles: [],
          notifications: [],
          userProfile: {
            ...defaultProfile,
            department: sanitized === 'travel-nursing' ? 'Travel Nursing Division' :
                        sanitized === 'allied-health' ? 'Allied Health Division' :
                        sanitized === 'locum-tenens' ? 'Physician & Locum Division' :
                        defaultProfile.department,
          },
        });
      },

      getAvailableWorkspaces: () => getAvailableWorkspaces(),

      deleteWorkspace: (workspaceId: string) => {
        const target = sanitizeWorkspaceId(workspaceId);
        if (target === DEFAULT_WORKSPACE_ID) return;
        deleteWorkspaceData(target);
        haptics.delete();
        if (get().activeWorkspaceId === target) {
          get().switchWorkspace(DEFAULT_WORKSPACE_ID);
        }
      },
    }),
    {
      name: BASE_STORAGE_KEY,
      storage: createJSONStorage(() => workspaceStorageAdapter),
      onRehydrateStorage: () => (state) => {
        migrateLegacyStorageIfNeeded();
        if (state && state.userProfile && state.userProfile.email?.includes('talentflow.com')) {
          state.updateUserProfile({ email: 'jordan.rivera@talentmatch.ai' });
        }
      },
      // Only persist long-lived application state & device data in localStorage
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        candidates: state.candidates,
        jobs: state.jobs,
        jobMatches: state.jobMatches,
        importedFiles: state.importedFiles,
        notifications: state.notifications,
        notificationSettings: state.notificationSettings,
        userProfile: state.userProfile,
        aiConfig: state.aiConfig,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
