import { useEffect, useState } from 'react'
import { StatCard }    from '../../../components/admin/StatCard'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { RiskBadge }   from '../../../components/admin/RiskBadge'
import { LoadingState } from '../../../components/admin/LoadingState'
import {
  getResidentsSummary,
  getRiskEscalations,
  getRecentRecordings,
  getRecentIncidents,
  type ResidentsSummary,
  type RiskEscalation,
  type RecentRecording,
  type RecentIncident,
} from '../../../lib/adminApi'

function severityClass(s: string) {
  if (s === 'High')     return 'badge-error'
  if (s === 'Moderate') return 'badge-warning'
  return 'badge'
}

export function ResidentsPage() {
  const [summary, setSummary]         = useState<ResidentsSummary | null>(null)
  const [escalations, setEscalations] = useState<RiskEscalation[]>([])
  const [recordings, setRecordings]   = useState<RecentRecording[]>([])
  const [incidents, setIncidents]     = useState<RecentIncident[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getResidentsSummary(),
      getRiskEscalations(),
      getRecentRecordings(),
      getRecentIncidents(),
    ]).then(([s, esc, rec, inc]) => {
      setSummary(s)
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
        title="Residents"
        subtitle="Risk levels, recent sessions, and incident reports across all residents."
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active Residents"          value={summary?.activeResidents ?? '—'}          icon="🏠" />
        <StatCard label="High / Critical Risk"      value={summary?.highCriticalRisk ?? '—'}         icon="⚠️" subtitle="active residents" />
        <StatCard label="Reintegration In Progress" value={summary?.reintegrationInProgress ?? '—'}  icon="🌱" />
        <StatCard label="Upcoming Conferences"      value={summary?.upcomingConferences ?? '—'}       icon="📅" />
      </div>

      {/* ── Risk escalations ─────────────────────────────────────────────────── */}
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
                      <td className="text-[var(--text)] text-xs">{r.sessionDate?.split('T')[0] ?? '—'}</td>
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
