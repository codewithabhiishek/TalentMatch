import { useState, useCallback, useRef } from 'react';
import {
  Upload, X, FileText, CheckCircle, AlertCircle, Loader2, Eye, RotateCcw,
  Sparkles, Settings as SettingsIcon, Cpu, ArrowRight
} from 'lucide-react';
import { useAppStore } from '../store';
import { extractDocumentText } from '../services/documentParser';
import { parseResumeWithAI } from '../services/aiExtractionService';

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
  const { navigateTo, addCandidateWithMatches, addImportedFile, addNotification, aiConfig } = useAppStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    ? `Local Ollama (${aiConfig.modelName || 'llama3'})`
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Resume Imports</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Upload PDF or Word resumes to automatically extract clinical talent and evaluate job matches.
          </p>
        </div>

        {/* Active AI Engine Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
            <Cpu size={12} className="text-[var(--color-info)]" />
            <span className="text-[11px]">
              Engine: <strong className="text-[var(--color-text-primary)]">{providerLabel}</strong>
            </span>
          </div>
          <button
            onClick={() => navigateTo('settings')}
            className="btn btn-secondary btn-sm text-xs p-1.5 cursor-pointer"
            title="Configure AI & LLM in Settings"
          >
            <SettingsIcon size={12} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)]'
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
        <Upload size={28} className={`mx-auto mb-3 ${isDragging ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]'}`} />
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {isDragging ? 'Drop files here' : 'Drag & drop real resume files'}
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">or click to browse from device</p>
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)]">PDF (.pdf)</span>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)]">Word (.docx)</span>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)]">Text (.txt)</span>
          <span className="text-[10px] text-[var(--color-text-tertiary)] ml-1">Up to 15MB</span>
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
                      {f.status === 'completed' && f.candidateId && (
                        <button
                          onClick={() => navigateTo('candidate-profile', f.candidateId)}
                          className="btn btn-primary btn-sm text-xs cursor-pointer flex items-center gap-1"
                        >
                          <Eye size={12} /> View Profile
                        </button>
                      )}
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
                  {f.status === 'completed' && (
                    <div className="mt-2.5 p-2.5 bg-[var(--color-surface-secondary)]/70 border border-[var(--color-border)] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-[var(--color-text-primary)]">{f.candidateName}</strong>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--color-info-bg)] text-[var(--color-info)] font-medium">
                            {f.specialty}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                          {f.position} · {f.experience} years clinical experience
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] self-start sm:self-auto font-mono">
                        via {f.usedProvider}
                      </span>
                    </div>
                  )}

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

      {files.length === 0 && (
        <div className="mt-6 text-center py-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
          <p className="text-xs text-[var(--color-text-tertiary)]">No files queued. Drop your real resume files above to extract candidates.</p>
        </div>
      )}
    </div>
  );
}
