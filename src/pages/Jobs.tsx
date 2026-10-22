import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, Plus, Upload, MapPin, MoreHorizontal, Briefcase, CheckCircle2, FileText, ArrowRight, X, Edit, Trash2, Check } from 'lucide-react';
import { useAppStore } from '../store';
import { TableSkeleton } from '../components/Skeletons';
import { Job } from '../types';

const statuses = ['All', 'active', 'draft', 'closed', 'filled'];

export function Jobs() {
  const { jobs, navigateTo, importedFiles, addJob, updateJob, deleteJob, addNotification } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [sortField, setSortField] = useState<'position' | 'postedDate'>('postedDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [newJob, setNewJob] = useState({
    position: '',
    specialty: 'ICU',
    facility: '',
    city: '',
    state: '',
    status: 'active' as Job['status'],
    requirements: '',
    description: '',
  });

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

  const perPage = 8;

  const hasActiveFilters = statusFilter !== 'All' || stateFilter !== 'All';

  const resetFilters = () => {
    setStatusFilter('All');
    setStateFilter('All');
    setPage(1);
  };

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, [search, statusFilter, stateFilter, sortField, sortDir, page]);

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

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.position.trim() || !newJob.facility.trim() || !newJob.city.trim() || !newJob.state.trim()) {
      alert('Please fill out Position, Facility, City, and State.');
      return;
    }

    const reqs = newJob.requirements
      .split(/[\n,]+/)
      .map(r => r.trim())
      .filter(Boolean);

    const createdJob: Job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      position: newJob.position.trim(),
      specialty: newJob.specialty.trim() || 'General',
      facility: newJob.facility.trim(),
      city: newJob.city.trim(),
      state: newJob.state.trim().toUpperCase(),
      status: newJob.status,
      postedDate: new Date().toISOString().split('T')[0],
      sourceFile: 'Manual Entry',
      description: newJob.description.trim() || `Seeking qualified ${newJob.position} to join the team at ${newJob.facility}.`,
      requirements: reqs.length > 0 ? reqs : ['Valid state medical license', 'BLS / ACLS Certification', 'Minimum 2 years clinical experience'],
    };

    addJob(createdJob);
    addNotification({
      type: 'success',
      title: 'Job Position Created',
      message: `${createdJob.position} at ${createdJob.facility} added to requisitions.`,
    });

    setIsAddModalOpen(false);
    setNewJob({
      position: '',
      specialty: 'ICU',
      facility: '',
      city: '',
      state: '',
      status: 'active',
      requirements: '',
      description: '',
    });
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
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
    setOpenMenu(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    const reqs = editForm.requirements
      .split(/[\n,]+/)
      .map(r => r.trim())
      .filter(Boolean);

    updateJob(editingJob.id, {
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
      title: 'Job Position Updated',
      message: `Updated details for ${editForm.position.trim()} at ${editForm.facility.trim()}`,
    });

    setEditingJob(null);
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-4 sm:space-y-5">
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
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary h-8 px-3 text-xs cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={13} className="flex-shrink-0" />
            <span>Add Job</span>
          </button>
        </div>
      </div>

      {/* Standardized Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 animate-fade-in" style={{ animationDelay: '40ms' }}>
        <div className="card p-3 sm:p-4 flex flex-col justify-between min-h-[88px] sm:min-h-[96px] hover-lift transition-all">
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
      <div className="toolbar-root animate-fade-in" style={{ animationDelay: '80ms' }}>
        <div className="toolbar-search-wrapper">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="text"
            placeholder="Search by position, facility, city..."
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
              aria-label="Filter by job status"
            >
              {statuses.map(s => (
                <option key={s} value={s} className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                  {s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="toolbar-chevron-icon" />
          </div>
          <div className="toolbar-select-wrapper">
            <select
              value={stateFilter}
              onChange={e => { setStateFilter(e.target.value); setPage(1); }}
              className="toolbar-select"
              aria-label="Filter by state"
            >
              {states.map(s => (
                <option key={s} value={s} className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                  {s === 'All' ? 'All States' : s}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="toolbar-chevron-icon" />
          </div>
        </div>
      </div>

      {/* Table & Cards - with Skeleton Loading state */}
      {loading ? (
        <TableSkeleton rows={Math.min(perPage, Math.max(paginated.length, 5))} cols={7} />
      ) : (
        <>
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
                      className="font-semibold text-xs text-[var(--color-text-primary)] hover:text-[var(--color-info)] transition-colors text-left truncate block max-w-[220px] cursor-pointer"
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
                      className="btn-icon btn-icon-sm inline-flex opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                      aria-label="Job actions"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenu === j.id && (
                      <div className="absolute right-4 top-8 w-44 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg z-20 py-1 animate-scale-in text-left">
                        <button
                          onClick={() => { navigateTo('job-detail', undefined, j.id); setOpenMenu(null); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <ArrowRight size={12} className="text-[var(--color-text-tertiary)]" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => openEditModal(j)}
                          className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Edit size={12} className="text-[var(--color-text-tertiary)]" />
                          <span>Edit Job</span>
                        </button>
                        <button
                          onClick={() => { navigateTo('job-detail', undefined, j.id); setOpenMenu(null); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Briefcase size={12} className="text-[var(--color-text-tertiary)]" />
                          <span>View Matches</span>
                        </button>
                        <div className="border-t border-[var(--color-border)] my-1" />
                        <div className="px-3 py-1 text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                          Set Status
                        </div>
                        {(['active', 'draft', 'filled', 'closed'] as const).map(st => (
                          <button
                            key={st}
                            onClick={() => {
                              updateJob(j.id, { status: st });
                              addNotification({
                                type: 'info',
                                title: 'Job Status Updated',
                                message: `${j.position} marked as ${st}`,
                              });
                              setOpenMenu(null);
                            }}
                            className={`w-full text-left px-3 py-1 text-xs capitalize flex items-center justify-between hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer ${
                              j.status === st ? 'text-[var(--color-info)] font-semibold' : 'text-[var(--color-text-secondary)]'
                            }`}
                          >
                            <span>{st}</span>
                            {j.status === st && <Check size={12} />}
                          </button>
                        ))}
                        <div className="border-t border-[var(--color-border)] my-1" />
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${j.position}"?`)) {
                              deleteJob(j.id);
                              addNotification({
                                type: 'info',
                                title: 'Job Deleted',
                                message: `Removed ${j.position} at ${j.facility}`,
                              });
                            }
                            setOpenMenu(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Delete Job</span>
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
          <div
            key={j.id}
            className="w-full card p-3.5 text-left hover-lift transition-all animate-fade-in block relative"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => navigateTo('job-detail', undefined, j.id)}
                className="min-w-0 flex-1 text-left cursor-pointer"
              >
                <p className="text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-info)] transition-colors truncate">{j.position}</p>
                <p className="text-[11px] text-[var(--color-text-tertiary)] truncate mt-0.5">{j.facility}</p>
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`badge ${statusBadgeClass[j.status] || 'badge-neutral'} flex-shrink-0`}>
                  {j.status}
                </span>
                <button
                  onClick={() => setOpenMenu(openMenu === j.id ? null : j.id)}
                  className="btn-icon btn-icon-sm cursor-pointer"
                  aria-label="Actions"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {openMenu === j.id && (
              <div className="mt-2.5 pt-2.5 border-t border-[var(--color-border)] grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => { navigateTo('job-detail', undefined, j.id); setOpenMenu(null); }}
                  className="btn btn-secondary btn-sm text-[11px] py-1 cursor-pointer"
                >
                  Details
                </button>
                <button
                  onClick={() => openEditModal(j)}
                  className="btn btn-secondary btn-sm text-[11px] py-1 cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    deleteJob(j.id);
                    addNotification({
                      type: 'info',
                      title: 'Job Deleted',
                      message: `Removed ${j.position}`,
                    });
                    setOpenMenu(null);
                  }}
                  className="btn btn-destructive btn-sm text-[11px] py-1 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-[var(--color-border)]/50 text-[11px] text-[var(--color-text-tertiary)]">
              <span className="font-medium text-[var(--color-text-secondary)]">{j.specialty}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><MapPin size={10} />{j.city}, {j.state}</span>
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--color-border)]/60">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Showing <span className="font-medium text-[var(--color-text-secondary)]">{(page - 1) * perPage + 1}</span>–<span className="font-medium text-[var(--color-text-secondary)]">{Math.min(page * perPage, filtered.length)}</span> of <span className="font-medium text-[var(--color-text-secondary)]">{filtered.length}</span> jobs
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

      {filtered.length === 0 && (
        <div className="text-center py-12 card animate-fade-in">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">No jobs match your filters</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('All'); setStateFilter('All'); }}
            className="mt-2 text-xs text-[var(--color-info)] hover:underline font-medium cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Add Job Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Add Job Requisition</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Create a new healthcare position</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="btn-icon btn-icon-sm"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddJob} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                  Position Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICU Registered Nurse, Staff Physical Therapist"
                  value={newJob.position}
                  onChange={e => setNewJob(prev => ({ ...prev, position: e.target.value }))}
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
                    placeholder="e.g. ICU, Emergency, Orthopedics, MRI"
                    value={newJob.specialty}
                    onChange={e => setNewJob(prev => ({ ...prev, specialty: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={newJob.status}
                    onChange={e => setNewJob(prev => ({ ...prev, status: e.target.value as Job['status'] }))}
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
                  placeholder="e.g. Mercy General Hospital, Stanford Health Care"
                  value={newJob.facility}
                  onChange={e => setNewJob(prev => ({ ...prev, facility: e.target.value }))}
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
                    placeholder="e.g. Sacramento"
                    value={newJob.city}
                    onChange={e => setNewJob(prev => ({ ...prev, city: e.target.value }))}
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
                    placeholder="e.g. CA"
                    value={newJob.state}
                    onChange={e => setNewJob(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    className="input w-full uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                  Key Requirements (newline or comma separated)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Valid State RN License, BLS/ACLS, 2+ years ICU experience"
                  value={newJob.requirements}
                  onChange={e => setNewJob(prev => ({ ...prev, requirements: e.target.value }))}
                  className="input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                  Job Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide clinical details, shift information, and facility environment..."
                  value={newJob.description}
                  onChange={e => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                  className="input w-full resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Create Requisition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Edit Job Requisition</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Update position details and requirements</p>
              </div>
              <button
                onClick={() => setEditingJob(null)}
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
                  onClick={() => setEditingJob(null)}
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
