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
  getSocialMlSummary,
  getSocialMlTopPosts,
  scorePost,
  type SocialSummary,
  type PlatformEngagement,
  type PostTypeEngagement,
  type ContentTopicEngagement,
  type ReferralTrendItem,
  type HeatmapCell,
  type TopPost,
  type SocialMlSummary,
  type SocialMlPost,
  type PostScoreRequest,
  type PostScoreResponse,
} from '../../../lib/adminApi'

// ── Heatmap configuration ─────────────────────────────────────────────────────
const HEATMAP_X_LABELS = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm']
const HEATMAP_Y_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DAY_INDEX: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
  Friday: 4, Saturday: 5, Sunday: 6,
}

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


// ── Impact tier badge helper ──────────────────────────────────────────────────
function TierBadge({ tier }: { tier: string }) {
  const cls =
    tier === 'High Impact'     ? 'badge-success' :
    tier === 'Moderate Impact' ? 'badge-info'    :
    tier === 'Low Impact'      ? 'badge-warning' :
    'badge'
  return <span className={`badge ${cls} text-xs`}>{tier}</span>
}

// ── Inline heatmap ────────────────────────────────────────────────────────────
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
      <div style={{ display: 'flex', marginLeft: '40px' }}>
        {xLabels.map(label => (
          <div key={label} style={{ width: '50px', textAlign: 'center', fontSize: '10px', color: 'var(--color-on-surface-variant)', flexShrink: 0 }}>
            {label}
          </div>
        ))}
      </div>
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

// ── Post Optimizer defaults ───────────────────────────────────────────────────
const DEFAULT_FORM: PostScoreRequest = {
  platform: 'Facebook',
  post_type: 'ImpactStory',
  media_type: 'Photo',
  sentiment_tone: 'Positive',
  has_call_to_action: 1,
  call_to_action_type: 'Donate',
  post_hour: 10,
  day_of_week: 'Monday',
  num_hashtags: 5,
  caption_length: 220,
  is_boosted: 0,
  features_resident_story: 1,
  content_topic: 'Fundraising',
}

const PAGE_SIZE = 5

