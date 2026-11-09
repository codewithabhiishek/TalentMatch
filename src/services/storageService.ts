/**
 * Multi-User / Multi-Workspace Profile Data Isolation Service for TalentMatch ATS.
 * Ensures each recruiter or division operates within their own isolated storage namespace
 * without cross-workspace state collision or data leakage.
 */

export const BASE_STORAGE_KEY = 'talentflow-storage';
export const ACTIVE_WORKSPACE_KEY = 'talentmatch_active_workspace';
export const DEFAULT_WORKSPACE_ID = 'default';

export const PRESET_WORKSPACES = [
  'default',
  'travel-nursing',
  'allied-health',
  'locum-tenens',
] as const;

export function sanitizeWorkspaceId(id?: string | null): string {
  if (!id) return DEFAULT_WORKSPACE_ID;
  const cleaned = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return cleaned || DEFAULT_WORKSPACE_ID;
}

export function getActiveWorkspaceId(): string {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_WORKSPACE_ID;
    return sanitizeWorkspaceId(localStorage.getItem(ACTIVE_WORKSPACE_KEY) || DEFAULT_WORKSPACE_ID);
  } catch {
    return DEFAULT_WORKSPACE_ID;
  }
}

export function setActiveWorkspaceId(workspaceId: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, sanitizeWorkspaceId(workspaceId));
    }
  } catch {
    /* ignore */
  }
}

export function getScopedStorageKey(workspaceId?: string): string {
  const safeId = sanitizeWorkspaceId(workspaceId || getActiveWorkspaceId());
  return `${BASE_STORAGE_KEY}:${safeId}`;
}

export function migrateLegacyStorageIfNeeded(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const legacyData = localStorage.getItem(BASE_STORAGE_KEY);
    const defaultScopedKey = `${BASE_STORAGE_KEY}:${DEFAULT_WORKSPACE_ID}`;
    if (legacyData && !localStorage.getItem(defaultScopedKey)) {
      localStorage.setItem(defaultScopedKey, legacyData);
    }
  } catch {
    /* ignore */
  }
}

export function getAvailableWorkspaces(): string[] {
  const workspaces = new Set<string>(PRESET_WORKSPACES);
  try {
    if (typeof localStorage !== 'undefined') {
      const prefix = `${BASE_STORAGE_KEY}:`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const id = key.slice(prefix.length);
          if (id) workspaces.add(id);
        }
      }
    }
  } catch {
    /* ignore */
  }
  return Array.from(workspaces);
}

export function deleteWorkspaceData(workspaceId: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const safeId = sanitizeWorkspaceId(workspaceId);
    if (safeId === DEFAULT_WORKSPACE_ID) return; // Prevent deleting default
    localStorage.removeItem(getScopedStorageKey(safeId));
    if (getActiveWorkspaceId() === safeId) {
      setActiveWorkspaceId(DEFAULT_WORKSPACE_ID);
    }
  } catch {
    /* ignore */
  }
}

export const workspaceStorageAdapter = {
  getItem: (_name: string): string | null => {
    migrateLegacyStorageIfNeeded();
    const activeId = getActiveWorkspaceId();
    const scopedKey = getScopedStorageKey(activeId);
    return localStorage.getItem(scopedKey);
  },
  setItem: (_name: string, value: string): void => {
    const activeId = getActiveWorkspaceId();
    const scopedKey = getScopedStorageKey(activeId);
    localStorage.setItem(scopedKey, value);
    if (activeId === DEFAULT_WORKSPACE_ID) {
      localStorage.setItem(BASE_STORAGE_KEY, value);
    }
  },
  removeItem: (_name: string): void => {
    const activeId = getActiveWorkspaceId();
    const scopedKey = getScopedStorageKey(activeId);
    localStorage.removeItem(scopedKey);
  },
};

