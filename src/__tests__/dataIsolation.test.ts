import {
  sanitizeWorkspaceId,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  getScopedStorageKey,
  migrateLegacyStorageIfNeeded,
  getAvailableWorkspaces,
  deleteWorkspaceData,
  workspaceStorageAdapter,
  BASE_STORAGE_KEY,
  DEFAULT_WORKSPACE_ID,
  PRESET_WORKSPACES,
} from '../services/storageService';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

// In-memory mock localStorage for Node testing
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

async function runDataIsolationTests() {
  console.log('\n======================================================');
  console.log('   MULTI-WORKSPACE / DATA ISOLATION ENGINE TESTS     ');
  console.log('======================================================\n');

  // Install mock localStorage
  const mockStorage = new MockLocalStorage();
  // @ts-ignore
  globalThis.localStorage = mockStorage;

  // 1. Workspace ID sanitization
  console.log('[TEST 1] Workspace ID Sanitization');
  assert(sanitizeWorkspaceId() === 'default', 'Empty workspace defaults to "default"');
  assert(sanitizeWorkspaceId(null) === 'default', 'Null workspace defaults to "default"');
  assert(sanitizeWorkspaceId('   ') === 'default', 'Whitespace workspace defaults to "default"');
  assert(sanitizeWorkspaceId('Travel Nursing') === 'travel_nursing', 'Converts spaces to underscores and lowercases');
  assert(sanitizeWorkspaceId('Allied-Health') === 'allied-health', 'Preserves valid hyphens and lowercases');
  assert(sanitizeWorkspaceId('ICU@Division#9!') === 'icu_division_9_', 'Strips illegal punctuation');

  // 2. Scoped key generation
  console.log('\n[TEST 2] Scoped Storage Key Generation');
  assert(getScopedStorageKey('default') === 'talentflow-storage:default', 'Scoped key matches base + workspace');
  assert(getScopedStorageKey('travel-nursing') === 'talentflow-storage:travel-nursing', 'Scoped key matches travel-nursing');

  // 3. Active workspace management
  console.log('\n[TEST 3] Active Workspace Switcher');
  setActiveWorkspaceId('locum-tenens');
  assert(getActiveWorkspaceId() === 'locum-tenens', 'Active workspace switches to "locum-tenens"');
  setActiveWorkspaceId('default');
  assert(getActiveWorkspaceId() === 'default', 'Active workspace switches back to "default"');

  // 4. Data isolation between workspaces
  console.log('\n[TEST 4] Cross-Workspace State Isolation');
  mockStorage.clear();

  // Write candidate dataset in workspace A
  setActiveWorkspaceId('travel-nursing');
  workspaceStorageAdapter.setItem(BASE_STORAGE_KEY, JSON.stringify({
    state: { candidates: [{ id: 'cand-1', name: 'Nurse Sarah' }] }
  }));

  // Switch to workspace B and write different dataset
  setActiveWorkspaceId('allied-health');
  workspaceStorageAdapter.setItem(BASE_STORAGE_KEY, JSON.stringify({
    state: { candidates: [{ id: 'cand-2', name: 'Therapist John' }] }
  }));

  // Verify workspace B reads only its own data
  const alliedData = JSON.parse(workspaceStorageAdapter.getItem(BASE_STORAGE_KEY) || '{}');
  assert(alliedData?.state?.candidates?.[0]?.name === 'Therapist John', 'Workspace "allied-health" reads therapist record');
  assert(alliedData?.state?.candidates?.length === 1, 'Workspace "allied-health" has exactly 1 candidate');

  // Switch back to workspace A and verify zero contamination
  setActiveWorkspaceId('travel-nursing');
  const nursingData = JSON.parse(workspaceStorageAdapter.getItem(BASE_STORAGE_KEY) || '{}');
  assert(nursingData?.state?.candidates?.[0]?.name === 'Nurse Sarah', 'Workspace "travel-nursing" reads nurse record');
  assert(nursingData?.state?.candidates?.length === 1, 'Workspace "travel-nursing" has exactly 1 candidate');

  // 5. Legacy storage lossless migration
  console.log('\n[TEST 5] Legacy Storage Migration');
  mockStorage.clear();
  const legacyPayload = JSON.stringify({
    state: { candidates: [{ id: 'legacy-1', name: 'Legacy Clinician' }] }
  });
  // Simulate an old installation with only un-scoped storage
  mockStorage.setItem(BASE_STORAGE_KEY, legacyPayload);

  migrateLegacyStorageIfNeeded();
  const migrated = mockStorage.getItem(`${BASE_STORAGE_KEY}:${DEFAULT_WORKSPACE_ID}`);
  assert(migrated === legacyPayload, 'Legacy data automatically migrated into scoped default key without loss');

  // 6. Workspace discovery and deletion safety
  console.log('\n[TEST 6] Workspace Discovery & Deletion Protection');
  const available = getAvailableWorkspaces();
  assert(available.includes('default'), 'Available workspaces include "default"');
  assert(available.includes('travel-nursing'), 'Available workspaces include "travel-nursing"');

  // Attempt to delete default workspace (must be prevented)
  deleteWorkspaceData('default');
  assert(mockStorage.getItem(`${BASE_STORAGE_KEY}:${DEFAULT_WORKSPACE_ID}`) !== null, 'Protected: default workspace cannot be deleted');

  // Delete non-default workspace
  deleteWorkspaceData('travel-nursing');
  assert(mockStorage.getItem(`${BASE_STORAGE_KEY}:travel-nursing`) === null, 'Non-default workspace successfully deleted');

  console.log(`\nData isolation tests completed: ${testsPassed} passed, ${testsFailed} failed.`);
  if (testsFailed > 0) process.exit(1);
}

runDataIsolationTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
