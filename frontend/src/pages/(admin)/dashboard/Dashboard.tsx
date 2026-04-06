import { Link } from 'react-router-dom'

// Placeholder summary data — replace with GET /api/dashboard/summary
const summaryData = {
  donors: {
    totalThisMonth: '₱485,200',
    activeCount: 142,
    trend: { direction: 'up' as const, text: '+12% vs last month' },
  },
  residents: {
    activeCount: 84,
    highRisk: 12,
    trend: { direction: 'down' as const, text: '−2 high-risk since last week' },
  },
  social: {
    postsThisMonth: 24,
    engagementRate: '4.2%',
    trend: { direction: 'up' as const, text: '+0.8pp vs last month' },
  },
  ml: {
    churnRiskCount: 8,
    reintegrationReady: 5,
  },
}

const recentActivity = [
  { id: 1, type: 'donation', icon: '💰', text: 'Maria Santos donated ₱15,000 (Monetary)', time: '2 hours ago' },
  { id: 2, type: 'incident', icon: '⚠️', text: 'Incident report filed at Pag-asa Davao — Severity: Moderate', time: '5 hours ago' },
  { id: 3, type: 'session', icon: '📋', text: 'Process recording added for RES-2024-031 by SW Reyes', time: 'Yesterday' },
  { id: 4, type: 'donation', icon: '💰', text: 'Anonymous donated school supplies (In-Kind, ₱8,200 est.)', time: 'Yesterday' },
  { id: 5, type: 'conference', icon: '📅', text: 'Case conference scheduled for RES-2024-019 — Apr 14', time: '2 days ago' },
  { id: 6, type: 'session', icon: '📋', text: 'Process recording added for RES-2024-008 by SW Dela Cruz', time: '2 days ago' },
]

export function Dashboard() {
  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      {/* Page title */}
      <div>
        <h2 className="text-[var(--text-h)]">Dashboard Overview</h2>
        <p className="text-sm text-[var(--text)] mt-1">
          Welcome back. Here's a summary of what's happening across the organization.
        </p>
      </div>

      {/* Domain summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Donors card */}
        <Link to="/admin/donors" className="card card-interactive no-underline block group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[var(--text-h)]">Donor Activity</span>
            <span className="text-xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-[var(--accent)] mb-1">{summaryData.donors.totalThisMonth}</div>
          <div className="text-xs text-[var(--text)] mb-3">donations this month</div>
          <div className="text-xs text-green-600 font-medium">▲ {summaryData.donors.trend.text}</div>
          <div className="text-xs text-[var(--accent)] mt-3 group-hover:underline">View donors →</div>
        </Link>

        {/* Residents card */}
        <Link to="/admin/residents" className="card card-interactive no-underline block group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[var(--text-h)]">Residents</span>
            <span className="text-xl">🏠</span>
          </div>
          <div className="text-2xl font-bold text-[var(--text-h)] mb-1">{summaryData.residents.activeCount}</div>
          <div className="text-xs text-[var(--text)] mb-3">active residents across all safehouses</div>
          <div className="text-xs text-[#DB7981] font-medium">
            {summaryData.residents.highRisk} at High / Critical risk
          </div>
          <div className="text-xs text-[var(--accent)] mt-3 group-hover:underline">View residents →</div>
        </Link>

        {/* Social media card */}
        <Link to="/admin/social" className="card card-interactive no-underline block group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[var(--text-h)]">Social Media</span>
            <span className="text-xl">📱</span>
          </div>
          <div className="text-2xl font-bold text-[var(--text-h)] mb-1">{summaryData.social.engagementRate}</div>
          <div className="text-xs text-[var(--text)] mb-3">avg engagement rate this month</div>
          <div className="text-xs text-green-600 font-medium">▲ {summaryData.social.trend.text}</div>
          <div className="text-xs text-[var(--accent)] mt-3 group-hover:underline">View social →</div>
        </Link>

        {/* ML card */}
        <Link to="/admin/ml" className="card card-interactive no-underline block group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[var(--text-h)]">ML Insights</span>
            <span className="text-xl">🤖</span>
          </div>
          <div className="text-2xl font-bold text-[var(--text-h)] mb-1">{summaryData.ml.churnRiskCount}</div>
          <div className="text-xs text-[var(--text)] mb-3">donors at high churn risk</div>
          <div className="text-xs text-[var(--accent)] font-medium">
            {summaryData.ml.reintegrationReady} residents ready for reintegration
          </div>
          <div className="text-xs text-[var(--accent)] mt-3 group-hover:underline">View insights →</div>
        </Link>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Donors', value: '142' },
          { label: 'Recurring Donors', value: '67' },
          { label: 'Upcoming Conferences', value: '7' },
          { label: 'Reintegration In Progress', value: '23' },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center py-4">
            <div className="text-2xl font-bold text-[var(--accent)]">{value}</div>
            <div className="text-xs text-[var(--text)] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent activity feed */}
      <div className="card">
        <h3 className="text-[var(--text-h)] mb-4">Recent Activity</h3>
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-start gap-3 py-3">
              <span className="text-lg mt-0.5 flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-h)]">{item.text}</p>
                <p className="text-xs text-[var(--text)] mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
