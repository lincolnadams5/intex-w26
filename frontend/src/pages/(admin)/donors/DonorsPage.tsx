import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { StatCard }    from '../../../components/admin/StatCard'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { Pagination }  from '../../../components/admin/Pagination'
import { LoadingState } from '../../../components/admin/LoadingState'
import {
  getDonorsSummary,
  getDonorTrends,
  getDonationsByType,
  getDonationsByChannel,
  getDonationsByCampaign,
  getDonationAllocations,
  getRecentDonations,
  getDonorImpactSummary,
  type DonorsSummary,
  type MonthlyTotal,
  type DonationByType,
  type DonationByChannel,
  type DonationByCampaign,
  type AllocationRow,
  type RecentDonation,
  type ImpactSummaryItem,
} from '../../../lib/adminApi'

// ── Chart colors ──────────────────────────────────────────────────────────────
const PIE_COLORS   = ['#0d9488', '#14b8a6', '#5eead4', '#99f6e4', '#ccfbf1']
const AREA_COLORS: Record<string, string> = {
  Care:       '#0d9488',
  Healing:    '#14b8a6',
  Teaching:   '#5eead4',
  Operations: '#99f6e4',
  Staff:      '#f0abfc',
  Outreach:   '#a78bfa',
}

const PAGE_SIZE = 5

// ── Pivot flat allocation rows into recharts stacked bar format ───────────────
function pivotAllocations(rows: AllocationRow[]) {
  const byHouse: Record<string, Record<string, number>> = {}
  for (const row of rows) {
    if (!byHouse[row.safehouseName]) byHouse[row.safehouseName] = {}
    byHouse[row.safehouseName][row.programArea] =
      (byHouse[row.safehouseName][row.programArea] ?? 0) + row.total
  }
  return Object.entries(byHouse).map(([name, areas]) => ({ name, ...areas }))
}

// ── Collect unique program areas for bar keys ─────────────────────────────────
function programAreas(rows: AllocationRow[]) {
  return [...new Set(rows.map(r => r.programArea))].sort()
}

