import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Copy, Check, Terminal, ExternalLink, ShieldCheck, Sparkles,
  Cpu, Activity, CheckCircle2, AlertCircle, RefreshCw, Play
} from 'lucide-react';
import { Logo } from './Logo';
import { DiagnosticBenchmarkModal } from './DiagnosticBenchmarkModal';

interface DesktopAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OperatingSystem = 'windows' | 'mac' | 'linux';

interface TerminalCodeBlockProps {
  id: string;
  stepNumber?: number;
  title: string;
  badge?: string;
  shellLabel: string;
  command: string;
  helperText?: string;
  copiedId: string | null;
  onCopy: (command: string, id: string) => void;
  accentColor?: 'sky' | 'emerald' | 'amber';
}

function TerminalCodeBlock({
  id,
  stepNumber,
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
        <span className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
          {stepNumber && (
            <span className="w-5 h-5 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-info)] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
              {stepNumber}
            </span>
          )}
          <span>{title}</span>
        </span>
        {badge && (
          <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
            {badge}
          </span>
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
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0c1424] border-b border-[var(--color-border)]/60 text-xs select-none">
          {/* Left: Window Dots + Shell Name */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 opacity-75">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] flex items-center gap-1 pl-1">
              <Terminal size={11} className="text-sky-400" />
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
                accentColor === 'emerald'
                  ? 'text-emerald-300'
                  : accentColor === 'amber'
                  ? 'text-amber-300'
                  : 'text-sky-300'
              }`}
            >
              {command}
            </pre>
          </div>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-[var(--color-text-tertiary)] leading-normal pl-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
}

export function DesktopAppModal({ isOpen, onClose }: DesktopAppModalProps) {
  const [os, setOs] = useState<OperatingSystem>('windows');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false);

  // Live Ollama connection tester state
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    models?: string[];
  }>({ status: 'idle', message: '' });

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

  // Test live connection to Ollama at http://localhost:11434
  const testOllamaConnection = async () => {
    setIsPinging(true);
    setPingResult({ status: 'idle', message: '' });
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('http://localhost:11434/api/tags', {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const models = (data.models || []).map((m: any) => m.name || m.model);
      setPingResult({
        status: 'success',
        message: `Connected successfully to port 11434! Found ${models.length} model(s).`,
        models,
      });
    } catch {
      setPingResult({
        status: 'error',
        message: 'Ollama is not responding at http://localhost:11434 yet. Make sure Step 3 is running in your terminal.',
      });
    } finally {
      setIsPinging(false);
    }
  };

  // OS-specific command generators
  const getTalentMatchRunCommand = () => {
    if (os === 'windows') {
      return `git clone https://github.com/codewithabhiishek/TalentMatch.git ; cd TalentMatch ; npm install ; npm run electron`;
    }
    return `git clone https://github.com/codewithabhiishek/TalentMatch.git && cd TalentMatch && npm install && npm run electron`;
  };

  const getStandaloneBuildCommand = () => {
    if (os === 'windows') {
      return `npm run build:win:portable`;
    }
    if (os === 'mac') {
      return `npm run build:mac`;
    }
    return `npm run build`;
  };

  const getOllamaInstallCommand = () => {
    if (os === 'windows') {
      return `winget install Ollama.Ollama`;
    }
    if (os === 'mac') {
      return `brew install ollama`;
    }
    return `curl -fsSL https://ollama.com/install.sh | sh`;
  };

  const getCorsConnectCommand = () => {
    if (os === 'windows') {
      return `$env:OLLAMA_ORIGINS="*" ; ollama serve`;
    }
    return `OLLAMA_ORIGINS="*" ollama serve`;
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--color-border)] flex items-start justify-between gap-4 bg-[var(--color-surface-secondary)]/50">
            <div className="flex items-center gap-3">
              <Logo size="md" withText={false} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Run TalentMatch &amp; Local AI on Desktop
                  </h3>
                  <span className="badge badge-info text-[9px] font-semibold uppercase">Complete Guide</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  5 simple steps to install the desktop app, download Ollama by terminal, connect them, and verify accuracy.
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
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            
            {/* OS Switcher Tabs with Animated Indicators */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[var(--color-border)]">
              <div>
                <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                  Select Your Operating System:
                </span>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                  Commands automatically adapt to your terminal environment.
                </p>
              </div>

              <div className="inline-flex items-center p-1 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl gap-1 shrink-0">
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

            {/* Dynamic Step-by-Step Execution Sequence */}
            <div key={os} className="animate-tab-switch space-y-6">

              {/* Step 1: Download & Run TalentMatch on Local Machine */}
              <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-surface-secondary)]/30 border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>Download &amp; Launch TalentMatch Desktop</span>
                  </span>
                  <span className="text-[10px] text-[var(--color-info)] font-semibold font-mono">
                    Full Local Access
                  </span>
                </div>

                <TerminalCodeBlock
                  id="talentmatch-run"
                  title="1-Step Terminal Quickstart (Recommended)"
                  shellLabel={os === 'windows' ? 'PowerShell 7+ / Command Prompt' : os === 'mac' ? 'zsh / Terminal' : 'bash / zsh'}
                  command={getTalentMatchRunCommand()}
                  helperText="Clones repository, installs dependencies, and launches native Electron desktop app with automatic folder sync."
                  copiedId={copiedIndex}
                  onCopy={copyToClipboard}
                  accentColor="sky"
                />

                <TerminalCodeBlock
                  id="standalone-build"
                  title={`Or Package Standalone Executable (${os === 'windows' ? 'Portable .exe' : os === 'mac' ? '.dmg Installer' : 'Linux Build'})`}
                  shellLabel={os === 'windows' ? 'PowerShell' : 'Terminal'}
                  command={getStandaloneBuildCommand()}
                  helperText="Builds an independent binary in the release/ folder. Requires zero terminal after packaging."
                  copiedId={copiedIndex}
                  onCopy={copyToClipboard}
                  accentColor="emerald"
                />
              </div>

              {/* Step 2: Install Ollama by Terminal */}
              <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-surface-secondary)]/30 border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <span>Install Ollama via Terminal</span>
                  </span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                    {os === 'windows' ? 'Windows Package Manager (winget)' : os === 'mac' ? 'Homebrew / curl' : 'curl script'}
                  </span>
                </div>

                <TerminalCodeBlock
                  id="ollama-install"
                  title={`Install Ollama Engine (${os === 'windows' ? 'Official Microsoft Winget' : os === 'mac' ? 'Brew / Shell' : 'Linux Shell'})`}
                  shellLabel={os === 'windows' ? 'PowerShell / CMD' : 'Terminal'}
                  command={getOllamaInstallCommand()}
                  helperText={
                    os === 'windows'
                      ? 'Uses the official built-in Windows Package Manager (winget). Or download the installer directly from ollama.com/download.'
                      : 'Installs the native Ollama CLI service on your system.'
                  }
                  copiedId={copiedIndex}
                  onCopy={copyToClipboard}
                  accentColor="sky"
                />
              </div>

              {/* Step 3: Download & Start the Free Local LLM */}
              <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-surface-secondary)]/30 border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <span>Download &amp; Run the Recommended AI Model</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                    100% Free &amp; Private
                  </span>
                </div>

                <TerminalCodeBlock
                  id="ollama-run-model"
                  title="Run Meta Llama 3.2 3B (Fastest & Most Accurate for Healthcare Resumes)"
                  shellLabel="Ollama CLI"
                  command="ollama run llama3.2:3b"
                  helperText="Downloads Meta's Llama 3.2 3B model (~2.0 GB). Runs completely offline on CPU or GPU with zero cloud token charges."
                  copiedId={copiedIndex}
                  onCopy={copyToClipboard}
                  accentColor="emerald"
                />
              </div>

              {/* Step 4: Connect Them Together & Verify Connection */}
              <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-surface-secondary)]/30 border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-[11px] font-bold flex items-center justify-center">
                      4
                    </span>
                    <span>Connect TalentMatch &amp; Test Live AI Link</span>
                  </span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                    Port 11434
                  </span>
                </div>

                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  TalentMatch automatically talks to <code className="px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] font-mono text-sky-300">http://localhost:11434</code>. If you are accessing via a web browser rather than the desktop app, allow local CORS by starting Ollama with origins enabled:
                </p>

                <TerminalCodeBlock
                  id="ollama-cors"
                  title="Start Ollama with Local Browser Permissions (if needed)"
                  shellLabel={os === 'windows' ? 'PowerShell' : 'Terminal'}
                  command={getCorsConnectCommand()}
                  helperText="Enables cross-origin requests so your browser can query your local LLM seamlessly."
                  copiedId={copiedIndex}
                  onCopy={copyToClipboard}
                  accentColor="sky"
                />

                {/* Interactive Live Connection Ping Button */}
                <div className="pt-1.5">
                  <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <span className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-1.5">
                        <Activity size={13} className="text-sky-400" />
                        <span>Live Connection Diagnostic</span>
                      </span>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                        Pings <code className="font-mono text-sky-400">http://localhost:11434/api/tags</code> directly to test your setup.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={testOllamaConnection}
                      disabled={isPinging}
                      className="btn btn-primary btn-sm text-xs px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                    >
                      <RefreshCw size={12} className={isPinging ? 'animate-spin' : ''} />
                      <span>{isPinging ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                  </div>

                  {/* Ping Result Feedback Card */}
                  {pingResult.status === 'success' && (
                    <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2 animate-fade-in">
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-400" />
                      <div>
                        <strong className="block text-emerald-300 font-semibold">{pingResult.message}</strong>
                        {pingResult.models && pingResult.models.length > 0 && (
                          <p className="text-[11px] text-emerald-300/80 mt-0.5">
                            Active models: <code className="font-mono font-bold text-white">{pingResult.models.join(', ')}</code>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {pingResult.status === 'error' && (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2 animate-fade-in">
                      <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                      <p className="text-[11px] leading-relaxed text-amber-300">
                        {pingResult.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 5: Test Accuracy & Run Diagnostics */}
              <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-surface-secondary)]/30 border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-[11px] font-bold flex items-center justify-center">
                      5
                    </span>
                    <span>Test Accuracy &amp; Run Benchmark</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold font-mono">
                    Validation Suite
                  </span>
                </div>

                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  Verify extraction precision, license parsing, and sub-second latency across 5 standard clinical scenarios:
                </p>

                <TerminalCodeBlock
                  id="run-benchmark"
                  title="Run Full Automated Benchmark in Terminal"
                  shellLabel="Node / tsx"
                  command="npm run benchmark"
                  helperText="Tests candidate name parsing, clinical position, certifications (BLS/ACLS/CCRN), and Strix defensive security."
                  copiedId={copiedIndex}
                  onCopy={copyToClipboard}
                  accentColor="amber"
                />

                {/* Direct In-App Benchmark Runner Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setBenchmarkModalOpen(true)}
                    className="btn btn-secondary w-full py-2.5 h-auto text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs border-[var(--color-border)] hover:border-[var(--color-info)] hover:bg-[var(--color-surface)]"
                  >
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Launch In-App Diagnostic Benchmark Suite</span>
                    <Play size={12} className="text-sky-400 ml-1" />
                  </button>
                </div>
              </div>

            </div>

            {/* Why Run Desktop Highlights */}
            <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] space-y-2">
              <span className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[var(--color-success)]" />
                Why Run Locally on Desktop?
              </span>
              <ul className="space-y-1.5 text-[11px] text-[var(--color-text-secondary)] list-disc pl-4 leading-relaxed">
                <li><strong>Continuous Local Folder Sync:</strong> Direct operating-system directory watching without repeated browser authorization dialogs.</li>
                <li><strong>Permanent Folder Permission:</strong> Remembers your resume directory across machine reboots and app restarts.</li>
                <li><strong>100% Air-Gapped Confidentiality:</strong> Resumes and clinical credentials are processed completely on your device with local Ollama inference.</li>
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
              Close Guide
            </button>
          </div>

        </div>
      </div>

      {/* In-App Diagnostic Benchmark Suite Modal */}
      <DiagnosticBenchmarkModal
        isOpen={benchmarkModalOpen}
        onClose={() => setBenchmarkModalOpen(false)}
      />
    </>,
    document.body
  );
}
