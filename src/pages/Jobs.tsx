import { useState, useMemo } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, Plus, Upload, MapPin, MoreHorizontal } from 'lucide-react';
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

  const statusColors: Record<string, string> = {
    active: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    draft: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
    closed: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]',
    filled: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-[var(--color-text-tertiary)] opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const locations = Array.from(new Set(jobs.map(j => `${j.city}, ${j.state}`))).length;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Jobs</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage imported job opportunities</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('job-import')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-secondary)] transition-colors text-[var(--color-text-secondary)]"
          >
            <Upload size={13} /> Import Jobs
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-hover)] transition-colors">
            <Plus size={13} /> Add Job
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-3">
          <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Total Jobs</p>
          <p className="text-xl font-semibold text-[var(--color-text-primary)] mt-1">{jobs.length}</p>
        </div>
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-3">
          <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Active</p>
          <p className="text-xl font-semibold text-[var(--color-success)] mt-1">{activeJobs}</p>
        </div>
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-3">
          <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Locations</p>
          <p className="text-xl font-semibold text-[var(--color-text-primary)] mt-1">{locations}</p>
        </div>
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-3">
          <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Source Files</p>
          <p className="text-xl font-semibold text-[var(--color-text-primary)] mt-1">{jobFiles.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by position, facility, city..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[var(--color-border)] rounded-md placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-border-hover)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-[var(--color-text-tertiary)]" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-8 px-2 text-xs bg-white border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)]"
            >
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <select
            value={stateFilter}
            onChange={e => { setStateFilter(e.target.value); setPage(1); }}
            className="h-8 px-2 text-xs bg-white border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)]"
          >
            {states.map(s => <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>)}
          </select>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden lg:block bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5 cursor-pointer select-none" onClick={() => toggleSort('position')}>
                  <span className="flex items-center gap-1">Position <SortIcon field="position" /></span>
                </th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">Specialty</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">City</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">State</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">Facility</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5 hidden xl:table-cell">Source File</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {paginated.map(j => (
                <tr key={j.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors group">
                  <td className="px-4 py-2.5">
                    <button onClick={() => navigateTo('job-detail', undefined, j.id)} className="font-medium text-[var(--color-text-primary)] hover:underline text-left">
                      {j.position}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{j.specialty}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{j.city}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{j.state}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] max-w-[150px] truncate">{j.facility}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-tertiary)] hidden xl:table-cell max-w-[140px] truncate">{j.sourceFile}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors[j.status]}`}>{j.status}</span>
                  </td>
                  <td className="px-4 py-2.5 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === j.id ? null : j.id)}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-surface-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenu === j.id && (
                      <div className="absolute right-4 top-8 w-36 bg-white border border-[var(--color-border)] rounded-md shadow-lg z-10 py-1">
                        <button onClick={() => { navigateTo('job-detail', undefined, j.id); setOpenMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-secondary)]">View Details</button>
                        <button onClick={() => setOpenMenu(null)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-secondary)]">Edit Job</button>
                        <button onClick={() => setOpenMenu(null)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-secondary)]">View Matches</button>
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
      <div className="lg:hidden space-y-2">
        {paginated.map(j => (
          <button
            key={j.id}
            onClick={() => navigateTo('job-detail', undefined, j.id)}
            className="w-full bg-white border border-[var(--color-border)] rounded-lg p-3 text-left hover:border-[var(--color-border-hover)] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[var(--color-text-primary)]">{j.position}</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{j.facility}</p>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors[j.status]}`}>{j.status}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-text-tertiary)]">
              <span>{j.specialty}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><MapPin size={9} />{j.city}, {j.state}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1 text-xs border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} onClick={() => setPage(i + 1)} className={`w-7 h-7 text-xs rounded-md transition-colors ${page === i + 1 ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-surface-secondary)]'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1 text-xs border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white border border-[var(--color-border)] rounded-lg">
          <p className="text-sm text-[var(--color-text-secondary)]">No jobs match your filters</p>
          <button onClick={() => { setSearch(''); setStatusFilter('All'); setStateFilter('All'); }} className="mt-2 text-xs text-[var(--color-info)] hover:underline">Clear filters</button>
        </div>
      )}
    </div>
  );
}
