import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Copy, Check, Terminal, ShieldCheck, Sparkles,
  Activity, CheckCircle2, AlertCircle, RefreshCw, Play,
  ArrowRight, ArrowLeft, Apple, List, Sliders, CheckCheck,
  CheckCircle, Zap, Lock, Cpu
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

function WindowsIcon({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M0 2.25L6.5 1.35V7.35H0V2.25ZM0 8.65H6.5V14.65L0 13.75V8.65ZM7.5 1.2L16 0V7.35H7.5V1.2ZM7.5 8.65H16V16L7.5 14.8V8.65Z" />
    </svg>
  );
}

interface TerminalCodeBlockProps {
  id: string;
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
    <div className="space-y-2 w-full">
      {/* Sleek Terminal Window */}
      <div
        className={`rounded-xl border bg-[#060a12] overflow-hidden transition-all duration-200 shadow-md ${
          isCopied
            ? 'border-emerald-500/70 ring-1 ring-emerald-500/30'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#0a101d] border-b border-white/8 select-none">
          {/* Traffic dots and shell name */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 opacity-90">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 pl-1.5 font-medium">
              <Terminal size={12} className="text-sky-400" />
              <span>{shellLabel}</span>
            </span>
          </div>

          {/* Copy Command Button */}
          <button
            type="button"
            onClick={() => onCopy(command, id)}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isCopied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/25 active:scale-97'
            }`}
            title="Copy command to clipboard"
          >
            {isCopied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} className="text-slate-400" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>

