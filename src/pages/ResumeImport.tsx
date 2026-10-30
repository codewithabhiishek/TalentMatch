import { useState, useCallback, useRef } from 'react';
import {
  Upload, X, FileText, CheckCircle, AlertCircle, Loader2, Eye, RotateCcw,
  Sparkles, Settings as SettingsIcon, Cpu, ArrowRight, Download, Play, AlertTriangle, Trash2, FolderOpen
} from 'lucide-react';
import { useAppStore } from '../store';
import { extractDocumentText } from '../services/documentParser';
import { parseResumeWithAI } from '../services/aiExtractionService';
import { downloadCandidateReport } from '../services/downloadService';
import { DiagnosticBenchmarkModal } from '../components/DiagnosticBenchmarkModal';
import { FolderWatcherPanel } from '../components/FolderWatcherPanel';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  step: number;
  error?: string;
  candidateId?: string;
  candidateName?: string;
  position?: string;
  specialty?: string;
  experience?: number;
  usedProvider?: string;
  extractedTextLength?: number;
}

const processingSteps = [
  'File received',
  'Extracting document text (PDF/Word)',
  'Extracting clinical credentials via AI',
  'Classifying position, specialty & tenure',
  'Mapping clinical timeline & travel history',
  'Calculating AI job matches against requisitions',
  'Candidate profile ready in database',
];

