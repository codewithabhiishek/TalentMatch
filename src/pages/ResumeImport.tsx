import { useState, useCallback, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2, Eye, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  step: number;
  error?: string;
}

const processingSteps = [
  'File received',
  'Extracting document text',
  'Identifying experience',
  'Classifying position and specialty',
  'Identifying previous travel/work locations',
  'Preparing candidate profile',
  'Ready for review',
];

export function ResumeImport() {
  const { navigateTo, addCandidate, addImportedFile, addNotification } = useAppStore();
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
      return ['pdf', 'doc', 'docx'].includes(ext || '');
    });

    const oversized = newFiles.filter(f => f.size > 10 * 1024 * 1024);

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
        error: 'File exceeds 10MB limit',
      })));
    }

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFile = async (fileId: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'uploading' as const, progress: 0 } : f));

    // Simulate upload
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 150));
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: i } : f));
    }

    // Simulate processing steps
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processing' as const, progress: 100, step: 1 } : f));

    for (let step = 1; step <= processingSteps.length; step++) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, step } : f));
    }

    // Random chance of failure for demo
    if (Math.random() < 0.05) {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'failed' as const, error: 'Could not extract text from document' } : f));
    } else {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'completed' as const } : f));

      // Persist candidate to local storage
      const targetFile = files.find(f => f.id === fileId);
      const rawName = targetFile ? targetFile.file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') : 'New Candidate';
      const parts = rawName.split(' ').filter(Boolean);
      const firstName = parts[0] || 'Alex';
      const lastName = parts.slice(1).join(' ') || 'Candidate';

      addCandidate({
        id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        phone: '(555) 234-5678',
        position: 'Registered Nurse',
        specialty: 'ICU',
        experience: 3 + Math.floor(Math.random() * 8),
        currentLocation: 'San Francisco, CA',
        previousTravelLocations: ['Denver, CO', 'Austin, TX'],
        bestMatch: 'ICU Registered Nurse (94%)',
        status: 'new',
        resumeFilename: targetFile?.file.name || 'resume.pdf',
        uploadedAt: new Date().toISOString().split('T')[0],
        professionalSummary: `Parsed candidate credentials from ${targetFile?.file.name || 'resume'}. Specializing in critical care and clinical excellence.`,
        experienceTimeline: [
          {
            id: `exp-${Date.now()}`,
            position: 'Staff Nurse',
            facility: 'Regional Health System',
            location: 'San Francisco, CA',
            startDate: '2022',
            endDate: 'Present',
            description: 'Critical care nursing and patient stabilization in high-acuity environments.'
          }
        ],
        verifiedByRecruiter: false,
      });

      addImportedFile({
        id: `file-${Date.now()}`,
        filename: targetFile?.file.name || 'resume.pdf',
        type: 'resume',
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'completed',
        recordCount: 1,
      });

      addNotification({
        title: 'Resume Processed',
        message: `Added ${firstName} ${lastName} to candidates and saved to local storage.`,
        read: false,
        type: 'success',
      });
    }
  };

  const processAll = () => {
    files.filter(f => f.status === 'pending').forEach(f => processFile(f.id));
  };

  const retryFile = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'pending' as const, progress: 0, step: 0, error: undefined } : f));
    setTimeout(() => processFile(id), 100);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const isProcessing = files.some(f => f.status === 'uploading' || f.status === 'processing');

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-5 animate-fade-in">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Resume Imports</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Upload resumes to create candidate profiles. Demo processing — no actual AI extraction is performed.</p>
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
            : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-secondary)]/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ''; }}
          className="hidden"
        />
        <Upload size={28} className={`mx-auto mb-3 ${isDragging ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]'}`} />
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {isDragging ? 'Drop files here' : 'Drag & drop resume files'}
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">or click to browse</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded">PDF</span>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded">DOC</span>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded">DOCX</span>
          <span className="text-[10px] text-[var(--color-text-tertiary)] ml-1">Max 10MB each</span>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
              Files ({files.length})
              {completedCount > 0 && <span className="text-[var(--color-text-tertiary)] font-normal ml-2">· {completedCount} processed</span>}
            </h3>
            {files.some(f => f.status === 'pending') && (
              <button
                onClick={processAll}
                disabled={isProcessing}
                className="btn btn-primary btn-sm"
              >
                Process All
              </button>
            )}
          </div>

          {files.map(f => (
            <div key={f.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                  f.status === 'completed' ? 'bg-[var(--color-success-bg)]' :
                  f.status === 'failed' ? 'bg-[var(--color-error-bg)]' :
                  'bg-[var(--color-surface-tertiary)]'
                }`}>
                  {f.status === 'completed' ? <CheckCircle size={14} className="text-[var(--color-success)]" /> :
                   f.status === 'failed' ? <AlertCircle size={14} className="text-[var(--color-error)]" /> :
                   <FileText size={14} className="text-[var(--color-text-secondary)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{f.file.name}</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)]">{formatSize(f.file.size)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {f.status === 'completed' && (
                        <button
                          onClick={() => navigateTo('candidates')}
                          className="btn btn-secondary btn-sm text-[var(--color-info)]"
                        >
                          <Eye size={11} /> View
                        </button>
                      )}
                      {f.status === 'failed' && (
                        <button
                          onClick={() => retryFile(f.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          <RotateCcw size={11} /> Retry
                        </button>
                      )}
                      {(f.status === 'pending' || f.status === 'failed') && (
                        <button
                          onClick={() => removeFile(f.id)}
                          className="btn-icon btn-icon-sm"
                          title="Remove file"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  {(f.status === 'uploading' || f.status === 'processing') && (
                    <div className="mt-2">
                      {f.status === 'uploading' && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300" style={{ width: `${f.progress}%` }} />
                          </div>
                          <span className="text-[10px] text-[var(--color-text-tertiary)] w-8">{f.progress}%</span>
                        </div>
                      )}
                      {f.status === 'processing' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Loader2 size={10} className="animate-spin text-[var(--color-text-secondary)]" />
                            <span className="text-[10px] text-[var(--color-text-secondary)]">Demo processing</span>
                          </div>
                          <div className="space-y-0.5">
                            {processingSteps.map((step, idx) => (
                              <div key={idx} className={`flex items-center gap-1.5 text-[10px] ${
                                idx + 1 < f.step ? 'text-[var(--color-success)]' :
                                idx + 1 === f.step ? 'text-[var(--color-text-primary)] font-medium' :
                                'text-[var(--color-text-tertiary)]'
                              }`}>
                                {idx + 1 < f.step ? <CheckCircle size={9} /> :
                                 idx + 1 === f.step ? <Loader2 size={9} className="animate-spin" /> :
                                 <div className="w-[9px] h-[9px] rounded-full border border-[var(--color-border)]" />}
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {f.status === 'pending' && (
                    <button
                      onClick={() => processFile(f.id)}
                      className="mt-2 px-2.5 py-1 text-[10px] font-medium border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-secondary)] transition-colors"
                    >
                      Process
                    </button>
                  )}

                  {f.status === 'failed' && f.error && (
                    <p className="mt-1.5 text-[10px] text-[var(--color-error)]">{f.error}</p>
                  )}

                  {f.status === 'completed' && (
                    <p className="mt-1 text-[10px] text-[var(--color-success)]">Profile created successfully</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <div className="mt-6 text-center py-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
          <p className="text-xs text-[var(--color-text-tertiary)]">No files uploaded yet. Drop resume files above to begin.</p>
        </div>
      )}
    </div>
  );
}