        {/* Terminal Code Body */}
        <div className="p-3.5 sm:p-4 font-mono text-xs leading-relaxed select-all overflow-x-auto bg-[#070b14]">
          <div className="space-y-1.5">
            {lines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-slate-500 font-mono text-xs select-none w-4 text-right shrink-0">
                  {lines.length > 1 ? idx + 1 : '$'}
                </span>
                <span
                  className={`font-mono text-xs whitespace-pre break-normal ${
                    accentColor === 'emerald'
                      ? 'text-emerald-300 font-medium'
                      : accentColor === 'amber'
                      ? 'text-amber-300 font-medium'
                      : 'text-sky-200 font-medium'
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
        <p className="text-[11px] text-slate-400 leading-normal pl-0.5">
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
    { num: 1, title: 'Desktop App', subtitle: 'Launch App' },
    { num: 2, title: 'Install Ollama', subtitle: 'CLI Engine' },
    { num: 3, title: 'Run Llama 3.2', subtitle: 'Offline AI' },
    { num: 4, title: 'Link Port 11434', subtitle: 'CORS Test' },
    { num: 5, title: 'Verify Accuracy', subtitle: 'Benchmark' },
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#0b121e] border border-white/12 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
          
          {/* Top Header: Brand, Title, Symmetrical OS Selector & Close */}
          <div className="px-5 py-4 border-b border-white/10 bg-[#0f1728]/80 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              
              {/* Left: Brand Mark & Title */}
              <div className="flex items-center gap-3 min-w-0">
                <Logo size="md" withText={false} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Run TalentMatch on Desktop
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      Step {activeStep} of 5
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    End-to-end setup: Desktop app, local Ollama engine, and verified offline AI inference.
                  </p>
                </div>
              </div>

              {/* Right: Symmetrical OS Segmented Selector + Close Button */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="inline-flex items-center p-0.5 bg-slate-900 border border-white/12 rounded-lg gap-0.5">
                  <button
                    type="button"
                    onClick={() => setOs('windows')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      os === 'windows'
                        ? 'bg-slate-800 text-white shadow-xs border border-white/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <WindowsIcon size={12} className={os === 'windows' ? 'text-sky-400' : 'text-slate-400'} />
                    <span className="hidden sm:inline">Windows</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOs('mac')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      os === 'mac'
                        ? 'bg-slate-800 text-white shadow-xs border border-white/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Apple size={12} className={os === 'mac' ? 'text-slate-100' : 'text-slate-400'} />
                    <span className="hidden sm:inline">macOS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOs('linux')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      os === 'linux'
                        ? 'bg-slate-800 text-white shadow-xs border border-white/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Terminal size={12} className={os === 'linux' ? 'text-emerald-400' : 'text-slate-400'} />
                    <span className="hidden sm:inline">Linux</span>
                  </button>
                </div>

                {/* View Mode Toggle Button */}
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'wizard' ? 'all' : 'wizard')}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    viewMode === 'all'
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  title={viewMode === 'wizard' ? 'Switch to All Steps Cheatsheet' : 'Switch to Step-by-Step Wizard'}
                >
                  {viewMode === 'wizard' ? <List size={14} /> : <Sliders size={14} />}
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>

            </div>

            {/* Clean Connected Milestone Stepper (Wizard Mode) */}
            {viewMode === 'wizard' && (
              <div className="grid grid-cols-5 gap-1.5 mt-3.5 pt-3 border-t border-white/8 select-none">
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
                          ? 'bg-slate-800/90 text-white shadow-xs border border-sky-500/40 ring-1 ring-sky-500/20'
                          : isCompleted
                          ? 'text-emerald-400 hover:bg-white/5 border border-transparent'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                            isActive
                              ? 'bg-sky-500 text-slate-950 font-black'
                              : isCompleted
                              ? 'bg-emerald-500/25 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <Check size={10} className="stroke-[3]" /> : s.num}
                        </span>
                        <span className="text-xs font-semibold hidden md:inline truncate">{s.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 truncate hidden sm:inline">
                        {s.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Main Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            
            {/* VIEW MODE A: FOCUSED STEP-BY-STEP WIZARD */}
            {viewMode === 'wizard' && (
              <div key={`${os}-${activeStep}`} className="animate-fade-in space-y-4 min-h-[350px]">
                
                {/* STEP 1: Download & Launch TalentMatch */}
                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-mono text-xs font-black flex items-center justify-center">
                            1
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            Download &amp; Launch TalentMatch Desktop
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Run locally on your machine for persistent resume folder monitoring and zero browser dialogs.
                        </p>
                      </div>

                      {/* Sub-tab quickstart vs standalone */}
                      <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-white/10 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setStep1SubTab('quickstart')}
                          className={`px-3 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                            step1SubTab === 'quickstart'
                              ? 'bg-slate-800 text-white shadow-xs border border-white/10'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          1-Step Terminal
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep1SubTab('standalone')}
                          className={`px-3 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                            step1SubTab === 'standalone'
                              ? 'bg-slate-800 text-white shadow-xs border border-white/10'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Build Standalone (.exe)
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
                        helperText={`Packages an independent executable in the release/ folder (${os === 'windows' ? 'Portable .exe' : os === 'mac' ? '.dmg Installer' : 'Linux build'}). No terminal required after packaging.`}
                        copiedId={copiedIndex}
                        onCopy={copyToClipboard}
                        accentColor="emerald"
                      />
                    )}

                    {/* Symmetrical 3-Pill Feature Bar (Replaces Cluttered Box Soup) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-white/8 flex items-start gap-2.5">
                        <Zap size={14} className="text-sky-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs font-semibold text-white block">Continuous Folder Sync</strong>
                          <span className="text-[10px] text-slate-400 leading-relaxed block mt-0.5">
                            Direct file-system access with background auto-ingestion of new resumes.
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-white/8 flex items-start gap-2.5">
                        <Lock size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs font-semibold text-white block">100% Air-Gapped Privacy</strong>
                          <span className="text-[10px] text-slate-400 leading-relaxed block mt-0.5">
                            Zero cloud token leaks. Candidate data stays completely on this device.
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-white/8 flex items-start gap-2.5">
                        <Cpu size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs font-semibold text-white block">Unlimited Offline AI</strong>
                          <span className="text-[10px] text-slate-400 leading-relaxed block mt-0.5">
                            Meta Llama 3.2 runs locally with sub-second execution and $0 fees.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Install Ollama */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-mono text-xs font-black flex items-center justify-center">
                            2
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            Install Ollama via Terminal
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Ollama is an open-source engine that runs local LLMs on your CPU or GPU without sending data to external APIs.
                        </p>
                      </div>

                      <a
                        href="https://ollama.com/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg text-xs font-medium text-sky-300 bg-sky-500/10 border border-sky-500/25 hover:bg-sky-500/20 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                      >
                        ollama.com/download ↗
                      </a>
                    </div>

                    <TerminalCodeBlock
                      id="ollama-install"
                      shellLabel={os === 'windows' ? 'PowerShell / Command Prompt' : 'Terminal'}
                      command={getOllamaInstallCommand()}
                      displayLines={[getOllamaInstallCommand()]}
                      helperText={
                        os === 'windows'
                          ? 'Uses the official Microsoft Windows Package Manager (winget). Installs the background Ollama service cleanly.'
                          : 'Installs the native Ollama CLI service on your operating system.'
                      }
                      copiedId={copiedIndex}
                      onCopy={copyToClipboard}
                      accentColor="sky"
                    />

                    {/* Symmetrical Feature Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-white/8">
                        <span className="text-xs font-semibold text-white block">Native Background Service</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Runs silently in system tray and boots on demand.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-white/8">
                        <span className="text-xs font-semibold text-white block">Hardware Accelerated</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Utilizes GPU/NPU automatically for &gt;60 tokens/sec speed.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-white/8">
                        <span className="text-xs font-semibold text-white block">Standard REST API</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Exposes standard endpoints at http://localhost:11434.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Run AI Model */}
                {activeStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-mono text-xs font-black flex items-center justify-center">
                          3
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Download &amp; Run Meta Llama 3.2 3B
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Meta&apos;s state-of-the-art 3B model is engineered for rapid reasoning, clinical credential parsing, and candidate scoring.
                      </p>
                    </div>

                    <TerminalCodeBlock
                      id="ollama-run-model"
                      shellLabel="Ollama CLI"
                      command="ollama run llama3.2:3b"
                      displayLines={['ollama run llama3.2:3b']}
                      helperText="Downloads the model weights (~2.0 GB) and begins serving on your machine. Future launches are instant."
                      copiedId={copiedIndex}
                      onCopy={copyToClipboard}
                      accentColor="emerald"
                    />

                    {/* Symmetrical Model Specification Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-white/8">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Parameters</span>
                        <span className="text-xs font-bold text-white mt-1 block">3.2 Billion</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-white/8">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">RAM Needed</span>
                        <span className="text-xs font-bold text-sky-400 mt-1 block">4 GB RAM</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-white/8">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Latency</span>
                        <span className="text-xs font-bold text-emerald-400 mt-1 block">&lt; 15 ms/token</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-white/8">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cost</span>
                        <span className="text-xs font-bold text-amber-400 mt-1 block">$0.00 (Unlimited)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Link Port 11434 */}
                {activeStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-mono text-xs font-black flex items-center justify-center">
                          4
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Connect TalentMatch &amp; Verify Port 11434
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        TalentMatch talks directly to Ollama at <code className="font-mono text-sky-300">http://localhost:11434</code>. Test your local connection with 1 click.
                      </p>
                    </div>

                    <TerminalCodeBlock
                      id="ollama-cors"
                      shellLabel={os === 'windows' ? 'PowerShell' : 'Terminal'}
                      command={getCorsConnectCommand()}
                      displayLines={[getCorsConnectCommand()]}
                      helperText="Required only if running in a web browser like Chrome to allow local cross-origin API requests."
                      copiedId={copiedIndex}
                      onCopy={copyToClipboard}
                      accentColor="sky"
                    />

                    {/* Interactive Live Connection Ping Card */}
                    <div className="p-4 rounded-xl border border-white/10 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                      <div>
                        <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                          <Activity size={13} className="text-sky-400" />
                          <span>Live Ollama Port 11434 Diagnostic</span>
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Sends a real HTTP probe to <code className="font-mono text-sky-400">http://localhost:11434/api/tags</code> right now.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={testOllamaConnection}
                        disabled={isPinging}
                        className="btn btn-primary btn-sm text-xs px-4 h-8.5 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs font-semibold"
                      >
                        <RefreshCw size={12} className={isPinging ? 'animate-spin' : ''} />
                        <span>{isPinging ? 'Pinging...' : 'Test Connection'}</span>
                      </button>
                    </div>

                    {/* Ping Feedback Banners */}
                    {pingResult.status === 'success' && (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5 animate-fade-in">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                        <div>
                          <strong className="block text-emerald-300 font-semibold">{pingResult.message}</strong>
                          {pingResult.models && pingResult.models.length > 0 && (
                            <p className="text-[11px] text-emerald-300/80 mt-0.5">
                              Active local models: <code className="font-mono font-bold text-white">{pingResult.models.join(', ')}</code>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {pingResult.status === 'error' && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2.5 animate-fade-in">
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
                        <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-mono text-xs font-black flex items-center justify-center">
                          5
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Verify Extraction Accuracy &amp; Benchmark
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Run our automated diagnostic suite across 5 real clinical scenarios (ICU RN, Trauma, Ortho, Neonatal, and Strix security).
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
                    <div className="p-4 rounded-xl border border-white/10 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                      <div>
                        <span className="font-semibold text-xs text-white block">
                          Interactive In-App Diagnostic Suite
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          Execute all 5 clinical tests in your browser with live speed and accuracy graphs.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCompletedSteps(prev => new Set(prev).add(5));
                          setBenchmarkModalOpen(true);
                        }}
                        className="btn btn-secondary h-8.5 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border-white/15 hover:border-sky-400"
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

            {/* VIEW MODE B: CHEATSHEET (ALL 5 STEPS STACKED CLEANLY) */}
            {viewMode === 'all' && (
              <div key={os} className="animate-fade-in space-y-4">
                
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/8 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-mono text-[11px] font-black flex items-center justify-center">
                        1
                      </span>
                      <span>Download &amp; Launch TalentMatch Desktop</span>
                    </span>
                    <span className="text-[10px] text-sky-400 font-semibold font-mono">
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
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/8 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-mono text-[11px] font-black flex items-center justify-center">
                        2
                      </span>
                      <span>Install Ollama via Terminal</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
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
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/8 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-mono text-[11px] font-black flex items-center justify-center">
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
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/8 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-mono text-[11px] font-black flex items-center justify-center">
                        4
                      </span>
                      <span>Connect TalentMatch &amp; Test Live AI Link</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
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
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/8 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-sky-500 text-slate-950 font-mono text-[11px] font-black flex items-center justify-center">
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

          </div>

          {/* Symmetrical Footer with Balanced Navigation */}
          <div className="px-5 py-3.5 border-t border-white/10 bg-[#0f1728]/80 backdrop-blur-md flex items-center justify-between gap-3">
            
            {/* Left: Previous Step Button */}
            <div>
              {viewMode === 'wizard' ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                  disabled={activeStep === 1}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Previous</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-mono">
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
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeStep === stepNum
                          ? 'w-6 bg-sky-400'
                          : completedSteps.has(stepNum)
                          ? 'w-2 bg-emerald-400'
                          : 'w-2 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Go to step ${stepNum}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-slate-400 pl-1 hidden sm:inline">
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
                  className="px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md bg-white hover:bg-slate-100 text-slate-950 transition-all active:scale-97"
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
                  className="px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all active:scale-97"
                >
                  <Sparkles size={13} />
                  <span>Run Benchmark</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                Close
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
