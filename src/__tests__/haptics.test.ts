import { triggerHaptic, isHapticsSupported, haptics, HAPTIC_PATTERNS } from '../services/hapticsService';

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

async function runHapticsTests() {
  console.log('\n======================================================');
  console.log('       TACTILE HAPTIC FEEDBACK ENGINE TESTS          ');
  console.log('======================================================\n');

  // Backup original global navigator
  const originalNavigator = globalThis.navigator;

  // 1. SSR / Non-supporting environment
  console.log('[TEST 1] Non-supporting environment handling');
  // @ts-ignore
  delete globalThis.navigator;
  assert(!isHapticsSupported(), 'isHapticsSupported() returns false when navigator is undefined');
  assert(!triggerHaptic(10), 'triggerHaptic() returns false cleanly when navigator is undefined without throwing');

  // 2. Mocking navigator with vibrate
  console.log('\n[TEST 2] Vibration execution with mock navigator');
  let vibrateCalls: (number | number[])[] = [];
  const mockNavigator = {
    vibrate: (pattern: number | number[]) => {
      vibrateCalls.push(pattern);
      return true;
    },
  };
  // @ts-ignore
  globalThis.navigator = mockNavigator;

  assert(isHapticsSupported(), 'isHapticsSupported() returns true when navigator.vibrate is defined');

  // Test individual trigger calls
  triggerHaptic(15);
  assert(vibrateCalls.length === 1 && vibrateCalls[0] === 15, 'triggerHaptic(15) invokes navigator.vibrate with 15');

  triggerHaptic([20, 40, 20]);
  assert(vibrateCalls.length === 2 && JSON.stringify(vibrateCalls[1]) === JSON.stringify([20, 40, 20]), 'triggerHaptic([20, 40, 20]) invokes navigator.vibrate with pattern');

  // 3. Named pattern triggers
  console.log('\n[TEST 3] Named helper methods');
  vibrateCalls = [];
  haptics.tap();
  assert(JSON.stringify(vibrateCalls[0]) === JSON.stringify(HAPTIC_PATTERNS.tap), 'haptics.tap() invokes correct micro-pulse');

  haptics.select();
  assert(JSON.stringify(vibrateCalls[1]) === JSON.stringify(HAPTIC_PATTERNS.select), 'haptics.select() invokes correct pattern');

  haptics.match();
  assert(JSON.stringify(vibrateCalls[2]) === JSON.stringify(HAPTIC_PATTERNS.match), 'haptics.match() invokes correct pattern');

  haptics.accept();
  assert(JSON.stringify(vibrateCalls[3]) === JSON.stringify(HAPTIC_PATTERNS.accept), 'haptics.accept() invokes correct pattern');

  haptics.reject();
  assert(JSON.stringify(vibrateCalls[4]) === JSON.stringify(HAPTIC_PATTERNS.reject), 'haptics.reject() invokes correct pattern');

  haptics.copy();
  assert(JSON.stringify(vibrateCalls[5]) === JSON.stringify(HAPTIC_PATTERNS.copy), 'haptics.copy() invokes correct pattern');

  haptics.error();
  assert(JSON.stringify(vibrateCalls[6]) === JSON.stringify(HAPTIC_PATTERNS.error), 'haptics.error() invokes correct pattern');

  haptics.delete();
  assert(JSON.stringify(vibrateCalls[7]) === JSON.stringify(HAPTIC_PATTERNS.delete), 'haptics.delete() invokes correct pattern');

  // 4. Exception resilience
  console.log('\n[TEST 4] Exception resilience');
  // @ts-ignore
  globalThis.navigator = {
    vibrate: () => {
      throw new Error('Hardware vibration locked by security policy');
    },
  };
  const result = triggerHaptic(10);
  assert(result === false, 'triggerHaptic handles hardware exceptions gracefully and returns false');

  // Restore navigator
  // @ts-ignore
  globalThis.navigator = originalNavigator;

  console.log(`\nHaptics tests completed: ${testsPassed} passed, ${testsFailed} failed.`);
  if (testsFailed > 0) process.exit(1);
}

runHapticsTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
