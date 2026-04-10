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
        title="Overview"
        subtitle="Here's a summary of what's happening across the organization."
      />

      {/* ── Metrics ─────────────────────────────────────────────────────────── */}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Active Residents"
          value={(isAdmin ? adminSummary?.activeResidents : staffSummary?.activeResidents) ?? '—'}
          color="#0d9488"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard
          label="High Risk Residents"
          value={(isAdmin ? adminSummary?.highCriticalRisk : staffSummary?.highCriticalRisk) ?? '—'}
          color="#f97316"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
        {isAdmin ? (
          <>
            <StatCard
              label="Successfully Reintegrated"
              value={adminSummary?.successfullyReintegrated ?? '—'}
              color="#22c55e"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            />
            <StatCard
              label="Active Donors"
              value={adminSummary?.activeDonors ?? '—'}
              color="#3b82f6"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 .5C21 14.5 12 21 12 21z"/></svg>}
            />
            <StatCard
              label="Donations This Month"
              value={adminSummary ? `₱${adminSummary.monthlyDonationsTotal.toLocaleString()}` : '—'}
              color="#c9a227"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M15 9.5C15 8.1 13.66 7 12 7s-3 1.1-3 2.5S10.34 12 12 12s3 1.4 3 2.5S13.66 17 12 17s-3-1.1-3-2.5"/></svg>}
            />
          </>
        ) : (
          <>
            <StatCard
              label="My Recordings This Month"
              value={staffSummary?.myRecordingsThisMonth ?? '—'}
              color="#0d9488"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" /><path d="M9 12h6M9 16h4" /></svg>}
            />
            <StatCard
              label="Upcoming Conferences"
              value={staffSummary?.upcomingConferences ?? '—'}
              color="#c9a227"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
            />
          </>
        )}
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to={isAdmin ? `${base}/dashboard/home-visits` : `${base}/home-visits`}
          className="card card-interactive flex items-center gap-4 no-underline group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 flex-shrink-0 text-[var(--color-primary)] opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 0 1-2-2V7l7-4 7 4v12a2 2 0 0 1-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
          </svg>
          <div>
            <p className="font-semibold text-[var(--color-on-surface)]">Record a Visitation</p>
          </div>
        </Link>

        <Link
          to={isAdmin ? `${base}/dashboard/process-recording` : `${base}/process-recording`}
          className="card card-interactive flex items-center gap-4 no-underline group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 flex-shrink-0 text-[var(--color-primary)] opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
          </svg>
          <div>
            <p className="font-semibold text-[var(--color-on-surface)]">Record a Process</p>
          </div>
        </Link>
      </div>

      {/* ── History & Upcoming ───────────────────────────────────────────────── */}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">History & Upcoming</h2>
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
