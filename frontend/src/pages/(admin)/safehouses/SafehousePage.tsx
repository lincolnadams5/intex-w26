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
  getOutcomeCoefficients,
  getOutcomeDrivers,
  type SafehouseOverviewRow,
  type SafehouseMonthlyPoint,
  type RiskBySafehouse,
  type SafehouseOutcomeCoefficient,
  type SafehouseOutcomeDriver,
} from '../../../lib/adminApi'

// ── Readable labels for pipeline feature names ───────────────────────────────

const FEATURE_LABELS: Record<string, string> = {
  sessions_per_resident:         'Program Sessions per Resident',
  visits_per_resident:           'Home Visits per Resident',
  pct_high_risk:                 'High-Risk Residents (%)',
  pct_trafficked:                'Trafficking Survivors (%)',
  pct_special_needs:             'Residents with Special Needs (%)',
  months_since_start:            'Months Since Safehouse Opened',
  sessions_per_resident_lag1:    'Program Sessions per Resident (Prior Month)',
  visits_per_resident_lag1:      'Home Visits per Resident (Prior Month)',
  pct_high_risk_lag1:            'High-Risk Residents — Prior Month (%)',
  pct_trafficked_lag1:           'Trafficking Survivors — Prior Month (%)',
  pct_special_needs_lag1:        'Residents with Special Needs — Prior Month (%)',
}

function EffectBadge({ beta, sig }: { beta: number | null; sig: string | null }) {
  const significant = sig === '*' || sig === '**' || sig === '***'
  if (!significant || beta == null) {
    return <span className="text-xs text-[var(--text)]">No clear effect</span>
  }
  const positive = beta > 0
  return (
    <span className={`badge ${positive ? 'badge-success' : 'badge-error'}`}>
      {positive ? '↑ Improves' : '↓ Worsens'}
    </span>
  )
}

// ── Palette for per-safehouse lines / bars ───────────────────────────────────

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
  const [coefficients, setCoefficients] = useState<SafehouseOutcomeCoefficient[]>([])
  const [drivers, setDrivers]           = useState<SafehouseOutcomeDriver[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getSafehousesOverview(),
      getSafehouseMonthlyMetrics(),
      getRiskBySafehouse(),
      getOutcomeCoefficients(),
      getOutcomeDrivers(),
    ]).then(([sh, mo, rb, coef, driv]) => {
      setSafehouses(sh)
      setMonthly(mo)
      setRiskByHouse(rb)
      setCoefficients(coef)
      setDrivers(driv)
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

  // Latest non-null health/education per safehouse, with the month it was recorded
  const latestHealthByName = useMemo(() => {
    const map = new Map<string, { value: number; month: string }>()
    for (const pt of monthly) {
      if (pt.avgHealthScore != null) map.set(pt.safehouseName, { value: pt.avgHealthScore, month: pt.month })
    }
    return map
  }, [monthly])

  const latestEdByName = useMemo(() => {
    const map = new Map<string, { value: number; month: string }>()
    for (const pt of monthly) {
      if (pt.avgEducationProgress != null) map.set(pt.safehouseName, { value: pt.avgEducationProgress, month: pt.month })
    }
    return map
  }, [monthly])

  const healthBarData = useMemo(
    () => Array.from(latestHealthByName.entries()).map(([name, { value }]) => ({ name, value })),
    [latestHealthByName]
  )

  const educationBarData = useMemo(
    () => Array.from(latestEdByName.entries()).map(([name, { value }]) => ({ name, value })),
    [latestEdByName]
  )

  if (loading) return <LoadingState />
  if (error)   return <p className="text-sm text-[var(--alert)] p-4">{error}</p>

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      <PageHeader
        title="Safehouses"
        subtitle="Occupancy, health, education, and incident trends across all locations."
      />

      {/* ── Summary cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Safehouses"
          value={summary ? `${summary.active} / ${summary.total}` : '—'}
          subtitle="active / total"
        />
        <StatCard
          label="Total Capacity"
          value={summary?.totalCap ?? '—'}
          subtitle={`${summary?.totalOcc ?? 0} currently occupied`}
        />
        <StatCard
          label="Overall Occupancy"
          value={summary ? `${Math.round((summary.totalOcc / summary.totalCap) * 100)}%` : '—'}
          subtitle={`${summary?.totalOcc} / ${summary?.totalCap} residents`}
        />
        <StatCard
          label="Nearest to Capacity"
          value={summary ? `${summary.nearCapPct}%` : '—'}
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
                    {(() => {
                      const entry = latestHealthByName.get(row.name)
                      return entry
                        ? <span title={`Recorded: ${entry.month}`} className="cursor-help border-b border-dashed border-[var(--text)] pb-px">{entry.value.toFixed(1)} / 5</span>
                        : '—'
                    })()}
                  </td>
                  <td className="font-medium">
                    {(() => {
                      const entry = latestEdByName.get(row.name)
                      return entry
                        ? <span title={`Recorded: ${entry.month}`} className="cursor-help border-b border-dashed border-[var(--text)] pb-px">{entry.value.toFixed(1)}%</span>
                        : '—'
                    })()}
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
          <div className="h-[320px]">
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

      {/* ── Section 6: Outcome Drivers ───────────────────────────────────── */}
      <SectionCard
        title="What Drives Outcomes"
        subtitle="Shows whether each program factor improves or worsens resident health and education, based on weekly statistical analysis. Only factors with a statistically reliable effect are shown as Improves or Worsens — others are listed as 'No clear effect'."
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Program Factor</th>
                <th>Effect on Health Score</th>
                <th>Effect on Education Progress</th>
              </tr>
            </thead>
            <tbody>
              {coefficients.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-sm py-4">No data available.</td>
                </tr>
              ) : coefficients.map(row => (
                <tr key={row.id}>
                  <td className="font-medium">{row.feature ? (FEATURE_LABELS[row.feature] ?? row.feature) : '—'}</td>
                  <td><EffectBadge beta={row.betaHealth} sig={row.sigHealth} /></td>
                  <td><EffectBadge beta={row.betaEdu}    sig={row.sigEdu}    /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Section 7: Flagged Safehouses ────────────────────────────────── */}
      <SectionCard
        title="Safehouses Needing Attention"
        subtitle="Safehouses where resident health or education outcomes are significantly below what the model predicts, based on the most recent weekly analysis. These may benefit from a staff check-in or resource review."
        accentBorder
        titleIcon="⚠️"
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Safehouse</th>
                <th>Region</th>
                <th>Concern Area</th>
                <th>Reason</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {drivers.filter(r => r.flaggedHealth || r.flaggedEdu).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-sm py-4">No safehouses flagged — all outcomes are within expected range.</td>
                </tr>
              ) : drivers.filter(r => r.flaggedHealth || r.flaggedEdu).map(row => (
                <tr key={row.id}>
                  <td className="font-medium">{row.safehouseName ?? '—'}</td>
                  <td className="text-xs">{row.region ?? '—'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {row.flaggedHealth && <span className="badge badge-error">Health Score</span>}
                      {row.flaggedEdu    && <span className="badge badge-error">Education Progress</span>}
                    </div>
                  </td>
                  <td className="text-xs">{row.flaggedFor ?? '—'}</td>
                  <td className="text-xs">{row.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