export function DonorsPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [summary, setSummary]       = useState<DonorsSummary | null>(null)
  const [trends, setTrends]         = useState<MonthlyTotal[]>([])
  const [byType, setByType]         = useState<DonationByType[]>([])
  const [byChannel, setByChannel]   = useState<DonationByChannel[]>([])
  const [byCampaign, setByCampaign] = useState<DonationByCampaign[]>([])
  const [allocations, setAllocations] = useState<AllocationRow[]>([])
  const [impactSummary, setImpactSummary] = useState<ImpactSummaryItem[]>([])
  const [recentItems, setRecentItems] = useState<RecentDonation[]>([])
  const [totalDonations, setTotalDonations] = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  // ── Fetch summary data on mount ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getDonorsSummary(),
      getDonorTrends(),
      getDonationsByType(),
      getDonationsByChannel(),
      getDonationsByCampaign(),
      getDonationAllocations(),
      getDonorImpactSummary(),
    ]).then(([s, t, bt, bc, bcp, alloc, impact]) => {
      setSummary(s)
      setTrends(t)
      setByType(bt)
      setByChannel(bc)
      setByCampaign(bcp)
      setAllocations(alloc)
      setImpactSummary(impact)
    }).catch(() => setError('Failed to load donor data.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Fetch paginated donations when page changes ──────────────────────────────
  useEffect(() => {
    getRecentDonations(page, PAGE_SIZE).then(result => {
      setRecentItems(result.items)
      setTotalDonations(result.total)
    })
  }, [page])

  if (loading) return <LoadingState />
  if (error) return <p className="text-sm text-[var(--color-error)] p-4">{error}</p>

  const allocPivoted = pivotAllocations(allocations)
  const areas        = programAreas(allocations)
  const totalPages   = Math.ceil(totalDonations / PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Donor Activity"
        subtitle="Donation trends, type breakdowns, campaign performance, and recent contributions."
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Donations (All Time)"
          value={summary ? `₱${summary.totalAllTime.toLocaleString()}` : '—'}
          icon="💰"
          accent
        />
        <StatCard
          label="Total Supporters"
          value={summary?.totalSupporters ?? '—'}
          icon="👥"
        />
        <StatCard
          label="Active / Inactive"
          value={summary ? `${summary.activeSupporters} / ${summary.inactiveSupporters}` : '—'}
          icon="📊"
          subtitle="supporters"
        />
        <StatCard
          label="Recurring Donors"
          value={summary?.recurringDonors ?? '—'}
          icon="🔁"
        />
      </div>

      {/* ── Donation trend + type breakdown ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Line chart: 12-month trend */}
        <SectionCard
          title="Donation Trend"
          subtitle="Monthly monetary total (₱) over the past 12 months"
          className="lg:col-span-2"
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                  width={52}
                />
                <Tooltip formatter={v => [`₱${Number(v).toLocaleString()}`, 'Total']} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ fill: '#0d9488', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Donut chart: donation by type */}
        <SectionCard title="Donation by Type" subtitle="Share of estimated value by type">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byType}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="total"
                  paddingAngle={3}
                >
                  {byType.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`₱${Number(v).toLocaleString()}`, 'Total']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            {byType.map((d, i) => (
              <div key={d.donationType} className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="flex-1">{d.donationType}</span>
                <span className="font-medium text-[var(--color-on-surface)]">{d.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Channel + Campaign ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Horizontal bar: acquisition channel */}
        <SectionCard
          title="Acquisition Channel"
          subtitle="Total monetary donations (₱) by channel source"
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byChannel} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-outline-variant)" />
                <XAxis
                  type="number"
                  tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis dataKey="channel" type="category" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={v => [`₱${Number(v).toLocaleString()}`, 'Total']} />
                <Bar dataKey="total" fill="#0d9488" radius={[0, 4, 4, 0]} name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Horizontal bar: campaign performance */}
        <SectionCard
          title="Campaign Performance"
          subtitle="Total donations raised (₱) per campaign"
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCampaign} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-outline-variant)" />
                <XAxis
                  type="number"
                  tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis dataKey="campaignName" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip formatter={v => [`₱${Number(v).toLocaleString()}`, 'Total']} />
                <Bar dataKey="total" fill="#14b8a6" radius={[0, 4, 4, 0]} name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* ── Donation allocations stacked bar ─────────────────────────────────── */}
      <SectionCard
        title="Donation Allocations by Safehouse"
        subtitle="Amount allocated (₱) per safehouse, broken down by program area"
      >
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={allocPivoted} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                width={52}
              />
              <Tooltip formatter={v => [`₱${Number(v).toLocaleString()}`]} />
              <Legend />
              {areas.map((area, i) => (
                <Bar
                  key={area}
                  dataKey={area}
                  stackId="a"
                  fill={AREA_COLORS[area] ?? PIE_COLORS[i % PIE_COLORS.length]}
                  radius={i === areas.length - 1 ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* ── Donation → Resident Impact ──────────────────────────────────────── */}
      {impactSummary.length > 0 && (
        <SectionCard
          title="Donations Funding Resident Progress"
          subtitle="Funds allocated per safehouse (last 90 days) and current resident readiness"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {impactSummary.map(item => (
              <div
                key={item.safehouseName}
                className="rounded-lg border border-[var(--color-outline-variant)] p-4 flex flex-col gap-1"
              >
                <p className="text-xs text-[var(--color-on-surface-variant)] font-medium">{item.safehouseName}</p>
                <p className="text-2xl font-bold text-[var(--color-on-surface)] leading-tight">
                  ₱{item.totalFunded.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--color-on-surface-variant)]">allocated this quarter</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Recent donations table ───────────────────────────────────────────── */}
      <SectionCard title="Recent Donations" subtitle="Latest contributions across all types">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Donor Name</th>
                <th>Type</th>
                <th>Amount (PHP)</th>
                <th>Date</th>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Recurring</th>
              </tr>
            </thead>
            <tbody>
              {recentItems.map(d => (
                <tr key={d.donationId}>
                  <td className="font-medium text-[var(--color-on-surface)]">{d.donorName}</td>
                  <td><span className="badge text-xs">{d.donationType}</span></td>
                  <td className="font-medium">₱{d.amount.toLocaleString()}</td>
                  <td className="text-[var(--color-on-surface-variant)] text-xs">{d.donationDate?.split('T')[0] ?? '—'}</td>
                  <td className="text-[var(--color-on-surface-variant)] text-xs">{d.campaignName}</td>
                  <td className="text-[var(--color-on-surface-variant)] text-xs">{d.channelSource}</td>
                  <td>
                    {d.isRecurring
                      ? <span className="badge badge-success text-xs">Yes</span>
                      : <span className="badge text-xs">No</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalDonations}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </SectionCard>
    </div>
  )
}
