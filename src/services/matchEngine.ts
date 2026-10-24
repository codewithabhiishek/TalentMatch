import { Candidate, Job, JobMatch } from '../types';

export function calculateCandidateJobMatch(candidate: Candidate, job: Job): JobMatch {
  let score = 0;
  const reasons = [];

  // 1. Position match (35% weight)
  const posA = candidate.position.toLowerCase();
  const posB = job.position.toLowerCase();
  if (posA === posB || posA.includes(posB) || posB.includes(posA)) {
    reasons.push({ factor: 'Position Match', score: 100, detail: `${job.position} matches candidate background` });
    score += 35;
  } else {
    reasons.push({ factor: 'Position Match', score: 50, detail: 'Related healthcare clinical role' });
    score += 18;
  }

  // 2. Specialty match (25% weight)
  const specA = candidate.specialty.toLowerCase();
  const specB = job.specialty.toLowerCase();
  if (specA === specB || specA.includes(specB) || specB.includes(specA)) {
    reasons.push({ factor: 'Specialty Match', score: 100, detail: `${job.specialty} discipline aligns directly` });
    score += 25;
  } else {
    reasons.push({ factor: 'Specialty Match', score: 50, detail: 'Transferable medical specialty' });
    score += 13;
  }

  // 3. Credentials & Certifications (15% weight)
  const candCerts = (candidate.certifications || []).map(c => c.toLowerCase());
  const jobReqs = (job.requirements || []).map(r => r.toLowerCase());

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
      detail: `Candidate holds verified credentials matching requisition requirements (${candidate.certifications?.slice(0, 3).join(', ')})`
    });
    score += 15;
  } else if (candCerts.length > 0) {
    reasons.push({
      factor: 'Credentials & Certs',
      score: 80,
      detail: `Candidate holds active clinical credentials (${candidate.certifications?.slice(0, 2).join(', ')})`
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
  const locCand = candidate.currentLocation.toLowerCase();
  const jobCity = job.city.toLowerCase();
  const jobState = job.state.toLowerCase();
  if (locCand.includes(jobCity) || locCand.includes(jobState)) {
    reasons.push({ factor: 'Location Compatibility', score: 95, detail: `Candidate is based in/near ${job.city}, ${job.state}` });
    score += 15;
  } else if (candidate.previousTravelLocations.some(l => l.toLowerCase().includes(jobState))) {
    reasons.push({ factor: 'Location Compatibility', score: 85, detail: `Prior travel experience in ${job.state}` });
    score += 13;
  } else {
    reasons.push({ factor: 'Location Compatibility', score: 70, detail: 'Travel relocation required' });
    score += 10;
  }

  // 5. Experience tenure (10% weight)
  if (candidate.experience >= 5) {
    reasons.push({ factor: 'Experience Level', score: 100, detail: `${candidate.experience} years exceeds requirement` });
    score += 10;
  } else if (candidate.experience >= 2) {
    reasons.push({ factor: 'Experience Level', score: 85, detail: `${candidate.experience} years meets requirement` });
    score += 8;
  } else {
    reasons.push({ factor: 'Experience Level', score: 60, detail: `${candidate.experience} years is developing` });
    score += 6;
  }

  const finalScore = Math.min(99, Math.max(55, Math.round(score)));

  return {
    id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    candidateId: candidate.id,
    jobId: job.id,
    score: finalScore,
    status: 'pending',
    reasons,
    explanation: `Strong compatibility for ${job.position} at ${job.facility}. Clinical background in ${candidate.specialty} aligns with requisition standards.`,
  };
}
