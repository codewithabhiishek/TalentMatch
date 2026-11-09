import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testFiles = [
  'src/__tests__/haptics.test.ts',
  'src/__tests__/dataIsolation.test.ts',
  'src/__tests__/matchEngine.test.ts',
];

console.log('======================================================');
console.log('       TALENTMATCH AUTOMATED UNIT TEST RUNNER         ');
console.log('======================================================');

let allPassed = true;

for (const testFile of testFiles) {
  const fullPath = resolve(__dirname, testFile);
  console.log(`\n▶ Running: ${testFile}`);
  const result = spawnSync('npx', ['tsx', fullPath], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname,
  });

  if (result.status !== 0) {
    console.error(`\n❌ Test suite failed: ${testFile} (exit code ${result.status})`);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('\n======================================================');
  console.log('  🎉 ALL AUTOMATED TEST SUITES PASSED (100% SUCCESS)  ');
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.error('\n❌ Test execution failed.');
  process.exit(1);
}

