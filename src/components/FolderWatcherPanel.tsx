import { useState, useEffect, useRef } from 'react';
import {
  Folder, FolderOpen, RefreshCw, CheckCircle2, Play, Pause,
  AlertCircle, Sparkles, X, Laptop, RotateCcw, Link
} from 'lucide-react';
import {
  folderWatcherInstance,
  DiscoveredResume,
} from '../services/folderWatcherService';
import { extractDocumentText } from '../services/documentParser';
import { parseResumeWithAI } from '../services/aiExtractionService';
import { useAppStore } from '../store';
import {
  saveHandleToIDB,
  loadHandleFromIDB,
  clearHandleFromIDB,
  queryHandlePermission,
  requestHandlePermission,
  getSavedFolderMeta,
  saveElectronFolderPath,
  loadElectronFolderMeta,
  clearElectronFolderMeta,
} from '../services/folderPersistenceService';

interface FolderActivity {
  id: string;
  filename: string;
  candidateName: string;
  specialty: string;
  timestamp: string;
}

/**
 * FolderWatcherPanel
 *
 * Key behaviors:
 * 1. PERSISTENT ACCESS — stores FileSystemDirectoryHandle in IndexedDB (browser)
 *    or folder path in localStorage (Electron/Windows desktop app).
 *    On next open/restart, silently reconnects if permission already granted,
 *    or shows a one-click "Reconnect" banner if browser needs confirmation.
 *
 * 2. INCREMENTAL PROCESSING — only analyzes new/unprocessed files via
 *    processedSignatures manifest (name_size_lastModified key in localStorage).
 *    Already-analyzed files are shown as ✓ completed and NEVER re-submitted.
 *
 * 3. LIVE WATCHING — polls every 5s when active; auto-detects and processes
 *    any new file dropped into the watched folder.
 */
