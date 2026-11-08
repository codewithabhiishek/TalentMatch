import { useState, useRef, useEffect } from 'react';
import {
  Save, User, Bell, Database, Key, Palette, Check, Sun, Moon, Sparkles,
  Keyboard, HardDrive, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2,
  FileText, Briefcase, Users, GitMerge, Globe, ChevronDown, Trash2,
  Volume2, VolumeX, Laptop, Play, Mail, ShieldCheck, Layers, ExternalLink, Plus
} from 'lucide-react';
import { useAppStore } from '../store';
import { SHORTCUT_DEFINITIONS, isMac } from '../hooks/useKeyboardShortcuts';
import { testAIConnection, AIConfig } from '../services/aiExtractionService';
import { DiagnosticBenchmarkModal } from '../components/DiagnosticBenchmarkModal';
import { notificationAudio, SOUND_OPTIONS, ChimeSound } from '../services/notificationAudioService';
import { RecruiterAvatar } from '../components/RecruiterAvatar';
import { sanitizeInput } from '../services/securityService';

export function Settings() {
  const {
    theme, setTheme, setShortcutsModalOpen,
    userProfile, updateUserProfile,
    aiConfig, updateAIConfig,
    candidates, jobs, jobMatches, importedFiles, notifications,
    notificationSettings, updateNotificationSettings, addNotification,
    loadSampleData, clearAllData, resetAllData, exportDataJSON, importDataJSON,
    activeWorkspaceId, switchWorkspace, getAvailableWorkspaces, deleteWorkspace
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'storage' | 'shortcuts' | 'notifications' | 'integrations' | 'api'>('profile');
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Saved successfully');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [storageSize, setStorageSize] = useState<string>('0 KB');
  const [customWsInput, setCustomWsInput] = useState('');
  const [testAlertSent, setTestAlertSent] = useState(false);
  const [playingSoundId, setPlayingSoundId] = useState<ChimeSound | null>(null);
  const [browserPermission, setBrowserPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  // AI Configuration Form state
  const [aiForm, setAiForm] = useState<AIConfig>({
    provider: aiConfig?.provider || 'ollama',
    apiUrl: aiConfig?.apiUrl || 'http://localhost:11434',
    apiKey: aiConfig?.apiKey || '',
    modelName: aiConfig?.modelName || 'llama3.2:3b',
    temperature: aiConfig?.temperature ?? 0.1,
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);

    // Sync AI form if store changes
  useEffect(() => {
    if (aiConfig) {
      setAiForm({
        provider: aiConfig.provider || 'ollama',
        apiUrl: aiConfig.apiUrl || 'http://localhost:11434',
        apiKey: aiConfig.apiKey || '',
        modelName: aiConfig.modelName || 'llama3.2:3b',
        temperature: aiConfig.temperature ?? 0.1,
      });
    }
  }, [aiConfig]);

  // Form local state synced with userProfile
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || 'Jordan',
    lastName: userProfile?.lastName || 'Rivera',
    email: userProfile?.email || 'jordan.rivera@talentmatch.ai',
    role: userProfile?.role || 'Senior Clinical Recruiter',
    timezone: userProfile?.timezone || 'India Standard Time (IST)',
    facility: userProfile?.facility || 'Pacific Health System · Level 1 Trauma',
    recruiterStatus: userProfile?.recruiterStatus || 'active',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || 'Jordan',
        lastName: userProfile.lastName || 'Rivera',
        email: userProfile.email || 'jordan.rivera@talentmatch.ai',
        role: userProfile.role || 'Senior Clinical Recruiter',
        timezone: userProfile.timezone || 'India Standard Time (IST)',
        facility: userProfile.facility || 'Pacific Health System · Level 1 Trauma',
        recruiterStatus: userProfile.recruiterStatus || 'active',
      });
    }
  }, [userProfile]);

  // Compute local storage size
  const updateStorageSize = () => {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(`talentflow-storage:${activeWorkspaceId}`) || localStorage.getItem('talentflow-storage') || '';
        const bytes = new Blob([item]).size;
        if (bytes < 1024) {
          setStorageSize(`${bytes} B`);
        } else if (bytes < 1024 * 1024) {
          setStorageSize(`${(bytes / 1024).toFixed(1)} KB`);
        } else {
          setStorageSize(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
        }
      }
    } catch {
      setStorageSize('Available');
    }
  };

  useEffect(() => {
    updateStorageSize();
  }, [candidates, jobs, jobMatches, importedFiles, notifications, userProfile, activeWorkspaceId]);

  const handleSaveProfile = () => {
    const cleaned = {
      ...formData,
      firstName: sanitizeInput(formData.firstName, 50),
      lastName: sanitizeInput(formData.lastName, 50),
      email: sanitizeInput(formData.email, 100),
      role: sanitizeInput(formData.role, 80),
      facility: sanitizeInput(formData.facility, 120),
      timezone: sanitizeInput(formData.timezone, 80),
    };
    updateUserProfile(cleaned);
    setSaveMessage('Profile saved to local storage!');
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const setRecruiterDuty = (status: 'active' | 'interviewing' | 'offline') => {
    setFormData(prev => ({ ...prev, recruiterStatus: status }));
    updateUserProfile({ recruiterStatus: status });
  };

  const handleExportData = () => {
    try {
      const json = exportDataJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talentmatch-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not export local storage data.');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          setSaveMessage('Data restored into local storage successfully!');
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        } else {
          alert('Failed to parse or restore JSON data. Please verify the backup file format.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSampleData = () => {
    loadSampleData();
    setSaveMessage('Loaded sample clinical candidates, jobs & matches into Local Storage.');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearAllData = () => {
    clearAllData();
    setResetConfirmOpen(false);
    setSaveMessage('Cleared all candidates, jobs & matches. Workspace is now completely blank.');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: <User size={14} /> },
    { id: 'appearance' as const, label: 'Appearance & Themes', icon: <Palette size={14} /> },
    { id: 'storage' as const, label: 'Local Storage & Data', icon: <HardDrive size={14} /> },
    { id: 'shortcuts' as const, label: 'Keyboard Shortcuts', icon: <Keyboard size={14} /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell size={14} /> },
    { id: 'integrations' as const, label: 'Integrations', icon: <Database size={14} /> },
    { id: 'api' as const, label: 'API Keys', icon: <Key size={14} /> },
  ];

  return (
    <div className="p-3.5 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in pb-1 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Settings & Preferences</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage recruiter identity, system appearance, storage health, and AI engine parameters</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-medium text-[var(--color-text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Local Confidential Mode
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
        {/* Left Navigation Rail */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="card p-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold tracking-wider uppercase text-[var(--color-text-tertiary)]">
              Configuration
            </div>
            <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 lg:flex-none flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors duration-150 cursor-pointer border ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] font-semibold shadow-xs border-[var(--color-border)]'
                      : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={activeTab === tab.id ? 'text-[var(--color-info)]' : 'text-[var(--color-text-tertiary)]'}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </div>
                  {activeTab === tab.id && (
                    <span className="hidden lg:inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-info)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Local Database Health & Diagnostic Card */}
          <div className="hidden lg:block card p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-primary)]">
              <span className="flex items-center gap-1.5">
                <HardDrive size={13} className="text-[var(--color-info)]" />
                Local Storage
              </span>
              <span className="font-mono text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                {storageSize}
              </span>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
                <span>Clinicians indexed</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{candidates.length}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
                <span>Active job requisitions</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{jobs.length}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
                <span>Match scores calculated</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{jobMatches.length}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--color-border)] flex items-center gap-2 text-[11px] text-[var(--color-text-tertiary)]">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>100% On-Device · Zero telemetry</span>
            </div>
          </div>
        </div>

        {/* Content Pane */}
        <div className="card flex-1 w-full min-w-0 p-5 sm:p-7 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
          {/* PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div key="profile" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Recruiter Profile &amp; Identity</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Executive clinician recruiter credentials stored privately in local device storage.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Profile
                </div>
              </div>

              {/* Recruiter Preview Hero Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-center gap-4 min-w-0">
                  <RecruiterAvatar
                    user={{ firstName: formData.firstName, lastName: formData.lastName }}
                    size="xl"
                    status={formData.recruiterStatus}
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                        {formData.firstName || 'Jordan'} {formData.lastName || 'Rivera'}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        Lead Clinical Partner
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {formData.role || 'Senior Clinical Recruiter'} · {formData.facility || 'Pacific Health System · Level 1 Trauma'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-tertiary)] pt-0.5 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} className="text-[var(--color-text-tertiary)]" />
                        <span>{formData.email || 'jordan.rivera@talentmatch.ai'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 text-sky-300 font-mono text-[10px] bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        <Globe size={11} />
                        <span>{formData.timezone}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Duty Status Switcher */}
                <div className="flex flex-col sm:items-end gap-1.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--color-border)]">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-tertiary)]">
                    Recruiter Duty Status
                  </span>
                  <div className="inline-flex items-center p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
                    <button
                      type="button"
                      onClick={() => setRecruiterDuty('active')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                        formData.recruiterStatus === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecruiterDuty('interviewing')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                        formData.recruiterStatus === 'interviewing'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Interview
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecruiterDuty('offline')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                        formData.recruiterStatus === 'offline'
                          ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30 font-semibold'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Away
                    </button>
                  </div>
                </div>
              </div>

              {/* Symmetrical Form Grid (3 rows x 2 columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Row 1: First Name & Last Name */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">First Name</label>
                  <input
                    type="text"
                    maxLength={50}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input w-full h-10 px-3.5 text-xs sm:text-sm font-medium bg-[var(--color-surface)] border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)] transition-all"
                    placeholder="Jordan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Last Name</label>
                  <input
                    type="text"
                    maxLength={50}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input w-full h-10 px-3.5 text-xs sm:text-sm font-medium bg-[var(--color-surface)] border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)] transition-all"
                    placeholder="Rivera"
                  />
                </div>

                {/* Row 2: Work Email & Role Title */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Work Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-tertiary)]">
                      <Mail size={14} />
                    </div>
                    <input
                      type="email"
                      maxLength={100}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input w-full h-10 pl-10 pr-3.5 text-xs sm:text-sm font-medium bg-[var(--color-surface)] border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)] transition-all"
                      placeholder="jordan.rivera@talentmatch.ai"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Role Title</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-tertiary)]">
                      <Briefcase size={14} />
                    </div>
                    <input
                      type="text"
                      maxLength={80}
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="input w-full h-10 pl-10 pr-3.5 text-xs sm:text-sm font-medium bg-[var(--color-surface)] border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)] transition-all"
                      placeholder="Senior Clinical Recruiter"
                    />
                  </div>
                </div>

                {/* Row 3: Healthcare Facility & Timezone */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Healthcare Facility / System</label>
                  <input
                    type="text"
                    maxLength={120}
                    value={formData.facility}
                    onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
                    className="input w-full h-10 px-3.5 text-xs sm:text-sm font-medium bg-[var(--color-surface)] border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)] transition-all"
                    placeholder="Pacific Health System · Level 1 Trauma"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">Timezone &amp; Regional Locale</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, timezone: 'India Standard Time (IST)' })}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-medium transition-colors cursor-pointer"
                    >
                      Quick Set: Indian Time (IST)
                    </button>
                  </div>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-tertiary)]">
                      <Globe size={14} />
                    </div>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="input w-full h-10 pl-10 pr-10 text-xs sm:text-sm font-medium bg-[var(--color-surface)] !bg-none border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] cursor-pointer appearance-none transition-all hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)]"
                    >
                      <optgroup label="India &amp; Asia">
                        <option value="India Standard Time (IST)">India Standard Time (IST) — New Delhi, Mumbai, Bengaluru (UTC+5:30)</option>
                        <option value="Gulf Standard Time (GST)">Gulf Standard Time (GST) — Dubai, Abu Dhabi (UTC+4)</option>
                        <option value="Singapore / Hong Kong (SGT)">Singapore / Hong Kong (SGT) — Singapore, Hong Kong (UTC+8)</option>
                        <option value="Japan &amp; Korea (JST)">Japan &amp; Korea (JST) — Tokyo, Seoul (UTC+9)</option>
                      </optgroup>
                      <optgroup label="Americas">
                        <option value="Pacific Time (PT)">Pacific Time (PT) — Los Angeles, Vancouver (UTC-8)</option>
                        <option value="Mountain Time (MT)">Mountain Time (MT) — Denver, Phoenix (UTC-7)</option>
                        <option value="Central Time (CT)">Central Time (CT) — Chicago, Dallas (UTC-6)</option>
                        <option value="Eastern Time (ET)">Eastern Time (ET) — New York, Toronto (UTC-5)</option>
                      </optgroup>
                      <optgroup label="Europe &amp; Global">
                        <option value="Greenwich Mean Time (GMT / BST)">Greenwich Mean Time (GMT / BST) — London, Dublin (UTC+0 / UTC+1)</option>
                        <option value="Central European Time (CET)">Central European Time (CET) — Berlin, Paris, Amsterdam (UTC+1)</option>
                        <option value="Australian Eastern Time (AEST)">Australian Eastern Time (AEST) — Sydney, Melbourne (UTC+10)</option>
                        <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time)</option>
                      </optgroup>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[var(--color-text-tertiary)]">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                  <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
                  <span>Stored locally on this device · Zero external cloud tracking</span>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {saved && (
                    <span className="text-xs text-[var(--color-success)] flex items-center gap-1.5 font-medium animate-fade-in">
                      <CheckCircle2 size={14} /> {saveMessage}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="btn btn-primary h-10 px-5 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-2 shadow-sm hover:shadow transition-all"
                  >
                    <Save size={14} /> Save Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div key="appearance" className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Appearance & Themes</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Select your interface theme. Your choice is automatically persisted to device storage.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* White Theme */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 relative group cursor-pointer ${
                    theme === 'light'
                      ? 'border-[var(--color-info)] ring-2 ring-[var(--color-info)]/20 bg-[var(--color-surface-secondary)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sun size={15} className="text-amber-500" />
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">White Theme</span>
                    </div>
                    {theme === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-[var(--color-info)] text-white flex items-center justify-center text-[10px]">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg p-2.5 border border-slate-200 bg-white space-y-1.5 shadow-sm pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                      <div className="w-12 h-2 rounded bg-slate-200" />
                    </div>
                    <div className="w-full h-2 rounded bg-slate-100" />
                    <div className="flex gap-1">
                      <div className="w-1/2 h-3 rounded bg-blue-50" />
                      <div className="w-1/2 h-3 rounded bg-slate-50" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-2.5">
                    Clean, high-clarity daylight theme with white cards.
                  </p>
                </button>

                {/* Dark Blue Theme */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 relative group cursor-pointer ${
                    theme === 'dark'
                      ? 'border-[var(--color-info)] ring-2 ring-[var(--color-info)]/20 bg-[var(--color-surface-secondary)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Moon size={15} className="text-sky-400" />
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">Dark Blue Theme</span>
                    </div>
                    {theme === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-[var(--color-info)] text-white flex items-center justify-center text-[10px]">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg p-2.5 border border-[#334155] bg-[#1e293b] space-y-1.5 shadow-sm pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                      <div className="w-12 h-2 rounded bg-[#334155]" />
                    </div>
                    <div className="w-full h-2 rounded bg-[#0f172a]" />
                    <div className="flex gap-1">
                      <div className="w-1/2 h-3 rounded bg-[#0f172a]/70" />
                      <div className="w-1/2 h-3 rounded bg-[#334155]/50" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-2.5">
                    Navy & slate dark palette with deep blue undertones.
                  </p>
                </button>

                {/* Pure Black Theme */}
                <button
                  type="button"
                  onClick={() => setTheme('black')}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 relative group cursor-pointer ${
                    theme === 'black'
                      ? 'border-[var(--color-info)] ring-2 ring-[var(--color-info)]/20 bg-[var(--color-surface-secondary)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-emerald-400" />
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">Pure Black Theme</span>
                    </div>
                    {theme === 'black' && (
                      <span className="w-5 h-5 rounded-full bg-[var(--color-info)] text-white flex items-center justify-center text-[10px]">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg p-2.5 border border-[#22242a] bg-[#0b0c0e] space-y-1.5 shadow-sm pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <div className="w-12 h-2 rounded bg-[#202227]" />
                    </div>
                    <div className="w-full h-2 rounded bg-black" />
                    <div className="flex gap-1">
                      <div className="w-1/2 h-3 rounded bg-black" />
                      <div className="w-1/2 h-3 rounded bg-[#16171b]" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-2.5">
                    True OLED midnight black with ultra-deep surfaces.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* LOCAL STORAGE & DATA MANAGEMENT */}
          {activeTab === 'storage' && (
            <div key="storage" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <HardDrive size={18} className="text-[var(--color-info)]" />
                    Local Storage on Your Device
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    All application data is securely kept in your device's browser Local Storage.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/30 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  Active on Local Device
                </span>
              </div>

              {/* Storage Stats Banner */}
              <div className="p-4 bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)] rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[var(--color-text-tertiary)]">Scoped Storage Key: </span>
                    <code className="text-xs font-mono font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                      talentflow-storage:{activeWorkspaceId}
                    </code>
                  </div>
                  <div className="text-[var(--color-text-secondary)]">
                    Local Device Footprint: <strong className="text-[var(--color-text-primary)]">{storageSize}</strong>
                  </div>
                </div>

                {/* Grid of records */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                  <div className="p-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-center">
                    <Users size={14} className="mx-auto text-[var(--color-info)] mb-1" />
                    <p className="text-base font-bold text-[var(--color-text-primary)]">{candidates.length}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Candidates</p>
                  </div>
                  <div className="p-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-center">
                    <Briefcase size={14} className="mx-auto text-[var(--color-primary)] mb-1" />
                    <p className="text-base font-bold text-[var(--color-text-primary)]">{jobs.length}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Job Openings</p>
                  </div>
                  <div className="p-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-center">
                    <GitMerge size={14} className="mx-auto text-[var(--color-warning)] mb-1" />
                    <p className="text-base font-bold text-[var(--color-text-primary)]">{jobMatches.length}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Job Matches</p>
                  </div>
                  <div className="p-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-center">
                    <FileText size={14} className="mx-auto text-emerald-400 mb-1" />
                    <p className="text-base font-bold text-[var(--color-text-primary)]">{importedFiles.length}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Imported Files</p>
                  </div>
                  <div className="p-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-center col-span-2 sm:col-span-1">
                    <Bell size={14} className="mx-auto text-amber-400 mb-1" />
                    <p className="text-base font-bold text-[var(--color-text-primary)]">{notifications.length}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Notifications</p>
                  </div>
                </div>
              </div>

              {/* Workspace Profiles (Multi-User / Multi-Division Data Isolation) */}
              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-sky-400" />
                      Recruiter Workspace Profiles (Isolated Storage)
                    </h4>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                      Operate in independent clinical divisions or test scenarios. Each workspace is isolated with zero cross-account state collision.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 self-start sm:self-auto">
                    Active: {activeWorkspaceId}
                  </span>
                </div>

                {/* Preset Switcher Badges */}
                <div className="flex flex-wrap gap-2">
                  {getAvailableWorkspaces().map((ws) => (
                    <div key={ws} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => switchWorkspace(ws)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeWorkspaceId === ws
                            ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-xs'
                            : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        <span className="capitalize">{ws.replace(/[-_]/g, ' ')}</span>
                        {activeWorkspaceId === ws && <Check size={12} className="text-sky-400" />}
                      </button>
                      {ws !== 'default' && (
                        <button
                          type="button"
                          onClick={() => deleteWorkspace(ws)}
                          title={`Delete workspace ${ws}`}
                          className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Create Custom Workspace */}
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                  <input
                    type="text"
                    value={customWsInput}
                    onChange={(e) => setCustomWsInput(e.target.value)}
                    placeholder="Create custom workspace (e.g. oncology-icu, pediatrics)..."
                    className="flex-1 px-3 py-1.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-sky-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customWsInput.trim()) {
                        e.preventDefault();
                        switchWorkspace(customWsInput.trim());
                        setCustomWsInput('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customWsInput.trim()) {
                        switchWorkspace(customWsInput.trim());
                        setCustomWsInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} />
                    <span>Create / Switch</span>
                  </button>
                </div>
              </div>

              {/* Data Export & Backup Actions */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  Backup & Portability
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="p-3.5 bg-[var(--color-surface-secondary)]/50 hover:bg-[var(--color-surface-tertiary)]/50 border border-[var(--color-border)] rounded-xl flex items-start gap-3 transition-colors text-left cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-info)] group-hover:scale-105 transition-transform">
                      <Download size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">Export Data Backup</p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                        Download your candidates, jobs, matches, and settings as a portable JSON file.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 bg-[var(--color-surface-secondary)]/50 hover:bg-[var(--color-surface-tertiary)]/50 border border-[var(--color-border)] rounded-xl flex items-start gap-3 transition-colors text-left cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-success)] group-hover:scale-105 transition-transform">
                      <Upload size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">Restore from Backup</p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                        Load a previously exported JSON backup file directly into local storage.
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </button>
                </div>
              </div>

              {/* Workspace Data Management */}
              <div className="pt-2 space-y-3">
                <h4 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                  Sample Data & Workspace Reset
                </h4>

                {/* Option 1: Load Sample Demo Data */}
                <div className="p-4 border border-[var(--color-border)] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--color-surface)]">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <Sparkles size={14} className="text-sky-400" />
                      Load Sample Clinical Demo Data
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                      Populate your workspace with realistic healthcare candidates, hospital requisitions, and match scores to explore all platform features.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="btn btn-secondary btn-sm text-xs border-[var(--color-border)] hover:border-[var(--color-info)] text-[var(--color-text-primary)] transition-colors cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles size={12} className="text-sky-400" />
                    Load Demo Data
                  </button>
                </div>

                {/* Option 2: Clear All Data (Start Blank) */}
                <div className="p-4 border border-[var(--color-border)] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--color-surface)]">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <Trash2 size={13} className="text-[var(--color-error)]" />
                      Clear All Workspace Data (Start Blank)
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                      Wipe all candidates, jobs, and matches from local storage to start completely fresh for your real organization data.
                    </p>
                  </div>

                  {!resetConfirmOpen ? (
                    <button
                      type="button"
                      onClick={() => setResetConfirmOpen(true)}
                      className="btn btn-secondary btn-sm text-xs border-[var(--color-border)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      Clear Data...
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleClearAllData}
                        className="btn btn-sm text-xs bg-[var(--color-error)] text-white hover:opacity-90 cursor-pointer"
                      >
                        Confirm Wipe (Blank)
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetConfirmOpen(false)}
                        className="btn btn-secondary btn-sm text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {saved && (
                <div className="p-3 bg-[var(--color-success-bg)] border border-[var(--color-success)]/30 rounded-lg text-xs text-[var(--color-success)] flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>{saveMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div key="shortcuts" className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Keyboard Shortcuts</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Navigate and trigger actions across TalentMatch with universal shortcuts for {isMac ? 'macOS' : 'Windows & Linux'}
                  </p>
                </div>
                <button
                  onClick={() => setShortcutsModalOpen(true)}
                  className="btn btn-secondary btn-sm self-start sm:self-auto"
                >
                  <Keyboard size={13} />
                  <span>Open Quick Modal (?)</span>
                </button>
              </div>

              <div className="space-y-4">
                {(['Navigation', 'General', 'Actions'] as const).map((cat) => {
                  const items = SHORTCUT_DEFINITIONS.filter(s => s.category === cat);
                  return (
                    <div key={cat} className="space-y-2">
                      <h4 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                        {cat}
                      </h4>
                      <div className="bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)] overflow-hidden">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2.5 px-3.5 hover:bg-[var(--color-surface-tertiary)]/40 transition-colors">
                            <span className="text-xs text-[var(--color-text-primary)] font-medium">
                              {item.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {item.keys.map((k, idx) => (
                                <span key={idx} className="flex items-center gap-1">
                                  {idx > 0 && item.keys.length === 2 && item.keys[0] === 'G' && (
                                    <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium">then</span>
                                  )}
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
                  );
                })}
              </div>

              <div className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-tertiary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>Active platform: <strong className="text-[var(--color-text-primary)]">{isMac ? 'macOS (⌘ Command)' : 'Windows / Linux (Ctrl)'}</strong></span>
                <span className="flex items-center gap-1">Press <kbd className="px-1.5 py-0.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded font-mono text-[10px]">?</kbd> anywhere to open shortcut overlay</span>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div key="notifications" className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Real-Time Alerts &amp; Sound Chimes
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Stay updated while multitasking — receive background notifications and audio cues whenever processing completes.
                </p>
              </div>

              {/* Platform Environment Banner */}
              {(window as unknown as { electronAPI?: { isElectron?: boolean } }).electronAPI?.isElectron ? (
                <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <Laptop size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--color-text-primary)]">
                        Native Desktop App Active
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 truncate">
                        Full Windows Action Center &amp; macOS Notification Center support with taskbar flashing, dock bounce, and sound.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase shrink-0">
                    Native OS Mode
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sky-400 flex items-center justify-center shrink-0">
                      <Globe size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-text-primary)]">Web Browser Mode</p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">
                        Status: {browserPermission === 'granted' ? '✓ Browser Notifications Allowed' : 'Permission needed for desktop banners'}
                      </p>
                    </div>
                  </div>
                  {browserPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={async () => {
                        const perm = await notificationAudio.requestPermission();
                        setBrowserPermission(perm);
                      }}
                      className="btn btn-secondary btn-sm text-xs cursor-pointer shrink-0"
                    >
                      Enable Browser Alerts
                    </button>
                  )}
                </div>
              )}

              {/* Preferences Toggles */}
              <div className="space-y-2 border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]/60 bg-[var(--color-surface-secondary)]/25 overflow-hidden">
                {/* 1. Audio Notification Sounds */}
                <div className="p-4 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Volume2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                            Synthesized Audio Chimes
                          </p>
                          <span className="badge badge-info text-[9px] font-semibold uppercase">
                            6 Audio Styles
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed">
                          Harmonic alerts synthesized with Web Audio API. Zero external audio downloads, 100% offline.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={notificationSettings?.soundEnabled ?? true}
                          onChange={(e) => updateNotificationSettings({ soundEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="toggle-track">
                          <div className="toggle-thumb" />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Sound Choice Grid (Active when sound is enabled) */}
                  {(notificationSettings?.soundEnabled ?? true) && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)]/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                          Choose Notification Chime:
                        </span>
                        <span className="text-[10px] text-[var(--color-text-tertiary)]">
                          Active: <strong className="text-sky-300 font-semibold">{SOUND_OPTIONS.find(s => s.id === (notificationSettings?.soundChoice || 'clinical-chime'))?.name}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {SOUND_OPTIONS.map((sound) => {
                          const isSelected = (notificationSettings?.soundChoice || 'clinical-chime') === sound.id;
                          const isPlaying = playingSoundId === sound.id;

                          return (
                            <div
                              key={sound.id}
                              onClick={() => {
                                updateNotificationSettings({ soundChoice: sound.id });
                                setPlayingSoundId(sound.id);
                                notificationAudio.playSound(sound.id, 'success');
                                setTimeout(() => setPlayingSoundId(null), 1200);
                              }}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 select-none ${
                                isSelected
                                  ? 'bg-[var(--color-surface)] border-[var(--color-info)] ring-1 ring-[var(--color-info)]/30 shadow-xs'
                                  : 'bg-[var(--color-surface)]/60 border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                                      {sound.name}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border)]">
                                      {sound.tag}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 line-clamp-2 leading-relaxed">
                                    {sound.description}
                                  </p>
                                </div>

                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected ? 'border-[var(--color-info)] bg-[var(--color-info)]' : 'border-[var(--color-border)]'
                                }`}>
                                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlayingSoundId(sound.id);
                                  notificationAudio.playSound(sound.id, 'success');
                                  setTimeout(() => setPlayingSoundId(null), 1200);
                                }}
                                className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                  isPlaying
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                    : 'bg-[var(--color-surface-secondary)]/80 hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                                }`}
                              >
                                <Play size={11} className={isPlaying ? 'animate-pulse text-sky-400' : ''} />
                                <span>{isPlaying ? 'Playing...' : 'Play Preview'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Desktop OS Push Notifications */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                        OS Desktop Notifications
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed">
                        Pushes system banners to Windows Action Center or macOS Notification Center even when TalentMatch is minimized or running behind other windows.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 self-end sm:self-auto">
                    <input
                      type="checkbox"
                      checked={notificationSettings?.desktopEnabled ?? true}
                      onChange={(e) => updateNotificationSettings({ desktopEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="toggle-track">
                      <div className="toggle-thumb" />
                    </div>
                  </label>
                </div>

                {/* 3. Resume & Folder Watcher Alerts */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                        Resume &amp; Folder Watcher Alerts
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed">
                        Notify in real time when Folder Watcher auto-discovers a new resume or direct batch PDF extraction finishes.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 self-end sm:self-auto">
                    <input
                      type="checkbox"
                      checked={notificationSettings?.resumeAlerts ?? true}
                      onChange={(e) => updateNotificationSettings({ resumeAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="toggle-track">
                      <div className="toggle-thumb" />
                    </div>
                  </label>
                </div>

                {/* 4. Candidate-Job Match Alerts */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <GitMerge size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                        Candidate-Job Match Alerts
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed">
                        Notify when high-relevance clinical candidates are matched with active hospital requisitions.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 self-end sm:self-auto">
                    <input
                      type="checkbox"
                      checked={notificationSettings?.matchAlerts ?? true}
                      onChange={(e) => updateNotificationSettings({ matchAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="toggle-track">
                      <div className="toggle-thumb" />
                    </div>
                  </label>
                </div>
              </div>

              {/* Live Test Banner */}
              <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Sparkles size={13} className="text-sky-400" />
                    Test Real-Time Notification &amp; Sound
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                    Click to dispatch an instant test notification with audio chime to verify your desktop and sound setup.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {testAlertSent && (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 size={13} /> Sent!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      addNotification({
                        type: 'success',
                        title: 'TalentMatch Desktop Alert',
                        message: 'Real-time background notifications and sound chimes are working perfectly on your device!',
                      });
                      setTestAlertSent(true);
                      setTimeout(() => setTestAlertSent(false), 3000);
                    }}
                    className="btn btn-primary text-xs h-8.5 px-3.5 cursor-pointer flex items-center gap-1.5 font-semibold"
                  >
                    <Bell size={13} />
                    <span>Send Test Alert</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div key="integrations" className="space-y-4">
              <h3 className="text-sm font-medium">Integrations</h3>
              <p className="text-xs text-[var(--color-text-tertiary)]">Connect external services. Currently running in client-side Local Storage mode.</p>
              <div className="space-y-2">
                {[
                  { name: 'Browser Local Storage', status: 'Connected', desc: 'Client-side active persistence on this device' },
                  { name: 'PostgreSQL Database', status: 'Optional', desc: 'Remote synchronization when connected to backend' },
                  { name: 'FastAPI Backend', status: 'Standby', desc: 'Application server for AI batch processing' },
                  { name: 'Ollama (Local LLM)', status: 'Standby', desc: 'Local AI model for offline resume embeddings' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-md">
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">{item.name}</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)]">{item.desc}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      item.status === 'Connected'
                        ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] font-medium'
                        : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI & LLM CONFIGURATION */}
          {activeTab === 'api' && (
            <div key="api" className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Key size={16} className="text-[var(--color-info)]" />
                  AI & LLM Configuration
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Choose how resumes and documents are analyzed. Run completely private on your local device with Ollama, connect your cloud API key, or use the built-in parser.
                </p>
              </div>

              {/* Provider Selector Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                  Inference Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAiForm({
                      ...aiForm,
                      provider: 'ollama',
                      apiUrl: 'http://localhost:11434',
                      modelName: 'llama3.2:3b',
                    })}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      aiForm.provider === 'ollama'
                        ? 'border-[var(--color-info)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-info)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">Local Ollama</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-success-bg)] text-[var(--color-success)] font-medium">100% Private</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
                      Runs locally on your Mac/PC at localhost:11434 with zero data leaving your machine.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiForm({
                      ...aiForm,
                      provider: 'openai',
                      apiUrl: 'https://api.openai.com/v1',
                      modelName: 'gpt-4o-mini',
                    })}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      aiForm.provider === 'openai'
                        ? 'border-[var(--color-info)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-info)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">OpenAI API</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-info-bg)] text-[var(--color-info)] font-medium">GPT-4o Mini</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
                      High-accuracy clinical extraction using OpenAI's fast, low-cost GPT-4o-mini model.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiForm({
                      ...aiForm,
                      provider: 'groq',
                      apiUrl: 'https://api.groq.com/openai/v1',
                      modelName: 'llama-3.3-70b-versatile',
                    })}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      aiForm.provider === 'groq'
                        ? 'border-[var(--color-info)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-info)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">Groq Cloud</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">Ultra-Fast LPU</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
                      Sub-second Llama 3.3 70B parsing via Groq's high-speed inference API.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiForm({
                      ...aiForm,
                      provider: 'heuristic',
                    })}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      aiForm.provider === 'heuristic'
                        ? 'border-[var(--color-info)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-info)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">Built-in Extractor</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] font-medium">Zero Setup</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
                      Deterministic pattern & NLP extractor. No API keys or external servers required.
                    </p>
                  </button>
                </div>
              </div>

              {/* Detailed inputs if not pure heuristic */}
              {aiForm.provider !== 'heuristic' && (
                <div className="space-y-3.5 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                      Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={aiForm.apiUrl}
                      onChange={(e) => setAiForm({ ...aiForm, apiUrl: e.target.value })}
                      placeholder="http://localhost:11434"
                      className="input w-full h-9 px-3 text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={aiForm.modelName}
                        onChange={(e) => setAiForm({ ...aiForm, modelName: e.target.value })}
                        placeholder={aiForm.provider === 'ollama' ? 'llama3.2:3b' : 'gpt-4o-mini'}
                        className="input w-full h-9 px-3 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                        API Key {aiForm.provider === 'ollama' ? '(Optional for Local Ollama)' : '(Required)'}
                      </label>
                      <input
                        type="password"
                        value={aiForm.apiKey}
                        onChange={(e) => setAiForm({ ...aiForm, apiKey: e.target.value })}
                        placeholder={aiForm.provider === 'ollama' ? 'None needed' : 'sk-...'}
                        className="input w-full h-9 px-3 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CORS warning for Ollama in browser mode */}
              {aiForm.provider === 'ollama' && !(window as any).electronAPI?.isElectron && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-amber-500" />
                  <div className="flex-1 leading-relaxed text-amber-600 dark:text-amber-400">
                    <strong>Browser CORS Notice:</strong> When running in-browser (not the Desktop app), Ollama requires CORS to be enabled.
                    Start Ollama with: <code className="font-mono text-[10px] bg-amber-500/20 px-1 py-0.5 rounded">set OLLAMA_ORIGINS=* && ollama serve</code> (Windows) or use the <strong>Desktop App</strong> (.exe) for zero-config local AI.
                  </div>
                </div>
              )}

              {/* Connection Test Result */}
              {connectionTestResult && (
                <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 animate-scale-in ${
                  connectionTestResult.success
                    ? 'bg-[var(--color-success-bg)] border-[var(--color-success)]/30 text-[var(--color-success)]'
                    : 'bg-[var(--color-error-bg)] border-[var(--color-error)]/30 text-[var(--color-error)]'
                }`}>
                  {connectionTestResult.success ? (
                    <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                  )}
                  <span className="flex-1 leading-relaxed">{connectionTestResult.message}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                      disabled={testingConnection}
                      onClick={async () => {
                        setTestingConnection(true);
                        setConnectionTestResult(null);
                        try {
                          const res = await testAIConnection(aiForm);
                          setConnectionTestResult({
                            tested: true,
                            success: res.success,
                            message: res.message,
                          });
                        } catch (err: any) {
                          setConnectionTestResult({
                            tested: true,
                            success: false,
                            message: err.message || 'Connection test failed',
                          });
                        } finally {
                          setTestingConnection(false);
                        }
                      }}
                      className="btn btn-secondary btn-sm text-xs cursor-pointer"
                    >
                      <RefreshCw size={12} className={testingConnection ? 'animate-spin' : ''} />
                      {testingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBenchmarkOpen(true)}
                      className="btn btn-secondary btn-sm text-xs cursor-pointer flex items-center gap-1.5"
                      title="Run automated accuracy and speed benchmark"
                    >
                      <Sparkles size={12} className="text-[var(--color-primary)]" />
                      <span>Self-Test Benchmark</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {saved && (
                      <span className="text-xs text-[var(--color-success)] flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={13} /> {saveMessage}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        updateAIConfig(aiForm);
                        setSaveMessage('AI configuration saved to local storage!');
                        setSaved(true);
                        setTimeout(() => setSaved(false), 2400);
                      }}
                      className="btn btn-primary h-9 px-4 text-xs cursor-pointer"
                    >
                      <Save size={13} /> Save AI Configuration
                    </button>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* Creator Portfolio Attribution Footer */}
        <div className="pt-6 pb-2 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <span>Designed &amp; Engineered by</span>
            <a
              href="https://abhiishek.is-a.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1 underline underline-offset-2"
            >
              Abhishek
              <ExternalLink size={11} />
            </a>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-medium text-[var(--color-text-secondary)]">TalentMatch ATS</span>
            <span>•</span>
            <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">Multi-Workspace Isolation &amp; Tactile Haptics</span>
          </div>
        </div>
      </div>

      {/* Live Diagnostic Benchmark Modal */}
      <DiagnosticBenchmarkModal
        isOpen={benchmarkOpen}
        onClose={() => setBenchmarkOpen(false)}
      />
    </div>
  );
}
