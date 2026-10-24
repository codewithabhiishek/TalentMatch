import { useState, useRef, useEffect } from 'react';
import {
  Save, User, Bell, Database, Key, Palette, Check, Sun, Moon, Sparkles,
  Keyboard, HardDrive, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2,
  FileText, Briefcase, Users, GitMerge, Globe, ChevronDown, Trash2
} from 'lucide-react';
import { useAppStore } from '../store';
import { SHORTCUT_DEFINITIONS, isMac } from '../hooks/useKeyboardShortcuts';
import { testAIConnection, AIConfig } from '../services/aiExtractionService';
import { DiagnosticBenchmarkModal } from '../components/DiagnosticBenchmarkModal';

export function Settings() {
  const {
    theme, setTheme, setShortcutsModalOpen,
    userProfile, updateUserProfile,
    aiConfig, updateAIConfig,
    candidates, jobs, jobMatches, importedFiles, notifications,
    loadSampleData, clearAllData, resetAllData, exportDataJSON, importDataJSON
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'storage' | 'shortcuts' | 'notifications' | 'integrations' | 'api'>('profile');
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Saved successfully');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [storageSize, setStorageSize] = useState<string>('0 KB');

  // AI Configuration Form state
  const [aiForm, setAiForm] = useState<AIConfig>({
    provider: aiConfig?.provider || 'ollama',
    apiUrl: aiConfig?.apiUrl || 'http://localhost:11434',
    apiKey: aiConfig?.apiKey || '',
    modelName: aiConfig?.modelName || 'llama3',
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
        modelName: aiConfig.modelName || 'llama3',
        temperature: aiConfig.temperature ?? 0.1,
      });
    }
  }, [aiConfig]);

  // Form local state synced with userProfile
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || 'Jordan',
    lastName: userProfile?.lastName || 'Rivera',
    email: userProfile?.email || 'jordan@talentflow.com',
    role: userProfile?.role || 'Senior Recruiter',
    timezone: userProfile?.timezone || 'Pacific Time (PT)',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || 'Jordan',
        lastName: userProfile.lastName || 'Rivera',
        email: userProfile.email || 'jordan@talentflow.com',
        role: userProfile.role || 'Senior Recruiter',
        timezone: userProfile.timezone || 'Pacific Time (PT)',
      });
    }
  }, [userProfile]);

  // Compute local storage size
  const updateStorageSize = () => {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem('talentflow-storage') || '';
        const bytes = new Blob([item]).size;
        if (bytes < 1024) {
          setStorageSize(`${bytes} B`);
        } else {
          setStorageSize(`${(bytes / 1024).toFixed(1)} KB`);
        }
      }
    } catch {
      setStorageSize('Available');
    }
  };

  useEffect(() => {
    updateStorageSize();
  }, [candidates, jobs, jobMatches, importedFiles, notifications, userProfile]);

  const handleSaveProfile = () => {
    updateUserProfile(formData);
    setSaveMessage('Profile saved to local storage!');
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const handleExportData = () => {
    try {
      const json = exportDataJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talentflow-backup-${new Date().toISOString().split('T')[0]}.json`;
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
    <div className="p-3.5 sm:p-5 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-5 animate-fade-in">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Settings</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage your account, appearance, and local device storage</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
        {/* Tabs */}
        <div className="lg:w-48 flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card flex-1 p-4 sm:p-6">
          {/* PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Profile Settings</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Update your identity details. These are stored locally in your browser.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input w-full h-10 px-3 text-xs sm:text-sm font-medium bg-[var(--color-surface)] border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input w-full h-10 px-3 text-xs sm:text-sm font-medium bg-[var(--color-surface)] border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input w-full h-10 px-3 text-xs sm:text-sm font-medium bg-[var(--color-surface)] border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Role Title</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input w-full h-10 px-3 text-xs sm:text-sm font-medium bg-[var(--color-surface)] border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                  Timezone & Region
                </label>
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-tertiary)]">
                    <Globe size={15} />
                  </div>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="input w-full h-10.5 pl-9 pr-10 text-xs sm:text-sm font-medium bg-[var(--color-surface)] !bg-none border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] cursor-pointer appearance-none transition-all hover:border-[var(--color-border-hover)] focus:border-[var(--color-info)]"
                  >
                    <option value="Pacific Time (PT)">Pacific Time (PT) — Los Angeles, Vancouver (UTC-8)</option>
                    <option value="Mountain Time (MT)">Mountain Time (MT) — Denver, Phoenix (UTC-7)</option>
                    <option value="Central Time (CT)">Central Time (CT) — Chicago, Dallas (UTC-6)</option>
                    <option value="Eastern Time (ET)">Eastern Time (ET) — New York, Toronto (UTC-5)</option>
                    <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[var(--color-text-tertiary)]">
                    <ChevronDown size={15} />
                  </div>
                </div>
                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1.5">
                  Used for formatting interview schedules, timestamps, and candidate timeline logs.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                {saved && (
                  <span className="text-xs text-[var(--color-success)] flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} /> {saveMessage}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="btn btn-primary h-9 px-4 text-xs ml-auto cursor-pointer"
                >
                  <Save size={14} /> Save Profile
                </button>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
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
            <div className="space-y-6 animate-fade-in">
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
                    <span className="text-[var(--color-text-tertiary)]">Storage Key: </span>
                    <code className="text-xs font-mono font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                      talentflow-storage
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
            <div className="space-y-5 animate-fade-in">
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
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Notification Preferences</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Control how and when you receive candidate match and processing alerts.
                </p>
              </div>
              <div className="space-y-1 divide-y divide-[var(--color-border)]/60">
                {[
                  { label: 'New candidate matches', desc: 'Get notified when new candidate-job matches are found' },
                  { label: 'Resume processing complete', desc: 'Notification when resume processing finishes' },
                  { label: 'Job import results', desc: 'Summary after job file imports complete' },
                  { label: 'Status changes', desc: 'Updates when candidate or job status changes' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">{item.label}</p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" defaultChecked={idx < 2} className="sr-only peer" />
                      <div className="toggle-track">
                        <div className="toggle-thumb" />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="space-y-4 animate-fade-in">
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
            <div className="space-y-5 animate-fade-in">
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
                      modelName: 'llama3',
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
                        placeholder={aiForm.provider === 'ollama' ? 'llama3' : 'gpt-4o-mini'}
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
      </div>

      {/* Live Diagnostic Benchmark Modal */}
      <DiagnosticBenchmarkModal
        isOpen={benchmarkOpen}
        onClose={() => setBenchmarkOpen(false)}
      />
    </div>
  );
}
