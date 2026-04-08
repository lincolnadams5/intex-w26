import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { LoadingState } from '../../../components/admin/LoadingState'
import {
  getSafehousesOverview,
  getRiskBySafehouse,
  type SafehouseOverviewRow,
  type RiskBySafehouse,
} from '../../../lib/adminApi'

const RISK_COLORS = {
  Low:      '#22c55e',
  Medium:   '#d97706',
  High:     '#f97316',
  Critical: '#DB7981',
}

function OccupancyBar({ occupancy, capacity }: { occupancy: number; capacity: number }) {
  if (capacity === 0) return <span className="text-xs text-[var(--text)]">—</span>
  const pct = Math.round((occupancy / capacity) * 100)
  const color = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f97316' : '#0d9488'
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{occupancy}/{capacity}</span>
      <div className="w-20 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-[var(--text)]">{pct}%</span>
    </div>
  )
}

export function SafehousePage() {
  const [safehouses, setSafehouses] = useState<SafehouseOverviewRow[]>([])
  const [riskByHouse, setRiskByHouse] = useState<RiskBySafehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getSafehousesOverview(),
      getRiskBySafehouse(),
    ]).then(([sh, rb]) => {
      setSafehouses(sh)
      setRiskByHouse(rb)
    }).catch(() => setError('Failed to load safehouse data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (error) return <p className="text-sm text-[var(--alert)] p-4">{error}</p>

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Safehouses"
        subtitle="Occupancy, health, education, and risk level breakdown across all safehouses."
      />

      <SectionCard
        title="Safehouse Overview"
        subtitle="Current occupancy and latest monthly metrics per safehouse"
      >
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Safehouse</th>
                <th>Region</th>
                <th>Occupancy</th>
                <th>Avg Ed. Progress</th>
                <th>Avg Health Score</th>
                <th>Recordings (Mo.)</th>
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
                    {row.avgEducationProgress != null
                      ? `${Number(row.avgEducationProgress).toFixed(1)}%`
                      : '—'}
                  </td>
                  <td className="font-medium">
                    {row.avgHealthScore != null
                      ? `${Number(row.avgHealthScore).toFixed(1)}/10`
                      : '—'}
                  </td>
                  <td className="text-center">
                    {row.processRecordingCount ?? '—'}
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

      <SectionCard
        title="Risk Level Breakdown by Safehouse"
        subtitle="Active resident count at each risk level per safehouse"
      >
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskByHouse} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="safehouseName" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Low"      stackId="a" fill={RISK_COLORS.Low} />
              <Bar dataKey="Medium"   stackId="a" fill={RISK_COLORS.Medium} />
              <Bar dataKey="High"     stackId="a" fill={RISK_COLORS.High} />
              <Bar dataKey="Critical" stackId="a" fill={RISK_COLORS.Critical} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  )
}
