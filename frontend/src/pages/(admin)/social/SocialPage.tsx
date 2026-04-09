import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { StatCard }    from '../../../components/admin/StatCard'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { Pagination }  from '../../../components/admin/Pagination'
import { LoadingState } from '../../../components/admin/LoadingState'
import {
  getSocialSummary,
  getSocialByPlatform,
  getSocialByPostType,
  getSocialByContentTopic,
  getSocialReferralTrend,
  getSocialPostingHeatmap,
  getSocialTopPosts,
  type SocialSummary,
  type PlatformEngagement,
  type PostTypeEngagement,
  type ContentTopicEngagement,
  type ReferralTrendItem,
  type HeatmapCell,
  type TopPost,
} from '../../../lib/adminApi'

// ── Heatmap configuration ─────────────────────────────────────────────────────
// Buckets: 0 = 12am–3am, 1 = 3am–6am, … 7 = 9pm–12am
const HEATMAP_X_LABELS = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm']
const HEATMAP_Y_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Map full day names (from DB) to 0-based index
const DAY_INDEX: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
  Friday: 4, Saturday: 5, Sunday: 6,
}

// Transform flat heatmap cells into the 2D matrix required by react-heatmap-grid
function buildHeatmapMatrix(cells: HeatmapCell[]): number[][] {
  const matrix = HEATMAP_Y_LABELS.map(() => HEATMAP_X_LABELS.map(() => 0))
  for (const cell of cells) {
    const dayIdx  = DAY_INDEX[cell.day]
    const hourIdx = cell.hourBucket
    if (dayIdx !== undefined && hourIdx >= 0 && hourIdx < 8) {
      matrix[dayIdx][hourIdx] = cell.avgEngagementRate
    }
  }
  return matrix
}

// ── Platform icon map ─────────────────────────────────────────────────────────
const PLATFORM_ICON: Record<string, string> = {
  Instagram:  '📸',
  Facebook:   '👍',
  'Twitter/X': '🐦',
  YouTube:    '▶️',
  TikTok:     '🎵',
  LinkedIn:   '💼',
  WhatsApp:   '💬',
}