export function SocialPage() {
  // ── Engagement data state ────────────────────────────────────────────────────
  const [summary, setSummary]             = useState<SocialSummary | null>(null)
  const [byPlatform, setByPlatform]       = useState<PlatformEngagement[]>([])
  const [byPostType, setByPostType]       = useState<PostTypeEngagement[]>([])
  const [byTopic, setByTopic]             = useState<ContentTopicEngagement[]>([])
  const [referralTrend, setReferralTrend] = useState<ReferralTrendItem[]>([])
  const [heatmapCells, setHeatmapCells]   = useState<HeatmapCell[]>([])
  const [topPosts, setTopPosts]           = useState<TopPost[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  // ── ML data state ────────────────────────────────────────────────────────────
  const [mlSummary, setMlSummary]       = useState<SocialMlSummary | null>(null)
  const [mlPosts, setMlPosts]           = useState<SocialMlPost[]>([])
  const [mlPage, setMlPage]             = useState(1)

  // ── Post Optimizer state ─────────────────────────────────────────────────────
  const [optimizerOpen, setOptimizerOpen]     = useState(false)
  const [form, setForm]                       = useState<PostScoreRequest>(DEFAULT_FORM)
  const [scoring, setScoring]                 = useState(false)
  const [scoreResult, setScoreResult]         = useState<PostScoreResponse | null>(null)
  const [scoreError, setScoreError]           = useState<string | null>(null)

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
      getSocialMlSummary(),
      getSocialMlTopPosts(),
    ]).then(([s, plat, pt, topic, trend, heat, posts, mls, mlp]) => {
      setSummary(s)
      setByPlatform(plat)
      setByPostType(pt)
      setByTopic(topic)
      setReferralTrend(trend)
      setHeatmapCells(heat)
      setTopPosts(posts)
      setMlSummary(mls)
      setMlPosts(mlp)
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

  // ── ML posts pagination ───────────────────────────────────────────────────────
  const mlTotalPages = Math.ceil(mlPosts.length / PAGE_SIZE)
  const mlPaged      = mlPosts.slice((mlPage - 1) * PAGE_SIZE, mlPage * PAGE_SIZE)

  // ── ML tier distribution chart data ──────────────────────────────────────────
  const tierData = mlSummary ? [
    { tier: 'High Impact',     count: mlSummary.highImpactCount },
    { tier: 'Moderate Impact', count: mlSummary.moderateImpactCount },
    { tier: 'Low Impact',      count: mlSummary.lowImpactCount },
    { tier: 'Minimal Impact',  count: mlSummary.minimalImpactCount },
  ] : []

  // ── Avg predicted value by platform (from ml posts) ──────────────────────────
  const platformValueMap: Record<string, { sum: number; count: number }> = {}
  for (const p of mlPosts) {
    if (!platformValueMap[p.platform]) platformValueMap[p.platform] = { sum: 0, count: 0 }
    platformValueMap[p.platform].sum   += p.predictedValuePhp
    platformValueMap[p.platform].count += 1
  }
  const platformValueData = Object.entries(platformValueMap).map(([platform, v]) => ({
    platform,
    avgPredictedValue: Math.round(v.sum / v.count),
  }))

  // ── Post Optimizer submit ─────────────────────────────────────────────────────
  async function handleScore() {
    setScoring(true)
    setScoreResult(null)
    setScoreError(null)
    try {
      const result = await scorePost(form)
      setScoreResult(result)
    } catch {
      setScoreError('Optimizer service unavailable. Ensure the FastAPI server is running on port 8001.')
    } finally {
      setScoring(false)
    }
  }

  function setField<K extends keyof PostScoreRequest>(key: K, value: PostScoreRequest[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setScoreResult(null)
    setScoreError(null)
  }

  const hasMlData = mlSummary && mlSummary.scoredPostCount > 0

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      <PageHeader
        title="Social Media Engagement"
        subtitle="Platform performance, content analysis, and ML-predicted donation impact."
      />

      {/* ── Engagement stat cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Posts"
          value={summary?.totalPosts ?? '—'}
        />
        <StatCard
          label="Avg Engagement Rate"
          value={summary ? `${summary.avgEngagementRate.toFixed(2)}%` : '—'}
          accent
        />
        <StatCard
          label="Total Donation Referrals"
          value={summary?.totalReferrals ?? '—'}
        />
        <StatCard
          label="Est. Referral Value"
          value={summary ? `₱${Number(summary.totalReferralValue).toLocaleString()}` : '—'}
        />
      </div>

      {/* ── ML stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Predicted Donation Value (ML)"
          value={hasMlData ? `₱${Math.round(mlSummary!.totalExpectedValuePhp).toLocaleString()}` : '—'}
          accent
        />
        <StatCard
          label="High Impact Posts"
          value={hasMlData
            ? `${mlSummary!.highImpactCount} (${mlSummary!.scoredPostCount > 0 ? Math.round(mlSummary!.highImpactCount / mlSummary!.scoredPostCount * 100) : 0}%)`
            : '—'}
        />
      </div>

      {/* ── Platform engagement + Post type engagement ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* ── ML: Predicted impact charts ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Impact Tier Distribution"
          subtitle="How many posts fall into each ML-predicted donation impact tier"
        >
          {!hasMlData ? (
            <p className="text-sm text-[var(--color-on-surface-variant)] py-4">
              No ML scores available. Run the inference job to populate predictions.
            </p>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tierData} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-outline-variant)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="tier" type="category" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip formatter={v => [v, 'Posts']} />
                  <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} name="Posts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Avg Predicted Value by Platform"
          subtitle="Which platforms the ML model predicts highest donation revenue from"
        >
          {platformValueData.length === 0 ? (
            <p className="text-sm text-[var(--color-on-surface-variant)] py-4">
              No ML scores available.
            </p>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformValueData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `₱${Number(v).toLocaleString()}`} tick={{ fontSize: 10 }} width={70} />
                  <Tooltip formatter={v => [`₱${Number(v).toLocaleString()}`, 'Avg Predicted Value']} />
                  <Bar dataKey="avgPredictedValue" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Avg Predicted Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── ML-Scored Top Posts ───────────────────────────────────────────────── */}
      <SectionCard
        title="ML-Scored Top Posts"
        subtitle="Posts ranked by ML-predicted donation value — engagement alone doesn't tell the full story"
      >
        {!hasMlData ? (
          <p className="text-sm text-[var(--color-on-surface-variant)] py-4">
            No ML scores available. Run: <code className="text-xs bg-[var(--color-surface-container)] px-1 py-0.5 rounded">python -m jobs.run_inference --source csv --sink supabase</code>
          </p>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Post Type</th>
                    <th>Topic</th>
                    <th>Date</th>
                    <th>Predicted Value</th>
                    <th>P(Donation)</th>
                    <th>Tier</th>
                    <th>Eng. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {mlPaged.map(p => (
                    <tr key={p.postId}>
                      <td>
                        {p.postUrl ? (
                          <a
                            href={p.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
                          >
                            {p.platform}
                          </a>
                        ) : (
                          <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-on-surface)]">
                            {p.platform}
                          </span>
                        )}
                      </td>
                      <td><span className="badge text-xs">{p.postType}</span></td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">{p.contentTopic}</td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-PH') : '—'}
                      </td>
                      <td className="font-bold text-[var(--color-primary)]">
                        ₱{Math.round(p.predictedValuePhp).toLocaleString()}
                      </td>
                      <td className="font-medium">
                        {(p.pHasDonation * 100).toFixed(1)}%
                      </td>
                      <td><TierBadge tier={p.valueTier} /></td>
                      <td className="text-[var(--color-on-surface-variant)]">
                        {p.engagementRate != null ? `${Number(p.engagementRate).toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={mlPage}
              totalPages={mlTotalPages}
              totalItems={mlPosts.length}
              pageSize={PAGE_SIZE}
              onPageChange={setMlPage}
            />
          </>
        )}
      </SectionCard>

      {/* ── Post Optimizer ───────────────────────────────────────────────────── */}
      <SectionCard
        title="Post Optimizer"
        subtitle="Fill in your post details before publishing to get an ML-predicted donation probability and expected value"
      >
        {/* Toggle open/close */}
        <button
          onClick={() => setOptimizerOpen(o => !o)}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline mb-4"
        >
          {optimizerOpen ? '▲ Hide optimizer' : '▼ Open optimizer'}
        </button>

        {optimizerOpen && (
          <div className="flex flex-col gap-6">
            {/* Form grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Platform */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Platform</label>
                <select
                  value={form.platform}
                  onChange={e => setField('platform', e.target.value)}
                  className="text-sm border border-[var(--color-outline-variant)] rounded-lg px-2 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
                >
                  {['Facebook', 'Instagram', 'Twitter', 'YouTube', 'TikTok', 'LinkedIn', 'WhatsApp'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Post Type */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Post Type</label>
                <select
                  value={form.post_type}
                  onChange={e => setField('post_type', e.target.value)}
                  className="text-sm border border-[var(--color-outline-variant)] rounded-lg px-2 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
                >
                  {['ImpactStory', 'Announcement', 'EventPromo', 'Educational', 'Campaign', 'ThankYou', 'FundraisingAppeal', 'EducationalContent', 'EventPromotion'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Media Type */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Media Type</label>
                <select
                  value={form.media_type}
                  onChange={e => setField('media_type', e.target.value)}
                  className="text-sm border border-[var(--color-outline-variant)] rounded-lg px-2 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
                >
                  {['Photo', 'Video', 'Reel', 'Story', 'Text', 'Carousel'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Content Topic */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Content Topic</label>
                <select
                  value={form.content_topic}
                  onChange={e => setField('content_topic', e.target.value)}
                  className="text-sm border border-[var(--color-outline-variant)] rounded-lg px-2 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
                >
                  {['Fundraising', 'Impact', 'Awareness', 'Events', 'Education', 'Health', 'DonorImpact', 'CampaignLaunch', 'Gratitude', 'Reintegration'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Sentiment Tone */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Sentiment Tone</label>
                <select
                  value={form.sentiment_tone}
                  onChange={e => setField('sentiment_tone', e.target.value)}
                  className="text-sm border border-[var(--color-outline-variant)] rounded-lg px-2 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
                >
                  {['Positive', 'Neutral', 'Urgent', 'Inspirational', 'Emotional', 'Celebratory', 'Informative'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Call to Action Type */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Call to Action</label>
                <select
                  value={form.call_to_action_type}
                  onChange={e => setField('call_to_action_type', e.target.value)}
                  className="text-sm border border-[var(--color-outline-variant)] rounded-lg px-2 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
                >
                  {['Donate', 'Share', 'Volunteer', 'Learn More', 'None', 'SignUp', 'DonateNow', 'ShareStory'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Day of Week */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Day of Week</label>
                <select
                  value={form.day_of_week}
                  onChange={e => setField('day_of_week', e.target.value)}
                  className="text-sm border border-[var(--color-outline-variant)] rounded-lg px-2 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Post Hour */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">
                  Post Hour — {form.post_hour === 0 ? '12am' : form.post_hour < 12 ? `${form.post_hour}am` : form.post_hour === 12 ? '12pm' : `${form.post_hour - 12}pm`}
                </label>
                <input
                  type="range"
                  min={0}
                  max={23}
                  value={form.post_hour}
                  onChange={e => setField('post_hour', Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>

              {/* Num Hashtags */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Number of Hashtags</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={form.num_hashtags}
                  onChange={e => setField('num_hashtags', Number(e.target.value))}
                  className="text-sm border border-[var(--color-outline-variant)] rounded-lg px-2 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
                />
              </div>

              {/* Caption Length */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Caption Length (chars)</label>
                <input
                  type="number"
                  min={0}
                  max={2200}
                  value={form.caption_length}
                  onChange={e => setField('caption_length', Number(e.target.value))}
                  className="text-sm border border-[var(--color-outline-variant)] rounded-lg px-2 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
                {(
                  [
                    ['has_call_to_action', 'Has Call to Action'],
                    ['is_boosted', 'Is Boosted (Paid)'],
                    ['features_resident_story', 'Features Resident Story'],
                  ] as [keyof PostScoreRequest, string][]
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key] === 1}
                      onChange={e => setField(key, e.target.checked ? 1 : 0)}
                      className="w-4 h-4 accent-[var(--color-primary)]"
                    />
                    <span className="text-sm text-[var(--color-on-surface)]">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleScore}
                disabled={scoring}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {scoring ? 'Scoring…' : 'Predict Donation Impact'}
              </button>
            </div>

            {/* Result */}
            {scoreError && (
              <p className="text-sm text-[var(--color-error)]">{scoreError}</p>
            )}
            {scoreResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)]">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--color-on-surface-variant)]">P(Donation)</span>
                  <span
                    className="text-3xl font-bold"
                    style={{
                      color: scoreResult.p_has_donation >= 0.7 ? 'var(--color-success)' :
                             scoreResult.p_has_donation >= 0.4 ? 'var(--color-primary)' :
                             'var(--color-on-surface-variant)'
                    }}
                  >
                    {(scoreResult.p_has_donation * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--color-on-surface-variant)]">Expected Donation Value</span>
                  <span className="text-3xl font-bold text-[var(--color-on-surface)]">
                    ₱{Math.round(scoreResult.expected_value_php).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--color-on-surface-variant)]">Impact Tier</span>
                  <div className="mt-1">
                    <TierBadge tier={scoreResult.value_tier} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Top posts table (engagement-based) ──────────────────────────────── */}
      <SectionCard title="Top Posts by Engagement" subtitle="Sorted by the selected metric">
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
                    {p.postUrl ? (
                      <a
                        href={p.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {p.platform}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-[var(--color-on-surface)]">
                        {p.platform}
                      </span>
                    )}
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
