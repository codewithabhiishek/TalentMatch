import { useState } from 'react';
import { Save, User, Bell, Database, Key } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={14} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
    { id: 'integrations', label: 'Integrations', icon: <Database size={14} /> },
    { id: 'api', label: 'API Keys', icon: <Key size={14} /> },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Settings</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage your account and application preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Tabs */}
        <div className="lg:w-48 flex lg:flex-col gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border border-[var(--color-border)] rounded-lg p-5">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Profile Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">First Name</label>
                  <input type="text" defaultValue="Jordan" className="w-full h-8 px-2.5 text-xs border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)]" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Last Name</label>
                  <input type="text" defaultValue="Rivera" className="w-full h-8 px-2.5 text-xs border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)]" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Email</label>
                  <input type="email" defaultValue="jordan@talentflow.com" className="w-full h-8 px-2.5 text-xs border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)]" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Role</label>
                  <input type="text" defaultValue="Senior Recruiter" className="w-full h-8 px-2.5 text-xs border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)]" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Timezone</label>
                <select className="h-8 px-2.5 text-xs border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)]">
                  <option>Pacific Time (PT)</option>
                  <option>Mountain Time (MT)</option>
                  <option>Central Time (CT)</option>
                  <option>Eastern Time (ET)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Preferences</h3>
              <div className="space-y-3">
                {[
                  { label: 'New candidate matches', desc: 'Get notified when new candidate-job matches are found' },
                  { label: 'Resume processing complete', desc: 'Notification when resume processing finishes' },
                  { label: 'Job import results', desc: 'Summary after job file imports complete' },
                  { label: 'Status changes', desc: 'Updates when candidate or job status changes' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 py-2 border-b border-[var(--color-border)] last:border-0">
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">{item.label}</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" defaultChecked={idx < 2} className="sr-only peer" />
                      <div className="w-8 h-4.5 bg-[var(--color-surface-tertiary)] peer-checked:bg-[var(--color-primary)] rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-3.5" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Integrations</h3>
              <p className="text-xs text-[var(--color-text-tertiary)]">Connect external services. These will be available after backend integration.</p>
              <div className="space-y-2">
                {[
                  { name: 'PostgreSQL Database', status: 'Not connected', desc: 'Primary data store for candidates and jobs' },
                  { name: 'FastAPI Backend', status: 'Not connected', desc: 'Application server for processing and matching' },
                  { name: 'Ollama (Local LLM)', status: 'Not connected', desc: 'Local AI model for resume parsing and matching' },
                  { name: 'Cloud LLM API', status: 'Not connected', desc: 'Optional cloud AI provider (OpenAI, Anthropic, etc.)' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-md">
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">{item.name}</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)]">{item.desc}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] rounded">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">API Configuration</h3>
              <p className="text-xs text-[var(--color-text-tertiary)]">Configure API keys for external services. Keys are stored securely on the server.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Backend API URL</label>
                  <input type="text" placeholder="http://localhost:8000/api" className="w-full h-8 px-2.5 text-xs border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)] placeholder:text-[var(--color-text-tertiary)]" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">LLM Provider</label>
                  <select className="w-full h-8 px-2.5 text-xs border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)]">
                    <option>Local Ollama (Llama 3)</option>
                    <option>OpenAI</option>
                    <option>Anthropic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">API Key</label>
                  <input type="password" placeholder="sk-..." className="w-full h-8 px-2.5 text-xs border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)] placeholder:text-[var(--color-text-tertiary)]" />
                </div>
              </div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] italic">
                Demo mode — settings are not persisted. In production, these connect to the FastAPI backend.
              </p>
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-border)]">
            {saved && (
              <span className="text-xs text-[var(--color-success)] flex items-center gap-1">
                <Save size={12} /> Saved successfully
              </span>
            )}
            <button
              onClick={handleSave}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              <Save size={12} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
