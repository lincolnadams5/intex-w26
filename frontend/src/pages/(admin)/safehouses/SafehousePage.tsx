import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { StatCard }    from '../../../components/admin/StatCard'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { LoadingState } from '../../../components/admin/LoadingState'
import {
  getSafehousesOverview,
  getSafehouseMonthlyMetrics,
  getRiskBySafehouse,
  type SafehouseOverviewRow,
  type SafehouseMonthlyPoint,
  type RiskBySafehouse,
} from '../../../lib/adminApi'

// ── Palette for per-safehouse lines / bars ────────────────────────────────────

const SAFEHOUSE_COLORS = [
  '#0d9488', '#3b82f6', '#a855f7', '#f97316',
  '#ec4899', '#84cc16', '#eab308', '#06b6d4', '#ef4444',
]

const RISK_COLORS = {
  Low:      '#22c55e',
  Medium:   '#d97706',
  High:     '#f97316',
  Critical: '#DB7981',
}

// ── Occupancy bar with color coding ──────────────────────────────────────────

function OccupancyBar({ occupancy, capacity }: { occupancy: number; capacity: number }) {
  if (capacity === 0) return <span className="text-xs text-[var(--text)]">—</span>
  const pct = Math.round((occupancy / capacity) * 100)
  const color = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f97316' : '#0d9488'
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{occupancy}/{capacity}</span>
      <div className="w-20 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="text-xs" style={{ color }}>{pct}%</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function SafehousePage() {
  const [safehouses, setSafehouses]   = useState<SafehouseOverviewRow[]>([])
  const [monthly, setMonthly]         = useState<SafehouseMonthlyPoint[]>([])
  const [riskByHouse, setRiskByHouse] = useState<RiskBySafehouse[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getSafehousesOverview(),
      getSafehouseMonthlyMetrics(),
      getRiskBySafehouse(),
    ]).then(([sh, mo, rb]) => {
      setSafehouses(sh)
      setMonthly(mo)
      setRiskByHouse(rb)
    }).catch(() => setError('Failed to load safehouse data.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Summary stats ─────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    if (!safehouses.length) return null
    const active    = safehouses.filter(s => s.status === 'Active').length
    const totalCap  = safehouses.reduce((a, s) => a + s.capacity, 0)
    const totalOcc  = safehouses.reduce((a, s) => a + s.occupancy, 0)
    const nearCap   = safehouses
      .filter(s => s.capacity > 0)
      .reduce((best, s) =>
        (s.occupancy / s.capacity) > (best.occupancy / best.capacity) ? s : best
      )
    const nearCapPct = nearCap.capacity > 0
      ? Math.round((nearCap.occupancy / nearCap.capacity) * 100)
      : 0
    return { active, total: safehouses.length, totalCap, totalOcc, nearCap, nearCapPct }
  }, [safehouses])

  // ── Pivot monthly data for line chart (month → {safehouseName: count}) ────

  const safehouseNames = useMemo(
    () => Array.from(new Set(monthly.map(m => m.safehouseName))).sort(),
    [monthly]
  )

  const incidentsByMonth = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>()
    for (const pt of monthly) {
      if (!map.has(pt.month)) map.set(pt.month, { month: pt.month })
      map.get(pt.month)![pt.safehouseName] = pt.incidentCount
    }
    return Array.from(map.values())
  }, [monthly])

  // ── Bar chart data (latest non-null value per safehouse from full history) ──
  // The overview returns the most recent metric row, which may have null values.
  // Monthly data is sorted ascending, so iterating forward gives us the latest non-null.

  const healthBarData = useMemo(() => {
    const map = new Map<string, number>()
    for (const pt of monthly) {
      if (pt.avgHealthScore != null) map.set(pt.safehouseName, pt.avgHealthScore)
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [monthly])

  const educationBarData = useMemo(() => {
    const map = new Map<string, number>()
    for (const pt of monthly) {
      if (pt.avgEducationProgress != null) map.set(pt.safehouseName, pt.avgEducationProgress)
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [monthly])

  if (loading) return <LoadingState />
  if (error)   return <p className="text-sm text-[var(--alert)] p-4">{error}</p>

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Safehouses"
        subtitle="Occupancy, health, education, and incident trends across all locations."
      />

      {/* ── Summary cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Safehouses"
          value={summary ? `${summary.active} / ${summary.total}` : '—'}
          icon="🏡"
          subtitle="active / total"
        />
        <StatCard
          label="Total Capacity"
          value={summary?.totalCap ?? '—'}
          icon="📋"
          subtitle={`${summary?.totalOcc ?? 0} currently occupied`}
        />
        <StatCard
          label="Overall Occupancy"
          value={summary ? `${Math.round((summary.totalOcc / summary.totalCap) * 100)}%` : '—'}
          icon="📊"
          subtitle={`${summary?.totalOcc} / ${summary?.totalCap} residents`}
        />
        <StatCard
          label="Nearest to Capacity"
          value={summary ? `${summary.nearCapPct}%` : '—'}
          icon="⚠️"
          subtitle={summary?.nearCap.name ?? '—'}
        />
      </div>

      {/* ── Comparison table ─────────────────────────────────────────────────── */}
      <SectionCard
        title="Safehouse Comparison"
        subtitle="Current occupancy and latest monthly metrics per location"
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Safehouse</th>
                <th>Region</th>
                <th>Occupancy</th>
                <th>Avg Health Score</th>
                <th>Avg Ed. Progress</th>
                <th>Incidents (Mo.)</th>
              </tr>
            </thead>
            <tbody>
              {safehouses.map(row => (
                <tr key={row.safehouseId}>
                  <td className="font-medium text-[var(--text-h)]">{row.name}</td>
                  <td className="text-[var(--text)] text-xs">{row.region}</td>
                  <td>
                    <OccupancyBar occupancy={row.occupancy} capacity={row.capacity} />
                  </td>
                  <td className="font-medium">
                    {row.avgHealthScore != null
                      ? `${Number(row.avgHealthScore).toFixed(1)} / 10`
                      : '—'}
                  </td>
                  <td className="font-medium">
                    {row.avgEducationProgress != null
                      ? `${Number(row.avgEducationProgress).toFixed(1)}%`
                      : '—'}
                  </td>
                  <td>
                    {row.incidentCount != null && row.incidentCount > 0
                      ? <span className="badge badge-error">{row.incidentCount}</span>
                      : <span className="badge badge-success">{row.incidentCount ?? 0}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Charts row 1: incidents line + risk stacked bar ──────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SectionCard
          title="Monthly Incidents by Safehouse"
          subtitle="Incident count per location over time"
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incidentsByMonth} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {safehouseNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={SAFEHOUSE_COLORS[i % SAFEHOUSE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Risk Level Breakdown by Safehouse"
          subtitle="Active resident count at each risk level"
        >
          <div className="h-[32 0px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskByHouse} margin={{ left: 0, right: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="safehouseName" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Low"      stackId="a" fill={RISK_COLORS.Low} />
                <Bar dataKey="Medium"   stackId="a" fill={RISK_COLORS.Medium} />
                <Bar dataKey="High"     stackId="a" fill={RISK_COLORS.High} />
                <Bar dataKey="Critical" stackId="a" fill={RISK_COLORS.Critical} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* ── Charts row 2: health bar + education bar ──────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SectionCard
          title="Average Health Score by Safehouse"
          subtitle="Based on latest monthly metrics (out of 10)"
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthBarData} margin={{ left: 0, right: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} / 10`, 'Avg Health']} />
                <Bar dataKey="value" name="Avg Health Score" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Average Education Progress by Safehouse"
          subtitle="Based on latest monthly metrics (%)"
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={educationBarData} margin={{ left: 0, right: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Avg Education']} />
                <Bar dataKey="value" name="Avg Education Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
