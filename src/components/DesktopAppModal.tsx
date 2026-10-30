import { useState, useEffect } from 'react';
import { X, Copy, Check, Terminal, Laptop, ExternalLink, ShieldCheck, Sparkles, FolderOpen } from 'lucide-react';
import { Logo } from './Logo';

interface DesktopAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OperatingSystem = 'windows' | 'mac' | 'linux';

export function DesktopAppModal({ isOpen, onClose }: DesktopAppModalProps) {
  const [os, setOs] = useState<OperatingSystem>('windows');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Auto-detect user OS on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('mac')) {
        setOs('mac');
      } else if (userAgent.includes('linux')) {
        setOs('linux');
      } else {
        setOs('windows');
      }
    }
  }, []);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const getQuickStartCommand = () => {
    if (os === 'windows') {
      return `git clone https://github.com/codewithabhiishek/TalentMatch.git ; cd TalentMatch ; npm install ; npm run electron`;
    }
    return `git clone https://github.com/codewithabhiishek/TalentMatch.git && cd TalentMatch && npm install && npm run electron`;
  };

  const getBuildCommand = () => {
    if (os === 'windows') {
      return `npm run build:win:portable`;
    }
    if (os === 'mac') {
      return `npm run build:mac`;
    }
    return `npm run build`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border)] flex items-start justify-between gap-4 bg-[var(--color-surface-secondary)]/50">
          <div className="flex items-center gap-3">
            <Logo size="md" withText={false} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Run TalentMatch on Desktop</h3>
                <span className="badge badge-info text-[9px] font-semibold uppercase">Native App</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Full file-system access, automatic continuous folder sync, and 100% offline privacy.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* OS Switcher Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
            <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Select Operating System:
            </span>
            <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl">
              <button
                type="button"
                onClick={() => setOs('windows')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  os === 'windows'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs border border-[var(--color-border)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span>🪟 Windows</span>
              </button>
              <button
                type="button"
                onClick={() => setOs('mac')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  os === 'mac'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs border border-[var(--color-border)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span>🍎 macOS</span>
              </button>
              <button
                type="button"
                onClick={() => setOs('linux')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  os === 'linux'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs border border-[var(--color-border)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span>🐧 Linux</span>
              </button>
            </div>
          </div>

          {/* Quick Terminal Runner (Recommended) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <Terminal size={14} className="text-[var(--color-info)]" />
                1-Step Quick Run in Terminal ({os === 'windows' ? 'PowerShell / Command Prompt' : 'Terminal'}):
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">Requires Node.js 18+ &amp; Git</span>
            </div>

            <div className="relative group">
              <pre className="p-3.5 bg-black/80 text-sky-300 font-mono text-[11px] rounded-xl border border-[var(--color-border)] overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                {getQuickStartCommand()}
              </pre>
              <button
                onClick={() => copyToClipboard(getQuickStartCommand(), 'quickstart')}
                className="absolute right-2.5 top-2.5 px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-info)] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {copiedIndex === 'quickstart' ? (
                  <>
                    <Check size={12} className="text-[var(--color-success)]" />
                    <span className="text-[var(--color-success)]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              This clones the project, installs dependencies, and launches the native Electron desktop application with full folder privileges.
            </p>
          </div>

          {/* Step 2: Build Standalone Installer (.exe or .dmg) */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
            <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              Build Standalone Executable ({os === 'windows' ? 'Portable .exe' : os === 'mac' ? '.dmg Installer' : 'Production Build'}):
            </span>

            <div className="relative group">
              <pre className="p-3.5 bg-black/80 text-emerald-300 font-mono text-[11px] rounded-xl border border-[var(--color-border)] overflow-x-auto select-all">
                {getBuildCommand()}
              </pre>
              <button
                onClick={() => copyToClipboard(getBuildCommand(), 'build')}
                className="absolute right-2.5 top-2.5 px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-info)] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {copiedIndex === 'build' ? (
                  <>
                    <Check size={12} className="text-[var(--color-success)]" />
                    <span className="text-[var(--color-success)]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              The packaged output file will be generated in the <code className="px-1 py-0.5 rounded bg-[var(--color-surface-secondary)] font-mono text-[10px]">release/</code> folder.
            </p>
          </div>

          {/* Local LLM Command */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
            <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <FolderOpen size={14} className="text-[var(--color-info)]" />
              Free Open-Source Local AI Model (Ollama):
            </span>

            <div className="relative group">
              <pre className="p-3 bg-black/80 text-purple-300 font-mono text-[11px] rounded-xl border border-[var(--color-border)] select-all">
                ollama run llama3.2:3b
              </pre>
              <button
                onClick={() => copyToClipboard('ollama run llama3.2:3b', 'ollama')}
                className="absolute right-2.5 top-2 px-2 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-medium text-[var(--color-text-primary)] hover:border-[var(--color-info)] flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                {copiedIndex === 'ollama' ? (
                  <Check size={12} className="text-[var(--color-success)]" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              Install Ollama from <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="underline text-[var(--color-info)]">ollama.com/download</a>. Runs 100% private and offline on your machine.
            </p>
          </div>

          {/* Benefits Box */}
          <div className="p-3.5 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] space-y-2">
            <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[var(--color-success)]" />
              Why Run the Desktop Version?
            </span>
            <ul className="space-y-1 text-[11px] text-[var(--color-text-secondary)] list-disc pl-4 leading-relaxed">
              <li><strong>Zero Browser Dialogs:</strong> Direct access to local resume directories with background monitoring.</li>
              <li><strong>Permanent Folder Permission:</strong> Remembers your resume directory forever across reboots.</li>
              <li><strong>Air-Gapped Confidentiality:</strong> No resume or candidate information ever leaves your device.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href="https://github.com/codewithabhiishek/TalentMatch"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex items-center gap-1.5 transition-colors"
          >
            <span>View Source on GitHub</span>
            <ExternalLink size={12} />
          </a>
          <button
            onClick={onClose}
            className="btn btn-primary h-8 px-4 text-xs font-semibold cursor-pointer w-full sm:w-auto"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