// ── Inline heatmap — replaces react-heatmap-grid (not compatible with React 19) ─
function PostingHeatmap({ data, xLabels, yLabels }: {
  data: number[][]
  xLabels: string[]
  yLabels: string[]
}) {
  const allValues = data.flat()
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* X-axis labels (top) */}
      <div style={{ display: 'flex', marginLeft: '40px' }}>
        {xLabels.map(label => (
          <div key={label} style={{ width: '50px', textAlign: 'center', fontSize: '10px', color: 'var(--color-on-surface-variant)', flexShrink: 0 }}>
            {label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {yLabels.map((yLabel, y) => (
        <div key={yLabel} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '40px', fontSize: '10px', color: 'var(--color-on-surface-variant)', flexShrink: 0 }}>
            {yLabel}
          </div>
          {xLabels.map((_label, x) => {
            const value = data[y][x]
            const intensity = max === min ? 0 : (value - min) / (max - min)
            return (
              <div
                key={x}
                style={{
                  width: '48px',
                  height: '32px',
                  margin: '1px',
                  borderRadius: '3px',
                  background: `rgba(13, 148, 136, ${0.08 + intensity * 0.88})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: intensity > 0.5 ? '#fff' : '#1e293b',
                  flexShrink: 0,
                }}
              >
                {value > 0 ? `${value.toFixed(1)}%` : ''}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

const PAGE_SIZE = 5

export function SocialPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [summary, setSummary]             = useState<SocialSummary | null>(null)
  const [byPlatform, setByPlatform]       = useState<PlatformEngagement[]>([])
  const [byPostType, setByPostType]       = useState<PostTypeEngagement[]>([])
  const [byTopic, setByTopic]             = useState<ContentTopicEngagement[]>([])
  const [referralTrend, setReferralTrend] = useState<ReferralTrendItem[]>([])
  const [heatmapCells, setHeatmapCells]   = useState<HeatmapCell[]>([])
  const [topPosts, setTopPosts]           = useState<TopPost[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  // ── Table sort + pagination state ────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<keyof TopPost>('engagementRate')
  const [page, setPage]       = useState(1)

  // ── Fetch all data on mount ──────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getSocialSummary(),
      getSocialByPlatform(),
      getSocialByPostType(),
      getSocialByContentTopic(),
      getSocialReferralTrend(),
      getSocialPostingHeatmap(),
      getSocialTopPosts(),
    ]).then(([s, plat, pt, topic, trend, heat, posts]) => {
      setSummary(s)
      setByPlatform(plat)
      setByPostType(pt)
      setByTopic(topic)
      setReferralTrend(trend)
      setHeatmapCells(heat)
      setTopPosts(posts)
    }).catch(() => setError('Failed to load social analytics data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (error) return <p className="text-sm text-[var(--color-error)] p-4">{error}</p>

  // ── Sort + paginate top posts ─────────────────────────────────────────────────
  const sorted = [...topPosts].sort((a, b) =>
    ((b[sortKey] as number) ?? 0) - ((a[sortKey] as number) ?? 0)
  )
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged      = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const heatmapMatrix = buildHeatmapMatrix(heatmapCells)

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Social Media Engagement"
        subtitle="Platform performance, content analysis, and donation referral tracking."
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Posts"
          value={summary?.totalPosts ?? '—'}
          icon="📝"
        />
        <StatCard
          label="Avg Engagement Rate"
          value={summary ? `${summary.avgEngagementRate.toFixed(2)}%` : '—'}
          icon="📊"
          accent
        />
        <StatCard
          label="Total Donation Referrals"
          value={summary?.totalReferrals ?? '—'}
          icon="🔗"
        />
        <StatCard
          label="Est. Referral Value"
          value={summary ? `₱${Number(summary.totalReferralValue).toLocaleString()}` : '—'}
          icon="💸"
        />
      </div>

      {/* ── Platform engagement + Post type engagement ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bar: engagement by platform */}
        <SectionCard
          title="Engagement Rate by Platform"
          subtitle="Average engagement rate (%) per platform"
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPlatform} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
                <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${Number(v).toFixed(2)}%`, 'Avg Engagement']} />
                <Bar dataKey="avgEngagementRate" fill="#0d9488" radius={[4, 4, 0, 0]} name="Eng. Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Horizontal bar: post type vs engagement */}
        <SectionCard
          title="Post Type vs Avg Engagement"
          subtitle="Which content formats drive the most engagement"
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPostType} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-outline-variant)" />
                <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="postType" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={v => [`${Number(v).toFixed(2)}%`, 'Avg Engagement']} />
                <Bar dataKey="avgEngagementRate" fill="#14b8a6" radius={[0, 4, 4, 0]} name="Eng. Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* ── Content topic performance ────────────────────────────────────────── */}
      <SectionCard
        title="Content Topic Performance"
        subtitle="Average engagement rate by content topic — identify what stories drive action"
      >
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byTopic} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-outline-variant)" />
              <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
              <YAxis dataKey="contentTopic" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={v => [`${Number(v).toFixed(2)}%`, 'Avg Engagement']} />
              <Bar dataKey="avgEngagementRate" fill="#0d9488" radius={[0, 4, 4, 0]} name="Eng. Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* ── Referral trend + Posting heatmap ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Line: donation referrals vs posting frequency */}
        <SectionCard
          title="Donation Referrals vs Posting Frequency"
          subtitle="Monthly comparison over the last 6 months"
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={referralTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalReferrals"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  name="Referrals"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="postCount"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  name="Posts"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Heatmap: best posting times (day × 3-hour bucket) */}
        <SectionCard
          title="Best Posting Times"
          subtitle="Avg engagement rate by day × time — darker = higher engagement"
        >
          <PostingHeatmap
            xLabels={HEATMAP_X_LABELS}
            yLabels={HEATMAP_Y_LABELS}
            data={heatmapMatrix}
          />
        </SectionCard>
      </div>

      {/* ── Top posts table ──────────────────────────────────────────────────── */}
      <SectionCard title="Top Posts" subtitle="Sorted by the selected metric">
        {/* Sort dropdown */}
        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs text-[var(--color-on-surface-variant)]">Sort by:</label>
          <select
            value={sortKey as string}
            onChange={e => { setSortKey(e.target.value as keyof TopPost); setPage(1) }}
            className="text-xs border border-[var(--color-outline-variant)] rounded-lg px-2 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
          >
            <option value="engagementRate">Engagement Rate</option>
            <option value="likes">Likes</option>
            <option value="shares">Shares</option>
            <option value="donationReferrals">Donation Referrals</option>
            <option value="impressions">Impressions</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Post Type</th>
                <th>Topic</th>
                <th>Date</th>
                <th>Likes</th>
                <th>Shares</th>
                <th>Referrals</th>
                <th>Eng. Rate</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(p => (
                <tr key={p.postId}>
                  <td>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-on-surface)]">
                      {PLATFORM_ICON[p.platform] ?? '🌐'} {p.platform}
                    </span>
                  </td>
                  <td><span className="badge text-xs">{p.postType}</span></td>
                  <td className="text-[var(--color-on-surface-variant)] text-xs">{p.contentTopic}</td>
                  <td className="text-[var(--color-on-surface-variant)] text-xs">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-PH') : '—'}
                  </td>
                  <td>{p.likes.toLocaleString()}</td>
                  <td>{p.shares.toLocaleString()}</td>
                  <td className="font-medium text-[var(--color-primary)]">{p.donationReferrals}</td>
                  <td className="font-bold text-[var(--color-on-surface)]">
                    {p.engagementRate != null ? `${Number(p.engagementRate).toFixed(2)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={sorted.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </SectionCard>
    </div>
  )
}
