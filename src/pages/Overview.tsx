import { useState, useEffect } from 'react';
import { Users, Briefcase, UserPlus, GitMerge, ArrowUpRight, FileText, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../store';
import { weeklyActivity } from '../data/mockData';
import { OverviewSkeleton } from '../components/Skeletons';

export function Overview() {
  const { candidates, jobs, jobMatches, importedFiles, navigateTo, theme } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 160);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return <OverviewSkeleton />;
  }

  const totalCandidates = candidates.length;
  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const newThisWeek = candidates.filter(c => {
    const d = new Date(c.uploadedAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;
  const potentialMatches = jobMatches.filter(m => m.status === 'pending').length;

  const recentCandidates = candidates.slice(0, 5);
  const recentJobs = jobs.slice(0, 5);
  const recentFiles = importedFiles.slice(0, 5);
  const topMatches = [...jobMatches].sort((a, b) => b.score - a.score).slice(0, 5);

  const statusBadgeClass: Record<string, string> = {
    new: 'badge-info',
    reviewing: 'badge-warning',
    matched: 'badge-success',
    interview: 'badge-info',
    placed: 'badge-success',
    rejected: 'badge-error',
    active: 'badge-success',
    draft: 'badge-neutral',
    closed: 'badge-neutral opacity-70',
    filled: 'badge-info',
    completed: 'badge-success',
    processing: 'badge-warning',
    failed: 'badge-error',
    pending: 'badge-warning',
  };

  const isDark = theme === 'dark' || theme === 'black';
  const barColor = isDark ? '#64748b' : '#94a3b8';
  const primaryBarColor = theme === 'black' ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[var(--color-success)]';
    if (score >= 75) return 'text-[var(--color-text-primary)]';
    if (score >= 60) return 'text-[var(--color-warning)]';
    return 'text-[var(--color-error)]';
  };

  return (
    <div className="p-3 sm:p-5 lg:p-7 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Standardized 4 Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
        <MetricCard
          label="Total Candidates"
          value={totalCandidates}
          icon={<Users size={16} />}
          subtext={`${newThisWeek} new this week`}
          onClick={() => navigateTo('candidates')}
          delay={0}
        />
        <MetricCard
          label="Active Jobs"
          value={activeJobs}
          icon={<Briefcase size={16} />}
          subtext={`${jobs.length} total positions`}
          onClick={() => navigateTo('jobs')}
          delay={60}
        />
        <MetricCard
          label="New This Week"
          value={newThisWeek}
          icon={<UserPlus size={16} />}
          subtext="candidates added"
          trend="up"
          delay={120}
        />
        <MetricCard
          label="Pending Matches"
          value={potentialMatches}
          icon={<GitMerge size={16} />}
          subtext="awaiting review"
          onClick={() => navigateTo('job-matches')}
          delay={180}
        />
      </div>

      {/* Activity Chart & Recent Processing Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 card p-3.5 sm:p-5 flex flex-col justify-between hover-lift animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--color-border)]">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Weekly Activity</h3>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">Candidates and match operations</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-secondary)] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: primaryBarColor }} />
                Candidates
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: barColor }} />
                Matches
              </span>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity} barGap={4}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: textColor }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: textColor }} width={24} />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="candidates" fill={primaryBarColor} radius={[3, 3, 0, 0]} name="Candidates" />
                <Bar dataKey="matches" fill={barColor} radius={[3, 3, 0, 0]} name="Matches" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processing Activity */}
        <div className="card p-4 sm:p-5 flex flex-col justify-between hover-lift animate-fade-in" style={{ animationDelay: '260ms' }}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-border)]">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Processing</h3>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">Import batch status</p>
            </div>
            <button
              onClick={() => navigateTo('resume-import')}
              className="btn btn-ghost btn-sm text-xs px-2"
            >
              Import <ArrowUpRight size={12} className="ml-0.5" />
            </button>
          </div>
          <div className="space-y-2 flex-1 flex flex-col justify-around">
            {recentFiles.map((file, idx) => (
              <div
                key={file.id}
                className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-[var(--color-surface-secondary)]/70 rounded-md transition-colors cursor-default"
                style={{ animationDelay: `${300 + idx * 40}ms` }}
              >
                <div className="w-6 h-6 rounded-md bg-[var(--color-surface-tertiary)] flex items-center justify-center flex-shrink-0 text-[var(--color-text-secondary)]">
                  <FileText size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">{file.recordCount} records</p>
                </div>
                <span className={`badge ${statusBadgeClass[file.status] || 'badge-neutral'} flex-shrink-0`}>
                  {file.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Candidates & Top Matches in Shared Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Candidates */}
        <div className="card overflow-hidden hover-lift animate-fade-in shadow-xs" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Candidates</h3>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">Latest talent pool additions</p>
            </div>
            <button
              onClick={() => navigateTo('candidates')}
              className="btn btn-ghost btn-sm text-xs px-2"
            >
              View all <ArrowUpRight size={12} className="ml-0.5" />
            </button>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentCandidates.map((c) => (
              <button
                key={c.id}
                onClick={() => navigateTo('candidate-profile', c.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-secondary)]/60 transition-colors text-left group focus-visible:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-150">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{c.firstName[0]}{c.lastName[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-info)] transition-colors truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] truncate leading-tight mt-0.5">{c.position} · {c.specialty}</p>
                </div>
                <span className={`badge ${statusBadgeClass[c.status] || 'badge-neutral'} flex-shrink-0`}>
                  {c.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Top Matches */}
        <div className="card overflow-hidden hover-lift animate-fade-in shadow-xs" style={{ animationDelay: '380ms' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Top Candidate–Job Matches</h3>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">Highest scoring opportunities</p>
            </div>
            <button
              onClick={() => navigateTo('job-matches')}
              className="btn btn-ghost btn-sm text-xs px-2"
            >
              View all <ArrowUpRight size={12} className="ml-0.5" />
            </button>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {topMatches.map((m) => {
              const candidate = candidates.find(c => c.id === m.candidateId);
              const job = jobs.find(j => j.id === m.jobId);
              return (
                <button
                  key={m.id}
                  onClick={() => navigateTo('job-matches')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-secondary)]/60 transition-colors text-left group focus-visible:outline-none"
                >
                  <div
                    className="w-8 h-8 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-150"
                    title={`Match score: ${m.score}%`}
                  >
                    <span className={`text-xs font-bold ${getScoreColor(m.score)}`}>{m.score}%</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-info)] transition-colors truncate">
                      {candidate?.firstName} {candidate?.lastName}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] truncate leading-tight mt-0.5">
                      → {job?.position} at {job?.facility}
                    </p>
                  </div>
                  <Clock size={12} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recently Imported Jobs Table */}
      <div className="card overflow-hidden hover-lift animate-fade-in shadow-xs" style={{ animationDelay: '440ms' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recently Imported Jobs</h3>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">Recently parsed job postings</p>
          </div>
          <button
            onClick={() => navigateTo('jobs')}
            className="btn btn-ghost btn-sm text-xs px-2"
          >
            View all <ArrowUpRight size={12} className="ml-0.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">Position</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px] hidden sm:table-cell">Location</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px] hidden md:table-cell">Facility</th>
                <th className="text-left font-semibold text-[var(--color-text-tertiary)] px-4 py-2.5 tracking-wider uppercase text-[11px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {recentJobs.map(job => (
                <tr
                  key={job.id}
                  className="hover:bg-[var(--color-surface-secondary)]/60 transition-colors cursor-pointer group"
                  onClick={() => navigateTo('job-detail', undefined, job.id)}
                >
                  <td className="px-4 py-2.5 font-semibold text-xs text-[var(--color-text-primary)] group-hover:text-[var(--color-info)] transition-colors align-middle">
                    {job.position}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] hidden sm:table-cell align-middle">
                    {job.city}, {job.state}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] hidden md:table-cell align-middle max-w-[200px] truncate" title={job.facility}>
                    {job.facility}
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    <span className={`badge ${statusBadgeClass[job.status] || 'badge-neutral'}`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, subtext, trend, onClick, delay }: {
  label: string; value: number; icon: React.ReactNode; subtext: string; trend?: string; onClick?: () => void; delay?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`card p-3 sm:p-4 lg:p-5 text-left animate-fade-in transition-all duration-150 h-full min-h-[118px] sm:min-h-[136px] flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-[var(--color-border-hover)] hover-lift focus-visible:outline-none' : 'cursor-default'
      }`}
      style={{ animationDelay: `${delay || 0}ms` }}
    >
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[var(--color-surface-tertiary)] border border-[var(--color-border)]/60 flex items-center justify-center text-[var(--color-text-secondary)] flex-shrink-0">
          {icon}
        </div>
        {trend === 'up' && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-success-bg)] text-[var(--color-success)] text-[9px] sm:text-[10px] font-semibold border border-[var(--color-success)]/20">
            <ArrowUpRight size={11} />
            <span>+{value}</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight leading-none mt-0.5 sm:mt-1">{value}</p>
        <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] mt-1 sm:mt-1.5 font-medium truncate">{subtext}</p>
      </div>
    </button>
  );
}
