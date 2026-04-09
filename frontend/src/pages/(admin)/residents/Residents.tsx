import { useEffect, useMemo, useState } from 'react'
import { StatCard }    from '../../../components/admin/StatCard'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { RiskBadge }   from '../../../components/admin/RiskBadge'
import { LoadingState } from '../../../components/admin/LoadingState'
import { ResidentDetailModal } from '../../../components/admin/ResidentDetailModal'
import {
  getResidentsSummary,
  getResidentsList,
  getResidentAlerts,
  getSafehousesOverview,
  type ResidentsSummary,
  type ResidentRow,
  type ResidentAlerts,
  type SafehouseOverviewRow,
} from '../../../lib/adminApi'

// ── Readiness badge ────────────────────────────────────────────────────────────
// For In Progress residents: shows ML readiness band.
// For all others: shows reintegration status as a neutral badge.

function ReadinessBadge({ band, reintegrationStatus }: { band: string | null; reintegrationStatus: string | null }) {
  if (reintegrationStatus !== 'In Progress') {
    if (!reintegrationStatus) return <span className="badge text-xs">—</span>
    if (reintegrationStatus === 'Completed') return <span className="badge badge-success text-xs">Completed</span>
    if (reintegrationStatus === 'On Hold') return <span className="badge badge-warning text-xs">On Hold</span>
    return <span className="badge badge-ghost text-xs">{reintegrationStatus}</span>
  }
  // In Progress — show ML band
  if (!band) return <span className="badge text-xs">—</span>
  if (band === 'Ready for Review') return <span className="badge badge-success text-xs">{band}</span>
  if (band === 'Developing')       return <span className="badge badge-info text-xs">{band}</span>
  if (band === 'Low Readiness')    return <span className="badge badge-error text-xs">{band}</span>
  return <span className="badge text-xs">{band}</span>
}

// ── Severity badge ─────────────────────────────────────────────────────────────

function SeverityBadge({ level }: { level: string }) {
  if (level === 'Critical') return <span className="badge badge-error text-xs">Critical</span>
  if (level === 'High')     return <span className="badge badge-error text-xs opacity-80">High</span>
  if (level === 'Medium')   return <span className="badge badge-warning text-xs">Medium</span>
  if (level === 'Low')      return <span className="badge badge-ghost text-xs">Low</span>
  return <span className="badge text-xs">{level}</span>
}

// ── Unified alert row ──────────────────────────────────────────────────────────

type AlertRow = {
  key: string
  residentCode: string
  safehouseName: string
  type: 'Risk Escalation' | 'High Incident' | 'No Recording'
  detail: string
  severity: string
}