export function ResumeImport() {
  const { navigateTo, addCandidateWithMatches, addImportedFile, addNotification, aiConfig, candidates, clearAllData } = useAppStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [importTab, setImportTab] = useState<'folder' | 'files'>('folder');
  const [isDragging, setIsDragging] = useState(false);
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasDemoData = candidates.length > 0 && candidates.some(c => c.id.startsWith('c') && !c.id.startsWith('cand-'));

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'doc', 'docx', 'txt'].includes(ext || '');
    });

    const oversized = newFiles.filter(f => f.size > 15 * 1024 * 1024);

    const uploadFiles: UploadFile[] = validFiles.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      status: 'pending',
      progress: 0,
      step: 0,
    }));

    if (oversized.length > 0) {
      uploadFiles.push(...oversized.map(f => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        status: 'failed' as const,
        progress: 0,
        step: 0,
        error: 'File exceeds 15MB limit',
      })));
    }

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFile = async (fileId: string) => {
    const target = files.find(f => f.id === fileId);
    if (!target) return;

    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'uploading' as const, progress: 15, step: 0, error: undefined } : f));

    try {
      // Step 1: Read file bytes
      await new Promise(r => setTimeout(r, 100));
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: 35, step: 1 } : f));

      // Step 2: Real Document Text Extraction from PDF or Word
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processing' as const, progress: 55, step: 2 } : f));
      const extractedText = await extractDocumentText(target.file);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Could not find readable text in this document. Please ensure it is not scanned image-only.');
      }

      // Step 3: Run AI analysis (Local Ollama, OpenAI/Groq, or Heuristic)
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: 80, step: 3 } : f));
      const extraction = await parseResumeWithAI(extractedText, target.file.name, aiConfig);

      // Step 4: Evaluate matches with active requisitions
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: 95, step: 5 } : f));
      await new Promise(r => setTimeout(r, 120));

      // Step 5: Save candidate & matches into local storage
      addCandidateWithMatches(extraction.candidate);

      addImportedFile({
        id: `file-${Date.now()}`,
        filename: target.file.name,
        type: 'resume',
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'completed',
        recordCount: 1,
      });

      addNotification({
        title: 'Resume Extracted & Scored',
        message: `${extraction.candidate.firstName} ${extraction.candidate.lastName} (${extraction.candidate.specialty}) parsed and matched to active positions.`,
        read: false,
        type: 'success',
      });

      setFiles(prev => prev.map(f => f.id === fileId ? {
        ...f,
        status: 'completed' as const,
        progress: 100,
        step: 6,
        candidateId: extraction.candidate.id,
        candidateName: `${extraction.candidate.firstName} ${extraction.candidate.lastName}`,
        position: extraction.candidate.position,
        specialty: extraction.candidate.specialty,
        experience: extraction.candidate.experience,
        usedProvider: extraction.usedProvider,
        extractedTextLength: extraction.extractedTextLength,
      } : f));

    } catch (err: any) {
      console.error('File parsing error:', err);
      setFiles(prev => prev.map(f => f.id === fileId ? {
        ...f,
        status: 'failed' as const,
        error: err.message || 'Failed to extract resume text',
      } : f));
    }
  };

  const processAll = () => {
    files.filter(f => f.status === 'pending').forEach(f => processFile(f.id));
  };

  const retryFile = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'pending' as const, progress: 0, step: 0, error: undefined } : f));
    setTimeout(() => processFile(id), 60);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const isProcessing = files.some(f => f.status === 'uploading' || f.status === 'processing');

  const providerLabel = aiConfig?.provider === 'ollama'
    ? `Local Ollama (${aiConfig.modelName || 'llama3.2:3b'})`
    : aiConfig?.provider === 'openai'
    ? `OpenAI (${aiConfig.modelName || 'gpt-4o-mini'})`
    : aiConfig?.provider === 'groq'
    ? `Groq Cloud (${aiConfig.modelName || 'llama-3.3'})`
    : aiConfig?.provider === 'custom'
    ? 'Custom OpenAI Endpoint'
    : 'Built-in Offline Pattern Parser';

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">Resume Imports</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Batch ingest resumes, parse clinical credentials, and map candidate job fit.
          </p>
        </div>

        {/* AI Engine & Benchmark Actions Toolbar (Always on a single horizontal row) */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => navigateTo('settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] hover:border-[var(--color-info)] text-xs transition-colors cursor-pointer shadow-2xs"
            title="Configure AI extraction model in Settings"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-[var(--color-text-secondary)]">Engine:</span>
            <strong className="text-[11px] text-[var(--color-text-primary)]">
              {aiConfig?.provider === 'ollama' ? `Ollama (${aiConfig.modelName || 'llama3.2:3b'})` : providerLabel}
            </strong>
            <SettingsIcon size={12} className="text-[var(--color-text-tertiary)] ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => setBenchmarkOpen(true)}
            className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            title="Run Automated Diagnostic Benchmark"
          >
            <Sparkles size={12} className="text-amber-400" />
            <span>Benchmark</span>
          </button>
        </div>
      </div>

      {/* Heuristic mode warning banner */}
      {(!aiConfig || aiConfig.provider === 'heuristic') && (
        <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs flex items-start gap-2.5 animate-fade-in">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <span className="leading-relaxed text-amber-600 dark:text-amber-400">
            <strong>Running in Offline Pattern-Match Mode.</strong> Results are estimated using regex patterns only (~60% accuracy).
            {' '}Connect <strong>Local Ollama</strong> (free &amp; private) in{' '}
            <button onClick={() => navigateTo('settings')} className="underline font-semibold cursor-pointer">Settings → API Keys</button>
            {' '}for accurate AI extraction.
          </span>
        </div>
      )}

      {/* Demo data warning banner before importing real folder */}
      {hasDemoData && (
        <div className="mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-fade-in">
          <div className="flex items-start sm:items-center gap-2">
            <Sparkles size={14} className="flex-shrink-0 text-amber-500 mt-0.5 sm:mt-0" />
            <span className="leading-relaxed text-[var(--color-text-secondary)]">
              Workspace currently has <strong className="text-[var(--color-text-primary)]">sample demo candidates</strong>. You can clear them before scanning your folder so only your real candidates are saved.
            </span>
          </div>
          <button
            onClick={() => {
              clearAllData();
              addNotification({
                type: 'info',
                title: 'Workspace Cleared',
                message: 'All sample demo candidates removed. Ready for your real resumes!',
              });
            }}
            className="btn btn-secondary btn-sm text-xs text-[var(--color-error)] hover:bg-[var(--color-error-bg)] border-[var(--color-error)]/30 shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 size={12} />
            <span>Clear Demo Data</span>
          </button>
        </div>
      )}

      {/* Workflow Mode Selector: Folder Auto-Sync vs Direct File Upload */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 animate-fade-in">
        <button
          type="button"
          onClick={() => setImportTab('folder')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
            importTab === 'folder'
              ? 'border-[var(--color-info)] bg-[var(--color-surface)] ring-2 ring-[var(--color-info)]/20 shadow-xs'
              : 'border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              importTab === 'folder' ? 'bg-[var(--color-info)]/10 text-[var(--color-info)]' : 'bg-[var(--color-surface)] text-[var(--color-text-tertiary)]'
            }`}>
              <FolderOpen size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-[var(--color-text-primary)]">Continuous Folder Watcher</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-[var(--color-info-bg)] text-[var(--color-info)]">Recommended</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 truncate">Auto-scan local directory with persistent access</p>
            </div>
          </div>
          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
            importTab === 'folder' ? 'border-[var(--color-info)] bg-[var(--color-info)] text-white' : 'border-[var(--color-border)]'
          }`}>
            {importTab === 'folder' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setImportTab('files')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
            importTab === 'files'
              ? 'border-[var(--color-info)] bg-[var(--color-surface)] ring-2 ring-[var(--color-info)]/20 shadow-xs'
              : 'border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              importTab === 'files' ? 'bg-[var(--color-info)]/10 text-[var(--color-info)]' : 'bg-[var(--color-surface)] text-[var(--color-text-tertiary)]'
            }`}>
              <Upload size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-[var(--color-text-primary)]">Upload Files Directly</span>
                {files.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
                    {files.length} queued
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 truncate">Drag and drop specific PDF or Word resumes</p>
            </div>
          </div>
          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
            importTab === 'files' ? 'border-[var(--color-info)] bg-[var(--color-info)] text-white' : 'border-[var(--color-border)]'
          }`}>
            {importTab === 'files' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
        </button>
      </div>

      {importTab === 'folder' ? (
        <FolderWatcherPanel />
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200
              ${isDragging
                ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] scale-[1.01]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-surface)]'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ''; }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-3 text-[var(--color-info)] shadow-xs">
              <Upload size={22} className={isDragging ? 'text-[var(--color-primary)] animate-bounce' : ''} />
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {isDragging ? 'Drop resumes here to upload' : 'Drag & drop real resume files here'}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">or click to browse from device</p>
            <div className="flex items-center justify-center gap-2 mt-3.5 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)]">PDF (.pdf)</span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)]">Word (.docx)</span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)]">Text (.txt)</span>
              <span className="text-[10px] text-[var(--color-text-tertiary)] ml-1">Up to 15MB each</span>
            </div>
          </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
              Files ({files.length})
              {completedCount > 0 && <span className="text-[var(--color-text-tertiary)] font-normal ml-2">· {completedCount} extracted</span>}
            </h3>
            {files.some(f => f.status === 'pending') && (
              <button
                onClick={processAll}
                disabled={isProcessing}
                className="btn btn-primary btn-sm cursor-pointer"
              >
                Extract All ({files.filter(f => f.status === 'pending').length})
              </button>
            )}
          </div>

          {files.map(f => (
            <div key={f.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                  f.status === 'completed' ? 'bg-[var(--color-success-bg)]' :
                  f.status === 'failed' ? 'bg-[var(--color-error-bg)]' :
                  'bg-[var(--color-surface-tertiary)]'
                }`}>
                  {f.status === 'completed' ? <CheckCircle size={16} className="text-[var(--color-success)]" /> :
                   f.status === 'failed' ? <AlertCircle size={16} className="text-[var(--color-error)]" /> :
                   <FileText size={16} className="text-[var(--color-text-secondary)]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{f.file.name}</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                        {formatSize(f.file.size)}
                        {f.extractedTextLength ? ` · ${f.extractedTextLength} characters extracted` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {f.status === 'completed' && f.candidateId && (() => {
                        const cand = candidates.find(c => c.id === f.candidateId);
                        return (
                          <>
                            {cand && (
                              <button
                                onClick={() => downloadCandidateReport(cand)}
                                className="btn btn-secondary btn-sm text-xs cursor-pointer flex items-center gap-1"
                                title="Download Candidate Dossier"
                              >
                                <Download size={11} /> Dossier
                              </button>
                            )}
                            <button
                              onClick={() => navigateTo('candidate-profile', f.candidateId)}
                              className="btn btn-primary btn-sm text-xs cursor-pointer flex items-center gap-1"
                            >
                              <Eye size={12} /> View Profile
                            </button>
                          </>
                        );
                      })()}
                      {f.status === 'failed' && (
                        <button
                          onClick={() => retryFile(f.id)}
                          className="btn btn-secondary btn-sm text-xs cursor-pointer"
                        >
                          <RotateCcw size={12} /> Retry
                        </button>
                      )}
                      {(f.status === 'pending' || f.status === 'failed') && (
                        <button
                          onClick={() => removeFile(f.id)}
                          className="btn-icon btn-icon-sm cursor-pointer"
                          title="Remove file"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Parsed Candidate Summary Card if completed */}
                  {f.status === 'completed' && (() => {
                    const cand = candidates.find(c => c.id === f.candidateId);
                    return (
                      <div className="mt-2.5 p-2.5 bg-[var(--color-surface-secondary)]/70 border border-[var(--color-border)] rounded-md text-xs space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-[var(--color-text-primary)]">{f.candidateName}</strong>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--color-info-bg)] text-[var(--color-info)] font-medium">
                                {f.specialty}
                              </span>
                              {cand?.confidenceScore && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold flex items-center gap-0.5">
                                  <Sparkles size={9} /> {cand.confidenceScore}% confidence
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                              {f.position} · {f.experience} years clinical experience
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] self-start sm:self-auto font-mono">
                            via {f.usedProvider}
                          </span>
                        </div>
                        {cand?.certifications && cand.certifications.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-[var(--color-border)]/50">
                            <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium">Licenses:</span>
                            {cand.certifications.map(cert => (
                              <span key={cert} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] font-medium">
                                {cert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Progress & Steps */}
                  {(f.status === 'uploading' || f.status === 'processing') && (
                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-primary)] transition-all duration-300"
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] w-8 text-right">{f.progress}%</span>
                      </div>

                      <div className="space-y-1">
                        {processingSteps.map((step, idx) => (
                          <div key={idx} className={`flex items-center gap-1.5 text-[10px] ${
                            idx < f.step ? 'text-[var(--color-success)] font-medium' :
                            idx === f.step ? 'text-[var(--color-text-primary)] font-semibold' :
                            'text-[var(--color-text-tertiary)]'
                          }`}>
                            {idx < f.step ? <CheckCircle size={10} /> :
                             idx === f.step ? <Loader2 size={10} className="animate-spin text-[var(--color-info)]" /> :
                             <div className="w-[10px] h-[10px] rounded-full border border-[var(--color-border)]" />}
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {f.status === 'pending' && (
                    <button
                      onClick={() => processFile(f.id)}
                      className="mt-2 px-2.5 py-1 text-[11px] font-medium border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
                    >
                      Parse Document
                    </button>
                  )}

                  {f.status === 'failed' && f.error && (
                    <p className="mt-1.5 text-[11px] text-[var(--color-error)] flex items-center gap-1">
                      <AlertCircle size={12} /> {f.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

      {/* Live Diagnostic Benchmark Modal */}
      <DiagnosticBenchmarkModal
        isOpen={benchmarkOpen}
        onClose={() => setBenchmarkOpen(false)}
      />
    </div>
  );
}
