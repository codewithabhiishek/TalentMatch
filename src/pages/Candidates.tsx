import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, MoreHorizontal, Plus, Upload, MapPin, ArrowRight, X, Download, Check, Trash2, UserPlus, Sparkles, Users } from 'lucide-react';
import { useAppStore } from '../store';
import { TableSkeleton } from '../components/Skeletons';
import { downloadCandidateReport } from '../services/downloadService';
import { Candidate } from '../types';

const specialties = ['All', 'ICU', 'Emergency', 'Orthopedics', 'MRI', 'Neonatal', 'Med-Surg', 'Pediatrics', 'Hospital'];
const statuses = ['All', 'new', 'reviewing', 'matched', 'interview', 'placed', 'rejected'];

export function Candidates() {
  const { candidates, navigateTo, addCandidateWithMatches, updateCandidateStatus, deleteCandidate, addNotification, loadSampleData } = useAppStore();
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<'name' | 'experience' | 'match'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: 'Registered Nurse',
    specialty: 'ICU',
    experience: 3,
    currentLocation: '',
    certifications: 'BLS, ACLS',
    professionalSummary: '',
  });
  const perPage = 8;

  const hasActiveFilters = specialtyFilter !== 'All' || statusFilter !== 'All';

  const resetFilters = () => {
    setSpecialtyFilter('All');
    setStatusFilter('All');
    setPage(1);
  };

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, [search, specialtyFilter, statusFilter, sortField, sortDir, page]);

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

  const statusBadgeClass: Record<string, string> = {
    new: 'badge-info',
    reviewing: 'badge-warning',
    matched: 'badge-success',
    interview: 'badge-info',
    placed: 'badge-success',
    rejected: 'badge-error',
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-[var(--color-text-tertiary)] opacity-40 ml-1 inline-block" />;
    return sortDir === 'asc' 
      ? <ChevronUp size={12} className="text-[var(--color-text-primary)] ml-1 inline-block" /> 
      : <ChevronDown size={12} className="text-[var(--color-text-primary)] ml-1 inline-block" />;
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">Candidates</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage and review candidate profiles</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigateTo('resume-import')}
            className="btn btn-secondary h-8 px-3 text-xs"
          >
            <Upload size={13} className="flex-shrink-0" />
            <span>Import Resumes</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary h-8 px-3 text-xs cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={13} className="flex-shrink-0" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="toolbar-root animate-fade-in" style={{ animationDelay: '60ms' }}>
        <div className="toolbar-search-wrapper">
          <Search size={15} className="toolbar-search-icon" />
          <input
            type="text"
            placeholder="Search candidates by name, position, specialty..."
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
          <div className="toolbar-select-wrapper">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="toolbar-select"
              aria-label="Filter by status"
            >
              {statuses.map(s => (
                <option key={s} value={s} className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                  {s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="toolbar-chevron-icon" />
          </div>
        </div>
      </div>

      {/* Table & Cards - with Skeleton Loading state */}
      {loading ? (
        <TableSkeleton rows={Math.min(perPage, Math.max(paginated.length, 5))} cols={8} />
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
                  onClick={() => toggleSort('name')}
                >
                  <span className="inline-flex items-center">Candidate <SortIcon field="name" /></span>
                </th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">Position</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">Specialty</th>
                <th
                  className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 cursor-pointer select-none hover:text-[var(--color-text-secondary)] transition-colors tracking-wider uppercase text-[11px]"
                  onClick={() => toggleSort('experience')}
                >
                  <span className="inline-flex items-center">Experience <SortIcon field="experience" /></span>
                </th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">Location</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">Best Match</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">Status</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {paginated.map((c, idx) => (
                <tr
                  key={c.id}
                  className="hover:bg-[var(--color-surface-secondary)]/60 transition-colors group"
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  <td className="px-4 py-2.5 align-middle">
                    <button
                      onClick={() => navigateTo('candidate-profile', c.id)}
                      className="flex items-center gap-2.5 text-left group/cell focus-visible:outline-none"
                    >
                      <div className="w-7 h-7 rounded-full bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 group-hover/cell:border-[var(--color-border-hover)] transition-transform duration-150">
                        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">{c.firstName[0]}{c.lastName[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-[var(--color-text-primary)] group-hover/cell:text-[var(--color-info)] transition-colors truncate">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-tertiary)] truncate leading-tight mt-0.5">{c.email}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] align-middle font-medium">{c.position}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] align-middle">{c.specialty}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] align-middle font-medium">{c.experience} yrs</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] align-middle">
                    <span className="inline-flex items-center gap-1.5"><MapPin size={11} className="text-[var(--color-text-tertiary)] flex-shrink-0" />{c.currentLocation}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] align-middle max-w-[200px]" title={c.bestMatch}>
                    <span className="block truncate">{c.bestMatch}</span>
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    <span className={`badge ${statusBadgeClass[c.status] || 'badge-neutral'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 align-middle relative text-right">
                    <button
                      onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                      className="btn-icon btn-icon-sm inline-flex opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      aria-label="Candidate actions"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenu === c.id && (
                      <div className="absolute right-4 top-8 w-44 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-xl z-20 py-1.5 animate-scale-in text-left divide-y divide-[var(--color-border)]/50">
                        <div>
                          <button
                            onClick={() => { navigateTo('candidate-profile', c.id); setOpenMenu(null); }}
                            className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>View Profile</span>
                            <ArrowRight size={11} className="text-[var(--color-text-tertiary)]" />
                          </button>
                          <button
                            onClick={() => { downloadCandidateReport(c); setOpenMenu(null); }}
                            className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>Download Dossier</span>
                            <Download size={11} className="text-[var(--color-text-tertiary)]" />
                          </button>
                        </div>

                        <div className="pt-1">
                          <p className="px-3 py-1 text-[9px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                            Set Status
                          </p>
                          {(['new', 'reviewing', 'matched', 'interview', 'placed', 'rejected'] as const).map(st => (
                            <button
                              key={st}
                              onClick={() => {
                                updateCandidateStatus(c.id, st);
                                setOpenMenu(null);
                                addNotification({
                                  type: 'info',
                                  title: 'Candidate Status Updated',
                                  message: `${c.firstName} ${c.lastName} status changed to ${st}`,
                                });
                              }}
                              className={`w-full text-left px-3 py-1 text-xs hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center justify-between cursor-pointer ${
                                c.status === st ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
                              }`}
                            >
                              <span className="capitalize">{st}</span>
                              {c.status === st && <Check size={11} className="text-[var(--color-primary)]" />}
                            </button>
                          ))}
                        </div>

                        <div className="pt-1">
                          <button
                            onClick={() => {
                              deleteCandidate(c.id);
                              setOpenMenu(null);
                              addNotification({
                                type: 'warning',
                                title: 'Candidate Removed',
                                message: `${c.firstName} ${c.lastName} was removed from the database`,
                              });
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>Delete Candidate</span>
                            <Trash2 size={11} />
                          </button>
                        </div>
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
      <div className="lg:hidden space-y-2.5">
        {paginated.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => navigateTo('candidate-profile', c.id)}
            className="w-full card p-3.5 text-left hover-lift transition-all animate-fade-in block"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{c.firstName[0]}{c.lastName[0]}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{c.firstName} {c.lastName}</p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{c.position} · {c.specialty}</p>
                </div>
              </div>
              <span className={`badge ${statusBadgeClass[c.status] || 'badge-neutral'} flex-shrink-0`}>
                {c.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-[var(--color-border)]/50 text-[11px] text-[var(--color-text-tertiary)]">
              <span className="font-medium text-[var(--color-text-secondary)]">{c.experience} yrs exp</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><MapPin size={10} />{c.currentLocation}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[var(--color-text-secondary)]" title={c.bestMatch}>
              <ArrowRight size={10} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
              <span className="truncate">{c.bestMatch}</span>
            </div>
          </button>
        ))}
      </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--color-border)]/60">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Showing <span className="font-medium text-[var(--color-text-secondary)]">{(page - 1) * perPage + 1}</span>–<span className="font-medium text-[var(--color-text-secondary)]">{Math.min(page * perPage, filtered.length)}</span> of <span className="font-medium text-[var(--color-text-secondary)]">{filtered.length}</span> candidates
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

      {candidates.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center animate-fade-in border border-dashed border-[var(--color-border)]">
          <div className="w-12 h-12 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-3.5 text-[var(--color-text-secondary)]">
            <Users size={22} />
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Your Candidate Database is Empty</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto mt-1 mb-5 leading-relaxed">
            Start by importing resumes (PDF, Word, or plain text) to populate your candidates, or load realistic sample healthcare candidates to test the features.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigateTo('resume-import')}
              className="btn btn-primary h-9 px-4 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} /> Import Candidate Resumes
            </button>
            <button
              onClick={loadSampleData}
              className="btn btn-secondary h-9 px-4 text-xs flex items-center gap-1.5 cursor-pointer hover:border-[var(--color-info)]"
            >
              <Sparkles size={14} className="text-sky-400" /> Load Sample Candidates
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 card animate-fade-in">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">No candidates match your filters</p>
          <button
            onClick={() => { setSearch(''); setSpecialtyFilter('All'); setStatusFilter('All'); }}
            className="mt-2 text-xs text-[var(--color-info)] hover:underline font-medium cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : null}

      {/* Add Candidate Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Add New Candidate</h3>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">Create candidate and calculate job matches</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="btn-icon btn-icon-sm cursor-pointer"
                aria-label="Close modal"
              >
                <X size={15} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCandidate.firstName || !newCandidate.lastName) return;

                const cand: Candidate = {
                  id: `c-${Date.now()}`,
                  firstName: newCandidate.firstName.trim(),
                  lastName: newCandidate.lastName.trim(),
                  email: newCandidate.email.trim() || `${newCandidate.firstName.toLowerCase()}.${newCandidate.lastName.toLowerCase()}@health.org`,
                  phone: newCandidate.phone.trim() || '(555) 123-4567',
                  position: newCandidate.position,
                  specialty: newCandidate.specialty,
                  experience: Number(newCandidate.experience) || 1,
                  currentLocation: newCandidate.currentLocation.trim() || 'Sacramento, CA',
                  previousTravelLocations: [newCandidate.currentLocation.trim() || 'Sacramento, CA', 'Phoenix, AZ'],
                  bestMatch: 'Evaluating opportunities...',
                  status: 'new',
                  resumeFilename: `${newCandidate.firstName.toLowerCase()}_${newCandidate.lastName.toLowerCase()}_resume.pdf`,
                  uploadedAt: new Date().toISOString().split('T')[0],
                  professionalSummary: newCandidate.professionalSummary.trim() || `Dedicated ${newCandidate.position} specializing in ${newCandidate.specialty} with ${newCandidate.experience} years of clinical experience.`,
                  certifications: newCandidate.certifications.split(',').map(s => s.trim()).filter(Boolean),
                  confidenceScore: 98,
                  experienceTimeline: [
                    {
                      id: `exp-${Date.now()}-1`,
                      position: newCandidate.position,
                      facility: 'Regional Medical Center',
                      location: newCandidate.currentLocation.trim() || 'Sacramento, CA',
                      startDate: `${new Date().getFullYear() - (Number(newCandidate.experience) || 1)}`,
                      endDate: 'Present',
                      description: `High-acuity ${newCandidate.specialty} patient care and multidisciplinary protocols.`,
                    },
                  ],
                  verifiedByRecruiter: true,
                };

                addCandidateWithMatches(cand);
                addNotification({
                  type: 'success',
                  title: 'Candidate Created',
                  message: `${cand.firstName} ${cand.lastName} was added to the talent pool with AI job matches evaluated`,
                });
                setIsAddModalOpen(false);
                setNewCandidate({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  position: 'Registered Nurse',
                  specialty: 'ICU',
                  experience: 3,
                  currentLocation: '',
                  certifications: 'BLS, ACLS',
                  professionalSummary: '',
                });
              }}
              className="p-5 space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newCandidate.firstName}
                    onChange={e => setNewCandidate({ ...newCandidate, firstName: e.target.value })}
                    className="input w-full h-8.5 px-3 text-xs"
                    placeholder="e.g. Rachel"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newCandidate.lastName}
                    onChange={e => setNewCandidate({ ...newCandidate, lastName: e.target.value })}
                    className="input w-full h-8.5 px-3 text-xs"
                    placeholder="e.g. Miller"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
                  <input
                    type="email"
                    value={newCandidate.email}
                    onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    className="input w-full h-8.5 px-3 text-xs"
                    placeholder="rachel.miller@health.org"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Phone</label>
                  <input
                    type="text"
                    value={newCandidate.phone}
                    onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    className="input w-full h-8.5 px-3 text-xs"
                    placeholder="(555) 234-5678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Position</label>
                  <select
                    value={newCandidate.position}
                    onChange={e => setNewCandidate({ ...newCandidate, position: e.target.value })}
                    className="input w-full h-8.5 px-2 text-xs"
                  >
                    <option value="Registered Nurse">Registered Nurse</option>
                    <option value="Physical Therapist">Physical Therapist</option>
                    <option value="Respiratory Therapist">Respiratory Therapist</option>
                    <option value="MRI Technologist">MRI Technologist</option>
                    <option value="Radiologic Technologist">Radiologic Tech</option>
                    <option value="Occupational Therapist">Occupational Therapist</option>
                    <option value="Nurse Practitioner">Nurse Practitioner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Specialty</label>
                  <select
                    value={newCandidate.specialty}
                    onChange={e => setNewCandidate({ ...newCandidate, specialty: e.target.value })}
                    className="input w-full h-8.5 px-2 text-xs"
                  >
                    <option value="ICU">ICU</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="MRI">MRI</option>
                    <option value="Neonatal">Neonatal</option>
                    <option value="Med-Surg">Med-Surg</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Years Exp</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={newCandidate.experience}
                    onChange={e => setNewCandidate({ ...newCandidate, experience: Number(e.target.value) })}
                    className="input w-full h-8.5 px-3 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Location (City, State)</label>
                  <input
                    type="text"
                    value={newCandidate.currentLocation}
                    onChange={e => setNewCandidate({ ...newCandidate, currentLocation: e.target.value })}
                    className="input w-full h-8.5 px-3 text-xs"
                    placeholder="e.g. Seattle, WA"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Certifications (comma-separated)</label>
                  <input
                    type="text"
                    value={newCandidate.certifications}
                    onChange={e => setNewCandidate({ ...newCandidate, certifications: e.target.value })}
                    className="input w-full h-8.5 px-3 text-xs"
                    placeholder="BLS, ACLS, CCRN"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">Professional Summary</label>
                <textarea
                  rows={2}
                  value={newCandidate.professionalSummary}
                  onChange={e => setNewCandidate({ ...newCandidate, professionalSummary: e.target.value })}
                  className="input w-full p-2.5 text-xs"
                  placeholder="Summary of acute clinical patient care, ICU assignments, or special skills..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary text-xs h-8 px-3 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs h-8 px-4 cursor-pointer"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