// ── Unique values helper ───────────────────────────────────────────────────────

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ResidentsPage() {
  const [summary, setSummary]           = useState<ResidentsSummary | null>(null)
  const [alerts, setAlerts]             = useState<ResidentAlerts | null>(null)
  const [residents, setResidents]       = useState<ResidentRow[]>([])
  const [safehouses, setSafehouses]     = useState<SafehouseOverviewRow[]>([])
  const [loading, setLoading]           = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // Filters
  const [search, setSearch]                       = useState('')
  const [statusFilter, setStatusFilter]           = useState('Active')
  const [safehouseFilter, setSafehouseFilter]     = useState('')
  const [riskFilter, setRiskFilter]               = useState('')
  const [reintTypeFilter, setReintTypeFilter]     = useState('')
  const [incidentFilter, setIncidentFilter]       = useState('')

  // Modal
  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(null)

  // Alert filters
  const [alertSafehouseFilter, setAlertSafehouseFilter] = useState('')
  const [alertTypeFilter, setAlertTypeFilter]           = useState('')
  const [alertSeverityFilter, setAlertSeverityFilter]   = useState('')

  // Initial load
  useEffect(() => {
    Promise.all([
      getResidentsSummary(),
      getResidentAlerts(),
      getSafehousesOverview(),
      getResidentsList({ status: 'Active' }),
    ]).then(([s, a, sh, r]) => {
      setSummary(s)
      setAlerts(a)
      setSafehouses(sh)
      setResidents(r)
    }).catch(() => setError('Failed to load residents data.'))
      .finally(() => setLoading(false))
  }, [])

  // Re-fetch when backend filters change (status / safehouse)
  useEffect(() => {
    if (loading) return
    setTableLoading(true)
    getResidentsList({
      status: statusFilter || undefined,
      safehouseId: safehouseFilter ? Number(safehouseFilter) : undefined,
    })
      .then(setResidents)
      .catch(() => setError('Failed to load residents.'))
      .finally(() => setTableLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, safehouseFilter])

  // Client-side filtered view (search / risk / reint / incident filters)
  const filtered = useMemo(() => {
    let rows = residents
    if (search)          rows = rows.filter(r => r.internalCode.toLowerCase().includes(search.toLowerCase()))
    if (riskFilter)      rows = rows.filter(r => r.currentRiskLevel === riskFilter)
    if (reintTypeFilter) rows = rows.filter(r => r.reintegrationType === reintTypeFilter)
    if (incidentFilter === 'true')  rows = rows.filter(r => r.hasUnresolvedIncident)
    if (incidentFilter === 'false') rows = rows.filter(r => !r.hasUnresolvedIncident)
    return rows
  }, [residents, search, riskFilter, reintTypeFilter, incidentFilter])

  // Dropdown options derived from currently-loaded resident list
  const reintTypeOptions = useMemo(
    () => unique(residents.map(r => r.reintegrationType).filter(Boolean) as string[]),
    [residents]
  )

  // Normalize all alerts into a unified list
  const allAlerts = useMemo((): AlertRow[] => {
    if (!alerts) return []
    const rows: AlertRow[] = []
    for (const r of alerts.riskEscalations) {
      rows.push({
        key:           `esc-${r.internalCode}`,
        residentCode:  r.internalCode,
        safehouseName: r.safehouseName,
        type:          'Risk Escalation',
        detail:        `${r.initialRiskLevel} → ${r.currentRiskLevel}`,
        severity:      r.currentRiskLevel,
      })
    }
    for (const i of alerts.unresolvedHighIncidents) {
      rows.push({
        key:           `inc-${i.incidentId}`,
        residentCode:  i.residentCode,
        safehouseName: i.safehouseName,
        type:          'High Incident',
        detail:        i.incidentType ?? '—',
        severity:      'High',
      })
    }
    for (const r of alerts.noRecentRecording) {
      rows.push({
        key:           `rec-${r.residentId}`,
        residentCode:  r.internalCode,
        safehouseName: r.safehouseName,
        type:          'No Recording',
        detail:        'No session in 30+ days',
        severity:      'Medium',
      })
    }
    return rows
  }, [alerts])

  const filteredAlerts = useMemo(() => {
    let rows = allAlerts
    if (alertSafehouseFilter) rows = rows.filter(r => r.safehouseName === alertSafehouseFilter)
    if (alertTypeFilter)      rows = rows.filter(r => r.type === alertTypeFilter)
    if (alertSeverityFilter)  rows = rows.filter(r => r.severity === alertSeverityFilter)
    return rows
  }, [allAlerts, alertSafehouseFilter, alertTypeFilter, alertSeverityFilter])

  const alertSafehouseOptions = useMemo(
    () => unique(allAlerts.map(a => a.safehouseName)),
    [allAlerts]
  )

  if (loading) return <LoadingState />
  if (error)   return <p className="text-sm text-[var(--alert)] p-4">{error}</p>

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Residents"
        subtitle="Full resident roster with risk levels, reintegration readiness, and alert flags."
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active Residents"          value={summary?.activeResidents ?? '—'}          icon="🏠" />
        <StatCard label="High / Critical Risk"      value={summary?.highCriticalRisk ?? '—'}         icon="⚠️" subtitle="active residents" />
        <StatCard label="Reintegration In Progress" value={summary?.reintegrationInProgress ?? '—'}  icon="🌱" />
        <StatCard label="Unresolved High Incidents" value={summary?.unresolvedHighIncidents ?? '—'}  icon="🚨" subtitle="high severity" />
      </div>

      {/* ── Main content: residents table + alerts side panel ───────────────── */}
      <div className="flex gap-4 items-start">

        {/* ── All Residents table (left, grows) ─────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <SectionCard
            title="All Residents"
            subtitle={`${filtered.length} resident${filtered.length !== 1 ? 's' : ''} shown`}
          >
            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="text"
                placeholder="Search by code…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input input-sm w-44"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="select select-sm"
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="Transferred">Transferred</option>
              </select>
              <select
                value={safehouseFilter}
                onChange={e => setSafehouseFilter(e.target.value)}
                className="select select-sm"
              >
                <option value="">All Safehouses</option>
                {safehouses.map(s => (
                  <option key={s.safehouseId} value={String(s.safehouseId)}>{s.name}</option>
                ))}
              </select>
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
                className="select select-sm"
              >
                <option value="">All Risk Levels</option>
                {['Low', 'Medium', 'High', 'Critical'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <select
                value={reintTypeFilter}
                onChange={e => setReintTypeFilter(e.target.value)}
                className="select select-sm"
              >
                <option value="">All Reint. Types</option>
                {reintTypeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={incidentFilter}
                onChange={e => setIncidentFilter(e.target.value)}
                className="select select-sm"
              >
                <option value="">All Incidents</option>
                <option value="true">Has Unresolved</option>
                <option value="false">No Unresolved</option>
              </select>
              {(search || riskFilter || reintTypeFilter || incidentFilter) && (
                <button
                  className="text-xs text-[var(--text)] underline self-center"
                  onClick={() => { setSearch(''); setRiskFilter(''); setReintTypeFilter(''); setIncidentFilter('') }}
                >
                  Clear
                </button>
              )}
            </div>

            {tableLoading ? (
              <LoadingState />
            ) : filtered.length === 0 ? (
              <p className="text-sm text-[var(--text)]">No residents match the current filters.</p>
            ) : (
              <div className="table-container overflow-y-auto" style={{ maxHeight: '520px' }}>
                <table>
                  <thead className="sticky top-0 bg-[var(--card)]">
                    <tr>
                      <th>Resident</th>
                      <th>Safehouse</th>
                      <th>Risk Level</th>
                      <th>Reintegration Type</th>
                      <th>Incident</th>
                      <th>Health</th>
                      <th>Length of Stay</th>
                      <th>Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.residentId}>
                        <td className="font-medium text-[var(--text-h)] whitespace-nowrap">
                          <button
                            className="hover:underline text-left"
                            onClick={() => setSelectedResidentId(r.residentId)}
                          >
                            {r.readinessFlag && (
                              <span className="mr-1 text-amber-500" title="Ready for Review but still In Progress">⚑</span>
                            )}
                            {r.noRecentProgress && (
                              <span className="mr-1 badge badge-ghost text-xs" title="No progress noted in last 3 sessions">No Progress</span>
                            )}
                            {r.internalCode}
                          </button>
                        </td>
                        <td className="text-xs text-[var(--text)]">{r.safehouseName}</td>
                        <td>
                          {r.currentRiskLevel
                            ? <RiskBadge level={r.currentRiskLevel} />
                            : <span className="text-xs text-[var(--text)]">—</span>
                          }
                        </td>
                        <td className="text-xs text-[var(--text)]">{r.reintegrationType ?? '—'}</td>
                        <td>
                          {r.hasUnresolvedIncident
                            ? <span className="badge badge-error text-xs">Yes</span>
                            : <span className="badge badge-ghost text-xs">No</span>
                          }
                        </td>
                        <td>
                          {r.healthTrend === 'Improving'  && <span className="badge badge-success text-xs">Improving</span>}
                          {r.healthTrend === 'Stable'     && <span className="badge badge-ghost text-xs">Stable</span>}
                          {r.healthTrend === 'Declining'  && <span className="badge badge-error text-xs">Declining</span>}
                          {!r.healthTrend                 && <span className="text-xs text-[var(--text)]">—</span>}
                        </td>
                        <td className="text-xs text-[var(--text)]">{r.lengthOfStay ?? '—'}</td>
                        <td><ReadinessBadge band={r.readinessBand} reintegrationStatus={r.reintegrationStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Alerts panel (right, fixed width) ─────────────────────────────── */}
        <div className="w-[480px] shrink-0">
          <SectionCard
            title={`Alerts${allAlerts.length > 0 ? ` (${filteredAlerts.length}/${allAlerts.length})` : ''}`}
            subtitle="Risk escalations, high incidents, overdue recordings"
            accentBorder
            titleIcon="⚑"
          >
            {/* Alert filters */}
            <div className="flex flex-col gap-2 mb-3">
              <select
                value={alertSafehouseFilter}
                onChange={e => setAlertSafehouseFilter(e.target.value)}
                className="select select-sm w-full"
              >
                <option value="">All Safehouses</option>
                {alertSafehouseOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={alertTypeFilter}
                onChange={e => setAlertTypeFilter(e.target.value)}
                className="select select-sm w-full"
              >
                <option value="">All Types</option>
                <option value="Risk Escalation">Risk Escalation</option>
                <option value="High Incident">High Incident</option>
                <option value="No Recording">No Recording</option>
              </select>
              <select
                value={alertSeverityFilter}
                onChange={e => setAlertSeverityFilter(e.target.value)}
                className="select select-sm w-full"
              >
                <option value="">All Severities</option>
                {['Critical', 'High', 'Medium', 'Low'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {(alertSafehouseFilter || alertTypeFilter || alertSeverityFilter) && (
                <button
                  className="text-xs text-[var(--text)] underline self-start"
                  onClick={() => { setAlertSafehouseFilter(''); setAlertTypeFilter(''); setAlertSeverityFilter('') }}
                >
                  Clear
                </button>
              )}
            </div>

            {filteredAlerts.length === 0 ? (
              <p className="text-sm text-[var(--text)]">No alerts match filters.</p>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: '460px' }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[var(--card)]">
                    <tr className="text-left text-[var(--text-h)]">
                      <th className="pb-1 pr-2 font-semibold">Resident</th>
                      <th className="pb-1 pr-2 font-semibold">Type</th>
                      <th className="pb-1 pr-2 font-semibold">Detail</th>
                      <th className="pb-1 font-semibold">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map(a => (
                      <tr key={a.key} className="border-t border-[var(--border)]">
                        <td className="py-1.5 pr-2 font-medium text-[var(--text-h)] whitespace-nowrap">{a.residentCode}</td>
                        <td className="py-1.5 pr-2 text-[var(--text)]">{a.type}</td>
                        <td className="py-1.5 pr-2 text-[var(--text)]">{a.detail}</td>
                        <td className="py-1.5"><SeverityBadge level={a.severity} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

      </div>

      {selectedResidentId !== null && (
        <ResidentDetailModal
          residentId={selectedResidentId}
          onClose={() => setSelectedResidentId(null)}
        />
      )}
    </div>
  )
}
