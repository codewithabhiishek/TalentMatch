import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Building, FileText, CheckCircle, Edit, Trash2, GitMerge, X, Check } from 'lucide-react';
import { useAppStore } from '../store';
import { JobDetailSkeleton } from '../components/Skeletons';
import { Job } from '../types';

export function JobDetail() {
  const { selectedJobId, jobs, jobMatches, candidates, navigateTo, updateJob, deleteJob, addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    position: '',
    specialty: '',
    facility: '',
    city: '',
    state: '',
    status: 'active' as Job['status'],
    requirements: '',
    description: '',
  });

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, [selectedJobId]);

  const job = jobs.find(j => j.id === selectedJobId);

  useEffect(() => {
    if (job) {
      setEditForm({
        position: job.position,
        specialty: job.specialty,
        facility: job.facility,
        city: job.city,
        state: job.state,
        status: job.status,
        requirements: (job.requirements || []).join('\n'),
        description: job.description,
      });
    }
  }, [job]);

  if (loading) {
    return <JobDetailSkeleton />;
  }

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">Job not found</p>
        <button onClick={() => navigateTo('jobs')} className="mt-2 text-xs text-[var(--color-info)] hover:underline cursor-pointer">Back to Jobs</button>
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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const reqs = editForm.requirements
      .split(/[\n,]+/)
      .map(r => r.trim())
      .filter(Boolean);

    updateJob(job.id, {
      position: editForm.position.trim(),
      specialty: editForm.specialty.trim(),
      facility: editForm.facility.trim(),
      city: editForm.city.trim(),
      state: editForm.state.trim().toUpperCase(),
      status: editForm.status,
      description: editForm.description.trim(),
      requirements: reqs,
    });

    addNotification({
      type: 'success',
      title: 'Job Updated',
      message: `Changes saved for ${editForm.position.trim()}`,
    });

    setIsEditModalOpen(false);
  };

  const handleDeleteJob = () => {
    if (confirm(`Are you sure you want to delete the job "${job.position}"?`)) {
      deleteJob(job.id);
      addNotification({
        type: 'info',
        title: 'Job Position Deleted',
        message: `Removed ${job.position} from requisitions.`,
      });
      navigateTo('jobs');
    }
  };

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigateTo('jobs')}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-3 sm:mb-4 transition-colors cursor-pointer py-1"
      >
        <ArrowLeft size={14} /> Back to Jobs
      </button>

      {/* Header */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 sm:p-5 mb-4 animate-fade-in shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{job.position}</h2>
              <select
                value={job.status}
                onChange={(e) => {
                  const newStatus = e.target.value as any;
                  updateJob(job.id, { status: newStatus });
                  addNotification({
                    type: 'info',
                    title: 'Job Status Updated',
                    message: `${job.position} set to ${newStatus}`,
                  });
                }}
                className={`text-[10px] font-medium px-2 py-0.5 rounded cursor-pointer border border-transparent hover:border-[var(--color-border)] capitalize ${statusColors[job.status]}`}
                title="Change job status"
              >
                <option value="active">active</option>
                <option value="draft">draft</option>
                <option value="filled">filled</option>
                <option value="closed">closed</option>
              </select>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{job.specialty}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--color-text-tertiary)]">
              <span className="flex items-center gap-1"><Building size={11} />{job.facility}</span>
              <span className="flex items-center gap-1"><MapPin size={11} />{job.city}, {job.state}</span>
              <span className="flex items-center gap-1"><Calendar size={11} />Posted {job.postedDate}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]/50">
            <button
              onClick={() => navigateTo('job-matches')}
              className="btn btn-primary h-8 px-3 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="View all matched candidates"
            >
              <GitMerge size={12} />
              <span>All Matches</span>
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn btn-secondary h-8 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Edit size={12} />
              <span>Edit Job</span>
            </button>
            <button
              onClick={handleDeleteJob}
              className="btn btn-destructive h-8 px-2.5 text-xs flex items-center gap-1 cursor-pointer"
              title="Delete job position"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
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
                    className="w-full text-left p-2.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
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

      {/* Edit Job Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Edit Job Requisition</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Modify position details and requirements</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="btn-icon btn-icon-sm"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                  Position Title *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.position}
                  onChange={e => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                    Specialty / Discipline
                  </label>
                  <input
                    type="text"
                    value={editForm.specialty}
                    onChange={e => setEditForm(prev => ({ ...prev, specialty: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as Job['status'] }))}
                    className="input w-full"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="filled">Filled</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.facility}
                  onChange={e => setEditForm(prev => ({ ...prev, facility: e.target.value }))}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={e => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                    State (2 letters) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={editForm.state}
                    onChange={e => setEditForm(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    className="input w-full uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                  Requirements
                </label>
                <textarea
                  rows={2}
                  value={editForm.requirements}
                  onChange={e => setEditForm(prev => ({ ...prev, requirements: e.target.value }))}
                  className="input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                  Job Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input w-full resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={13} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
