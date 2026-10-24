import { useState, useEffect, useRef } from 'react';
import {
  Folder, FolderOpen, RefreshCw, CheckCircle2, Play, Pause,
  AlertCircle, FileText, Sparkles, Eye, X, Laptop, ShieldCheck, ChevronRight
} from 'lucide-react';
import {
  folderWatcherInstance,
  DiscoveredResume
} from '../services/folderWatcherService';
import { extractDocumentText } from '../services/documentParser';
import { parseResumeWithAI } from '../services/aiExtractionService';
import { useAppStore } from '../store';

interface FolderActivity {
  id: string;
  filename: string;
  candidateName: string;
  specialty: string;
  timestamp: string;
}

export function FolderWatcherPanel() {
  const { aiConfig, addCandidateWithMatches, addImportedFile, addNotification, navigateTo } = useAppStore();

  const [folderName, setFolderName] = useState<string | null>(null);
  const [discoveredFiles, setDiscoveredFiles] = useState<DiscoveredResume[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<FolderActivity[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fallbackInputRef = useRef<HTMLInputElement>(null);

  const pendingCount = discoveredFiles.filter(f => f.status === 'pending').length;
  const completedCount = discoveredFiles.filter(f => f.status === 'completed').length;

  const handlePickFolder = async () => {
    setErrorMessage(null);
    try {
      if (folderWatcherInstance.isFileSystemAccessSupported()) {
        const res = await folderWatcherInstance.pickDirectory();
        setFolderName(res.name);
        setDiscoveredFiles(res.files);

        addNotification({
          type: 'success',
          title: 'Resume Folder Connected',
          message: `Connected "${res.name}" with ${res.files.length} document(s) detected.`,
        });
      } else {
        // Fallback for non-supported browsers
        fallbackInputRef.current?.click();
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('cancelled')) {
        setErrorMessage(err.message);
      }
    }
  };

  const handleFallbackFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const validExtensions = ['pdf', 'doc', 'docx', 'txt'];
    const filesArray = Array.from(fileList).filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext && validExtensions.includes(ext);
    });

    const folder = fileList[0].webkitRelativePath?.split('/')[0] || 'Selected Folder';
    setFolderName(folder);

    const discovered: DiscoveredResume[] = filesArray.map(f => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: f.name,
      size: f.size,
      lastModified: f.lastModified,
      file: f,
      status: 'pending',
    }));

    setDiscoveredFiles(discovered);

    addNotification({
      type: 'success',
      title: 'Resume Folder Loaded',
      message: `Loaded ${discovered.length} resume(s) from "${folder}".`,
    });
  };

  // Toggle Live Auto-Watching
  const toggleWatching = () => {
    if (!folderName) return;

    if (isWatching) {
      folderWatcherInstance.stopWatching();
      setIsWatching(false);
      addNotification({
        type: 'info',
        title: 'Folder Watcher Paused',
        message: `Paused background folder watching for "${folderName}".`,
      });
    } else {
      if (!folderWatcherInstance.getDirectoryHandle() && !folderWatcherInstance.getDirectoryPath()) {
        setErrorMessage('Direct live watching requires File System Access (available on Microsoft Edge, Google Chrome, or Windows Desktop app). You can still scan all files below.');
        return;
      }

      folderWatcherInstance.startWatching(
        aiConfig,
        (candidate, fileName) => {
          // Callback when a new file is detected in the folder
          addCandidateWithMatches(candidate);

          addImportedFile({
            id: `file-${Date.now()}`,
            filename: fileName,
            type: 'resume',
            uploadedAt: new Date().toISOString().split('T')[0],
            status: 'completed',
            recordCount: 1,
          });

          addNotification({
            type: 'success',
            title: 'New Resume Auto-Analyzed',
            message: `${candidate.firstName} ${candidate.lastName} (${candidate.specialty}) auto-discovered from "${folderName}" and matched!`,
          });

          setActivityLog(prev => [
            {
              id: Math.random().toString(36).slice(2),
              filename: fileName,
              candidateName: `${candidate.firstName} ${candidate.lastName}`,
              specialty: candidate.specialty,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            },
            ...prev.slice(0, 9),
          ]);

          setDiscoveredFiles(prev =>
            prev.map(f => f.name === fileName ? { ...f, status: 'completed' } : f)
          );
        },
        5 // check every 5 seconds
      );

      setIsWatching(true);
      addNotification({
        type: 'success',
        title: 'Live Watcher Active',
        message: `Watching "${folderName}". Drop any new resume file in this folder on your laptop to automatically analyze it!`,
      });
    }
  };

  // Process all pending resumes found in folder
  const handleProcessAll = async () => {
    if (isScanning || pendingCount === 0) return;

    setIsScanning(true);
    setScanProgress(0);

    const pending = discoveredFiles.filter(f => f.status === 'pending');
    let completed = 0;

    for (const item of pending) {
      setCurrentProcessingFile(item.name);
      try {
        const text = await extractDocumentText(item.file);
        if (!text || text.trim().length === 0) {
          throw new Error('No readable text found in document');
        }

        const result = await parseResumeWithAI(text, item.file.name, aiConfig);

        addCandidateWithMatches(result.candidate);
        folderWatcherInstance.markSignatureProcessed(item.file);

        addImportedFile({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          filename: item.file.name,
          type: 'resume',
          uploadedAt: new Date().toISOString().split('T')[0],
          status: 'completed',
          recordCount: 1,
        });

        setDiscoveredFiles(prev =>
          prev.map(f => f.id === item.id ? {
            ...f,
            status: 'completed',
            candidate: result.candidate,
            candidateName: `${result.candidate.firstName} ${result.candidate.lastName}`,
            specialty: result.candidate.specialty,
          } : f)
        );

        setActivityLog(prev => [
          {
            id: Math.random().toString(36).slice(2),
            filename: item.name,
            candidateName: `${result.candidate.firstName} ${result.candidate.lastName}`,
            specialty: result.candidate.specialty,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          ...prev.slice(0, 9),
        ]);

        completed++;
        setScanProgress(Math.round((completed / pending.length) * 100));
      } catch (err: any) {
        setDiscoveredFiles(prev =>
          prev.map(f => f.id === item.id ? { ...f, status: 'failed', error: err.message || 'Parsing failed' } : f)
        );
      }
    }

    setIsScanning(false);
    setCurrentProcessingFile(null);

    addNotification({
      type: 'success',
      title: 'Batch Analysis Complete',
      message: `Processed ${completed} resume(s) from "${folderName}". Candidates and job fit scores are updated!`,
    });
  };

  const handleRefreshFolder = async () => {
    try {
      const files = await folderWatcherInstance.scanFiles();
      setDiscoveredFiles(files);
      addNotification({
        type: 'info',
        title: 'Folder Rescanned',
        message: `Found ${files.length} document(s) in "${folderName}".`,
      });
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to rescan folder');
    }
  };

  const handleDisconnect = () => {
    folderWatcherInstance.stopWatching();
    setIsWatching(false);
    setFolderName(null);
    setDiscoveredFiles([]);
    setErrorMessage(null);
  };

  useEffect(() => {
    return () => {
      folderWatcherInstance.stopWatching();
    };
  }, []);

  return (
    <div className="card p-4 sm:p-5 mb-5 border-[var(--color-border)] shadow-xs animate-fade-in">
      {/* Hidden fallback file input with directory selection */}
      <input
        ref={fallbackInputRef}
        type="file"
        multiple
        // @ts-ignore
        webkitdirectory="true"
        // @ts-ignore
        directory="true"
        onChange={handleFallbackFolderSelect}
        className="hidden"
      />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-info)]">
            <FolderOpen size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Local Folder Watcher
              </h3>
              <span className="badge badge-info text-[9px] py-0 px-1.5 font-medium flex items-center gap-1">
                <Laptop size={10} /> Windows / Desktop
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
              Connect a folder on your laptop. Automatically analyzes existing & newly dropped resumes.
            </p>
          </div>
        </div>

        {folderName ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={toggleWatching}
              className={`btn btn-sm text-xs flex items-center gap-1.5 cursor-pointer ${
                isWatching
                  ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/30 hover:opacity-90'
                  : 'btn-secondary'
              }`}
              title={isWatching ? 'Click to pause auto-watching' : 'Click to start live watching'}
            >
              {isWatching ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  <Pause size={12} />
                  <span>Watching Live</span>
                </>
              ) : (
                <>
                  <Play size={12} />
                  <span>Start Live Watch</span>
                </>
              )}
            </button>

            <button
              onClick={handleRefreshFolder}
              disabled={isScanning}
              className="btn btn-secondary btn-sm text-xs p-1.5 cursor-pointer"
              title="Rescan folder now"
            >
              <RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleDisconnect}
              className="btn btn-ghost btn-sm text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] cursor-pointer"
              title="Disconnect folder"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handlePickFolder}
            className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Folder size={13} />
            <span>Connect Resume Folder...</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-[var(--color-error-bg)] border border-[var(--color-error)]/30 text-xs text-[var(--color-error)] flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p className="flex-1">{errorMessage}</p>
        </div>
      )}

      {/* Connected folder details */}
      {folderName ? (
        <div className="mt-3 space-y-3">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)]">Watched Folder</span>
              <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate mt-0.5" title={folderName}>
                {folderName}
              </p>
            </div>

            <div className="p-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)]">Total Found</span>
              <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-0.5">
                {discoveredFiles.length} files
              </p>
            </div>

            <div className="p-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)]">Ready to Analyze</span>
              <p className={`text-xs font-semibold mt-0.5 ${pendingCount > 0 ? 'text-[var(--color-info)]' : 'text-[var(--color-text-secondary)]'}`}>
                {pendingCount} new
              </p>
            </div>

            <div className="p-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)]">Imported</span>
              <p className="text-xs font-semibold text-[var(--color-success)] mt-0.5">
                {completedCount} candidates
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              {isWatching ? (
                <span className="flex items-center gap-1.5 text-[var(--color-success)] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  Auto-sync active: Any PDF or Word file saved to this folder is automatically parsed.
                </span>
              ) : (
                <span className="text-[var(--color-text-tertiary)]">
                  Live watch is paused. Click "Start Live Watch" to auto-process new files.
                </span>
              )}
            </div>

            {pendingCount > 0 && (
              <button
                onClick={handleProcessAll}
                disabled={isScanning}
                className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Sparkles size={13} />
                <span>Analyze All {pendingCount} New Resumes</span>
              </button>
            )}
          </div>

          {/* Progress bar during batch scan */}
          {isScanning && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-secondary)] truncate">
                  Analyzing: <strong className="text-[var(--color-text-primary)]">{currentProcessingFile}</strong>
                </span>
                <span className="text-xs font-semibold text-[var(--color-info)]">{scanProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-surface-secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-info)] transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Live Activity Log of Watched Folder */}
          {activityLog.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]/60">
              <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                Recent Folder Discoveries
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {activityLog.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)]/50"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 size={12} className="text-[var(--color-success)] shrink-0" />
                      <span className="font-medium text-[var(--color-text-primary)] truncate">{item.candidateName}</span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">({item.specialty})</span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)] truncate">from {item.filename}</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] shrink-0">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 p-3 bg-[var(--color-surface-secondary)]/50 border border-dashed border-[var(--color-border)] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)]">Tip for Windows Recruiters: </span>
            Select a folder (e.g. your <code className="px-1 py-0.5 rounded bg-[var(--color-surface)] border text-[10px]">C:\Users\...\Resumes</code>). Whenever candidate files are downloaded or copied there, TalentMatch auto-detects, extracts, and matches them to open jobs without manual dragging!
          </div>
          <button
            onClick={handlePickFolder}
            className="btn btn-secondary btn-sm text-xs shrink-0 cursor-pointer"
          >
            Select Folder
          </button>
        </div>
      )}
    </div>
  );
}
