import { Candidate, Job, JobMatch } from '../types';
import { sanitizeInput } from './securityService';

// Clinical specialty synonym clusters for accurate cross-requisition evaluation
const SPECIALTY_SYNONYM_GROUPS: string[][] = [
  ['icu', 'intensive care', 'critical care', 'ccu', 'cvicu', 'neuro icu', 'surgical icu', 'micu', 'sicu'],
  ['emergency', 'er', 'ed', 'trauma', 'emergency department', 'emergency room', 'triage'],
  ['med-surg', 'medical surgical', 'telemetry', 'stepdown', 'step-down', 'pcu', 'progressive care'],
  ['operating room', 'surgery', 'surgical', 'perioperative', 'or', 'pacu', 'post-anesthesia', 'intraoperative'],
  ['pediatrics', 'peds', 'picu', 'children'],
  ['neonatal', 'nicu', 'newborn', 'nursery', 'neonatology'],
  ['labor and delivery', 'l&d', 'postpartum', 'maternity', 'antepartum', 'mother-baby'],
  ['orthopedics', 'ortho', 'sports medicine', 'physical therapy', 'rehabilitation'],
  ['mri', 'radiology', 'imaging', 'radiologic', 'diagnostic imaging'],
  ['cath lab', 'cardiology', 'cardiovascular', 'ep lab', 'electrophysiology'],
  ['oncology', 'cancer', 'chemotherapy', 'hematology', 'infusion'],
  ['dialysis', 'hemodialysis', 'nephrology', 'crrt'],
  ['home health', 'hospice', 'palliative care'],
  ['psychiatry', 'mental health', 'behavioral health', 'psych'],
];

// Clinical position role clusters
const POSITION_SYNONYM_GROUPS: string[][] = [
  ['registered nurse', 'staff nurse', 'rn', 'bsn nurse', 'nurse', 'charge nurse', 'clinical nurse'],
  ['nurse practitioner', 'np', 'fnp', 'arnp', 'aprn', 'family nurse practitioner', 'agacnp'],
  ['physical therapist', 'pt', 'dpt', 'staff physical therapist', 'physiotherapist'],
  ['respiratory therapist', 'rrt', 'crt', 'respiratory care practitioner'],
  ['occupational therapist', 'ot', 'otr/l'],
  ['speech-language pathologist', 'slp', 'speech therapist'],
  ['crna', 'certified registered nurse anesthetist', 'nurse anesthetist'],
  ['physician assistant', 'pa', 'pa-c'],
  ['mri technologist', 'mri tech', 'radiologic technologist', 'rad tech'],
  ['surgical technologist', 'surgical tech', 'scrub tech', 'cst'],
  ['certified nursing assistant', 'cna', 'nursing assistant', 'patient care tech', 'pct'],
  ['licensed practical nurse', 'lpn', 'lvn', 'licensed vocational nurse'],
];

function areSpecialtiesCompatible(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  return SPECIALTY_SYNONYM_GROUPS.some(group => 
    group.some(term => a.includes(term) || term.includes(a)) &&
    group.some(term => b.includes(term) || term.includes(b))
  );
}

function arePositionsCompatible(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  return POSITION_SYNONYM_GROUPS.some(group => 
    group.some(term => a.includes(term) || term.includes(a)) &&
    group.some(term => b.includes(term) || term.includes(b))
  );
}

