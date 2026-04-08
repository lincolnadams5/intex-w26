import { useEffect, useMemo, useState } from 'react'
import { StatCard }    from '../../../components/admin/StatCard'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { RiskBadge }   from '../../../components/admin/RiskBadge'
import { LoadingState } from '../../../components/admin/LoadingState'
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

function ReadinessBadge({ band }: { band: string | null }) {
  if (!band) return <span className="badge text-xs">—</span>
  if (band === 'Ready for Review') return <span className="badge badge-success text-xs">{band}</span>
  if (band === 'Developing')       return <span className="badge badge-warning text-xs">{band}</span>
  if (band === 'Low Readiness')    return <span className="badge badge-error text-xs">{band}</span>
  return <span className="badge text-xs">{band}</span>
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
  const [search, setSearch]                     = useState('')
  const [statusFilter, setStatusFilter]         = useState('Active')
  const [safehouseFilter, setSafehouseFilter]   = useState('')
  const [riskFilter, setRiskFilter]             = useState('')
  const [reintTypeFilter, setReintTypeFilter]   = useState('')
  const [reintStatusFilter, setReintStatusFilter] = useState('')

  // Alert section accordion
  const [alertOpen, setAlertOpen] = useState(true)

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

  // Client-side filtered view (search / risk / reint filters)
  const filtered = useMemo(() => {
    let rows = residents
    if (search)            rows = rows.filter(r => r.internalCode.toLowerCase().includes(search.toLowerCase()))
    if (riskFilter)        rows = rows.filter(r => r.currentRiskLevel === riskFilter)
    if (reintTypeFilter)   rows = rows.filter(r => r.reintegrationType === reintTypeFilter)
    if (reintStatusFilter) rows = rows.filter(r => r.reintegrationStatus === reintStatusFilter)
    return rows
  }, [residents, search, riskFilter, reintTypeFilter, reintStatusFilter])

  // Dropdown options derived from currently-loaded resident list
  const reintTypeOptions   = useMemo(
    () => unique(residents.map(r => r.reintegrationType).filter(Boolean) as string[]),
    [residents]
  )
  const reintStatusOptions = useMemo(
    () => unique(residents.map(r => r.reintegrationStatus).filter(Boolean) as string[]),
    [residents]
  )

  const totalAlerts = alerts
    ? alerts.riskEscalations.length + alerts.unresolvedHighIncidents.length + alerts.noRecentRecording.length
    : 0

  if (loading) return <LoadingState />
  if (error)   return <p className="text-sm text-[var(--alert)] p-4">{error}</p>

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
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

      {/* ── Alert section ────────────────────────────────────────────────────── */}
      <SectionCard
        title={`Alerts${totalAlerts > 0 ? ` (${totalAlerts})` : ''}`}
        subtitle="Risk escalations, unresolved high incidents, and residents overdue for a process recording"
        accentBorder
        titleIcon="⚑"
      >
        <button
          className="text-xs text-[var(--text)] underline mb-3 self-start"
          onClick={() => setAlertOpen(o => !o)}
        >
          {alertOpen ? 'Collapse' : 'Expand'} alerts
        </button>

        {alertOpen && alerts && (
          <div className="flex flex-col gap-5">

            {/* Risk escalations */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-h)] mb-2 uppercase tracking-wide">
                Risk Escalations Since Intake ({alerts.riskEscalations.length})
              </p>
              {alerts.riskEscalations.length === 0 ? (
                <p className="text-sm text-[var(--text)]">None.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Resident</th>
                        <th>Safehouse</th>
                        <th>Initial Risk</th>
                        <th>Current Risk</th>
                        <th>Length of Stay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.riskEscalations.map(r => (
                        <tr key={r.internalCode}>
                          <td className="font-medium text-[var(--text-h)]">{r.internalCode}</td>
                          <td className="text-xs text-[var(--text)]">{r.safehouseName}</td>
                          <td><RiskBadge level={r.initialRiskLevel} /></td>
                          <td><RiskBadge level={r.currentRiskLevel} /></td>
                          <td className="text-xs text-[var(--text)]">{r.lengthOfStay}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Unresolved High incidents */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-h)] mb-2 uppercase tracking-wide">
                Unresolved High-Severity Incidents ({alerts.unresolvedHighIncidents.length})
              </p>
              {alerts.unresolvedHighIncidents.length === 0 ? (
                <p className="text-sm text-[var(--text)]">None.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Resident</th>
                        <th>Safehouse</th>
                        <th>Type</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.unresolvedHighIncidents.map(i => (
                        <tr key={i.incidentId}>
                          <td className="font-medium text-[var(--text-h)]">{i.residentCode}</td>
                          <td className="text-xs text-[var(--text)]">{i.safehouseName}</td>
                          <td className="text-xs text-[var(--text)]">{i.incidentType}</td>
                          <td className="text-xs text-[var(--text)]">{i.incidentDate?.split('T')[0] ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* No recent recording */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-h)] mb-2 uppercase tracking-wide">
                No Process Recording in 30+ Days ({alerts.noRecentRecording.length})
              </p>
              {alerts.noRecentRecording.length === 0 ? (
                <p className="text-sm text-[var(--text)]">All residents have recent recordings.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Resident</th>
                        <th>Safehouse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.noRecentRecording.map(r => (
                        <tr key={r.residentId}>
                          <td className="font-medium text-[var(--text-h)]">{r.internalCode}</td>
                          <td className="text-xs text-[var(--text)]">{r.safehouseName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </SectionCard>

      {/* ── Resident table ───────────────────────────────────────────────────── */}
      <SectionCard
        title="All Residents"
        subtitle={`${filtered.length} resident${filtered.length !== 1 ? 's' : ''} shown`}
      >
        {/* Search + filters */}
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
            <option value="">All Reintegration Types</option>
            {reintTypeOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={reintStatusFilter}
            onChange={e => setReintStatusFilter(e.target.value)}
            className="select select-sm"
          >
            <option value="">All Reintegration Statuses</option>
            {reintStatusOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {(search || riskFilter || reintTypeFilter || reintStatusFilter) && (
            <button
              className="text-xs text-[var(--text)] underline self-center"
              onClick={() => {
                setSearch('')
                setRiskFilter('')
                setReintTypeFilter('')
                setReintStatusFilter('')
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {tableLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[var(--text)]">No residents match the current filters.</p>
        ) : (
          <div className="table-container overflow-y-auto" style={{ maxHeight: '480px' }}>
            <table>
              <thead className="sticky top-0 bg-[var(--card)]">
                <tr>
                  <th>Resident</th>
                  <th>Safehouse</th>
                  <th>Risk Level</th>
                  <th>Reintegration Type</th>
                  <th>Reint. Status</th>
                  <th>Social Worker</th>
                  <th>Length of Stay</th>
                  <th>Readiness</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.residentId}>
                    <td className="font-medium text-[var(--text-h)] whitespace-nowrap">
                      {r.readinessFlag && (
                        <span className="mr-1 text-amber-500" title="Ready for Review but still In Progress">⚑</span>
                      )}
                      {r.internalCode}
                    </td>
                    <td className="text-xs text-[var(--text)]">{r.safehouseName}</td>
                    <td>
                      {r.currentRiskLevel
                        ? <RiskBadge level={r.currentRiskLevel} />
                        : <span className="text-xs text-[var(--text)]">—</span>
                      }
                    </td>
                    <td className="text-xs text-[var(--text)]">{r.reintegrationType ?? '—'}</td>
                    <td className="text-xs text-[var(--text)]">{r.reintegrationStatus ?? '—'}</td>
                    <td className="text-xs text-[var(--text)]">{r.assignedSocialWorker ?? '—'}</td>
                    <td className="text-xs text-[var(--text)]">{r.lengthOfStay ?? '—'}</td>
                    <td><ReadinessBadge band={r.readinessBand} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
