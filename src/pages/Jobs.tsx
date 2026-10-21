import { useState, useMemo } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, Plus, Upload, MapPin, MoreHorizontal, Briefcase, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store';

const statuses = ['All', 'active', 'draft', 'closed', 'filled'];

export function Jobs() {
  const { jobs, navigateTo, importedFiles } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [sortField, setSortField] = useState<'position' | 'postedDate'>('postedDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const perPage = 8;

  const states = ['All', ...Array.from(new Set(jobs.map(j => j.state)))];
  const jobFiles = importedFiles.filter(f => f.type === 'jobs');

  const filtered = useMemo(() => {
    let result = [...jobs];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.position.toLowerCase().includes(q) ||
        j.facility.toLowerCase().includes(q) ||
        j.city.toLowerCase().includes(q) ||
        j.specialty.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') result = result.filter(j => j.status === statusFilter);
    if (stateFilter !== 'All') result = result.filter(j => j.state === stateFilter);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'position') cmp = a.position.localeCompare(b.position);
      else cmp = a.postedDate.localeCompare(b.postedDate);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [jobs, search, statusFilter, stateFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const statusBadgeClass: Record<string, string> = {
    active: 'badge-success',
    draft: 'badge-neutral',
    closed: 'badge-neutral opacity-70',
    filled: 'badge-info',
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-[var(--color-text-tertiary)] opacity-40 ml-1 inline-block" />;
    return sortDir === 'asc' 
      ? <ChevronUp size={12} className="text-[var(--color-text-primary)] ml-1 inline-block" /> 
      : <ChevronDown size={12} className="text-[var(--color-text-primary)] ml-1 inline-block" />;
  };

  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const locations = Array.from(new Set(jobs.map(j => `${j.city}, ${j.state}`))).length;

  return (
    <div className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">Jobs</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage imported job opportunities</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigateTo('job-import')}
            className="btn btn-secondary h-8 px-3 text-xs"
          >
            <Upload size={13} className="flex-shrink-0" />
            <span>Import Jobs</span>
          </button>
          <button className="btn btn-primary h-8 px-3 text-xs">
            <Plus size={13} className="flex-shrink-0" />
            <span>Add Job</span>
          </button>
        </div>
      </div>

      {/* Standardized Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '40ms' }}>
        <div className="card p-3.5 sm:p-4 flex flex-col justify-between min-h-[96px] hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Total Jobs</span>
            <div className="w-7 h-7 rounded-md bg-[var(--color-surface-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
              <Briefcase size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight leading-none">{jobs.length}</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 font-medium">positions listed</p>
          </div>
        </div>

        <div className="card p-3.5 sm:p-4 flex flex-col justify-between min-h-[96px] hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Active</span>
            <div className="w-7 h-7 rounded-md bg-[var(--color-success-bg)] flex items-center justify-center text-[var(--color-success)]">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-[var(--color-success)] tracking-tight leading-none">{activeJobs}</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 font-medium">open positions</p>
          </div>
        </div>

        <div className="card p-3.5 sm:p-4 flex flex-col justify-between min-h-[96px] hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Locations</span>
            <div className="w-7 h-7 rounded-md bg-[var(--color-surface-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
              <MapPin size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight leading-none">{locations}</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 font-medium">cities & states</p>
          </div>
        </div>

        <div className="card p-3.5 sm:p-4 flex flex-col justify-between min-h-[96px] hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Source Files</span>
            <div className="w-7 h-7 rounded-md bg-[var(--color-surface-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
              <FileText size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight leading-none">{jobFiles.length}</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 font-medium">imported sources</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 animate-fade-in" style={{ animationDelay: '80ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by position, facility, city..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input w-full h-9 pl-9 pr-3 text-xs sm:text-sm placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex items-center">
            <Filter size={13} className="absolute left-2.5 text-[var(--color-text-tertiary)] pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="input h-9 pl-8 pr-7 text-xs font-medium cursor-pointer appearance-none bg-transparent"
              aria-label="Filter by job status"
            >
              {statuses.map(s => (
                <option key={s} value={s} className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                  {s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 text-[var(--color-text-tertiary)] pointer-events-none" />
          </div>
          <div className="relative flex items-center">
            <select
              value={stateFilter}
              onChange={e => { setStateFilter(e.target.value); setPage(1); }}
              className="input h-9 px-3 pr-7 text-xs font-medium cursor-pointer appearance-none bg-transparent"
              aria-label="Filter by state"
            >
              {states.map(s => (
                <option key={s} value={s} className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                  {s === 'All' ? 'All States' : s}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 text-[var(--color-text-tertiary)] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden lg:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden animate-fade-in shadow-xs" style={{ animationDelay: '120ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
                <th
                  className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 cursor-pointer select-none hover:text-[var(--color-text-secondary)] transition-colors tracking-wider uppercase text-[11px]"
                  onClick={() => toggleSort('position')}
                >
                  <span className="inline-flex items-center">Position <SortIcon field="position" /></span>
                </th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">Specialty</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">City</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">State</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">Facility</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px] hidden xl:table-cell">Source File</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">Status</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {paginated.map((j, idx) => (
                <tr
                  key={j.id}
                  className="hover:bg-[var(--color-surface-secondary)]/60 transition-colors group"
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  <td className="px-4 py-2.5 align-middle">
                    <button
                      onClick={() => navigateTo('job-detail', undefined, j.id)}
                      className="font-semibold text-xs text-[var(--color-text-primary)] hover:text-[var(--color-info)] transition-colors text-left truncate block max-w-[220px]"
                    >
                      {j.position}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] align-middle">{j.specialty}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] align-middle">{j.city}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] align-middle font-medium">{j.state}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] align-middle max-w-[170px]" title={j.facility}>
                    <span className="block truncate">{j.facility}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-tertiary)] align-middle hidden xl:table-cell max-w-[150px]" title={j.sourceFile}>
                    <span className="block truncate">{j.sourceFile}</span>
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    <span className={`badge ${statusBadgeClass[j.status] || 'badge-neutral'}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 align-middle relative text-right">
                    <button
                      onClick={() => setOpenMenu(openMenu === j.id ? null : j.id)}
                      className="btn-icon btn-icon-sm inline-flex opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      aria-label="Job actions"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenu === j.id && (
                      <div className="absolute right-4 top-8 w-38 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg z-20 py-1 animate-scale-in text-left">
                        <button
                          onClick={() => { navigateTo('job-detail', undefined, j.id); setOpenMenu(null); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => setOpenMenu(null)}
                          className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                        >
                          Edit Job
                        </button>
                        <button
                          onClick={() => setOpenMenu(null)}
                          className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                        >
                          View Matches
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - Mobile */}
      <div className="lg:hidden space-y-2.5">
        {paginated.map((j, idx) => (
          <button
            key={j.id}
            onClick={() => navigateTo('job-detail', undefined, j.id)}
            className="w-full card p-3.5 text-left hover-lift transition-all animate-fade-in block"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{j.position}</p>
                <p className="text-[11px] text-[var(--color-text-tertiary)] truncate mt-0.5">{j.facility}</p>
              </div>
              <span className={`badge ${statusBadgeClass[j.status] || 'badge-neutral'} flex-shrink-0`}>
                {j.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-[var(--color-border)]/50 text-[11px] text-[var(--color-text-tertiary)]">
              <span className="font-medium text-[var(--color-text-secondary)]">{j.specialty}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><MapPin size={10} />{j.city}, {j.state}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--color-border)]/60">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Showing <span className="font-medium text-[var(--color-text-secondary)]">{(page - 1) * perPage + 1}</span>–<span className="font-medium text-[var(--color-text-secondary)]">{Math.min(page * perPage, filtered.length)}</span> of <span className="font-medium text-[var(--color-text-secondary)]">{filtered.length}</span> jobs
          </p>
          <div className="flex items-center gap-1">
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

      {filtered.length === 0 && (
        <div className="text-center py-12 card animate-fade-in">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">No jobs match your filters</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('All'); setStateFilter('All'); }}
            className="mt-2 text-xs text-[var(--color-info)] hover:underline font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