export function calculateCandidateJobMatch(candidate: Candidate, job: Job): JobMatch {
  let score = 0;
  const reasons: Array<{ factor: string; score: number; detail: string }> = [];

  const safeCandPos = (candidate.position || '').toLowerCase().trim();
  const safeJobPos = (job.position || '').toLowerCase().trim();
  const safeCandSpec = (candidate.specialty || '').toLowerCase().trim();
  const safeJobSpec = (job.specialty || '').toLowerCase().trim();
  const safeCandLoc = (candidate.currentLocation || '').toLowerCase().trim();
  const safeJobCity = (job.city || '').toLowerCase().trim();
  const safeJobState = (job.state || '').toLowerCase().trim();

  // 1. Position match (35% weight)
  if (safeCandPos === safeJobPos || (safeCandPos && safeJobPos && (safeCandPos.includes(safeJobPos) || safeJobPos.includes(safeCandPos)))) {
    reasons.push({ factor: 'Position Match', score: 100, detail: `${job.position} matches candidate background` });
    score += 35;
  } else if (arePositionsCompatible(safeCandPos, safeJobPos)) {
    reasons.push({ factor: 'Position Match', score: 90, detail: `${job.position} — compatible clinical role tier` });
    score += 31;
  } else {
    reasons.push({ factor: 'Position Match', score: 40, detail: 'Different clinical discipline — role transfer required' });
    score += 10;
  }

  // 2. Specialty match (25% weight)
  const isUnknownSpec = safeCandSpec === 'general' || safeCandSpec === '';
  if (isUnknownSpec) {
    reasons.push({ factor: 'Specialty Match', score: 40, detail: 'Specialty not confirmed from resume — manual verification required' });
    score += 8;
  } else if (safeCandSpec === safeJobSpec || areSpecialtiesCompatible(safeCandSpec, safeJobSpec)) {
    reasons.push({ factor: 'Specialty Match', score: 100, detail: `${job.specialty} specialty aligns directly` });
    score += 25;
  } else {
    reasons.push({ factor: 'Specialty Match', score: 55, detail: 'Transferable healthcare discipline' });
    score += 14;
  }

  // 3. Credentials & Certifications (15% weight)
  const candCerts = (Array.isArray(candidate.certifications) ? candidate.certifications : [])
    .map(c => (c || '').toLowerCase().trim())
    .filter(Boolean);
  const jobReqs = (Array.isArray(job.requirements) ? job.requirements : [])
    .map(r => (r || '').toLowerCase().trim())
    .filter(Boolean);

  let certMatches = 0;
  for (const cert of candCerts) {
    if (jobReqs.some(req => req.includes(cert) || cert.includes(req))) {
      certMatches++;
    }
  }

  if (candCerts.length > 0 && certMatches > 0) {
    reasons.push({
      factor: 'Credentials & Certs',
      score: Math.min(100, 75 + (certMatches * 15)),
      detail: `Candidate holds verified credentials matching requisition requirements (${(candidate.certifications || []).slice(0, 3).join(', ')})`
    });
    score += 15;
  } else if (candCerts.length > 0) {
    reasons.push({
      factor: 'Credentials & Certs',
      score: 80,
      detail: `Candidate holds active clinical credentials (${(candidate.certifications || []).slice(0, 2).join(', ')})`
    });
    score += 12;
  } else {
    reasons.push({
      factor: 'Credentials & Certs',
      score: 50,
      detail: 'Standard clinical credentialing verification required'
    });
    score += 8;
  }

  // 4. Location match (15% weight)
  const travelLocations = (Array.isArray(candidate.previousTravelLocations) ? candidate.previousTravelLocations : [])
    .map(l => (l || '').toLowerCase().trim());

  if ((safeJobCity && safeCandLoc.includes(safeJobCity)) || (safeJobState && safeCandLoc.includes(safeJobState))) {
    reasons.push({ factor: 'Location Compatibility', score: 95, detail: `Candidate is based in/near ${job.city || 'local area'}, ${job.state || ''}` });
    score += 15;
  } else if (safeJobState && travelLocations.some(l => l.includes(safeJobState))) {
    reasons.push({ factor: 'Location Compatibility', score: 85, detail: `Prior travel experience in ${job.state}` });
    score += 13;
  } else {
    reasons.push({ factor: 'Location Compatibility', score: 70, detail: 'Travel relocation required' });
    score += 10;
  }

  // 5. Experience tenure (10% weight)
  const expYears = typeof candidate.experience === 'number' && !isNaN(candidate.experience) ? candidate.experience : 1;
  if (expYears >= 5) {
    reasons.push({ factor: 'Experience Level', score: 100, detail: `${expYears} years exceeds requirement` });
    score += 10;
  } else if (expYears >= 2) {
    reasons.push({ factor: 'Experience Level', score: 85, detail: `${expYears} years meets requirement` });
    score += 8;
  } else {
    reasons.push({ factor: 'Experience Level', score: 60, detail: `${expYears} years is developing` });
    score += 6;
  }

  const finalScore = Math.min(99, Math.max(35, Math.round(score)));

  return {
    id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    candidateId: candidate.id,
    jobId: job.id,
    score: finalScore,
    status: 'pending',
    reasons,
    explanation: sanitizeInput(`Strong compatibility for ${job.position || 'Requisition'} at ${job.facility || 'Healthcare Facility'}. Clinical background in ${candidate.specialty || 'specialty'} aligns with requisition standards.`, 300),
  };
}
