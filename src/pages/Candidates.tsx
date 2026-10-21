import { useState, useMemo } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, MoreHorizontal, Plus, Upload, MapPin, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store';

const specialties = ['All', 'ICU', 'Emergency', 'Orthopedics', 'MRI', 'Neonatal', 'Med-Surg', 'Pediatrics', 'Hospital'];
const statuses = ['All', 'new', 'reviewing', 'matched', 'interview', 'placed', 'rejected'];

export function Candidates() {
  const { candidates, navigateTo } = useAppStore();
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<'name' | 'experience' | 'match'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const perPage = 8;

  const filtered = useMemo(() => {
    let result = [...candidates];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q)
      );
    }
    if (specialtyFilter !== 'All') result = result.filter(c => c.specialty === specialtyFilter);
    if (statusFilter !== 'All') result = result.filter(c => c.status === statusFilter);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = `${a.lastName}`.localeCompare(`${b.lastName}`);
      else if (sortField === 'experience') cmp = a.experience - b.experience;
      else if (sortField === 'match') cmp = a.bestMatch.localeCompare(b.bestMatch);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [candidates, search, specialtyFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const statusColors: Record<string, string> = {
    new: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    reviewing: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    matched: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    interview: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    placed: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    rejected: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-[var(--color-text-tertiary)] opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Candidates</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage and review candidate profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('resume-import')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-tertiary)] transition-all duration-150 btn-hover text-[var(--color-text-secondary)]"
          >
            <Upload size={13} /> Import Resumes
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-primary)] text-[var(--color-surface)] rounded-md hover:bg-[var(--color-primary-hover)] transition-all duration-150 btn-hover">
            <Plus size={13} /> Add Candidate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 animate-fade-in" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by name, position, specialty..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-8 pl-8 pr-3 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-border-hover)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-[var(--color-text-tertiary)]" />
            <select
              value={specialtyFilter}
              onChange={e => { setSpecialtyFilter(e.target.value); setPage(1); }}
              className="h-8 px-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)]"
            >
              {specialties.map(s => <option key={s} value={s}>{s === 'All' ? 'All Specialties' : s}</option>)}
            </select>
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-8 px-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-hover)]"
          >
            {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden lg:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden animate-fade-in" style={{ animationDelay: '120ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5 cursor-pointer select-none hover:text-[var(--color-text-secondary)] transition-colors" onClick={() => toggleSort('name')}>
                  <span className="flex items-center gap-1">Candidate <SortIcon field="name" /></span>
                </th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">Position</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">Specialty</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5 cursor-pointer select-none hover:text-[var(--color-text-secondary)] transition-colors" onClick={() => toggleSort('experience')}>
                  <span className="flex items-center gap-1">Experience <SortIcon field="experience" /></span>
                </th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">Location</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">Best Match</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {paginated.map((c, idx) => (
                <tr key={c.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors group" style={{ animationDelay: `${idx * 30}ms` }}>
                  <td className="px-4 py-2.5">
                    <button onClick={() => navigateTo('candidate-profile', c.id)} className="flex items-center gap-2.5 text-left group/cell">
                      <div className="w-7 h-7 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center flex-shrink-0 group-hover/cell:scale-110 transition-transform duration-150">
                        <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">{c.firstName[0]}{c.lastName[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)] group-hover/cell:underline">{c.firstName} {c.lastName}</p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">{c.email}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{c.position}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{c.specialty}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{c.experience} yrs</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1"><MapPin size={10} />{c.currentLocation}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] max-w-[180px] truncate">{c.bestMatch}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-2.5 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-surface-tertiary)] opacity-0 group-hover:opacity-100 transition-all duration-150"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenu === c.id && (
                      <div className="absolute right-4 top-8 w-36 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg z-10 py-1 animate-scale-in">
                        <button onClick={() => { navigateTo('candidate-profile', c.id); setOpenMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-secondary)] transition-colors">View Profile</button>
                        <button onClick={() => setOpenMenu(null)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-secondary)] transition-colors">Edit Status</button>
                        <button onClick={() => setOpenMenu(null)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-secondary)] transition-colors">Download Resume</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-2">
        {paginated.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => navigateTo('candidate-profile', c.id)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 text-left hover:border-[var(--color-border-hover)] hover-lift transition-all animate-fade-in"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">{c.firstName[0]}{c.lastName[0]}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{c.firstName} {c.lastName}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">{c.position} · {c.specialty}</p>
                </div>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors[c.status]}`}>{c.status}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-text-tertiary)]">
              <span>{c.experience} yrs exp</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><MapPin size={9} />{c.currentLocation}</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--color-text-secondary)]">
              <ArrowRight size={9} />
              <span className="truncate">{c.bestMatch}</span>
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
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 text-xs border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 btn-hover"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 text-xs rounded-md transition-all duration-150 btn-hover ${page === i + 1 ? 'bg-[var(--color-primary)] text-[var(--color-surface)]' : 'hover:bg-[var(--color-surface-tertiary)]'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 text-xs border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 btn-hover"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg animate-fade-in">
          <p className="text-sm text-[var(--color-text-secondary)]">No candidates match your filters</p>
          <button onClick={() => { setSearch(''); setSpecialtyFilter('All'); setStatusFilter('All'); }} className="mt-2 text-xs text-[var(--color-info)] hover:underline">Clear filters</button>
        </div>
      )}
    </div>
  );
}
