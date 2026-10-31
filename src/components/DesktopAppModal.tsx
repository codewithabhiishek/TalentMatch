import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Copy, Check, Terminal, ShieldCheck, Sparkles,
  Activity, CheckCircle2, AlertCircle, RefreshCw, Play,
  ArrowRight, ArrowLeft, Apple, Sliders, CheckCheck, List
} from 'lucide-react';
import { Logo } from './Logo';
import { DiagnosticBenchmarkModal } from './DiagnosticBenchmarkModal';
import { notificationAudio } from '../services/notificationAudioService';

interface DesktopAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OperatingSystem = 'windows' | 'mac' | 'linux';
type ViewMode = 'wizard' | 'all';

function WindowsIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M0 2.25L6.5 1.35V7.35H0V2.25ZM0 8.65H6.5V14.65L0 13.75V8.65ZM7.5 1.2L16 0V7.35H7.5V1.2ZM7.5 8.65H16V16L7.5 14.8V8.65Z" />
    </svg>
  );
}

interface TerminalCodeBlockProps {
  id: string;
  title?: string;
  badge?: string;
  shellLabel: string;
  command: string;
  displayLines?: string[];
  helperText?: string;
  copiedId: string | null;
  onCopy: (command: string, id: string) => void;
  accentColor?: 'sky' | 'emerald' | 'amber';
}

