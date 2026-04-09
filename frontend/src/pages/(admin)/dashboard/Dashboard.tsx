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
import {
  getStaffDashboardSummary,
  getStaffDashboardActivity,
  getStaffDashboardConferences,
  type StaffDashboardSummary,
} from '../../../lib/staffApi'

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
  const [adminSummary, setAdminSummary]   = useState<DashboardSummary | null>(null)
  const [staffSummary, setStaffSummary]   = useState<StaffDashboardSummary | null>(null)
  const [activity, setActivity]           = useState<ActivityItem[]>([])
  const [conferences, setConferences]     = useState<ConferenceItem[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  // ── Fetch all dashboard data on mount ───────────────────────────────────────
  useEffect(() => {
    if (isAdmin) {
      Promise.all([
        getDashboardSummary(),
        getDashboardActivity(),
        getDashboardConferences(),
      ]).then(([s, a, c]) => {
        setAdminSummary(s)
        setActivity(a)
        setConferences(c)
      }).catch(() => setError('Failed to load dashboard data.'))
        .finally(() => setLoading(false))
    } else {
      Promise.all([
        getStaffDashboardSummary(),
        getStaffDashboardActivity(),
        getStaffDashboardConferences(),
      ]).then(([s, a, c]) => {
        setStaffSummary(s)
        setActivity(a as ActivityItem[])
        setConferences(c)
      }).catch(() => setError('Failed to load dashboard data.'))
        .finally(() => setLoading(false))
    }
  }, [isAdmin])

  if (loading) return <LoadingState />
  if (error) return <p className="text-sm text-[var(--color-error)] p-4">{error}</p>

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Dashboard Overview"
        subtitle={
          isAdmin
            ? 'Welcome back. Here\'s a summary of what\'s happening across the organization.'
            : 'Welcome back. Here\'s a summary of your safehouse activity.'
        }
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Residents"
          value={(isAdmin ? adminSummary?.activeResidents : staffSummary?.activeResidents) ?? '—'}
          icon="🏠"
        />
        <StatCard
          label="High / Critical Risk"
          value={(isAdmin ? adminSummary?.highCriticalRisk : staffSummary?.highCriticalRisk) ?? '—'}
          icon="⚠️"
          subtitle="active residents"
        />
        {isAdmin ? (
          <>
            <StatCard
              label="Active Donors"
              value={adminSummary?.activeDonors ?? '—'}
              icon="👤"
            />
            <StatCard
              label="Donations This Month"
              value={adminSummary ? `₱${adminSummary.monthlyDonationsTotal.toLocaleString()}` : '—'}
              icon="💰"
              accent
            />
          </>
        ) : (
          <>
            <StatCard
              label="My Recordings This Month"
              value={staffSummary?.myRecordingsThisMonth ?? '—'}
              icon="📋"
            />
            <StatCard
              label="Upcoming Conferences"
              value={staffSummary?.upcomingConferences ?? '—'}
              icon="📅"
              accent
            />
          </>
        )}
      </div>

      {/* ── Quick action buttons ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to={isAdmin ? `${base}/dashboard/home-visits` : `${base}/home-visits`}
          className="card card-interactive flex no-underline block group"
        >
          <span className="text-3xl mr-3">🏡</span>
          <div>
            <p className="font-semibold text-[var(--color-on-surface)]">Record a Visitation</p>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Opens home visitation form</p>
          </div>
        </Link>

        <Link
          to={isAdmin ? `${base}/dashboard/process-recording` : `${base}/process-recording`}
          className="card card-interactive flex no-underline block group"
        >
          <span className="text-3xl mr-3">📋</span>
          <div>
            <p className="font-semibold text-[var(--color-on-surface)]">Record a Process Session</p>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Opens process recording form</p>
          </div>
        </Link>
      </div>

      {/* ── Domain navigation cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isAdmin && (
          <Link to={`${base}/donors`} className="card card-interactive no-underline block group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Donor Activity</span>
              <span className="text-xl">💰</span>
            </div>
            <p className="text-xs text-[var(--color-on-surface-variant)]">Trends, campaigns, and allocations</p>
            <p className="text-xs text-[var(--color-primary)] mt-3 group-hover:underline">View donors →</p>
          </Link>
        )}

        <Link to={`${base}/residents`} className="card card-interactive no-underline block group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--color-on-surface)]">Residents</span>
            <span className="text-xl">🏠</span>
          </div>
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            {isAdmin ? 'Safehouse occupancy and risk levels' : 'Your caseload and resident records'}
          </p>
          <p className="text-xs text-[var(--color-primary)] mt-3 group-hover:underline">View residents →</p>
        </Link>

        {isAdmin && (
          <Link to={`${base}/social`} className="card card-interactive no-underline block group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Social Media</span>
              <span className="text-xl">📱</span>
            </div>
            <p className="text-xs text-[var(--color-on-surface-variant)]">Engagement, referrals, and top posts</p>
            <p className="text-xs text-[var(--color-primary)] mt-3 group-hover:underline">View social →</p>
          </Link>
        )}

        <Link to={`${base}/ml`} className="card card-interactive no-underline block group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--color-on-surface)]">ML Insights</span>
            <span className="text-xl">🤖</span>
          </div>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Churn risk, reintegration, and ROI</p>
          <p className="text-xs text-[var(--color-primary)] mt-3 group-hover:underline">View insights →</p>
        </Link>
      </div>

      {/* ── Bottom row: activity feed + upcoming conferences ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent activity feed */}
        <SectionCard
          title="Recent Activity"
          subtitle={
            isAdmin
              ? 'Latest events across donations, sessions, visitations, and incidents'
              : 'Latest sessions, visitations, and incidents at your safehouse'
          }
        >
          {activity.length === 0 ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">No recent activity found.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--color-outline-variant)]">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <span className="text-lg mt-0.5 flex-shrink-0">
                    {ACTIVITY_ICONS[item.type] ?? '📌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-on-surface)]">{item.label}</p>
                    <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{item.detail}</p>
                    <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5 opacity-70">
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
            <p className="text-sm text-[var(--color-on-surface-variant)]">No upcoming conferences.</p>
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
                      <td className="font-medium text-[var(--color-on-surface)]">{c.residentCode}</td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">
                        {formatDate(c.conferenceDate)}
                      </td>
                      <td className="text-xs">
                        <span className="badge">{c.planCategory ?? '—'}</span>
                      </td>
                      <td className="text-xs text-[var(--color-on-surface-variant)]">{c.status ?? '—'}</td>
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
