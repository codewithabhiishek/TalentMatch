// Service for scanning and live-watching local resume folders on Windows and all desktop environments.
// Uses File System Access API (showDirectoryPicker) in Chromium/Edge/Electron with directory input fallback.

import { extractDocumentText } from './documentParser';
import { parseResumeWithAI, AIConfig } from './aiExtractionService';
import { Candidate } from '../types';

export interface DiscoveredResume {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'skipped' | 'failed';
  error?: string;
  candidate?: Candidate;
  candidateName?: string;
  specialty?: string;
}

export interface WatchedFolderInfo {
  name: string;
  isWatching: boolean;
  lastScanTime: string;
  totalFound: number;
  processedCount: number;
  autoSync: boolean;
  scanIntervalSeconds: number;
}

const STORAGE_KEY_PROCESSED = 'talentflow_processed_resumes_manifest';

export class FolderWatcherService {
  private dirHandle: any = null;
  private timerId: any = null;
  private isScanning = false;
  private processedSignatures = new Set<string>();
  private onNewFileCallback?: (file: DiscoveredResume) => void;
  private onBatchCompleteCallback?: (count: number) => void;
  private onStatusChangeCallback?: (status: WatchedFolderInfo) => void;

  constructor() {
    this.loadProcessedManifest();
  }

  private loadProcessedManifest() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROCESSED);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          this.processedSignatures = new Set(arr);
        }
      }
    } catch {
      this.processedSignatures = new Set();
    }
  }

  private saveProcessedManifest() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PROCESSED, JSON.stringify(Array.from(this.processedSignatures)));
    } catch {
      // quota or private mode
    }
  }

  public isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  public getDirectoryHandle(): any {
    return this.dirHandle;
  }

  /**
   * Prompts the user to pick a folder on their Windows laptop or local system.
   */
  public async pickDirectory(): Promise<{ name: string; files: DiscoveredResume[] }> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error(
        'Folder Access API is not supported on this browser. Please use Microsoft Edge, Google Chrome, or run in the Desktop App.'
      );
    }

    try {
      this.dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
        startIn: 'documents',
      });

      const files = await this.scanFiles();
      return {
        name: this.dirHandle.name,
        files,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Folder selection was cancelled.');
      }
      throw err;
    }
  }

  /**
   * Set directory handle directly (e.g. from state or drag-drop directory)
   */
  public setDirectoryHandle(handle: any) {
    this.dirHandle = handle;
  }

  /**
   * Recursively scans directory for supported resumes (.pdf, .docx, .doc, .txt)
   */
  public async scanFiles(): Promise<DiscoveredResume[]> {
    if (!this.dirHandle) return [];

    const discovered: DiscoveredResume[] = [];
    const validExtensions = ['pdf', 'doc', 'docx', 'txt'];

    const readEntries = async (handle: any) => {
      try {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const ext = entry.name.split('.').pop()?.toLowerCase();
            if (ext && validExtensions.includes(ext)) {
              try {
                const file: File = await entry.getFile();
                const sig = `${file.name}_${file.size}_${file.lastModified}`;
                const isAlreadyProcessed = this.processedSignatures.has(sig);

                discovered.push({
                  id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  name: file.name,
                  size: file.size,
                  lastModified: file.lastModified,
                  file,
                  status: isAlreadyProcessed ? 'completed' : 'pending',
                });
              } catch (e) {
                console.warn(`Could not read file ${entry.name}:`, e);
              }
            }
          } else if (entry.kind === 'directory') {
            // Traverse subfolder
            try {
              await readEntries(entry);
            } catch (subErr) {
              console.warn(`Could not traverse folder ${entry.name}:`, subErr);
            }
          }
        }
      } catch (err) {
        console.error('Error scanning folder handle:', err);
      }
    };

    await readEntries(this.dirHandle);
    return discovered;
  }

  /**
   * Starts live watching the folder at regular intervals.
   * Auto-processes newly detected resumes.
   */
  public startWatching(
    aiConfig: AIConfig,
    onNewCandidate: (candidate: Candidate, fileName: string) => void,
    intervalSeconds = 5
  ) {
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    if (!this.dirHandle) {
      throw new Error('No folder connected to watch.');
    }

    // Request notification permission if not yet granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    this.timerId = setInterval(async () => {
      if (this.isScanning || !this.dirHandle) return;
      this.isScanning = true;

      try {
        const currentFiles = await this.scanFiles();
        const pendingFiles = currentFiles.filter(f => {
          const sig = `${f.file.name}_${f.file.size}_${f.file.lastModified}`;
          return !this.processedSignatures.has(sig);
        });

        if (pendingFiles.length > 0) {
          console.log(`[FolderWatcher] Found ${pendingFiles.length} new resume(s) in watched folder!`);

          for (const item of pendingFiles) {
            try {
              const sig = `${item.file.name}_${item.file.size}_${item.file.lastModified}`;
              const text = await extractDocumentText(item.file);
              if (text && text.trim().length > 0) {
                const result = await parseResumeWithAI(text, item.file.name, aiConfig);
                this.processedSignatures.add(sig);
                this.saveProcessedManifest();

                onNewCandidate(result.candidate, item.file.name);

                // Desktop OS notification if supported
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  new Notification('New Candidate Analyzed', {
                    body: `${result.candidate.firstName} ${result.candidate.lastName} (${result.candidate.specialty}) parsed from ${item.file.name}`,
                    icon: '/favicon.svg',
                  });
                }
              }
            } catch (parseErr) {
              console.error(`Failed to auto-process ${item.name}:`, parseErr);
            }
          }
        }
      } catch (scanErr) {
        console.warn('[FolderWatcher] Scan iteration failed:', scanErr);
      } finally {
        this.isScanning = false;
      }
    }, intervalSeconds * 1000);
  }

  public stopWatching() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public isWatching(): boolean {
    return this.timerId !== null;
  }

  public markSignatureProcessed(file: File) {
    const sig = `${file.name}_${file.size}_${file.lastModified}`;
    this.processedSignatures.add(sig);
    this.saveProcessedManifest();
  }

  public resetManifest() {
    this.processedSignatures.clear();
    this.saveProcessedManifest();
  }
}

export const folderWatcherInstance = new FolderWatcherService();