export function FolderWatcherPanel() {
  const { aiConfig, addCandidateWithMatches, addImportedFile, addNotification } = useAppStore();

  const [folderName,            setFolderName]            = useState<string | null>(null);
  const [discoveredFiles,       setDiscoveredFiles]        = useState<DiscoveredResume[]>([]);
  const [isWatching,            setIsWatching]             = useState(false);
  const [isScanning,            setIsScanning]             = useState(false);
  const [scanProgress,          setScanProgress]           = useState(0);
  const [currentProcessingFile, setCurrentProcessingFile]  = useState<string | null>(null);
  const [activityLog,           setActivityLog]            = useState<FolderActivity[]>([]);
  const [errorMessage,          setErrorMessage]           = useState<string | null>(null);

  // Reconnect banner state — shown when a saved handle/path exists but needs user gesture
  const [reconnectMeta, setReconnectMeta] = useState<{ name: string } | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const fallbackInputRef = useRef<HTMLInputElement>(null);

  const pendingCount   = discoveredFiles.filter(f => f.status === 'pending').length;
  const completedCount = discoveredFiles.filter(f => f.status === 'completed').length;
  const failedCount    = discoveredFiles.filter(f => f.status === 'failed').length;
  const isElectron     = folderWatcherInstance.isElectron();

  // ─── On mount: try to silently restore previous folder ──────────────────────
  useEffect(() => {
    restorePersistedFolder();
    return () => { folderWatcherInstance.stopWatching(); };
  }, []);

  async function restorePersistedFolder() {
    // ── Electron path restore ──
    if (folderWatcherInstance.isElectron()) {
      const meta = loadElectronFolderMeta();
      if (meta) {
        // Electron has full OS access — no permission prompt needed
        try {
          folderWatcherInstance.setDirectoryPath(meta.path);
          const files = await folderWatcherInstance.scanFiles();
          setFolderName(meta.name);
          setDiscoveredFiles(files);
        } catch {
          clearElectronFolderMeta();
        }
      }
      return;
    }

    // ── Browser IndexedDB handle restore ──
    const meta = getSavedFolderMeta();
    if (!meta) return; // Nothing saved, show fresh UI

    const handle = await loadHandleFromIDB();
    if (!handle) {
      // Meta exists but handle was lost — clear stale meta
      setReconnectMeta(null);
      return;
    }

    const permission = await queryHandlePermission(handle);

    if (permission === 'granted') {
      // Silent auto-reconnect — no user gesture needed
      folderWatcherInstance.setDirectoryHandle(handle);
      const files = await folderWatcherInstance.scanFiles();
      setFolderName(handle.name);
      setDiscoveredFiles(files);
    } else if (permission === 'prompt') {
      // Can't silently reconnect — show "Reconnect?" banner
      setReconnectMeta({ name: handle.name });
    }
    // If 'denied', just show fresh UI
  }

  // One-click reconnect from banner — fires requestPermission (requires user gesture)
  async function handleReconnect() {
    setIsReconnecting(true);
    setErrorMessage(null);
    try {
      const handle = await loadHandleFromIDB();
      if (!handle) { setReconnectMeta(null); return; }

      const granted = await requestHandlePermission(handle);
      if (granted) {
        folderWatcherInstance.setDirectoryHandle(handle);
        const files = await folderWatcherInstance.scanFiles();
        setFolderName(handle.name);
        setDiscoveredFiles(files);
        setReconnectMeta(null);
        addNotification({
          type: 'success',
          title: 'Folder Reconnected',
          message: `Reconnected to "${handle.name}" — ${files.length} file(s) found.`,
        });
      } else {
        setErrorMessage('Permission denied. Please click "Connect Resume Folder" to select again.');
        setReconnectMeta(null);
        await clearHandleFromIDB();
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Reconnect failed.');
    } finally {
      setIsReconnecting(false);
    }
  }

  // ─── Pick a new folder ───────────────────────────────────────────────────────
  async function handlePickFolder() {
    setErrorMessage(null);
    try {
      if (folderWatcherInstance.isFileSystemAccessSupported()) {
        const res = await folderWatcherInstance.pickDirectory();
        setFolderName(res.name);
        setDiscoveredFiles(res.files);
        setReconnectMeta(null);

        // Persist handle/path for future sessions
        if (isElectron && res.path) {
          saveElectronFolderPath(res.path, res.name);
        } else {
          const handle = folderWatcherInstance.getDirectoryHandle();
          if (handle) await saveHandleToIDB(handle);
        }

        const newCount = res.files.filter(f => f.status === 'pending').length;
        addNotification({
          type: 'success',
          title: 'Resume Folder Connected',
          message: `Connected "${res.name}" — ${res.files.length} file(s) found (${newCount} new, ${res.files.length - newCount} already analyzed).`,
        });
      } else {
        fallbackInputRef.current?.click();
      }
    } catch (err: any) {
      if (err.message && !err.message.toLowerCase().includes('cancel')) {
        setErrorMessage(err.message);
      }
    }
  }

  // Fallback for Firefox / Safari — webkitdirectory input
  function handleFallbackFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const validExtensions = ['pdf', 'doc', 'docx', 'txt'];
    const filesArray = Array.from(fileList).filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext && validExtensions.includes(ext);
    });

    const folder = fileList[0].webkitRelativePath?.split('/')[0] || 'Selected Folder';
    setFolderName(folder);
    setReconnectMeta(null);

    const discovered: DiscoveredResume[] = filesArray.map(f => {
      const sig = `${f.name}_${f.size}_${f.lastModified}`;
      return {
        id:           `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name:         f.name,
        size:         f.size,
        lastModified: f.lastModified,
        file:         f,
        status:       folderWatcherInstance.isSignatureProcessed(sig) ? 'completed' as const : 'pending' as const,
      };
    });

    setDiscoveredFiles(discovered);
    addNotification({
      type: 'success',
      title: 'Resume Folder Loaded',
      message: `Loaded ${discovered.length} resume(s) from "${folder}".`,
    });
  }

  // ─── Live watch toggle ───────────────────────────────────────────────────────
  function toggleWatching() {
    if (!folderName) return;

    if (isWatching) {
      folderWatcherInstance.stopWatching();
      setIsWatching(false);
      addNotification({ type: 'info', title: 'Folder Watcher Paused', message: `Paused watching "${folderName}".` });
    } else {
      if (!folderWatcherInstance.getDirectoryHandle() && !folderWatcherInstance.getDirectoryPath()) {
        setErrorMessage('Live watching needs File System Access (Chrome/Edge) or the Desktop app. You can still scan below.');
        return;
      }

      folderWatcherInstance.startWatching(
        aiConfig,
        (candidate, fileName) => {
          addCandidateWithMatches(candidate);
          addImportedFile({
            id:          `file-${Date.now()}`,
            filename:    fileName,
            type:        'resume',
            uploadedAt:  new Date().toISOString().split('T')[0],
            status:      'completed',
            recordCount: 1,
          });
          addNotification({
            type:    'success',
            title:   'New Resume Auto-Analyzed',
            message: `${candidate.firstName} ${candidate.lastName} (${candidate.specialty}) auto-discovered in "${folderName}".`,
          });
          setActivityLog(prev => [{
            id:            Math.random().toString(36).slice(2),
            filename:      fileName,
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            specialty:     candidate.specialty,
            timestamp:     new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          }, ...prev.slice(0, 9)]);
          setDiscoveredFiles(prev => prev.map(f => f.name === fileName ? { ...f, status: 'completed' } : f));
          // Refresh the full file list to pick up any new files added to the folder
          folderWatcherInstance.scanFiles().then(updatedFiles => {
            setDiscoveredFiles(updatedFiles);
          }).catch(() => {});
        },
        5
      );

      setIsWatching(true);
      addNotification({
        type:    'success',
        title:   'Live Watcher Active',
        message: `Watching "${folderName}". Drop any new resume file in this folder to auto-analyze it!`,
      });
    }
  }

  // ─── Process only NEW (pending) resumes — incremental ───────────────────────
  async function handleProcessAll() {
    if (isScanning || pendingCount === 0) return;
    setIsScanning(true);
    setScanProgress(0);

    // Only files that haven't been processed yet (status === 'pending')
    const pending = discoveredFiles.filter(f => f.status === 'pending');
    let completed = 0;

    for (const item of pending) {
      setCurrentProcessingFile(item.name);
      try {
        const text = await extractDocumentText(item.file);
        if (!text || text.trim().length === 0) throw new Error('No readable text found in document');

        const result = await parseResumeWithAI(text, item.file.name, aiConfig);

        addCandidateWithMatches(result.candidate);
        // Mark as processed in the persistent manifest so it's skipped on next scan
        folderWatcherInstance.markSignatureProcessed(item.file);

        addImportedFile({
          id:          `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          filename:    item.file.name,
          type:        'resume',
          uploadedAt:  new Date().toISOString().split('T')[0],
          status:      'completed',
          recordCount: 1,
        });

        setDiscoveredFiles(prev => prev.map(f => f.id === item.id ? {
          ...f,
          status:        'completed',
          candidate:     result.candidate,
          candidateName: `${result.candidate.firstName} ${result.candidate.lastName}`,
          specialty:     result.candidate.specialty,
        } : f));

        setActivityLog(prev => [{
          id:            Math.random().toString(36).slice(2),
          filename:      item.name,
          candidateName: `${result.candidate.firstName} ${result.candidate.lastName}`,
          specialty:     result.candidate.specialty,
          timestamp:     new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        }, ...prev.slice(0, 9)]);

        completed++;
        setScanProgress(Math.round((completed / pending.length) * 100));
      } catch (err: any) {
        setDiscoveredFiles(prev => prev.map(f => f.id === item.id
          ? { ...f, status: 'failed', error: err.message || 'Parsing failed' }
          : f
        ));
      }
    }

    setIsScanning(false);
    setCurrentProcessingFile(null);
    addNotification({
      type:    completed > 0 ? 'success' : 'warning',
      title:   'Batch Analysis Complete',
      message: `Analyzed ${completed} of ${pending.length} new resume(s) from "${folderName}".`,
    });
  }

  // ─── Rescan (checks for new files only) ─────────────────────────────────────
  async function handleRefreshFolder() {
    try {
      const files = await folderWatcherInstance.scanFiles();
      setDiscoveredFiles(files);
      const newCount = files.filter(f => f.status === 'pending').length;
      addNotification({
        type:    'info',
        title:   'Folder Rescanned',
        message: newCount > 0
          ? `Found ${newCount} new resume(s) in "${folderName}". Click "Analyze" to process them.`
          : `No new files since last scan in "${folderName}".`,
      });
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to rescan folder');
    }
  }

  // ─── Disconnect ──────────────────────────────────────────────────────────────
  async function handleDisconnect() {
    folderWatcherInstance.stopWatching();
    setIsWatching(false);
    setFolderName(null);
    setDiscoveredFiles([]);
    setErrorMessage(null);
    setReconnectMeta(null);
    if (isElectron) {
      clearElectronFolderMeta();
    } else {
      await clearHandleFromIDB();
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="card p-4 sm:p-5 mb-5 border-[var(--color-border)] shadow-xs animate-fade-in">
      {/* Hidden fallback file input */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-info)]">
            <FolderOpen size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Local Folder Watcher</h3>
              <span className="badge badge-info text-[9px] py-0 px-1.5 font-medium flex items-center gap-1">
                <Laptop size={10} /> Windows / Desktop
              </span>
              {folderName && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-success-bg)] text-[var(--color-success)] font-medium flex items-center gap-1">
                  <Link size={9} /> Persistent
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
              Connect once — folder access persists across restarts. Only new resumes are analyzed.
            </p>
          </div>
        </div>

        {folderName && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={toggleWatching}
              className={`btn btn-sm text-xs flex items-center gap-1.5 cursor-pointer ${
                isWatching
                  ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/30 hover:opacity-90'
                  : 'btn-secondary'
              }`}
            >
              {isWatching
                ? <><span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" /><Pause size={12} /><span>Watching Live</span></>
                : <><Play size={12} /><span>Start Live Watch</span></>
              }
            </button>
            <button
              onClick={handleRefreshFolder}
              disabled={isScanning}
              className="btn btn-secondary btn-sm text-xs p-1.5 cursor-pointer"
              title="Rescan for new files"
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
        )}
      </div>

      {/* ── Reconnect banner (shown on reload when permission needs confirmation) */}
      {reconnectMeta && !folderName && (
        <div className="mt-3 p-3 rounded-lg border border-[var(--color-info)]/40 bg-[var(--color-info-bg)]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <Link size={14} className="text-[var(--color-info)] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                Resume folder remembered: <code className="text-[var(--color-info)]">"{reconnectMeta.name}"</code>
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                One click to restore access — no need to re-select the folder.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={12} className={isReconnecting ? 'animate-spin' : ''} />
              {isReconnecting ? 'Reconnecting...' : `Reconnect to "${reconnectMeta.name}"`}
            </button>
            <button
              onClick={async () => { await clearHandleFromIDB(); setReconnectMeta(null); }}
              className="btn btn-ghost btn-sm text-xs text-[var(--color-text-tertiary)] cursor-pointer"
              title="Forget this folder"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-[var(--color-error-bg)] border border-[var(--color-error)]/30 text-xs text-[var(--color-error)] flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p className="flex-1">{errorMessage}</p>
        </div>
      )}

      {/* Connected folder body */}
      {folderName ? (
        <div className="mt-3 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)]">Folder</span>
              <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate mt-0.5" title={folderName}>{folderName}</p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)]">Total Found</span>
              <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-0.5">{discoveredFiles.length} files</p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)]">New (Unanalyzed)</span>
              <p className={`text-xs font-semibold mt-0.5 ${pendingCount > 0 ? 'text-[var(--color-info)]' : 'text-[var(--color-text-secondary)]'}`}>
                {pendingCount} new
              </p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)]">Analyzed</span>
              <p className="text-xs font-semibold text-[var(--color-success)] mt-0.5">{completedCount} done</p>
            </div>
          </div>

          {/* Incremental info notice */}
          {completedCount > 0 && pendingCount === 0 && (
            <div className="p-2.5 rounded-lg bg-[var(--color-success-bg)]/40 border border-[var(--color-success)]/20 text-[11px] text-[var(--color-success)] flex items-center gap-2">
              <CheckCircle2 size={13} />
              All {completedCount} resume(s) already analyzed. Drop new files into the folder — they'll be detected automatically.
            </div>
          )}

          {/* Action row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-[var(--color-text-secondary)]">
              {isWatching ? (
                <span className="flex items-center gap-1.5 text-[var(--color-success)] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  Live watching — any new PDF/Word file saved here is auto-parsed instantly.
                </span>
              ) : (
                <span className="text-[var(--color-text-tertiary)]">
                  Click "Start Live Watch" to auto-detect new files, or manually scan below.
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
                <span>Analyze {pendingCount} New Resume{pendingCount !== 1 ? 's' : ''}</span>
              </button>
            )}
          </div>

          {/* Progress bar */}
          {isScanning && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-secondary)] truncate">
                  Analyzing: <strong className="text-[var(--color-text-primary)]">{currentProcessingFile}</strong>
                </span>
                <span className="text-xs font-semibold text-[var(--color-info)]">{scanProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-surface-secondary)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-info)] transition-all duration-300" style={{ width: `${scanProgress}%` }} />
              </div>
            </div>
          )}

          {/* File list — shows pending vs completed vs failed */}
          {discoveredFiles.length > 0 && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
              {discoveredFiles.map(f => (
                <div
                  key={f.id}
                  className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)]/50"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {f.status === 'completed' && <CheckCircle2 size={12} className="text-[var(--color-success)] shrink-0" />}
                    {f.status === 'pending'   && <div className="w-3 h-3 rounded-full border-2 border-[var(--color-info)] shrink-0" />}
                    {f.status === 'failed'    && <AlertCircle  size={12} className="text-[var(--color-error)] shrink-0" />}
                    <span className={`truncate font-medium ${f.status === 'completed' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                      {f.name}
                    </span>
                  </div>
                  <span className={`shrink-0 ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    f.status === 'completed' ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' :
                    f.status === 'failed'    ? 'bg-[var(--color-error-bg)] text-[var(--color-error)]' :
                    'bg-[var(--color-info-bg)] text-[var(--color-info)]'
                  }`}>
                    {f.status === 'completed' ? (f.candidateName ?? '✓ Done') :
                     f.status === 'failed'    ? 'Failed' : 'New'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Activity log */}
          {activityLog.length > 0 && (
            <div className="mt-2 pt-3 border-t border-[var(--color-border)]/60">
              <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                Recent Auto-Discoveries
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {activityLog.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)]/50">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 size={12} className="text-[var(--color-success)] shrink-0" />
                      <span className="font-medium text-[var(--color-text-primary)] truncate">{item.candidateName}</span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">({item.specialty})</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] shrink-0">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !reconnectMeta ? (
        <div className="mt-4 p-6 sm:p-8 bg-[var(--color-surface-secondary)]/40 border border-dashed border-[var(--color-border)] rounded-xl text-center space-y-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto text-[var(--color-info)] shadow-xs">
            <Folder size={22} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Connect Your Resume Folder
            </h4>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Select your local resumes directory (e.g. <code className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] border text-[11px] font-mono">C:\Recruiting\Resumes\</code>). Permissions persist across browser restarts, and only newly added files will be extracted.
            </p>
          </div>
          <div>
            <button
              onClick={handlePickFolder}
              className="btn btn-primary h-9.5 px-5 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs hover:scale-102 transition-transform"
            >
              <FolderOpen size={14} />
              <span>Select Resume Folder to Watch</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-[var(--color-text-tertiary)]">
            <span className="flex items-center gap-1">✓ PDF, Word &amp; Text</span>
            <span className="flex items-center gap-1">✓ Incremental Scan</span>
            <span className="flex items-center gap-1">✓ 100% Local &amp; Private</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
