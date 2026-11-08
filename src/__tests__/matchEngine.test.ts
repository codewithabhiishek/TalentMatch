import { calculateCandidateJobMatch } from '../services/matchEngine';
import { Candidate, Job } from '../types';

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

async function runMatchEngineTests() {
  console.log('\n======================================================');
  console.log('       CLINICAL TALENT MATCH ENGINE TESTS             ');
  console.log('======================================================\n');

  const baseJob: Job = {
    id: 'job-101',
    position: 'Critical Care RN',
    specialty: 'ICU',
    facility: 'Parkland Memorial Hospital',
    city: 'Dallas',
    state: 'TX',
    sourceFile: 'VendorRequisitions.xlsx',
    status: 'active',
    postedDate: '2026-03-01',
    description: 'Level 1 Trauma ICU staffing requisition',
    requirements: ['BLS', 'ACLS', 'CCRN'],
  };

  // 1. High match candidate (Exact role, exact specialty, matching certs, local state, 6 yrs experience)
  console.log('[TEST 1] Prime Candidate High Acuity Match');
  const primeCandidate: Candidate = {
    id: 'cand-prime',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@hospital.org',
    phone: '214-555-0199',
    position: 'Critical Care RN',
    specialty: 'ICU',
    experience: 6,
    currentLocation: 'Dallas, TX',
    previousTravelLocations: ['TX', 'OK'],
    bestMatch: '',
    certifications: ['BLS', 'ACLS', 'CCRN'],
    status: 'matched',
    resumeFilename: 'SarahMitchell_Resume.pdf',
    uploadedAt: '2026-03-01',
    professionalSummary: 'Experienced ICU clinician with extensive critical care background.',
    experienceTimeline: [],
    verifiedByRecruiter: true,
  };

  const primeMatch = calculateCandidateJobMatch(primeCandidate, baseJob);
  assert(primeMatch.score >= 90, `Prime candidate receives high match score (${primeMatch.score}%)`);
  assert(primeMatch.candidateId === 'cand-prime', 'Match records correct candidateId');
  assert(primeMatch.jobId === 'job-101', 'Match records correct jobId');
  assert(primeMatch.reasons.length === 5, 'Match breakdown details all 5 clinical scoring factors');
  assert(primeMatch.status === 'pending', 'Default match status starts as pending');

  // 2. Specialty Synonym Match (e.g. Critical Care synonym for ICU, Staff Nurse synonym for RN)
  console.log('\n[TEST 2] Specialty & Position Synonym Clustering');
  const synonymCandidate: Candidate = {
    id: 'cand-synonym',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.vance@clinic.org',
    phone: '713-555-0144',
    position: 'Staff Nurse',
    specialty: 'Critical Care',
    experience: 4,
    currentLocation: 'Houston, TX',
    previousTravelLocations: ['TX'],
    bestMatch: '',
    certifications: ['BLS', 'ACLS'],
    status: 'new',
    resumeFilename: 'MarcusVance_CV.docx',
    uploadedAt: '2026-03-01',
    professionalSummary: 'Staff nurse specializing in critical care telemetry.',
    experienceTimeline: [],
    verifiedByRecruiter: true,
  };

  const synonymMatch = calculateCandidateJobMatch(synonymCandidate, baseJob);
  assert(synonymMatch.score >= 80, `Synonym candidate scores highly via clinical synonym clusters (${synonymMatch.score}%)`);
  const specialtyReason = synonymMatch.reasons.find(r => r.factor === 'Specialty Match');
  assert(specialtyReason !== undefined && specialtyReason.score === 100, 'Specialty match recognizes "Critical Care" aligns with "ICU"');

  // 3. Different Discipline Candidate
  console.log('\n[TEST 3] Role Discrepancy & Lower Scoring');
  const differentCandidate: Candidate = {
    id: 'cand-pt',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.rostova@therapy.org',
    phone: '206-555-0182',
    position: 'Physical Therapist',
    specialty: 'Orthopedics',
    experience: 2,
    currentLocation: 'Seattle, WA',
    previousTravelLocations: ['WA', 'OR'],
    bestMatch: '',
    certifications: ['BLS'],
    status: 'new',
    resumeFilename: 'ElenaRostova_Resume.pdf',
    uploadedAt: '2026-03-01',
    professionalSummary: 'Staff physical therapist in outpatient sports medicine.',
    experienceTimeline: [],
    verifiedByRecruiter: true,
  };

  const ptMatch = calculateCandidateJobMatch(differentCandidate, baseJob);
  assert(ptMatch.score < 70, `Different clinical role receives lower match score (${ptMatch.score}%)`);
  assert(ptMatch.score >= 35, `Match score respects minimum baseline floor (${ptMatch.score}%)`);

  // 4. Missing/Empty Candidate Fields
  console.log('\n[TEST 4] Edge Cases & Resilient Missing Data Handling');
  const emptyCandidate: Candidate = {
    id: 'cand-empty',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    specialty: '',
    experience: 0,
    currentLocation: '',
    previousTravelLocations: [],
    bestMatch: '',
    status: 'new',
    resumeFilename: '',
    uploadedAt: '2026-03-01',
    professionalSummary: '',
    experienceTimeline: [],
    verifiedByRecruiter: false,
  };

  const emptyMatch = calculateCandidateJobMatch(emptyCandidate, baseJob);
  assert(typeof emptyMatch.score === 'number' && !isNaN(emptyMatch.score), 'Computes score without NaN even with blank fields');
  assert(emptyMatch.score <= 60, 'Blank profile scores reasonably low');
  assert(emptyMatch.explanation.length > 0, 'Generates sanitized clinical explanation');

  console.log(`\nMatch engine tests completed: ${testsPassed} passed, ${testsFailed} failed.`);
  if (testsFailed > 0) process.exit(1);
}

runMatchEngineTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
