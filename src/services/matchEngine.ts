import { Candidate, Job, JobMatch } from '../types';

export function calculateCandidateJobMatch(candidate: Candidate, job: Job): JobMatch {
  let score = 0;
  const reasons = [];

  // 1. Position match (40% weight)
  const posA = candidate.position.toLowerCase();
  const posB = job.position.toLowerCase();
  if (posA === posB || posA.includes(posB) || posB.includes(posA)) {
    reasons.push({ factor: 'Position Match', score: 100, detail: `${job.position} matches candidate background` });
    score += 40;
  } else {
    reasons.push({ factor: 'Position Match', score: 50, detail: 'Related healthcare clinical role' });
    score += 20;
  }

  // 2. Specialty match (30% weight)
  const specA = candidate.specialty.toLowerCase();
  const specB = job.specialty.toLowerCase();
  if (specA === specB || specA.includes(specB) || specB.includes(specA)) {
    reasons.push({ factor: 'Specialty Match', score: 100, detail: `${job.specialty} discipline aligns directly` });
    score += 30;
  } else {
    reasons.push({ factor: 'Specialty Match', score: 50, detail: 'Transferable medical specialty' });
    score += 15;
  }

  // 3. Location match (20% weight)
  const locCand = candidate.currentLocation.toLowerCase();
  const jobCity = job.city.toLowerCase();
  const jobState = job.state.toLowerCase();
  if (locCand.includes(jobCity) || locCand.includes(jobState)) {
    reasons.push({ factor: 'Location Compatibility', score: 95, detail: `Candidate is based in/near ${job.city}, ${job.state}` });
    score += 20;
  } else if (candidate.previousTravelLocations.some(l => l.toLowerCase().includes(jobState))) {
    reasons.push({ factor: 'Location Compatibility', score: 85, detail: `Prior travel experience in ${job.state}` });
    score += 17;
  } else {
    reasons.push({ factor: 'Location Compatibility', score: 70, detail: 'Travel relocation required' });
    score += 14;
  }

  // 4. Experience tenure (10% weight)
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

  const finalScore = Math.min(98, Math.max(55, score));

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