function TerminalCodeBlock({
  id,
  title,
  badge,
  shellLabel,
  command,
  displayLines,
  helperText,
  copiedId,
  onCopy,
  accentColor = 'sky',
}: TerminalCodeBlockProps) {
  const isCopied = copiedId === id;
  const lines = displayLines || [command];

  return (
    <div className="space-y-1.5 w-full">
      {title && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--color-text-primary)]">
            {title}
          </span>
          {badge && (
            <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Terminal Window Frame */}
      <div
        className={`rounded-xl border bg-[#080d19] overflow-hidden shadow-xs transition-all duration-200 ${
          isCopied
            ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
        }`}
      >
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#0c1424] border-b border-[var(--color-border)]/60 select-none">
          {/* Window Traffic Lights & Shell Name */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 opacity-80">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] flex items-center gap-1.5 pl-1">
              <Terminal size={11} className="text-sky-400" />
              <span>{shellLabel}</span>
            </span>
          </div>

          {/* Copy Command Button */}
          <button
            type="button"
            onClick={() => onCopy(command, id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isCopied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-[var(--color-surface)]/80 hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-info)] active:scale-97'
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

        {/* Terminal Code Body */}
        <div className="p-3 sm:p-3.5 font-mono text-xs leading-relaxed select-all overflow-x-auto">
          <div className="space-y-1">
            {lines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="text-slate-600 font-mono text-[11px] select-none w-4 text-right shrink-0 pt-0.5">
                  {lines.length > 1 ? idx + 1 : '$'}
                </span>
                <span
                  className={`font-mono text-xs whitespace-pre break-normal ${
                    accentColor === 'emerald'
                      ? 'text-emerald-300'
                      : accentColor === 'amber'
                      ? 'text-amber-300'
                      : 'text-sky-300'
                  }`}
                >
                  {line}
                </span>
              </div>
            ))}
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
  const [activeStep, setActiveStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('wizard');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [step1SubTab, setStep1SubTab] = useState<'quickstart' | 'standalone'>('quickstart');
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
    notificationAudio.playChime('success');
    setCopiedIndex(id);
    setCompletedSteps(prev => new Set(prev).add(activeStep));
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Test live connection to Ollama at http://localhost:11434
  const testOllamaConnection = async () => {
    setIsPinging(true);
    setPingResult({ status: 'idle', message: '' });
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('http://localhost:11434/api/tags', {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latency = Math.round(performance.now() - startTime);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const models = (data.models || []).map((m: any) => m.name || m.model);
      notificationAudio.playChime('success');
      setCompletedSteps(prev => new Set(prev).add(4));
      setPingResult({
        status: 'success',
        message: `Connected successfully to port 11434 (${latency}ms latency)!`,
        models,
      });
    } catch {
      setPingResult({
        status: 'error',
        message: 'Ollama is not responding at http://localhost:11434 yet. Ensure Step 3 (ollama run llama3.2:3b) is running in your terminal.',
      });
    } finally {
      setIsPinging(false);
    }
  };

  // Step definitions
  const steps = [
    { num: 1, title: 'Desktop App', desc: 'Download & Launch' },
    { num: 2, title: 'Install Ollama', desc: 'Engine CLI' },
    { num: 3, title: 'Run AI Model', desc: 'Meta Llama 3.2' },
    { num: 4, title: 'Link & Ping', desc: 'Port 11434' },
    { num: 5, title: 'Verify Accuracy', desc: 'Benchmark Suite' },
  ];

  // OS-specific command generators
  const getTalentMatchRunCommand = () => {
    if (os === 'windows') {
      return `git clone https://github.com/codewithabhiishek/TalentMatch.git ; cd TalentMatch ; npm install ; npm run electron`;
    }
    return `git clone https://github.com/codewithabhiishek/TalentMatch.git && cd TalentMatch && npm install && npm run electron`;
  };

  const getTalentMatchRunLines = () => [
    'git clone https://github.com/codewithabhiishek/TalentMatch.git',
    'cd TalentMatch',
    'npm install',
    'npm run electron',
  ];

  const getStandaloneBuildCommand = () => {
    if (os === 'windows') return `npm run build:win:portable`;
    if (os === 'mac') return `npm run build:mac`;
    return `npm run build`;
  };

  const getOllamaInstallCommand = () => {
    if (os === 'windows') return `winget install Ollama.Ollama`;
    if (os === 'mac') return `brew install ollama`;
    return `curl -fsSL https://ollama.com/install.sh | sh`;
  };

  const getCorsConnectCommand = () => {
    if (os === 'windows') return `$env:OLLAMA_ORIGINS="*" ; ollama serve`;
    return `OLLAMA_ORIGINS="*" ollama serve`;
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
          
          {/* Header with Title & Symmetrical Controls */}
          <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Logo size="md" withText={false} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                      Run TalentMatch &amp; Local AI on Desktop
                    </h3>
                    <span className="badge badge-info text-[9px] font-semibold uppercase">
                      5-Step Complete Pipeline
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    End-to-end guide: Install desktop app, pull Ollama via terminal, link port 11434, and test accuracy.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition-colors cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Symmetrical Controls: Operating System & View Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-[var(--color-border)]/70">
              
              {/* Operating System Segmented Pill (Zero Emojis, Pure SVGs) */}
              <div className="flex items-center justify-between px-2.5 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">OS:</span>
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setOs('windows')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      os === 'windows'
                        ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <WindowsIcon size={12} className={os === 'windows' ? 'text-sky-400' : 'text-slate-400'} />
                    <span>Windows</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOs('mac')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      os === 'mac'
                        ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <Apple size={12} className={os === 'mac' ? 'text-slate-200' : 'text-slate-400'} />
                    <span>macOS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOs('linux')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      os === 'linux'
                        ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <Terminal size={12} className={os === 'linux' ? 'text-emerald-400' : 'text-slate-400'} />
                    <span>Linux</span>
                  </button>
                </div>
              </div>

              {/* View Mode Toggle: Interactive Wizard vs Full Cheatsheet */}
              <div className="flex items-center justify-between px-2.5 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">View:</span>
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('wizard')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'wizard'
                        ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <Sliders size={12} className="text-sky-400" />
                    <span>Step Wizard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'all'
                        ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <List size={12} className="text-emerald-400" />
                    <span>Cheatsheet (All 5)</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Symmetrical 5-Step Stepper Bar (Active in Wizard Mode) */}
            {viewMode === 'wizard' && (
              <div className="grid grid-cols-5 gap-1.5 mt-3 pt-3 border-t border-[var(--color-border)]/70 select-none">
                {steps.map(s => {
                  const isActive = activeStep === s.num;
                  const isCompleted = completedSteps.has(s.num);
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setActiveStep(s.num)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs ring-1 ring-[var(--color-info)]/40'
                          : isCompleted
                          ? 'text-emerald-400 hover:bg-[var(--color-surface)]/60'
                          : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                            isActive
                              ? 'bg-[var(--color-info)] text-white'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
                          }`}
                        >
                          {isCompleted ? <Check size={10} className="stroke-[3]" /> : s.num}
                        </span>
                        <span className="text-xs font-semibold hidden md:inline truncate">{s.title}</span>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 truncate hidden sm:inline">
                        {s.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            
            {/* VIEW MODE A: FOCUSED STEP-BY-STEP WIZARD */}
            {viewMode === 'wizard' && (
              <div key={`${os}-${activeStep}`} className="animate-fade-in space-y-4 min-h-[360px]">
                
                {/* STEP 1: Download & Launch TalentMatch */}
                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-xs font-bold flex items-center justify-center">
                            1
                          </span>
                          <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                            Download &amp; Launch TalentMatch Desktop
                          </h4>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                          Run TalentMatch natively on your machine for permanent folder permissions and background resume ingestion.
                        </p>
                      </div>

                      {/* Sub-tab quickstart vs standalone */}
                      <div className="inline-flex p-0.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] shrink-0">
                        <button
                          type="button"
                          onClick={() => setStep1SubTab('quickstart')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                            step1SubTab === 'quickstart'
                              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-2xs'
                              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          Quickstart
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep1SubTab('standalone')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                            step1SubTab === 'standalone'
                              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-2xs'
                              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          Portable Binary
                        </button>
                      </div>
                    </div>

                    {step1SubTab === 'quickstart' ? (
                      <TerminalCodeBlock
                        id="talentmatch-run"
                        shellLabel={os === 'windows' ? 'PowerShell 7+ / CMD' : os === 'mac' ? 'zsh / Terminal' : 'bash / zsh'}
                        command={getTalentMatchRunCommand()}
                        displayLines={getTalentMatchRunLines()}
                        helperText="Clones repository, installs dependencies, and launches native Electron desktop app with automatic folder sync."
                        copiedId={copiedIndex}
                        onCopy={copyToClipboard}
                        accentColor="sky"
                      />
                    ) : (
                      <TerminalCodeBlock
                        id="standalone-build"
                        shellLabel={os === 'windows' ? 'PowerShell' : 'Terminal'}
                        command={getStandaloneBuildCommand()}
                        displayLines={[getStandaloneBuildCommand()]}
                        helperText={`Packages a standalone executable in the release/ folder (${os === 'windows' ? 'Portable .exe' : os === 'mac' ? '.dmg Installer' : 'Linux build'}). No terminal required after packaging.`}
                        copiedId={copiedIndex}
                        onCopy={copyToClipboard}
                        accentColor="emerald"
                      />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)]">
                        <span className="font-semibold text-[11px] text-[var(--color-text-primary)] block">
                          ✓ Full File-System Access
                        </span>
                        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                          Directly links to local candidate folders like <code className="font-mono text-sky-300">C:\Recruiting\Resumes\</code> without browser upload prompts.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)]">
                        <span className="font-semibold text-[11px] text-[var(--color-text-primary)] block">
                          ✓ Background Folder Watcher
                        </span>
                        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                          Monitors your resume folder continuously and notifies you with audio chimes when new candidates are added.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Install Ollama */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-xs font-bold flex items-center justify-center">
                          2
                        </span>
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                          Install Ollama via Terminal
                        </h4>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Ollama is an open-source engine that runs LLMs natively on your hardware with 100% privacy and zero subscription fees.
                      </p>
                    </div>

                    <TerminalCodeBlock
                      id="ollama-install"
                      shellLabel={os === 'windows' ? 'PowerShell / Command Prompt' : 'Terminal'}
                      command={getOllamaInstallCommand()}
                      displayLines={[getOllamaInstallCommand()]}
                      helperText={
                        os === 'windows'
                          ? 'Uses the official built-in Windows Package Manager (winget). Fast and requires zero browser navigation.'
                          : 'Installs the native Ollama CLI service on your operating system.'
                      }
                      copiedId={copiedIndex}
                      onCopy={copyToClipboard}
                      accentColor="sky"
                    />

                    <div className="p-3 rounded-xl bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border)] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-[var(--color-text-primary)] block">Prefer a graphical setup wizard?</span>
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">Download the direct GUI installer for {os === 'windows' ? 'Windows' : os === 'mac' ? 'macOS' : 'Linux'}.</span>
                      </div>
                      <a
                        href="https://ollama.com/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm text-xs font-medium shrink-0 cursor-pointer"
                      >
                        ollama.com/download ↗
                      </a>
                    </div>
                  </div>
                )}

                {/* STEP 3: Run AI Model */}
                {activeStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-xs font-bold flex items-center justify-center">
                          3
                        </span>
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                          Download &amp; Run Meta Llama 3.2 3B
                        </h4>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Download Meta&apos;s optimized Llama 3.2 3B model. It delivers high clinical extraction accuracy and sub-second execution.
                      </p>
                    </div>

                    <TerminalCodeBlock
                      id="ollama-run-model"
                      shellLabel="Ollama CLI"
                      command="ollama run llama3.2:3b"
                      displayLines={['ollama run llama3.2:3b']}
                      helperText="Pulls the model weights (~2.0 GB) and begins serving locally on your machine. Runs completely offline."
                      copiedId={copiedIndex}
                      onCopy={copyToClipboard}
                      accentColor="emerald"
                    />

                    {/* Model Specification Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
                      <div className="p-2.5 rounded-xl bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] block">Parameters</span>
                        <span className="text-xs font-bold text-[var(--color-text-primary)] mt-0.5 block">3.2 Billion</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] block">Memory</span>
                        <span className="text-xs font-bold text-sky-400 mt-0.5 block">4 GB RAM</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] block">Inference Speed</span>
                        <span className="text-xs font-bold text-emerald-400 mt-0.5 block">&lt; 15 ms/token</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] block">Token Cost</span>
                        <span className="text-xs font-bold text-amber-400 mt-0.5 block">$0.00 (Unlimited)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Link & Ping */}
                {activeStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-xs font-bold flex items-center justify-center">
                          4
                        </span>
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                          Connect TalentMatch &amp; Test Live AI Link
                        </h4>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        TalentMatch talks directly to Ollama at <code className="font-mono text-sky-300">http://localhost:11434</code>. Test your local connection with 1 click.
                      </p>
                    </div>

                    <TerminalCodeBlock
                      id="ollama-cors"
                      title="Start Ollama with Browser Permissions (if running web browser)"
                      shellLabel={os === 'windows' ? 'PowerShell' : 'Terminal'}
                      command={getCorsConnectCommand()}
                      displayLines={[getCorsConnectCommand()]}
                      helperText="Enables cross-origin headers if testing in Chrome/Edge rather than native desktop."
                      copiedId={copiedIndex}
                      onCopy={copyToClipboard}
                      accentColor="sky"
                    />

                    {/* Interactive Live Connection Ping Button */}
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <span className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-1.5">
                          <Activity size={13} className="text-sky-400" />
                          <span>Live Ollama Port 11434 Diagnostic</span>
                        </span>
                        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                          Pings <code className="font-mono text-sky-400">http://localhost:11434/api/tags</code> directly from this interface.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={testOllamaConnection}
                        disabled={isPinging}
                        className="btn btn-primary btn-sm text-xs px-4 h-8 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      >
                        <RefreshCw size={12} className={isPinging ? 'animate-spin' : ''} />
                        <span>{isPinging ? 'Pinging...' : 'Test Connection'}</span>
                      </button>
                    </div>

                    {/* Ping Feedback Banners */}
                    {pingResult.status === 'success' && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5 animate-fade-in">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                        <div>
                          <strong className="block text-emerald-300 font-semibold">{pingResult.message}</strong>
                          {pingResult.models && pingResult.models.length > 0 && (
                            <p className="text-[11px] text-emerald-300/80 mt-0.5">
                              Available models: <code className="font-mono font-bold text-white">{pingResult.models.join(', ')}</code>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {pingResult.status === 'error' && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2.5 animate-fade-in">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                        <p className="text-[11px] leading-relaxed text-amber-300">
                          {pingResult.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 5: Verify Accuracy & Benchmark */}
                {activeStep === 5 && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-xs font-bold flex items-center justify-center">
                          5
                        </span>
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                          Verify Extraction Accuracy &amp; Benchmark
                        </h4>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Run our automated diagnostic suite across 5 real clinical scenarios (ICU, Trauma ER, Ortho, Neonatal, and Strix security).
                      </p>
                    </div>

                    <TerminalCodeBlock
                      id="run-benchmark"
                      shellLabel="Node / tsx"
                      command="npm run benchmark"
                      displayLines={['npm run benchmark']}
                      helperText="Runs automated field-by-field verification: candidate name, contact, specialty, licensing, and credentials."
                      copiedId={copiedIndex}
                      onCopy={copyToClipboard}
                      accentColor="amber"
                    />

                    {/* 1-Click Interactive Benchmark Launcher Button */}
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="font-semibold text-xs text-[var(--color-text-primary)] block">
                          Interactive In-App Diagnostic Suite
                        </span>
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">
                          Execute all 5 clinical tests right here in your browser with live speed and accuracy graphs.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCompletedSteps(prev => new Set(prev).add(5));
                          setBenchmarkModalOpen(true);
                        }}
                        className="btn btn-secondary h-8 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border-[var(--color-border)] hover:border-[var(--color-info)]"
                      >
                        <Sparkles size={13} className="text-amber-400" />
                        <span>Launch In-App Benchmark</span>
                        <Play size={11} className="text-sky-400 ml-0.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* VIEW MODE B: CHEATSHEET (ALL 5 STEPS STACKED SYMMETRICALLY) */}
            {viewMode === 'all' && (
              <div key={os} className="animate-fade-in space-y-5">
                
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] space-y-3">
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
                    id="talentmatch-run-all"
                    shellLabel={os === 'windows' ? 'PowerShell 7+ / CMD' : 'zsh / Terminal'}
                    command={getTalentMatchRunCommand()}
                    displayLines={getTalentMatchRunLines()}
                    helperText="Clones repository, installs dependencies, and launches native Electron desktop app with automatic folder sync."
                    copiedId={copiedIndex}
                    onCopy={copyToClipboard}
                    accentColor="sky"
                  />
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-[11px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <span>Install Ollama via Terminal</span>
                    </span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                      {os === 'windows' ? 'winget' : os === 'mac' ? 'brew' : 'curl'}
                    </span>
                  </div>
                  <TerminalCodeBlock
                    id="ollama-install-all"
                    shellLabel={os === 'windows' ? 'PowerShell / CMD' : 'Terminal'}
                    command={getOllamaInstallCommand()}
                    displayLines={[getOllamaInstallCommand()]}
                    helperText="Installs native Ollama service on your machine."
                    copiedId={copiedIndex}
                    onCopy={copyToClipboard}
                    accentColor="sky"
                  />
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-[11px] font-bold flex items-center justify-center">
                        3
                      </span>
                      <span>Download &amp; Run Meta Llama 3.2 3B</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                      100% Free &amp; Offline
                    </span>
                  </div>
                  <TerminalCodeBlock
                    id="ollama-run-all"
                    shellLabel="Ollama CLI"
                    command="ollama run llama3.2:3b"
                    displayLines={['ollama run llama3.2:3b']}
                    helperText="Pulls Meta Llama 3.2 3B model weights (~2.0 GB) and starts serving locally."
                    copiedId={copiedIndex}
                    onCopy={copyToClipboard}
                    accentColor="emerald"
                  />
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] space-y-3">
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
                  <TerminalCodeBlock
                    id="ollama-cors-all"
                    shellLabel={os === 'windows' ? 'PowerShell' : 'Terminal'}
                    command={getCorsConnectCommand()}
                    displayLines={[getCorsConnectCommand()]}
                    helperText="Enables cross-origin headers when running in a web browser."
                    copiedId={copiedIndex}
                    onCopy={copyToClipboard}
                    accentColor="sky"
                  />
                </div>

                {/* Step 5 */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[var(--color-info)] text-white font-mono text-[11px] font-bold flex items-center justify-center">
                        5
                      </span>
                      <span>Verify Extraction Accuracy &amp; Benchmark</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold font-mono">
                      Validation Suite
                    </span>
                  </div>
                  <TerminalCodeBlock
                    id="run-benchmark-all"
                    shellLabel="Node / tsx"
                    command="npm run benchmark"
                    displayLines={['npm run benchmark']}
                    helperText="Tests candidate name parsing, clinical position, certifications, and Strix defensive security."
                    copiedId={copiedIndex}
                    onCopy={copyToClipboard}
                    accentColor="amber"
                  />
                </div>

              </div>
            )}

            {/* Why Run Desktop Highlights Banner */}
            <div className="p-3.5 rounded-xl bg-[var(--color-surface-secondary)]/40 border border-[var(--color-border)]">
              <span className="font-semibold text-xs text-[var(--color-text-primary)] flex items-center gap-1.5 mb-1.5">
                <ShieldCheck size={13} className="text-[var(--color-success)]" />
                <span>Why Run Locally on Desktop?</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[var(--color-text-secondary)]">
                <div>• <strong>Persistent Directory Watching:</strong> Remembers resume folders across machine reboots.</div>
                <div>• <strong>Real-Time System Alerts:</strong> Windows Action Center &amp; macOS Notification banners with audio chimes.</div>
                <div>• <strong>100% Air-Gapped Confidentiality:</strong> No candidate data or credentials ever leave your computer.</div>
                <div>• <strong>Zero API Tokens:</strong> Meta Llama 3.2 3B runs unlimited inference locally with zero cost.</div>
              </div>
            </div>

          </div>

          {/* Symmetrical Footer with Clear Step Navigation & Zero Cat Buttons */}
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/30 flex items-center justify-between gap-3">
            
            {/* Left: Previous Step Button (Wizard mode) or Status (Cheatsheet) */}
            <div>
              {viewMode === 'wizard' ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                  disabled={activeStep === 1}
                  className="btn btn-secondary h-8 px-3 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={13} />
                  <span>Previous</span>
                </button>
              ) : (
                <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                  All 5 steps displayed for {os.toUpperCase()}
                </span>
              )}
            </div>

            {/* Center: Step Progress Dots (Wizard mode) */}
            {viewMode === 'wizard' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(stepNum => (
                    <button
                      key={stepNum}
                      type="button"
                      onClick={() => setActiveStep(stepNum)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeStep === stepNum
                          ? 'w-6 bg-[var(--color-info)]'
                          : completedSteps.has(stepNum)
                          ? 'w-2 bg-emerald-500/60 hover:bg-emerald-400'
                          : 'w-2 bg-[var(--color-border)] hover:bg-[var(--color-text-tertiary)]'
                      }`}
                      title={`Go to step ${stepNum}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] pl-1">
                  Step {activeStep} of 5
                </span>
              </div>
            )}

            {/* Right: Next Step or Diagnostic Launcher & Close Button */}
            <div className="flex items-center gap-2">
              {viewMode === 'wizard' && activeStep < 5 && (
                <button
                  type="button"
                  onClick={() => {
                    setCompletedSteps(prev => new Set(prev).add(activeStep));
                    setActiveStep(prev => Math.min(5, prev + 1));
                  }}
                  className="btn btn-primary h-8 px-3.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-97"
                >
                  <span>Next Step</span>
                  <ArrowRight size={13} />
                </button>
              )}

              {viewMode === 'wizard' && activeStep === 5 && (
                <button
                  type="button"
                  onClick={() => {
                    setCompletedSteps(prev => new Set(prev).add(5));
                    setBenchmarkModalOpen(true);
                  }}
                  className="btn btn-primary h-8 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-97"
                >
                  <Sparkles size={13} />
                  <span>Run Benchmark</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary h-8 px-3.5 text-xs font-semibold cursor-pointer"
              >
                Close Guide
              </button>
            </div>

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
