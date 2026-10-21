export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  specialty: string;
  experience: number;
  currentLocation: string;
  previousTravelLocations: string[];
  bestMatch: string;
  status: 'new' | 'reviewing' | 'matched' | 'interview' | 'placed' | 'rejected';
  resumeFilename: string;
  uploadedAt: string;
  professionalSummary: string;
  experienceTimeline: ExperienceRecord[];
  verifiedByRecruiter: boolean;
  certifications?: string[];
  confidenceScore?: number;
}

export interface ExperienceRecord {
  id: string;
  position: string;
  facility: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Job {
  id: string;
  position: string;
  specialty: string;
  city: string;
  state: string;
  facility: string;
  sourceFile: string;
  status: 'active' | 'draft' | 'closed' | 'filled';
  postedDate: string;
  description: string;
  requirements: string[];
}

export interface JobMatch {
  id: string;
  candidateId: string;
  jobId: string;
  score: number;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  reasons: MatchReason[];
  explanation: string;
}

export interface MatchReason {
  factor: string;
  score: number;
  detail: string;
}

export interface ImportedFile {
  id: string;
  filename: string;
  type: 'resume' | 'jobs';
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  recordCount: number;
}

export interface ProcessingTask {
  id: string;
  filename: string;
  step: number;
  totalSteps: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  startedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type Page = 'overview' | 'candidates' | 'candidate-profile' | 'jobs' | 'job-detail' | 'job-import' | 'job-matches' | 'resume-import' | 'settings';
