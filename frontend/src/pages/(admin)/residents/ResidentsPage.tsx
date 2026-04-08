import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { StatCard }    from '../../../components/admin/StatCard'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { RiskBadge }   from '../../../components/admin/RiskBadge'
import { LoadingState } from '../../../components/admin/LoadingState'
import {
  getResidentsSummary,
  getSafehousesOverview,
  getRiskBySafehouse,
  getRiskEscalations,
  getRecentRecordings,
  getRecentIncidents,
  type ResidentsSummary,
  type SafehouseOverviewRow,
  type RiskBySafehouse,
  type RiskEscalation,
  type RecentRecording,
  type RecentIncident,
} from '../../../lib/adminApi'

// ── Risk level chart colors ───────────────────────────────────────────────────
const RISK_COLORS = {
  Low:      '#22c55e',
  Medium:   '#d97706',
  High:     '#f97316',
  Critical: '#DB7981',
}

// ── Severity badge classes ────────────────────────────────────────────────────
function severityClass(s: string) {
  if (s === 'High')     return 'badge-error'
  if (s === 'Moderate') return 'badge-warning'
  return 'badge'
}

// ── Occupancy progress bar ────────────────────────────────────────────────────
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

export function ResidentsPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [summary, setSummary]           = useState<ResidentsSummary | null>(null)
  const [safehouses, setSafehouses]     = useState<SafehouseOverviewRow[]>([])
  const [riskByHouse, setRiskByHouse]   = useState<RiskBySafehouse[]>([])
  const [escalations, setEscalations]   = useState<RiskEscalation[]>([])
  const [recordings, setRecordings]     = useState<RecentRecording[]>([])
  const [incidents, setIncidents]       = useState<RecentIncident[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  // ── Fetch all data on mount ──────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getResidentsSummary(),
      getSafehousesOverview(),
      getRiskBySafehouse(),
      getRiskEscalations(),
      getRecentRecordings(),
      getRecentIncidents(),
    ]).then(([s, sh, rb, esc, rec, inc]) => {
      setSummary(s)
      setSafehouses(sh)
      setRiskByHouse(rb)
      setEscalations(esc)
      setRecordings(rec)
      setIncidents(inc)
    }).catch(() => setError('Failed to load residents data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (error) return <p className="text-sm text-[var(--alert)] p-4">{error}</p>

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Residents & Safehouses"
        subtitle="Occupancy, risk levels, recent sessions, and incident reports across all safehouses."
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Residents"
          value={summary?.activeResidents ?? '—'}
          icon="🏠"
        />
        <StatCard
          label="High / Critical Risk"
          value={summary?.highCriticalRisk ?? '—'}
          icon="⚠️"
          subtitle="active residents"
        />
        <StatCard
          label="Reintegration In Progress"
          value={summary?.reintegrationInProgress ?? '—'}
          icon="🌱"
        />
        <StatCard
          label="Upcoming Conferences"
          value={summary?.upcomingConferences ?? '—'}
          icon="📅"
        />
      </div>

      {/* ── Safehouse overview table ─────────────────────────────────────────── */}
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

      {/* ── Risk level stacked bar ───────────────────────────────────────────── */}
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

      {/* ── Risk escalations table ───────────────────────────────────────────── */}
      <SectionCard
        title="Risk Escalations Since Intake"
        subtitle="Residents whose current risk level is higher than their initial assessment"
        accentBorder
        titleIcon="⚠️"
      >
        {escalations.length === 0 ? (
          <p className="text-sm text-[var(--text)]">No risk escalations found.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Resident Code</th>
                  <th>Safehouse</th>
                  <th>Initial Risk</th>
                  <th>Current Risk</th>
                  <th>Length of Stay</th>
                </tr>
              </thead>
              <tbody>
                {escalations.map(r => (
                  <tr key={r.internalCode}>
                    <td className="font-medium text-[var(--text-h)]">{r.internalCode}</td>
                    <td className="text-[var(--text)] text-xs">{r.safehouseName}</td>
                    <td><RiskBadge level={r.initialRiskLevel} /></td>
                    <td><RiskBadge level={r.currentRiskLevel} /></td>
                    <td className="text-[var(--text)] text-xs">{r.lengthOfStay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Recent recordings + incidents ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent process recordings (last 7 days) */}
        <SectionCard title="Recent Process Recordings" subtitle="Last 7 days">
          {recordings.length === 0 ? (
            <p className="text-sm text-[var(--text)]">No recordings in the past 7 days.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Resident</th>
                    <th>Social Worker</th>
                    <th>Date</th>
                    <th>Concerns</th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map(r => (
                    <tr key={r.recordingId}>
                      <td className="font-medium text-[var(--text-h)]">{r.residentCode}</td>
                      <td className="text-[var(--text)] text-xs">{r.socialWorker}</td>
                      <td className="text-[var(--text)] text-xs">
                        {r.sessionDate?.split('T')[0] ?? '—'}
                      </td>
                      <td className="text-xs">
                        {r.concernsFlagged
                          ? <span className="text-orange-600">⚑ Flagged</span>
                          : <span className="text-[var(--text)]">None</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Recent incident reports (last 14 days) */}
        <SectionCard title="Recent Incidents" subtitle="Last 14 days">
          {incidents.length === 0 ? (
            <p className="text-sm text-[var(--text)]">No incidents in the past 14 days.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Resident</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Resolved</th>
                    <th>Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map(inc => (
                    <tr key={inc.incidentId}>
                      <td className="font-medium text-[var(--text-h)]">{inc.residentCode}</td>
                      <td className="text-[var(--text)] text-xs">{inc.incidentType}</td>
                      <td>
                        <span className={`badge ${severityClass(inc.severity)} text-xs`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td>
                        {inc.resolved
                          ? <span className="badge badge-success text-xs">Yes</span>
                          : <span className="badge badge-error text-xs">No</span>
                        }
                      </td>
                      <td>
                        {inc.followUpRequired
                          ? <span className="badge badge-warning text-xs">Required</span>
                          : <span className="badge text-xs">No</span>
                        }
                      </td>
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
