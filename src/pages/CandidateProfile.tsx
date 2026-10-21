import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, FileText, Calendar, Edit, Eye, CheckCircle, AlertTriangle, Briefcase } from 'lucide-react';
import { useAppStore } from '../store';
import { ProfileViewSkeleton } from '../components/Skeletons';

export function CandidateProfile() {
  const { selectedCandidateId, candidates, jobMatches, jobs, navigateTo } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, [selectedCandidateId]);

  if (loading) {
    return <ProfileViewSkeleton />;
  }

  const candidate = candidates.find(c => c.id === selectedCandidateId);

  if (!candidate) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">Candidate not found</p>
        <button onClick={() => navigateTo('candidates')} className="mt-2 text-xs text-[var(--color-info)] hover:underline">Back to Candidates</button>
      </div>
    );
  }

  const candidateMatches = jobMatches.filter(m => m.candidateId === candidate.id);
  const matchedJobs = candidateMatches.map(m => ({
    match: m,
    job: jobs.find(j => j.id === m.jobId)!
  })).filter(x => x.job);

  const statusColors: Record<string, string> = {
    new: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    reviewing: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    matched: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    interview: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    placed: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    rejected: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
  };

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 max-w-5xl mx-auto">
      {/* Back nav */}
      <button
        onClick={() => navigateTo('candidates')}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-3 sm:mb-4 transition-colors cursor-pointer py-1"
      >
        <ArrowLeft size={14} /> Back to Candidates
      </button>

      {/* Header */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 sm:p-5 mb-4 animate-fade-in shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center flex-shrink-0 border border-[var(--color-border)]">
              <span className="text-base sm:text-lg font-medium text-[var(--color-text-secondary)]">{candidate.firstName[0]}{candidate.lastName[0]}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] truncate">{candidate.firstName} {candidate.lastName}</h2>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusColors[candidate.status]}`}>{candidate.status}</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{candidate.position} · {candidate.specialty}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-[var(--color-text-tertiary)]">
                <span className="flex items-center gap-1"><Mail size={11} />{candidate.email}</span>
                <span className="flex items-center gap-1"><Phone size={11} />{candidate.phone}</span>
                <span className="flex items-center gap-1"><MapPin size={11} />{candidate.currentLocation}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]/50">
            <button className="btn btn-secondary flex-1 sm:flex-initial text-xs h-8">
              <Edit size={12} /> Edit Profile
            </button>
            <button className="btn btn-secondary flex-1 sm:flex-initial text-xs h-8">
              <Eye size={12} /> Review
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <FileText size={12} className="text-[var(--color-text-tertiary)]" />
            <span>{candidate.resumeFilename}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <Calendar size={12} className="text-[var(--color-text-tertiary)]" />
            <span>Uploaded {candidate.uploadedAt}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <Briefcase size={12} className="text-[var(--color-text-tertiary)]" />
            <span>{candidate.experience} years experience</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Professional Summary */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Professional Summary</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{candidate.professionalSummary}</p>
          </div>

          {/* Experience Timeline */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Experience Timeline</h3>
            <div className="space-y-4">
              {candidate.experienceTimeline.map((exp, idx) => (
                <div key={exp.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'} mt-1`} />
                    {idx < candidate.experienceTimeline.length - 1 && <div className="w-px flex-1 bg-[var(--color-border)] mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">{exp.position}</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">{exp.facility} · {exp.location}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{exp.startDate} — {exp.endDate}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Travel/Work Locations */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Previous Travel/Work Locations</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mb-3">Locations where the candidate has worked or traveled in the past 5 years</p>
            <div className="flex flex-wrap gap-2">
              {candidate.previousTravelLocations.map(loc => (
                <span key={loc} className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)]">
                  <MapPin size={10} /> {loc}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Classification */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Classification</h3>
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Position</p>
                <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">{candidate.position}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Specialty</p>
                <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">{candidate.specialty}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Experience</p>
                <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">{candidate.experience} years</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Current Location</p>
                <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">{candidate.currentLocation}</p>
              </div>
            </div>
          </div>

          {/* Matched Jobs */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Matched Opportunities</h3>
            {matchedJobs.length > 0 ? (
              <div className="space-y-2.5">
                {matchedJobs.map(({ match, job }) => (
                  <button
                    key={match.id}
                    onClick={() => navigateTo('job-detail', undefined, job.id)}
                    className="w-full text-left p-2.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{job.position}</p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">{job.facility}</p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">{job.city}, {job.state}</p>
                      </div>
                      <span className="text-xs font-bold text-[var(--color-text-primary)] flex-shrink-0">{match.score}%</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-tertiary)]">No matches yet</p>
            )}
          </div>

          {/* Extraction Review */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Extraction Review</h3>
            <div className="flex items-start gap-2 mb-3">
              {candidate.verifiedByRecruiter ? (
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                  <CheckCircle size={13} /> Verified by recruiter
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-warning)]">
                  <AlertTriangle size={13} /> Pending review
                </div>
              )}
            </div>
            <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
              This information was extracted from the candidate's resume using automated processing. 
              Fields marked as verified have been reviewed and confirmed by a recruiter.
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2 italic">Demo data — extraction is simulated</p>
          </div>
        </div>
      </div>
    </div>
  );
}
