import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { StatCard }    from '../../../components/admin/StatCard'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { LoadingState } from '../../../components/admin/LoadingState'
import {
  getDashboardSummary,
  getDashboardActivity,
  getDashboardConferences,
  type DashboardSummary,
  type ActivityItem,
  type ConferenceItem,
} from '../../../lib/adminApi'

// ── Activity feed icons ───────────────────────────────────────────────────────
const ACTIVITY_ICONS: Record<string, string> = {
  donation:   '💰',
  incident:   '⚠️',
  recording:  '📋',
  visitation: '🏡',
}

// ── Date display helper ───────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function Dashboard() {
  const { isAdmin } = useAuth()
  const base = isAdmin ? '/admin' : '/staff'

  // ── Data state ──────────────────────────────────────────────────────────────
  const [summary, setSummary]         = useState<DashboardSummary | null>(null)
  const [activity, setActivity]       = useState<ActivityItem[]>([])
  const [conferences, setConferences] = useState<ConferenceItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  // ── Fetch all dashboard data on mount ───────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getDashboardActivity(),
      getDashboardConferences(),
    ]).then(([s, a, c]) => {
      setSummary(s)
      setActivity(a)
      setConferences(c)
    }).catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (error) return <p className="text-sm text-[var(--alert)] p-4">{error}</p>

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Welcome back. Here's a summary of what's happening across the organization."
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Residents"
          value={summary?.activeResidents ?? '—'}
          icon="🏠"
        />
        <StatCard
          label="High / Critical Risk"
          value={summary?.highCriticalRisk ?? '—'}
          icon="⚠️"
          subtitle="active residents"
        />
        <StatCard
          label="Active Donors"
          value={summary?.activeDonors ?? '—'}
          icon="👤"
        />
        <StatCard
          label="Donations This Month"
          value={summary ? `₱${summary.monthlyDonationsTotal.toLocaleString()}` : '—'}
          icon="💰"
          accent
        />
      </div>

      {/* ── Quick action buttons ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Placeholder — links to home visitation form (teammate's page) */}
        <Link
          to={`${base}/dashboard/home-visits`}
          className="card card-interactive flex no-underline block group"
        >
          <span className="text-3xl mr-3">🏡</span>
          <div>
            <p className="font-semibold text-[var(--text-h)]">Record a Visitation</p>
            <p className="text-xs text-[var(--text)] mt-0.5">Opens home visitation form</p>
          </div>
        </Link>

        {/* Placeholder — links to process recording form (teammate's page) */}
        <Link
          to={`${base}/dashboard/process-recording`}
          className="card card-interactive flex no-underline block group"
        >
          <span className="text-3xl mr-3">📋</span>
          <div>
            <p className="font-semibold text-[var(--text-h)]">Record a Process</p>
            <p className="text-xs text-[var(--text)] mt-0.5">Opens process recording form</p>
          </div>
        </Link>
      </div>

      {/* ── Domain navigation cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isAdmin && (
          <Link to={`${base}/donors`} className="card card-interactive no-underline block group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--text-h)]">Donor Activity</span>
              <span className="text-xl">💰</span>
            </div>
            <p className="text-xs text-[var(--text)]">Trends, campaigns, and allocations</p>
            <p className="text-xs text-[var(--accent)] mt-3 group-hover:underline">View donors →</p>
          </Link>
        )}

        <Link to={`${base}/residents`} className="card card-interactive no-underline block group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--text-h)]">Residents</span>
            <span className="text-xl">🏠</span>
          </div>
          <p className="text-xs text-[var(--text)]">Safehouse occupancy and risk levels</p>
          <p className="text-xs text-[var(--accent)] mt-3 group-hover:underline">View residents →</p>
        </Link>

        {isAdmin && (
          <Link to={`${base}/social`} className="card card-interactive no-underline block group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--text-h)]">Social Media</span>
              <span className="text-xl">📱</span>
            </div>
            <p className="text-xs text-[var(--text)]">Engagement, referrals, and top posts</p>
            <p className="text-xs text-[var(--accent)] mt-3 group-hover:underline">View social →</p>
          </Link>
        )}

        <Link to={`${base}/ml`} className="card card-interactive no-underline block group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--text-h)]">ML Insights</span>
            <span className="text-xl">🤖</span>
          </div>
          <p className="text-xs text-[var(--text)]">Churn risk, reintegration, and ROI</p>
          <p className="text-xs text-[var(--accent)] mt-3 group-hover:underline">View insights →</p>
        </Link>
      </div>

      {/* ── Bottom row: activity feed + upcoming conferences ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent activity feed */}
        <SectionCard
          title="Recent Activity"
          subtitle="Latest events across donations, sessions, visitations, and incidents"
        >
          {activity.length === 0 ? (
            <p className="text-sm text-[var(--text)]">No recent activity found.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <span className="text-lg mt-0.5 flex-shrink-0">
                    {ACTIVITY_ICONS[item.type] ?? '📌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-h)]">{item.label}</p>
                    <p className="text-xs text-[var(--text)] mt-0.5">{item.detail}</p>
                    <p className="text-xs text-[var(--text)] mt-0.5 opacity-70">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Upcoming case conferences */}
        <SectionCard
          title="Upcoming Case Conferences"
          subtitle="Scheduled from today onward"
          titleIcon="📅"
        >
          {conferences.length === 0 ? (
            <p className="text-sm text-[var(--text)]">No upcoming conferences.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Resident</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {conferences.map((c, i) => (
                    <tr key={i}>
                      <td className="font-medium text-[var(--text-h)]">{c.residentCode}</td>
                      <td className="text-[var(--text)] text-xs">
                        {formatDate(c.conferenceDate)}
                      </td>
                      <td className="text-xs">
                        <span className="badge">{c.planCategory ?? '—'}</span>
                      </td>
                      <td className="text-xs text-[var(--text)]">{c.status ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
