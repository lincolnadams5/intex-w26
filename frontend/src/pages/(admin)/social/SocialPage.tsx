import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { AdminStatCard } from '../../../components/admin/AdminStatCard'

// ─── Mock data — replace with API calls once backend is ready ─────────────────
// GET /api/social/summary
const socialSummary = {
  postsThisMonth: 24,
  engagementRate: '4.2%',
  donationReferrals: 31,
  estimatedValue: '₱92,400',
}

// GET /api/social/by-platform
const platformData = [
  { platform: 'Instagram', rate: 6.2 },
  { platform: 'Facebook', rate: 4.8 },
  { platform: 'YouTube', rate: 3.4 },
  { platform: 'Twitter/X', rate: 2.1 },
]

// GET /api/social/by-post-type
const postTypeData = [
  { type: 'Testimonial', rate: 7.4 },
  { type: 'Impact Story', rate: 6.9 },
  { type: 'Fundraising', rate: 5.2 },
  { type: 'Educational', rate: 4.1 },
  { type: 'Event', rate: 3.8 },
  { type: 'General', rate: 2.6 },
]

// GET /api/social/referral-trend
const referralTrendData = [
  { month: 'Nov', referrals: 12, posts: 18 },
  { month: 'Dec', referrals: 22, posts: 28 },
  { month: 'Jan', referrals: 15, posts: 16 },
  { month: 'Feb', referrals: 19, posts: 20 },
  { month: 'Mar', referrals: 27, posts: 22 },
  { month: 'Apr', referrals: 31, posts: 24 },
]

// GET /api/social/posting-heatmap — avg engagement by hour × day
// Simplified to daily-only for now; full heatmap can replace this
const bestDayData = [
  { day: 'Mon', rate: 3.8 },
  { day: 'Tue', rate: 4.1 },
  { day: 'Wed', rate: 5.0 },
  { day: 'Thu', rate: 4.6 },
  { day: 'Fri', rate: 3.9 },
  { day: 'Sat', rate: 6.3 },
  { day: 'Sun', rate: 5.8 },
]

// GET /api/social/top-posts
const topPosts = [
  { id: 1, platform: 'Instagram', type: 'Testimonial', date: '2026-04-02', likes: 412, shares: 87, comments: 54, referrals: 9, engRate: '8.1%' },
  { id: 2, platform: 'Facebook', type: 'Impact Story', date: '2026-03-28', likes: 318, shares: 104, comments: 38, referrals: 7, engRate: '7.2%' },
  { id: 3, platform: 'Instagram', type: 'Fundraising', date: '2026-03-21', likes: 290, shares: 62, comments: 41, referrals: 5, engRate: '6.5%' },
  { id: 4, platform: 'YouTube', type: 'Impact Story', date: '2026-03-15', likes: 214, shares: 39, comments: 28, referrals: 4, engRate: '5.8%' },
  { id: 5, platform: 'Facebook', type: 'Educational', date: '2026-03-10', likes: 178, shares: 55, comments: 22, referrals: 3, engRate: '4.9%' },
  { id: 6, platform: 'Instagram', type: 'Testimonial', date: '2026-03-05', likes: 334, shares: 71, comments: 47, referrals: 6, engRate: '7.8%' },
  { id: 7, platform: 'Twitter/X', type: 'Fundraising', date: '2026-02-27', likes: 89, shares: 134, comments: 15, referrals: 2, engRate: '3.4%' },
]

const PAGE_SIZE = 5

const platformIcon: Record<string, string> = {
  Instagram: '📸',
  Facebook: '👍',
  'Twitter/X': '🐦',
  YouTube: '▶️',
}

