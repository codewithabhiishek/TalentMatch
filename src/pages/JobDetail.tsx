import { ArrowLeft, MapPin, Calendar, Building, FileText, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store';

export function JobDetail() {
  const { selectedJobId, jobs, jobMatches, candidates, navigateTo } = useAppStore();
  const job = jobs.find(j => j.id === selectedJobId);

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">Job not found</p>
        <button onClick={() => navigateTo('jobs')} className="mt-2 text-xs text-[var(--color-info)] hover:underline">Back to Jobs</button>
      </div>
    );
  }

  const relatedMatches = jobMatches.filter(m => m.jobId === job.id).sort((a, b) => b.score - a.score);
  const matchedCandidates = relatedMatches.map(m => ({
    match: m,
    candidate: candidates.find(c => c.id === m.candidateId)!
  })).filter(x => x.candidate);

  const statusColors: Record<string, string> = {
    active: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    draft: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
    closed: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]',
    filled: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    pending: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    reviewed: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    accepted: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    rejected: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigateTo('jobs')}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Jobs
      </button>

      {/* Header */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 mb-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{job.position}</h2>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusColors[job.status]}`}>{job.status}</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{job.specialty}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--color-text-tertiary)]">
              <span className="flex items-center gap-1"><Building size={11} />{job.facility}</span>
              <span className="flex items-center gap-1"><MapPin size={11} />{job.city}, {job.state}</span>
              <span className="flex items-center gap-1"><Calendar size={11} />Posted {job.postedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <FileText size={12} className="text-[var(--color-text-tertiary)]" />
            <span>Source: {job.sourceFile}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Job Description</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{job.description}</p>
          </div>

          {/* Requirements */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Requirements</h3>
            <div className="space-y-2">
              {job.requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-[var(--color-success)] flex-shrink-0" />
                  <span className="text-xs text-[var(--color-text-secondary)]">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Matched Candidates */}
        <div className="space-y-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Matched Candidates ({matchedCandidates.length})
            </h3>
            {matchedCandidates.length > 0 ? (
              <div className="space-y-2.5">
                {matchedCandidates.map(({ match, candidate }) => (
                  <button
                    key={match.id}
                    onClick={() => navigateTo('candidate-profile', candidate.id)}
                    className="w-full text-left p-2.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--color-text-primary)]">{candidate.firstName} {candidate.lastName}</p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">{candidate.specialty} · {candidate.experience} yrs</p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">{candidate.currentLocation}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-[var(--color-text-primary)]">{match.score}%</span>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">{match.status}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-tertiary)]">No candidate matches yet</p>
            )}
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Job Details</h3>
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Position</p>
                <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">{job.position}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Specialty</p>
                <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">{job.specialty}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Location</p>
                <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">{job.city}, {job.state}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Facility</p>
                <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">{job.facility}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
