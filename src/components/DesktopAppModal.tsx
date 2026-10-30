import { useState, useEffect } from 'react';
import { X, Copy, Check, Terminal, ExternalLink, ShieldCheck, Sparkles, FolderOpen } from 'lucide-react';
import { Logo } from './Logo';

interface DesktopAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OperatingSystem = 'windows' | 'mac' | 'linux';

interface TerminalCodeBlockProps {
  id: string;
  title: string;
  badge?: string;
  shellLabel: string;
  command: string;
  helperText?: string;
  copiedId: string | null;
  onCopy: (command: string, id: string) => void;
  accentColor?: 'sky' | 'emerald';
}

function TerminalCodeBlock({
  id,
  title,
  badge,
  shellLabel,
  command,
  helperText,
  copiedId,
  onCopy,
  accentColor = 'sky',
}: TerminalCodeBlockProps) {
  const isCopied = copiedId === id;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-1.5">
          {accentColor === 'sky' ? (
            <Terminal size={14} className="text-[var(--color-info)]" />
          ) : (
            <Sparkles size={14} className="text-emerald-400" />
          )}
          <span>{title}</span>
        </span>
        {badge && (
          <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">{badge}</span>
        )}
      </div>

      {/* Terminal Window with Header Bar */}
      <div
        className={`rounded-xl border bg-[#080d19] overflow-hidden shadow-xs transition-all duration-200 ${
          isCopied
            ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
        }`}
      >
        {/* Terminal Window Header (Contains Traffic Lights, Shell Label, and Copy Button) */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#0c1424] border-b border-[var(--color-border)]/60 text-xs select-none">
          {/* Left: Window Dots + Shell Name */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 opacity-75">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] flex items-center gap-1 pl-1">
              <span>{shellLabel}</span>
            </span>
          </div>

          {/* Right: Dedicated Copy Button (Never overlaps or crowds the command) */}
          <button
            type="button"
            onClick={() => onCopy(command, id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isCopied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-[var(--color-surface)]/80 hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-info)]'
            }`}
            title="Copy command to clipboard"
          >
            {isCopied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} className="text-[var(--color-text-tertiary)]" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-3 sm:p-3.5 font-mono text-[11px] sm:text-xs leading-relaxed select-all overflow-x-auto">
          <div className="flex items-start gap-2">
            <span className="text-sky-500/60 select-none font-bold">$</span>
            <pre
              className={`flex-1 m-0 p-0 font-mono whitespace-pre-wrap break-all ${
                accentColor === 'sky' ? 'text-sky-300' : 'text-emerald-300'
              }`}
            >
              {command}
            </pre>
          </div>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-[var(--color-text-tertiary)] leading-normal">
          {helperText}
        </p>
      )}
    </div>
  );
}

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
        <div className="p-4 sm:p-5 border-b border-[var(--color-border)] flex items-start justify-between gap-4 bg-[var(--color-surface-secondary)]/50">
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* OS Switcher Tabs with Animated Indicators */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[var(--color-border)]">
            <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Select Operating System:
            </span>
            <div className="inline-flex items-center p-1 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setOs('windows')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  os === 'windows'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs ring-1 ring-[var(--color-info)]/30 scale-102'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span>🪟 Windows</span>
                {os === 'windows' && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setOs('mac')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  os === 'mac'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs ring-1 ring-[var(--color-info)]/30 scale-102'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span>🍎 macOS</span>
                {os === 'mac' && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setOs('linux')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  os === 'linux'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs ring-1 ring-[var(--color-info)]/30 scale-102'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span>🐧 Linux</span>
                {os === 'linux' && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Dynamic OS-Dependent Commands (Smooth Keyframed Switch Animation) */}
          <div key={os} className="animate-tab-switch space-y-4">
            
            {/* Active Platform Banner */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)]/80 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {os === 'windows' ? 'Windows Environment' : os === 'mac' ? 'macOS Environment' : 'Linux Environment'}
                </span>
                <span className="text-[var(--color-text-tertiary)]">•</span>
                <span className="text-[var(--color-text-secondary)]">
                  {os === 'windows'
                    ? 'PowerShell sequential syntax (;) & Portable .exe target'
                    : os === 'mac'
                    ? 'Apple Silicon & Intel zsh (&&) & .dmg installer target'
                    : 'Standard POSIX shell (&&) & Production runtime'}
                </span>
              </div>
            </div>

            {/* Quick Terminal Runner */}
            <TerminalCodeBlock
              id="quickstart"
              title={`1-Step Quick Run in Terminal`}
              badge="Requires Node.js 18+ & Git"
              shellLabel={os === 'windows' ? 'PowerShell / Command Prompt' : os === 'mac' ? 'zsh / Apple Terminal' : 'bash / zsh'}
              command={getQuickStartCommand()}
              helperText="This clones the repository, installs dependencies, and launches the native Electron desktop application with background folder sync."
              copiedId={copiedIndex}
              onCopy={copyToClipboard}
              accentColor="sky"
            />

            {/* Standalone Binary Build */}
            <TerminalCodeBlock
              id="build"
              title={`Build Standalone Executable`}
              badge={os === 'windows' ? 'Portable .exe' : os === 'mac' ? '.dmg Installer' : 'Production Build'}
              shellLabel={os === 'windows' ? 'PowerShell' : 'Terminal'}
              command={getBuildCommand()}
              helperText="The packaged executable output will be created inside the release/ directory on your machine."
              copiedId={copiedIndex}
              onCopy={copyToClipboard}
              accentColor="emerald"
            />
          </div>

          {/* Local LLM Command */}
          <div className="pt-2 border-t border-[var(--color-border)]">
            <TerminalCodeBlock
              id="ollama"
              title="Free Open-Source Local AI Model (Ollama)"
              badge="100% Offline & Private"
              shellLabel="Ollama CLI"
              command="ollama run llama3.2:3b"
              helperText="Download Ollama from ollama.com/download. Keeps candidate clinical data strictly air-gapped on your device."
              copiedId={copiedIndex}
              onCopy={copyToClipboard}
              accentColor="sky"
            />
          </div>

          {/* Value Highlights */}
          <div className="p-3.5 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] space-y-2">
            <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[var(--color-success)]" />
              Why Run the Desktop Version?
            </span>
            <ul className="space-y-1 text-[11px] text-[var(--color-text-secondary)] list-disc pl-4 leading-relaxed">
              <li><strong>Zero Browser Dialogs:</strong> Direct access to local resume directories with background monitoring.</li>
              <li><strong>Permanent Folder Permission:</strong> Remembers your resume directory forever across reboots without re-granting permission.</li>
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
