import { Users, Briefcase, UserPlus, GitMerge, ArrowUpRight, FileText, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../store';
import { weeklyActivity } from '../data/mockData';

export function Overview() {
  const { candidates, jobs, jobMatches, importedFiles, navigateTo, theme } = useAppStore();

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

  const statusColors: Record<string, string> = {
    new: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    reviewing: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    matched: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    interview: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    placed: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    rejected: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
    active: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    draft: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
    closed: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]',
    filled: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
    completed: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    processing: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    failed: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
  };

  const barColor = theme === 'dark' ? '#a3a3a3' : '#6b7280';
  const primaryBarColor = theme === 'dark' ? '#f5f5f5' : '#1a1a1a';
  const textColor = theme === 'dark' ? '#737373' : '#6b7280';

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 hover-lift animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-4">Weekly Activity</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity} barGap={2}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: textColor }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: textColor }} width={24} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                />
                <Bar dataKey="candidates" fill={primaryBarColor} radius={[3, 3, 0, 0]} name="Candidates" />
                <Bar dataKey="matches" fill={barColor} radius={[3, 3, 0, 0]} name="Matches" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processing Activity */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 hover-lift animate-fade-in" style={{ animationDelay: '260ms' }}>
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Recent Processing</h3>
          <div className="space-y-2.5">
            {recentFiles.map((file, idx) => (
              <div key={file.id} className="flex items-center gap-2.5 py-1.5 hover:bg-[var(--color-surface-secondary)] rounded-md px-1 -mx-1 transition-colors cursor-default" style={{ animationDelay: `${300 + idx * 50}ms` }}>
                <FileText size={14} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{file.filename}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">{file.recordCount} records</p>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors[file.status]}`}>
                  {file.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Candidates & Top Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Candidates */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover-lift animate-fade-in" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-medium">Recent Candidates</h3>
            <button onClick={() => navigateTo('candidates')} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-all duration-150 hover:gap-1.5">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentCandidates.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => navigateTo('candidate-profile', c.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-surface-secondary)] transition-all duration-150 text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-150">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">{c.firstName[0]}{c.lastName[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{c.firstName} {c.lastName}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">{c.position} · {c.specialty}</p>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors[c.status]}`}>
                  {c.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Top Matches */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover-lift animate-fade-in" style={{ animationDelay: '380ms' }}>
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-medium">Top Candidate–Job Matches</h3>
            <button onClick={() => navigateTo('job-matches')} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-all duration-150 hover:gap-1.5">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {topMatches.map((m, idx) => {
              const candidate = candidates.find(c => c.id === m.candidateId);
              const job = jobs.find(j => j.id === m.jobId);
              return (
                <button
                  key={m.id}
                  onClick={() => navigateTo('job-matches')}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-surface-secondary)] transition-all duration-150 text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-150">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">{m.score}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                      {candidate?.firstName} {candidate?.lastName}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">→ {job?.position} at {job?.facility}</p>
                  </div>
                  <Clock size={12} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recently Imported Jobs */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover-lift animate-fade-in" style={{ animationDelay: '440ms' }}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-medium">Recently Imported Jobs</h3>
          <button onClick={() => navigateTo('jobs')} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-all duration-150 hover:gap-1.5">
            View all <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">Position</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5 hidden sm:table-cell">Location</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5 hidden md:table-cell">Facility</th>
                <th className="text-left font-medium text-[var(--color-text-tertiary)] px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {recentJobs.map(job => (
                <tr key={job.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer group" onClick={() => navigateTo('job-detail', undefined, job.id)}>
                  <td className="px-4 py-2.5 font-medium text-[var(--color-text-primary)] group-hover:underline">{job.position}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] hidden sm:table-cell">{job.city}, {job.state}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] hidden md:table-cell">{job.facility}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors[job.status]}`}>
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
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 text-left transition-all duration-200 hover-lift animate-fade-in ${onClick ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: `${delay || 0}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[var(--color-text-tertiary)]">{icon}</span>
        {trend === 'up' && <ArrowUpRight size={13} className="text-[var(--color-success)]" />}
      </div>
      <p className="text-2xl font-semibold text-[var(--color-text-primary)]">{value}</p>
      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">{subtext}</p>
    </button>
  );
}