export function SocialPage() {
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<keyof (typeof topPosts)[0]>('engRate')
  const sorted = [...topPosts].sort((a, b) => {
    const av = sortKey === 'engRate' ? parseFloat(a[sortKey]) : (a[sortKey] as number)
    const bv = sortKey === 'engRate' ? parseFloat(b[sortKey]) : (b[sortKey] as number)
    return bv - av
  })
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <div>
        <h2 className="text-[var(--text-h)]">Social Media Engagement</h2>
        <p className="text-sm text-[var(--text)] mt-1">
          Platform performance, content analysis, and donation referral tracking.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard
          label="Posts This Month"
          value={socialSummary.postsThisMonth}
          icon="📝"
          trend={{ direction: 'up', text: '+4 vs last month' }}
        />
        <AdminStatCard
          label="Avg Engagement Rate"
          value={socialSummary.engagementRate}
          icon="📊"
          trend={{ direction: 'up', text: '+0.8pp vs last month' }}
          accent
        />
        <AdminStatCard
          label="Donation Referrals"
          value={socialSummary.donationReferrals}
          icon="🔗"
          trend={{ direction: 'up', text: '+14% vs last month' }}
        />
        <AdminStatCard
          label="Est. Referral Value"
          value={socialSummary.estimatedValue}
          icon="💸"
          trend={{ direction: 'up', text: '+₱18k vs last month' }}
        />
      </div>

      {/* Platform engagement + Post type engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-[var(--text-h)] mb-1">Engagement Rate by Platform</h3>
          <p className="text-xs text-[var(--text)] mb-4">Average engagement rate (%) across all posts</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} domain={[0, 8]} />
                <Tooltip formatter={(v) => [`${v}%`, 'Engagement Rate']} />
                <Bar dataKey="rate" fill="#0d9488" radius={[4, 4, 0, 0]} name="Eng. Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-[var(--text-h)] mb-1">Post Type vs Avg Engagement</h3>
          <p className="text-xs text-[var(--text)] mb-4">Which content formats drive the most engagement</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={postTypeData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} domain={[0, 9]} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(v) => [`${v}%`, 'Engagement Rate']} />
                <Bar dataKey="rate" fill="#14b8a6" radius={[0, 4, 4, 0]} name="Eng. Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Referral trend + Best day chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-[var(--text-h)] mb-1">Donation Referrals vs Posting Frequency</h3>
          <p className="text-xs text-[var(--text)] mb-4">Monthly comparison over the last 6 months</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={referralTrendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="referrals" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} name="Referrals" />
                <Line yAxisId="right" type="monotone" dataKey="posts" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Posts" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-[var(--text-h)] mb-1">Best Posting Days</h3>
          <p className="text-xs text-[var(--text)] mb-4">
            Avg engagement rate by day of week — full hour × day heatmap coming once API is wired
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bestDayData} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} domain={[0, 8]} />
                <Tooltip formatter={(v) => [`${v}%`, 'Engagement Rate']} />
                <Bar dataKey="rate" fill="#0d9488" radius={[4, 4, 0, 0]} name="Eng. Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top posts table */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-[var(--text-h)]">Top Posts</h3>
            <p className="text-xs text-[var(--text)] mt-0.5">Sorted by engagement rate. Click a column header to re-sort.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text)]">Sort by:</label>
            <select
              value={sortKey as string}
              onChange={(e) => { setSortKey(e.target.value as keyof (typeof topPosts)[0]); setPage(1) }}
              className="text-xs border border-[var(--border)] rounded-lg px-2 py-1.5 bg-[var(--bg)] text-[var(--text-h)]"
            >
              <option value="engRate">Engagement Rate</option>
              <option value="likes">Likes</option>
              <option value="shares">Shares</option>
              <option value="comments">Comments</option>
              <option value="referrals">Donation Referrals</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Post Type</th>
                <th>Date</th>
                <th>Likes</th>
                <th>Shares</th>
                <th>Comments</th>
                <th>Referrals</th>
                <th>Eng. Rate</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-h)]">
                      {platformIcon[p.platform] ?? '🌐'} {p.platform}
                    </span>
                  </td>
                  <td>
                    <span className="badge text-xs">{p.type}</span>
                  </td>
                  <td className="text-[var(--text)] text-xs">{p.date}</td>
                  <td>{p.likes.toLocaleString()}</td>
                  <td>{p.shares.toLocaleString()}</td>
                  <td>{p.comments.toLocaleString()}</td>
                  <td className="font-medium text-[var(--accent)]">{p.referrals}</td>
                  <td className="font-bold text-[var(--text-h)]">{p.engRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary btn-small"
          >
            ← Previous
          </button>
          <span className="text-sm text-[var(--text)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary btn-small"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
