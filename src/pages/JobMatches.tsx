import { useState, useMemo } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAppStore } from '../store';

const matchStatuses = ['All', 'pending', 'reviewed', 'accepted', 'rejected'];

export function JobMatches() {
  const { jobMatches, candidates, jobs, navigateTo, updateMatchStatus } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 8;

  const specialties = ['All', ...Array.from(new Set(candidates.map(c => c.specialty)))];

  const enrichedMatches = useMemo(() => {
    let result = jobMatches.map(m => ({
      ...m,
      candidate: candidates.find(c => c.id === m.candidateId),
      job: jobs.find(j => j.id === m.jobId),
    })).filter(m => m.candidate && m.job);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        `${m.candidate!.firstName} ${m.candidate!.lastName}`.toLowerCase().includes(q) ||
        m.job!.position.toLowerCase().includes(q) ||
        m.job!.facility.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') result = result.filter(m => m.status === statusFilter);
    if (specialtyFilter !== 'All') result = result.filter(m => m.candidate!.specialty === specialtyFilter);

    return result.sort((a, b) => b.score - a.score);
  }, [jobMatches, candidates, jobs, search, statusFilter, specialtyFilter]);

  const totalPages = Math.ceil(enrichedMatches.length / perPage);
  const paginated = enrichedMatches.slice((page - 1) * perPage, page * perPage);

  const statusColors: Record<string, string> = {
    pending: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    reviewed: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    accepted: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    rejected: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending': return <Clock size={11} />;
      case 'reviewed': return <Eye size={11} />;
      case 'accepted': return <CheckCircle size={11} />;
      case 'rejected': return <XCircle size={11} />;
      default: return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[var(--color-success)]';
    if (score >= 75) return 'text-[var(--color-text-primary)]';
    if (score >= 60) return 'text-[var(--color-warning)]';
    return 'text-[var(--color-error)]';
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Job Matches</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Review candidate-to-job matches with explainable scoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 bg-[var(--color-warning-bg)] text-[var(--color-warning)] rounded font-medium">
            Demo scores — not scientifically validated predictions
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by candidate, position, facility..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input w-full h-9 pl-9 pr-3 text-sm placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-[var(--color-text-tertiary)]" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="input h-9 px-3 text-sm cursor-pointer"
            >
              {matchStatuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <select
            value={specialtyFilter}
            onChange={e => { setSpecialtyFilter(e.target.value); setPage(1); }}
            className="input h-9 px-3 text-sm cursor-pointer"
          >
            {specialties.map(s => <option key={s} value={s}>{s === 'All' ? 'All Specialties' : s}</option>)}
          </select>
        </div>
      </div>

      {/* Match list */}
      <div className="space-y-2">
        {paginated.map((m, idx) => (
          <div
            key={m.id}
            className="card hover-lift overflow-hidden animate-fade-in"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            {/* Main row - restructured for proper alignment */}
            <div className="p-3">
              {/* Top section: Score + Info + Status */}
              <div className="flex items-center gap-3">
                {/* Score */}
                <div className="w-11 h-11 rounded-lg bg-[var(--color-surface-secondary)] flex items-center justify-center flex-shrink-0 border border-[var(--color-border)]">
                  <span className={`text-sm font-bold ${getScoreColor(m.score)}`}>{m.score}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigateTo('candidate-profile', m.candidate!.id)}
                      className="text-xs font-medium text-[var(--color-text-primary)] hover:underline transition-colors"
                    >
                      {m.candidate!.firstName} {m.candidate!.lastName}
                    </button>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">→</span>
                    <button
                      onClick={() => navigateTo('job-detail', undefined, m.job!.id)}
                      className="text-xs font-medium text-[var(--color-text-primary)] hover:underline transition-colors"
                    >
                      {m.job!.position}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                    <span>{m.candidate!.specialty} / {m.job!.specialty}</span>
                    <span>{m.job!.city}, {m.job!.state}</span>
                    <span>{m.candidate!.experience} yrs exp</span>
                  </div>
                </div>

                {/* Status badge */}
                <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${statusColors[m.status]}`}>
                  <StatusIcon status={m.status} /> {m.status}
                </span>
              </div>

              {/* Action buttons row - properly aligned */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setExpandedMatch(expandedMatch === m.id ? null : m.id)}
                  className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                  {expandedMatch === m.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Details
                </button>
                {m.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateMatchStatus(m.id, 'accepted')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-success-bg)] text-[var(--color-success)] rounded-md hover:bg-[var(--color-success)] hover:text-white transition-all duration-150 btn-hover"
                    >
                      <CheckCircle size={12} /> Accept
                    </button>
                    <button
                      onClick={() => updateMatchStatus(m.id, 'rejected')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-md hover:bg-[var(--color-error)] hover:text-white transition-all duration-150 btn-hover"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </>
                )}
                {m.status === 'reviewed' && (
                  <button
                    onClick={() => updateMatchStatus(m.id, 'accepted')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-success-bg)] text-[var(--color-success)] rounded-md hover:bg-[var(--color-success)] hover:text-white transition-all duration-150 btn-hover"
                  >
                    <CheckCircle size={12} /> Accept
                  </button>
                )}
                {m.status === 'accepted' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-success)]">
                    <CheckCircle size={12} /> Matched
                  </span>
                )}
                {m.status === 'rejected' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-error)]">
                    <XCircle size={12} /> Rejected
                  </span>
                )}
              </div>
            </div>

            {/* Expanded details */}
            {expandedMatch === m.id && (
              <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-surface-secondary)]/50 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Match breakdown */}
                  <div>
                    <h4 className="text-xs font-medium text-[var(--color-text-primary)] mb-2">Match Breakdown</h4>
                    <div className="space-y-2">
                      {m.reasons.map((r, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-12 flex-shrink-0">
                            <div className="h-1.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${r.score >= 85 ? 'bg-[var(--color-success)]' : r.score >= 60 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-error)]'}`}
                                style={{ width: `${r.score}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium text-[var(--color-text-primary)]">{r.factor}</span>
                              <span className="text-[10px] text-[var(--color-text-tertiary)]">{r.score}%</span>
                            </div>
                            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{r.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <h4 className="text-xs font-medium text-[var(--color-text-primary)] mb-2">Explanation</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{m.explanation}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => navigateTo('candidate-profile', m.candidate!.id)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface)] transition-all duration-150 btn-hover"
                      >
                        <ExternalLink size={9} /> View Candidate
                      </button>
                      <button
                        onClick={() => navigateTo('job-detail', undefined, m.job!.id)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface)] transition-all duration-150 btn-hover"
                      >
                        <ExternalLink size={9} /> View Job
                      </button>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] mt-3 italic">
                      These scores are generated from demo data for illustration purposes. They do not represent validated predictions.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, enrichedMatches.length)} of {enrichedMatches.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} onClick={() => setPage(i + 1)} className={`w-9 h-9 text-sm font-medium rounded-md transition-all duration-150 btn-hover ${page === i + 1 ? 'bg-[var(--color-primary)] text-[var(--color-surface)]' : 'hover:bg-[var(--color-surface-tertiary)]'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      )}

      {enrichedMatches.length === 0 && (
        <div className="text-center py-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg animate-fade-in">
          <p className="text-sm text-[var(--color-text-secondary)]">No matches found</p>
          <button onClick={() => { setSearch(''); setStatusFilter('All'); setSpecialtyFilter('All'); }} className="mt-2 text-xs text-[var(--color-info)] hover:underline">Clear filters</button>
        </div>
      )}
    </div>
  );
}
