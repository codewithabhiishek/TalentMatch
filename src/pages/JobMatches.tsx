import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, ExternalLink, X, MapPin, User, Briefcase } from 'lucide-react';
import { useAppStore } from '../store';
import { MatchCardsSkeleton } from '../components/Skeletons';

const matchStatuses = ['All', 'pending', 'reviewed', 'accepted', 'rejected'];

export function JobMatches() {
  const { jobMatches, candidates, jobs, navigateTo, updateMatchStatus } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const perPage = 8;

  const hasActiveFilters = statusFilter !== 'All' || specialtyFilter !== 'All';

  const resetFilters = () => {
    setStatusFilter('All');
    setSpecialtyFilter('All');
    setPage(1);
  };

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, [search, statusFilter, specialtyFilter, page]);

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

  const statusBadgeClass: Record<string, string> = {
    pending: 'badge-warning',
    reviewed: 'badge-info',
    accepted: 'badge-success',
    rejected: 'badge-error',
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
    <div className="p-3.5 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">Job Matches</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Review candidate-to-job matches with explainable scoring</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="badge badge-warning text-[10px] py-1 px-2.5 font-medium">
            Demo scores — not scientifically validated predictions
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="toolbar-root animate-fade-in" style={{ animationDelay: '60ms' }}>
        <div className="toolbar-search-wrapper">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="text"
            placeholder="Search by candidate, position, facility..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="toolbar-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setPage(1); }}
              className="toolbar-clear-btn"
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="toolbar-controls-group">
          <button
            type="button"
            onClick={hasActiveFilters ? resetFilters : undefined}
            className={`toolbar-filter-btn ${hasActiveFilters ? 'is-active' : ''}`}
            title={hasActiveFilters ? 'Filters active — click to reset' : 'Filter options'}
            aria-label={hasActiveFilters ? 'Reset active filters' : 'Filter options'}
          >
            <Filter size={15} />
            {hasActiveFilters && <span className="toolbar-filter-badge" />}
          </button>
          <div className="toolbar-select-wrapper">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="toolbar-select"
              aria-label="Filter by match status"
            >
              {matchStatuses.map(s => (
                <option key={s} value={s} className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                  {s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="toolbar-chevron-icon" />
          </div>
          <div className="toolbar-select-wrapper">
            <select
              value={specialtyFilter}
              onChange={e => { setSpecialtyFilter(e.target.value); setPage(1); }}
              className="toolbar-select"
              aria-label="Filter by specialty"
            >
              {specialties.map(s => (
                <option key={s} value={s} className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                  {s === 'All' ? 'All Specialties' : s}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="toolbar-chevron-icon" />
          </div>
        </div>
      </div>

      {/* Match list */}
      {loading ? (
        <MatchCardsSkeleton count={Math.min(perPage, Math.max(paginated.length, 4))} />
      ) : (
        <div className="space-y-2">
        {paginated.map((m, idx) => (
          <div
            key={m.id}
            className="card hover-lift overflow-hidden animate-fade-in"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            {/* Main row - compact, scannable, single line on desktop */}
            <div className="p-3 sm:py-2.5 sm:px-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Score + Candidate/Job Info Hierarchy */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Score */}
                <div 
                  className="w-9 h-9 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex flex-col items-center justify-center flex-shrink-0"
                  title={`Match Score: ${m.score}%`}
                >
                  <span className={`text-xs font-bold leading-none ${getScoreColor(m.score)}`}>{m.score}</span>
                  <span className="text-[8px] text-[var(--color-text-tertiary)] font-medium leading-none mt-0.5">%</span>
                </div>

                {/* Candidate & Job Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => navigateTo('candidate-profile', m.candidate!.id)}
                      className="text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-info)] truncate transition-colors text-left"
                    >
                      {m.candidate!.firstName} {m.candidate!.lastName}
                    </button>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">→</span>
                    <button
                      onClick={() => navigateTo('job-detail', undefined, m.job!.id)}
                      className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] truncate transition-colors text-left"
                    >
                      {m.job!.position}
                    </button>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] hidden sm:inline">at</span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] truncate hidden sm:inline">{m.job!.facility}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                    <span className="font-medium text-[var(--color-text-secondary)]">{m.candidate!.specialty}</span>
                    <span>•</span>
                    <span>{m.job!.city}, {m.job!.state}</span>
                    <span>•</span>
                    <span>{m.candidate!.experience} yrs exp</span>
                  </div>
                </div>
              </div>

              {/* Action buttons + Status badge row */}
              <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--color-border)]/60">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setExpandedMatch(expandedMatch === m.id ? null : m.id)}
                    className={`btn btn-secondary btn-sm ${expandedMatch === m.id ? 'bg-[var(--color-surface-tertiary)]' : ''}`}
                    aria-expanded={expandedMatch === m.id}
                  >
                    {expandedMatch === m.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    <span>{expandedMatch === m.id ? 'Hide' : 'Details'}</span>
                  </button>
                  {m.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateMatchStatus(m.id, 'accepted')}
                        className="btn btn-success btn-sm"
                        title="Accept Match"
                      >
                        <CheckCircle size={12} />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => updateMatchStatus(m.id, 'rejected')}
                        className="btn btn-destructive btn-sm"
                        title="Reject Match"
                      >
                        <XCircle size={12} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {m.status === 'reviewed' && (
                    <button
                      onClick={() => updateMatchStatus(m.id, 'accepted')}
                      className="btn btn-success btn-sm"
                      title="Accept Match"
                    >
                      <CheckCircle size={12} />
                      <span>Accept</span>
                    </button>
                  )}
                </div>

                {/* Status badge anchored on the far right */}
                <span className={`badge ${statusBadgeClass[m.status] || 'badge-neutral'} flex items-center gap-1 text-[10px] font-medium h-6 px-2 rounded flex-shrink-0 ml-1`}>
                  <StatusIcon status={m.status} />
                  <span className="capitalize">{m.status}</span>
                </span>
              </div>
            </div>

            {/* Expanded details */}
            {expandedMatch === m.id && (
              <div className="border-t border-[var(--color-border)] p-4 sm:p-5 bg-[var(--color-surface-secondary)]/40 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                  {/* Left Column: Match Breakdown */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border)]/50">
                      <h4 className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                        <span>Match Breakdown</span>
                        <span className="text-[10px] font-normal text-[var(--color-text-tertiary)]">({m.reasons.length} criteria)</span>
                      </h4>
                      <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">Fit Score</span>
                    </div>

                    <div className="space-y-2.5">
                      {m.reasons.map((r, idx) => {
                        const isStrong = r.score >= 85;
                        const isPartial = r.score >= 70 && r.score < 85;
                        const barColor = isStrong ? 'bg-[var(--color-success)]' : isPartial ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-error)]';
                        const scoreTextColor = isStrong ? 'text-[var(--color-success)]' : isPartial ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]';

                        return (
                          <div key={idx} className="bg-[var(--color-surface)] border border-[var(--color-border)]/70 rounded-lg p-2.5 transition-colors">
                            <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                              <span className="text-[var(--color-text-primary)]">{r.factor}</span>
                              <span className={`font-semibold tabular-nums text-xs ${scoreTextColor}`}>{r.score}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden mb-1.5">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                style={{ width: `${Math.min(100, Math.max(0, r.score))}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-[var(--color-text-tertiary)] leading-tight">{r.detail}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Decision Analysis, Highlights & Actions */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="pb-1.5 border-b border-[var(--color-border)]/50">
                        <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">
                          Recruiter Decision Analysis
                        </h4>
                      </div>

                      {/* Reasoning Text Block */}
                      <div className="bg-[var(--color-surface)] border border-[var(--color-border)]/70 rounded-lg p-3">
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                          {m.explanation}
                        </p>
                      </div>

                      {/* Key Highlights / Callouts */}
                      <div className="space-y-2">
                        {/* Top Strength Callout */}
                        {(() => {
                          const topStrength = [...m.reasons].sort((a, b) => b.score - a.score)[0];
                          if (!topStrength || topStrength.score < 85) return null;
                          return (
                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--color-success-bg)]/50 border border-[var(--color-success)]/20 text-xs">
                              <CheckCircle2 size={14} className="text-[var(--color-success)] shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="font-semibold text-[var(--color-text-primary)]">Key Strength: </span>
                                <span className="text-[var(--color-text-secondary)]">{topStrength.factor} ({topStrength.detail})</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Location & Travel Relevance Callout */}
                        {(() => {
                          const locReason = m.reasons.find(r => r.factor.toLowerCase().includes('location') || r.factor.toLowerCase().includes('travel'));
                          if (!locReason) return null;
                          const isStrong = locReason.score >= 80;
                          return (
                            <div className={`flex items-start gap-2 p-2.5 rounded-lg text-xs border ${
                              isStrong
                                ? 'bg-[var(--color-info-bg)]/40 border-[var(--color-info)]/20'
                                : 'bg-[var(--color-warning-bg)]/40 border-[var(--color-warning)]/20'
                            }`}>
                              <MapPin size={14} className={`shrink-0 mt-0.5 ${isStrong ? 'text-[var(--color-info)]' : 'text-[var(--color-warning)]'}`} />
                              <div className="min-w-0">
                                <span className="font-semibold text-[var(--color-text-primary)]">Location & Mobility: </span>
                                <span className="text-[var(--color-text-secondary)]">{locReason.detail}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Bottom Area: Secondary Actions & Understated Disclaimer */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigateTo('candidate-profile', m.candidate!.id)}
                          className="btn btn-secondary btn-sm flex-1"
                        >
                          <User size={12} className="text-[var(--color-text-tertiary)]" />
                          <span>View Candidate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateTo('job-detail', undefined, m.job!.id)}
                          className="btn btn-secondary btn-sm flex-1"
                        >
                          <Briefcase size={12} className="text-[var(--color-text-tertiary)]" />
                          <span>View Job</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight italic">
                        Scores are generated from demo data for illustration purposes. They do not represent validated predictions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--color-border)]/60">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Showing <span className="font-medium text-[var(--color-text-secondary)]">{(page - 1) * perPage + 1}</span>–<span className="font-medium text-[var(--color-text-secondary)]">{Math.min(page * perPage, enrichedMatches.length)}</span> of <span className="font-medium text-[var(--color-text-secondary)]">{enrichedMatches.length}</span> matches
          </p>
          <div className="flex items-center flex-wrap justify-center sm:justify-end gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`btn btn-sm w-7 px-0 ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {enrichedMatches.length === 0 && (
        <div className="text-center py-12 card animate-fade-in">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">No matches found</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('All'); setSpecialtyFilter('All'); }}
            className="mt-2 text-xs text-[var(--color-info)] hover:underline font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
