import { useEffect, useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useAuth }     from '../../../hooks/useAuth'
import { StatCard }    from '../../../components/admin/StatCard'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { RiskBadge }   from '../../../components/admin/RiskBadge'
import { LoadingState } from '../../../components/admin/LoadingState'
import { Pagination }  from '../../../components/admin/Pagination'
import {
  getResidentsSummary,
  getResidentsList,
  getResidentAlerts,
  getSafehousesOverview,
  getRiskBySafehouse,
  getRiskEscalations,
  getRecentRecordings,
  getRecentIncidents,
  type ResidentsSummary,
  type ResidentRow,
  type ResidentAlerts,
  type SafehouseOverviewRow,
  type RiskBySafehouse,
  type RiskEscalation,
  type RecentRecording,
  type RecentIncident,
} from '../../../lib/adminApi'
import {
  getStaffResidentsSummary,
  getStaffResidents,
  getStaffResident,
  getResidentRecordings,
  getResidentVisits,
  getResidentInterventionPlan,
  createResident,
  type StaffResidentsSummary,
  type CaseloadItem,
  type ResidentDetail,
  type ResidentRecordingItem,
  type ResidentVisitItem,
  type InterventionPlanItem,
} from '../../../lib/staffApi'

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

type DetailTab = 'profile' | 'recordings' | 'visits' | 'intervention'

interface IntakeForm {
  internalCode: string
  dateOfAdmission: string
  sex: string
  ageUponAdmission: string
  caseCategory: string
  assignedSocialWorker: string
  referralSource: string
  initialRiskLevel: string
  subCatOrphaned: boolean
  subCatTrafficked: boolean
  subCatChildLabor: boolean
  subCatPhysicalAbuse: boolean
  subCatSexualAbuse: boolean
  subCatOsaec: boolean
  subCatCicl: boolean
  subCatAtRisk: boolean
  subCatStreetChild: boolean
  subCatChildWithHiv: boolean
  isPwd: boolean
  pwdType: string
  familyIs4ps: boolean
  familySoloParent: boolean
  familyIndigenous: boolean
  familyInformalSettler: boolean
  notesRestricted: string
}

const defaultIntakeForm: IntakeForm = {
  internalCode: '', dateOfAdmission: '', sex: '', ageUponAdmission: '',
  caseCategory: '', assignedSocialWorker: '', referralSource: '', initialRiskLevel: '',
  subCatOrphaned: false, subCatTrafficked: false, subCatChildLabor: false,
  subCatPhysicalAbuse: false, subCatSexualAbuse: false, subCatOsaec: false,
  subCatCicl: false, subCatAtRisk: false, subCatStreetChild: false, subCatChildWithHiv: false,
  isPwd: false, pwdType: '',
  familyIs4ps: false, familySoloParent: false, familyIndigenous: false, familyInformalSettler: false,
  notesRestricted: '',
}

// ── Shared helpers ────────────────────────────────────────────────────────────

const RISK_COLORS = { Low: '#22c55e', Medium: '#d97706', High: '#f97316', Critical: '#DB7981' }

function severityClass(s: string) {
  if (s === 'High')     return 'badge-error'
  if (s === 'Moderate') return 'badge-warning'
  return 'badge'
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function OccupancyBar({ occupancy, capacity }: { occupancy: number; capacity: number }) {
  if (capacity === 0) return <span className="text-xs text-[var(--color-on-surface-variant)]">—</span>
  const pct = Math.round((occupancy / capacity) * 100)
  const color = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f97316' : '#0d9488'
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{occupancy}/{capacity}</span>
      <div className="w-20 h-2 rounded-full bg-[var(--color-outline-variant)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-[var(--color-on-surface-variant)]">{pct}%</span>
    </div>
  )
}

// ── Sub-categories label map ──────────────────────────────────────────────────
const SUB_CAT_LABELS: { key: keyof IntakeForm; label: string }[] = [
  { key: 'subCatTrafficked',   label: 'Trafficked' },
  { key: 'subCatPhysicalAbuse', label: 'Physical Abuse' },
  { key: 'subCatSexualAbuse',  label: 'Sexual Abuse' },
  { key: 'subCatOsaec',        label: 'OSAEC' },
  { key: 'subCatCicl',         label: 'CICL' },
  { key: 'subCatAtRisk',       label: 'At Risk' },
  { key: 'subCatChildLabor',   label: 'Child Labor' },
  { key: 'subCatOrphaned',     label: 'Orphaned' },
  { key: 'subCatStreetChild',  label: 'Street Child' },
  { key: 'subCatChildWithHiv', label: 'Child with HIV' },
]


// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export function Residents() {
  const { isAdmin } = useAuth()

  // ── Admin state ─────────────────────────────────────────────────────────────
  const [summary, setSummary]         = useState<ResidentsSummary | null>(null)
  const [safehouses, setSafehouses]   = useState<SafehouseOverviewRow[]>([])
  const [riskByHouse, setRiskByHouse] = useState<RiskBySafehouse[]>([])
  const [escalations, setEscalations] = useState<RiskEscalation[]>([])
  const [recordings, setRecordings]   = useState<RecentRecording[]>([])
  const [incidents, setIncidents]     = useState<RecentIncident[]>([])

  // ── Staff state ─────────────────────────────────────────────────────────────
  const [staffSummary, setStaffSummary]       = useState<StaffResidentsSummary | null>(null)
  const [caseload, setCaseload]               = useState<CaseloadItem[]>([])
  const [caseloadTotal, setCaseloadTotal]     = useState(0)
  const [caseloadPage, setCaseloadPage]       = useState(1)
  const [caseloadLoading, setCaseloadLoading] = useState(false)
  const [searchInput, setSearchInput]         = useState('')
  const [searchQuery, setSearchQuery]         = useState('')
  const [riskFilter, setRiskFilter]           = useState('')
  const [statusFilter, setStatusFilter]       = useState('')
  // Detail panel
  const [expandedId, setExpandedId]               = useState<number | null>(null)
  const [activeTab, setActiveTab]                 = useState<DetailTab>('profile')
  const [detail, setDetail]                       = useState<ResidentDetail | null>(null)
  const [detailRecordings, setDetailRecordings]   = useState<ResidentRecordingItem[] | null>(null)
  const [detailVisits, setDetailVisits]           = useState<ResidentVisitItem[] | null>(null)
  const [detailPlan, setDetailPlan]               = useState<InterventionPlanItem[] | null>(null)
  const [detailLoading, setDetailLoading]         = useState(false)
  // Intake form
  const [showIntakeForm, setShowIntakeForm]   = useState(false)
  const [intakeForm, setIntakeForm]           = useState<IntakeForm>(defaultIntakeForm)
  const [intakeSubmitting, setIntakeSubmitting] = useState(false)
  const [intakeError, setIntakeError]         = useState<string | null>(null)
  const [intakeSuccess, setIntakeSuccess]     = useState(false)

  // ── Shared ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)


  // ── Effect: initial data load ────────────────────────────────────────────────
  useEffect(() => {
    if (isAdmin) {
      Promise.all([
        getResidentsSummary(),
        getSafehousesOverview(),
        getRiskBySafehouse(),
        getRiskEscalations(),
        getRecentRecordings(),
        getRecentIncidents(),
      ]).then(([s, sh, rb, esc, rec, inc]) => {
        setSummary(s); setSafehouses(sh); setRiskByHouse(rb)
        setEscalations(esc); setRecordings(rec); setIncidents(inc)
      }).catch(() => setError('Failed to load residents data.'))
        .finally(() => setLoading(false))
    } else {
      getStaffResidentsSummary()
        .then(s => setStaffSummary(s))
        .catch(() => setError('Failed to load residents data.'))
        .finally(() => setLoading(false))
    }
  }, [isAdmin])

  // ── Effect: caseload (staff only, re-runs on filter/page change) ─────────────
  useEffect(() => {
    if (isAdmin) return
    setCaseloadLoading(true)
    getStaffResidents({
      page: caseloadPage, pageSize: PAGE_SIZE,
      search: searchQuery || undefined,
      riskLevel: riskFilter || undefined,
      status: statusFilter || undefined,
    }).then(({ total, items }) => {
      setCaseloadTotal(total)
      setCaseload(items)
    }).catch(() => {/* silently fail — main error already set if needed */})
      .finally(() => setCaseloadLoading(false))
  }, [isAdmin, caseloadPage, searchQuery, riskFilter, statusFilter])

  // ── Effect: detail panel data (loads all tabs upfront when a row is expanded) ─
  useEffect(() => {
    if (expandedId === null) return
    setDetailLoading(true)
    setDetail(null); setDetailRecordings(null); setDetailVisits(null); setDetailPlan(null)
    Promise.all([
      getStaffResident(expandedId),
      getResidentRecordings(expandedId),
      getResidentVisits(expandedId),
      getResidentInterventionPlan(expandedId),
    ]).then(([d, r, v, p]) => {
      setDetail(d); setDetailRecordings(r); setDetailVisits(v); setDetailPlan(p)
    }).catch(() => {/* detail error is shown in the panel */})
      .finally(() => setDetailLoading(false))
  }, [expandedId])


  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleRowClick(id: number) {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      setActiveTab('profile')
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearchQuery(searchInput)
    setCaseloadPage(1)
    setExpandedId(null)
  }

  function handleRiskFilter(val: string) {
    setRiskFilter(val); setCaseloadPage(1); setExpandedId(null)
  }

  function handleStatusFilter(val: string) {
    setStatusFilter(val); setCaseloadPage(1); setExpandedId(null)
  }

  function handlePageChange(p: number) {
    setCaseloadPage(p); setExpandedId(null)
  }

  function setField<K extends keyof IntakeForm>(key: K, val: IntakeForm[K]) {
    setIntakeForm(f => ({ ...f, [key]: val }))
  }

  async function handleIntakeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIntakeError(null)

    const required = ['internalCode', 'sex', 'caseCategory', 'initialRiskLevel'] as const
    const missing = required.filter(k => !intakeForm[k])
    if (missing.length > 0) {
      setIntakeError('Please fill in all required fields: Internal Code, Sex, Case Category, and Initial Risk Level.')
      return
    }

    setIntakeSubmitting(true)
    try {
      await createResident({
        internalCode:         intakeForm.internalCode,
        dateOfAdmission:      intakeForm.dateOfAdmission || undefined,
        sex:                  intakeForm.sex,
        ageUponAdmission:     intakeForm.ageUponAdmission || undefined,
        caseCategory:         intakeForm.caseCategory,
        assignedSocialWorker: intakeForm.assignedSocialWorker || undefined,
        referralSource:       intakeForm.referralSource || undefined,
        initialRiskLevel:     intakeForm.initialRiskLevel,
        subCatOrphaned:       intakeForm.subCatOrphaned,
        subCatTrafficked:     intakeForm.subCatTrafficked,
        subCatChildLabor:     intakeForm.subCatChildLabor,
        subCatPhysicalAbuse:  intakeForm.subCatPhysicalAbuse,
        subCatSexualAbuse:    intakeForm.subCatSexualAbuse,
        subCatOsaec:          intakeForm.subCatOsaec,
        subCatCicl:           intakeForm.subCatCicl,
        subCatAtRisk:         intakeForm.subCatAtRisk,
        subCatStreetChild:    intakeForm.subCatStreetChild,
        subCatChildWithHiv:   intakeForm.subCatChildWithHiv,
        isPwd:                intakeForm.isPwd,
        pwdType:              intakeForm.isPwd ? intakeForm.pwdType : undefined,
        familyIs4ps:          intakeForm.familyIs4ps,
        familySoloParent:     intakeForm.familySoloParent,
        familyIndigenous:     intakeForm.familyIndigenous,
        familyInformalSettler: intakeForm.familyInformalSettler,
        notesRestricted:      intakeForm.notesRestricted || undefined,
      })
      setIntakeSuccess(true)
      setIntakeForm(defaultIntakeForm)
      // Refresh caseload to show the new Pending resident
      getStaffResidents({ page: 1, pageSize: PAGE_SIZE }).then(({ total, items }) => {
        setCaseloadTotal(total); setCaseload(items); setCaseloadPage(1)
      })
      setTimeout(() => { setIntakeSuccess(false); setShowIntakeForm(false) }, 2000)
    } catch {
      setIntakeError('Failed to submit resident intake. Please try again.')
    } finally {
      setIntakeSubmitting(false)
    }
  }


  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return <LoadingState />
  if (error)   return <p className="text-sm text-[var(--color-error)] p-4">{error}</p>


  // ════════════════════════════════════════════════════════════════════════════
  //  ADMIN VIEW (unchanged)
  // ════════════════════════════════════════════════════════════════════════════

  if (isAdmin) return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Residents"
        subtitle="Full resident roster with risk levels, reintegration readiness, and alert flags."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active Residents"          value={summary?.activeResidents ?? '—'}          icon="🏠" />
        <StatCard label="High / Critical Risk"      value={summary?.highCriticalRisk ?? '—'}         icon="⚠️" subtitle="active residents" />
        <StatCard label="Reintegration In Progress" value={summary?.reintegrationInProgress ?? '—'}  icon="🌱" />
        <StatCard label="Upcoming Conferences"      value={summary?.upcomingConferences ?? '—'}      icon="📅" />
      </div>

      <SectionCard title="Safehouse Overview" subtitle="Current occupancy and latest monthly metrics per safehouse">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Safehouse</th><th>Region</th><th>Occupancy</th>
                <th>Avg Ed. Progress</th><th>Avg Health Score</th>
                <th>Recordings (Mo.)</th><th>Incidents (Mo.)</th>
              </tr>
            </thead>
            <tbody>
              {safehouses.map(row => (
                <tr key={row.safehouseId}>
                  <td className="font-medium text-[var(--color-on-surface)]">{row.name}</td>
                  <td className="text-[var(--color-on-surface-variant)] text-xs">{row.region}</td>
                  <td><OccupancyBar occupancy={row.occupancy} capacity={row.capacity} /></td>
                  <td className="font-medium">
                    {row.avgEducationProgress != null ? `${Number(row.avgEducationProgress).toFixed(1)}%` : '—'}
                  </td>
                  <td className="font-medium">
                    {row.avgHealthScore != null ? `${Number(row.avgHealthScore).toFixed(1)}/10` : '—'}
                  </td>
                  <td className="text-center">{row.processRecordingCount ?? '—'}</td>
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

      <SectionCard title="Risk Level Breakdown by Safehouse" subtitle="Active resident count at each risk level per safehouse">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskByHouse} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
              <XAxis dataKey="safehouseName" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip /><Legend />
              <Bar dataKey="Low"      stackId="a" fill={RISK_COLORS.Low} />
              <Bar dataKey="Medium"   stackId="a" fill={RISK_COLORS.Medium} />
              <Bar dataKey="High"     stackId="a" fill={RISK_COLORS.High} />
              <Bar dataKey="Critical" stackId="a" fill={RISK_COLORS.Critical} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Risk Escalations Since Intake" subtitle="Residents whose current risk level is higher than their initial assessment" accentBorder titleIcon="⚠️">
        {escalations.length === 0 ? (
          <p className="text-sm text-[var(--color-on-surface-variant)]">No risk escalations found.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Resident Code</th><th>Safehouse</th>
                  <th>Initial Risk</th><th>Current Risk</th><th>Length of Stay</th>
                </tr>
              </thead>
              <tbody>
                {escalations.map(r => (
                  <tr key={r.internalCode}>
                    <td className="font-medium text-[var(--color-on-surface)]">{r.internalCode}</td>
                    <td className="text-[var(--color-on-surface-variant)] text-xs">{r.safehouseName}</td>
                    <td><RiskBadge level={r.initialRiskLevel} /></td>
                    <td><RiskBadge level={r.currentRiskLevel} /></td>
                    <td className="text-[var(--color-on-surface-variant)] text-xs">{r.lengthOfStay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Recent Process Recordings" subtitle="Last 7 days">
          {recordings.length === 0 ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">No recordings in the past 7 days.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Resident</th><th>Social Worker</th><th>Date</th><th>Concerns</th></tr></thead>
                <tbody>
                  {recordings.map(r => (
                    <tr key={r.recordingId}>
                      <td className="font-medium text-[var(--color-on-surface)]">{r.residentCode}</td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">{r.socialWorker}</td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">{r.sessionDate?.split('T')[0] ?? '—'}</td>
                      <td className="text-xs">
                        {r.concernsFlagged
                          ? <span className="text-orange-600">⚑ Flagged</span>
                          : <span className="text-[var(--color-on-surface-variant)]">None</span>
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
            <p className="text-sm text-[var(--color-on-surface-variant)]">No incidents in the past 14 days.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Resident</th><th>Type</th><th>Severity</th><th>Resolved</th><th>Follow-up</th></tr></thead>
                <tbody>
                  {incidents.map(inc => (
                    <tr key={inc.incidentId}>
                      <td className="font-medium text-[var(--color-on-surface)]">{inc.residentCode}</td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">{inc.incidentType}</td>
                      <td><span className={`badge ${severityClass(inc.severity)} text-xs`}>{inc.severity}</span></td>
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


  // ════════════════════════════════════════════════════════════════════════════
  //  STAFF VIEW
  // ════════════════════════════════════════════════════════════════════════════

  const sh = staffSummary?.safehouse
  const totalPages = Math.max(1, Math.ceil(caseloadTotal / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Residents"
        subtitle="Caseload and resident records for your safehouse."
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active Residents"          value={staffSummary?.stats.activeResidents ?? '—'}         icon="🏠" />
        <StatCard label="High / Critical Risk"      value={staffSummary?.stats.highCriticalRisk ?? '—'}        icon="⚠️" subtitle="active residents" />
        <StatCard label="Reintegration In Progress" value={staffSummary?.stats.reintegrationInProgress ?? '—'} icon="🌱" />
        <StatCard label="Upcoming Conferences"      value={staffSummary?.stats.upcomingConferences ?? '—'}     icon="📅" />
      </div>

      {/* ── My Safehouse card ────────────────────────────────────────────────── */}
      {sh && (
        <SectionCard title="My Safehouse" titleIcon="🏠">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Name</p>
              <p className="text-sm font-semibold text-[var(--color-on-surface)]">{sh.name}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Region</p>
              <p className="text-sm font-medium text-[var(--color-on-surface)]">{sh.region}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Occupancy</p>
              <OccupancyBar occupancy={sh.occupancy} capacity={sh.capacity} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Avg Education Progress</p>
              <p className="text-sm font-medium text-[var(--color-on-surface)]">
                {sh.avgEducationProgress != null ? `${Number(sh.avgEducationProgress).toFixed(1)}%` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Avg Health Score</p>
              <p className="text-sm font-medium text-[var(--color-on-surface)]">
                {sh.avgHealthScore != null ? `${Number(sh.avgHealthScore).toFixed(1)}/10` : '—'}
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Recordings (Mo.)</p>
                <p className="text-sm font-medium text-[var(--color-on-surface)]">{sh.processRecordingsThisMonth}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Incidents (Mo.)</p>
                <p className="text-sm font-medium text-[var(--color-on-surface)]">{sh.incidentsThisMonth}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Caseload table ───────────────────────────────────────────────────── */}
      <SectionCard title="Caseload">
        {/* Filters + Add button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Search by resident code…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="form-input flex-1"
              aria-label="Search resident code"
            />
            <button type="submit" className="btn btn-secondary btn-small">Search</button>
          </form>

          <select
            value={riskFilter}
            onChange={e => handleRiskFilter(e.target.value)}
            className="form-input"
            aria-label="Filter by risk level"
          >
            <option value="">All Risk Levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => handleStatusFilter(e.target.value)}
            className="form-input"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Reintegrating">Reintegrating</option>
            <option value="Closed">Closed</option>
          </select>

          <button
            onClick={() => { setShowIntakeForm(true); setIntakeError(null); setIntakeSuccess(false) }}
            className="btn btn-primary btn-small whitespace-nowrap"
          >
            + Add Resident
          </button>
        </div>

        {/* Table */}
        {caseloadLoading ? (
          <p className="text-sm text-[var(--color-on-surface-variant)] py-4 text-center">Loading…</p>
        ) : caseload.length === 0 ? (
          <p className="text-sm text-[var(--color-on-surface-variant)] py-4">No residents found.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Case Category</th>
                  <th>Risk Level</th>
                  <th>Admission Date</th>
                  <th>Social Worker</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {caseload.map(r => (
                  <Fragment key={r.residentId}>
                    {/* Main row */}
                    <tr
                      onClick={() => handleRowClick(r.residentId)}
                      className="cursor-pointer hover:bg-[var(--color-surface-container-low)] transition-colors select-none"
                      aria-expanded={expandedId === r.residentId}
                    >
                      <td className="font-medium text-[var(--color-on-surface)]">
                        {expandedId === r.residentId ? '▾ ' : '▸ '}{r.internalCode}
                      </td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">{r.caseCategory}</td>
                      <td><RiskBadge level={r.currentRiskLevel} /></td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">{fmtDate(r.dateOfAdmission)}</td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">{r.assignedSocialWorker}</td>
                      <td>
                        {r.caseStatus === 'Pending'
                          ? <span className="badge badge-warning text-xs">Pending Review</span>
                          : <span className="badge text-xs">{r.caseStatus}</span>
                        }
                      </td>
                    </tr>

                    {/* Accordion detail row */}
                    {expandedId === r.residentId && (
                      <tr>
                        <td colSpan={6} className="p-0 border-b border-[var(--color-outline-variant)]">
                          <div className="bg-[var(--color-surface-container-low)] border-t border-[var(--color-outline-variant)]">
                            {/* Tab bar */}
                            <div className="flex border-b border-[var(--color-outline-variant)] px-4">
                              {(['profile', 'recordings', 'visits', 'intervention'] as DetailTab[]).map(tab => (
                                <button
                                  key={tab}
                                  onClick={e => { e.stopPropagation(); setActiveTab(tab) }}
                                  className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                                    activeTab === tab
                                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                      : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                                  }`}
                                >
                                  {tab === 'profile' ? 'Profile' : tab === 'recordings' ? 'Recordings' : tab === 'visits' ? 'Home Visits' : 'Intervention Plan'}
                                </button>
                              ))}
                            </div>

                            {/* Tab content */}
                            <div className="p-4" onClick={e => e.stopPropagation()}>
                              {detailLoading ? (
                                <p className="text-sm text-[var(--color-on-surface-variant)]">Loading…</p>
                              ) : (
                                <>
                                  {/* Profile tab */}
                                  {activeTab === 'profile' && detail && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                                      {[
                                        ['Sex',              detail.sex],
                                        ['Age at Admission', detail.ageUponAdmission],
                                        ['Present Age',      detail.presentAge],
                                        ['Admission Date',   fmtDate(detail.dateOfAdmission)],
                                        ['Referral Source',  detail.referralSource],
                                        ['Social Worker',    detail.assignedSocialWorker],
                                        ['Risk Level',       detail.currentRiskLevel],
                                        ['Status',           detail.caseStatus],
                                        ['Reintegration',    detail.reintegrationStatus ?? '—'],
                                        ['Disability',       detail.isPwd ? (detail.pwdType || 'Yes') : 'No'],
                                        ['4Ps Beneficiary',  detail.familyIs4ps ? 'Yes' : 'No'],
                                        ['Solo Parent HH',   detail.familySoloParent ? 'Yes' : 'No'],
                                        ['Indigenous Group', detail.familyIndigenous ? 'Yes' : 'No'],
                                        ['Informal Settler', detail.familyInformalSettler ? 'Yes' : 'No'],
                                      ].map(([label, value]) => (
                                        <div key={label as string}>
                                          <p className="text-xs text-[var(--color-on-surface-variant)]">{label}</p>
                                          <p className="text-sm font-medium text-[var(--color-on-surface)]">{value}</p>
                                        </div>
                                      ))}
                                      {/* Sub-categories */}
                                      <div className="col-span-full">
                                        <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Sub-categories</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {SUB_CAT_LABELS
                                            .filter(({ key }) => detail.subCategories[key as keyof typeof detail.subCategories])
                                            .map(({ label }) => (
                                              <span key={label} className="badge text-xs">{label}</span>
                                            ))}
                                          {Object.values(detail.subCategories).every(v => !v) && (
                                            <span className="text-xs text-[var(--color-on-surface-variant)]">None</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Recordings tab */}
                                  {activeTab === 'recordings' && (
                                    <>
                                      <div className="flex justify-between items-center mb-3">
                                        <p className="text-xs text-[var(--color-on-surface-variant)]">{detailRecordings?.length ?? 0} recording(s)</p>
                                        <Link
                                          to={`/staff/process-recording?residentId=${r.residentId}`}
                                          className="text-xs text-[var(--color-primary)] hover:underline"
                                        >
                                          + Submit New Recording
                                        </Link>
                                      </div>
                                      {!detailRecordings || detailRecordings.length === 0 ? (
                                        <p className="text-sm text-[var(--color-on-surface-variant)]">No recordings on file.</p>
                                      ) : (
                                        <div className="flex flex-col gap-2">
                                          {detailRecordings.map(rec => (
                                            <details key={rec.recordingId} className="border border-[var(--color-outline-variant)] rounded-lg">
                                              <summary className="flex items-center justify-between px-3 py-2 cursor-pointer list-none">
                                                <div className="flex items-center gap-3">
                                                  <span className="text-xs font-medium text-[var(--color-on-surface)]">{fmtDate(rec.sessionDate)}</span>
                                                  <span className="badge text-xs">{rec.sessionType}</span>
                                                  <span className="text-xs text-[var(--color-on-surface-variant)]">{rec.emotionalStateObserved}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-[var(--color-on-surface-variant)]">{rec.socialWorker}</span>
                                                  {rec.concernsFlagged && <span className="badge badge-warning text-xs">⚑ Concerns</span>}
                                                </div>
                                              </summary>
                                              <div className="px-3 pb-3 pt-1 border-t border-[var(--color-outline-variant)] flex flex-col gap-2">
                                                {rec.sessionNarrative && (
                                                  <div>
                                                    <p className="text-xs text-[var(--color-on-surface-variant)]">Narrative</p>
                                                    <p className="text-sm text-[var(--color-on-surface)]">{rec.sessionNarrative}</p>
                                                  </div>
                                                )}
                                                {rec.interventionsApplied && (
                                                  <div>
                                                    <p className="text-xs text-[var(--color-on-surface-variant)]">Interventions Applied</p>
                                                    <p className="text-sm text-[var(--color-on-surface)]">{rec.interventionsApplied}</p>
                                                  </div>
                                                )}
                                                {rec.followUpActions && (
                                                  <div>
                                                    <p className="text-xs text-[var(--color-on-surface-variant)]">Follow-up Actions</p>
                                                    <p className="text-sm text-[var(--color-on-surface)]">{rec.followUpActions}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </details>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {/* Visits tab */}
                                  {activeTab === 'visits' && (
                                    <>
                                      <div className="flex justify-between items-center mb-3">
                                        <p className="text-xs text-[var(--color-on-surface-variant)]">{detailVisits?.length ?? 0} visit(s)</p>
                                        <Link
                                          to={`/staff/home-visits?residentId=${r.residentId}`}
                                          className="text-xs text-[var(--color-primary)] hover:underline"
                                        >
                                          + Submit New Visit
                                        </Link>
                                      </div>
                                      {!detailVisits || detailVisits.length === 0 ? (
                                        <p className="text-sm text-[var(--color-on-surface-variant)]">No home visits on file.</p>
                                      ) : (
                                        <div className="flex flex-col gap-2">
                                          {detailVisits.map(v => (
                                            <details key={v.visitationId} className="border border-[var(--color-outline-variant)] rounded-lg">
                                              <summary className="flex items-center justify-between px-3 py-2 cursor-pointer list-none">
                                                <div className="flex items-center gap-3">
                                                  <span className="text-xs font-medium text-[var(--color-on-surface)]">{fmtDate(v.visitDate)}</span>
                                                  <span className="badge text-xs">{v.visitType}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-[var(--color-on-surface-variant)]">{v.socialWorker}</span>
                                                  {v.safetyConcernsNoted && <span className="badge badge-error text-xs">⚑ Safety Concern</span>}
                                                  {v.followUpNeeded && <span className="badge badge-warning text-xs">Follow-up</span>}
                                                </div>
                                              </summary>
                                              <div className="px-3 pb-3 pt-1 border-t border-[var(--color-outline-variant)] flex flex-col gap-2">
                                                {v.observations && (
                                                  <div>
                                                    <p className="text-xs text-[var(--color-on-surface-variant)]">Observations</p>
                                                    <p className="text-sm text-[var(--color-on-surface)]">{v.observations}</p>
                                                  </div>
                                                )}
                                                <div>
                                                  <p className="text-xs text-[var(--color-on-surface-variant)]">Family Cooperation</p>
                                                  <p className="text-sm text-[var(--color-on-surface)]">{v.familyCooperationLevel}</p>
                                                </div>
                                                {v.visitOutcome && (
                                                  <div>
                                                    <p className="text-xs text-[var(--color-on-surface-variant)]">Outcome</p>
                                                    <p className="text-sm text-[var(--color-on-surface)]">{v.visitOutcome}</p>
                                                  </div>
                                                )}
                                                {v.followUpNeeded && v.followUpNotes && (
                                                  <div>
                                                    <p className="text-xs text-[var(--color-on-surface-variant)]">Follow-up Notes</p>
                                                    <p className="text-sm text-[var(--color-on-surface)]">{v.followUpNotes}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </details>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {/* Intervention Plan tab */}
                                  {activeTab === 'intervention' && (
                                    <>
                                      {!detailPlan || detailPlan.length === 0 ? (
                                        <p className="text-sm text-[var(--color-on-surface-variant)]">No intervention plan on file.</p>
                                      ) : (
                                        <div className="flex flex-col gap-3">
                                          {detailPlan.map(plan => (
                                            <div key={plan.planId} className="border border-[var(--color-outline-variant)] rounded-lg p-3 flex flex-col gap-2">
                                              <div className="flex items-center justify-between">
                                                <span className="badge text-xs">{plan.planCategory}</span>
                                                <span className={`badge text-xs ${plan.status === 'Completed' ? 'badge-success' : ''}`}>{plan.status}</span>
                                              </div>
                                              {plan.planDescription && (
                                                <div>
                                                  <p className="text-xs text-[var(--color-on-surface-variant)]">Description</p>
                                                  <p className="text-sm text-[var(--color-on-surface)]">{plan.planDescription}</p>
                                                </div>
                                              )}
                                              {plan.servicesProvided && (
                                                <div>
                                                  <p className="text-xs text-[var(--color-on-surface-variant)]">Services Provided</p>
                                                  <p className="text-sm text-[var(--color-on-surface)]">{plan.servicesProvided}</p>
                                                </div>
                                              )}
                                              <div className="flex gap-6">
                                                {plan.targetDate && (
                                                  <div>
                                                    <p className="text-xs text-[var(--color-on-surface-variant)]">Target Date</p>
                                                    <p className="text-sm text-[var(--color-on-surface)]">{fmtDate(plan.targetDate)}</p>
                                                  </div>
                                                )}
                                                {plan.caseConferenceDate && (
                                                  <div>
                                                    <p className="text-xs text-[var(--color-on-surface-variant)]">Case Conference</p>
                                                    <p className="text-sm text-[var(--color-on-surface)]">{fmtDate(plan.caseConferenceDate)}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {caseloadTotal > PAGE_SIZE && (
          <Pagination
            page={caseloadPage}
            totalPages={totalPages}
            totalItems={caseloadTotal}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        )}
      </SectionCard>


      {/* ── Intake form slide-in panel ───────────────────────────────────────── */}
      {showIntakeForm && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/30"
            onClick={() => setShowIntakeForm(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="w-[520px] max-w-full bg-[var(--color-surface-container-lowest)] border-l border-[var(--color-outline-variant)] h-full overflow-y-auto flex flex-col shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-on-surface)]">Add Resident</h2>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Submitted as Pending — requires admin approval.</p>
              </div>
              <button
                onClick={() => setShowIntakeForm(false)}
                className="p-2 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
                aria-label="Close intake form"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleIntakeSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

              {/* Identification */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">Identification</p>
                <div>
                  <label className="text-xs text-[var(--color-on-surface-variant)] mb-1 block">Internal Code <span className="text-[var(--color-error)]">*</span></label>
                  <input className="form-input w-full" value={intakeForm.internalCode} onChange={e => setField('internalCode', e.target.value)} placeholder="e.g. PAS-2024-001" />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-on-surface-variant)] mb-1 block">Date of Admission</label>
                  <input type="date" className="form-input w-full" value={intakeForm.dateOfAdmission} onChange={e => setField('dateOfAdmission', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-on-surface-variant)] mb-1 block">Referral Source</label>
                  <input className="form-input w-full" value={intakeForm.referralSource} onChange={e => setField('referralSource', e.target.value)} placeholder="Organization or individual" />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-on-surface-variant)] mb-1 block">Assigned Social Worker</label>
                  <input className="form-input w-full" value={intakeForm.assignedSocialWorker} onChange={e => setField('assignedSocialWorker', e.target.value)} />
                </div>
              </div>

              {/* Demographics */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">Demographics</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--color-on-surface-variant)] mb-1 block">Sex <span className="text-[var(--color-error)]">*</span></label>
                    <select className="form-input w-full" value={intakeForm.sex} onChange={e => setField('sex', e.target.value)}>
                      <option value="">Select…</option>
                      <option>Female</option><option>Male</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-on-surface-variant)] mb-1 block">Age at Admission</label>
                    <input className="form-input w-full" value={intakeForm.ageUponAdmission} onChange={e => setField('ageUponAdmission', e.target.value)} placeholder="e.g. 14" />
                  </div>
                </div>
              </div>

              {/* Case */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">Case</p>
                <div>
                  <label className="text-xs text-[var(--color-on-surface-variant)] mb-1 block">Case Category <span className="text-[var(--color-error)]">*</span></label>
                  <select className="form-input w-full" value={intakeForm.caseCategory} onChange={e => setField('caseCategory', e.target.value)}>
                    <option value="">Select…</option>
                    <option>Trafficked</option><option>Physical Abuse</option><option>Sexual Abuse</option>
                    <option>Neglect</option><option>Abandoned</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--color-on-surface-variant)] mb-1 block">Initial Risk Level <span className="text-[var(--color-error)]">*</span></label>
                  <select className="form-input w-full" value={intakeForm.initialRiskLevel} onChange={e => setField('initialRiskLevel', e.target.value)}>
                    <option value="">Select…</option>
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--color-on-surface-variant)] mb-2 block">Sub-categories</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SUB_CAT_LABELS.map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-xs text-[var(--color-on-surface)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={intakeForm[key] as boolean}
                          onChange={e => setField(key, e.target.checked)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disability */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">Disability</p>
                <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
                  <input type="checkbox" checked={intakeForm.isPwd} onChange={e => setField('isPwd', e.target.checked)} />
                  Person with Disability (PWD)
                </label>
                {intakeForm.isPwd && (
                  <div>
                    <label className="text-xs text-[var(--color-on-surface-variant)] mb-1 block">Disability Type / Description</label>
                    <input className="form-input w-full" value={intakeForm.pwdType} onChange={e => setField('pwdType', e.target.value)} />
                  </div>
                )}
              </div>

              {/* Family Profile */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">Family Profile</p>
                {([
                  ['familyIs4ps', '4Ps Beneficiary'],
                  ['familySoloParent', 'Solo Parent Household'],
                  ['familyIndigenous', 'Indigenous Group'],
                  ['familyInformalSettler', 'Informal Settler'],
                ] as [keyof IntakeForm, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
                    <input type="checkbox" checked={intakeForm[key] as boolean} onChange={e => setField(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-[var(--color-on-surface-variant)] mb-1 block">Notes (Restricted)</label>
                <textarea
                  className="form-input w-full"
                  rows={3}
                  value={intakeForm.notesRestricted}
                  onChange={e => setField('notesRestricted', e.target.value)}
                  placeholder="Additional intake notes…"
                />
              </div>

              {/* Feedback */}
              {intakeError && (
                <p className="text-sm text-[var(--color-error)]">{intakeError}</p>
              )}
              {intakeSuccess && (
                <p className="text-sm text-[var(--color-primary)]">Resident submitted successfully. Pending admin review.</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 pb-4">
                <button type="submit" disabled={intakeSubmitting} className="btn btn-primary flex-1">
                  {intakeSubmitting ? 'Saving…' : 'Save Resident'}
                </button>
                <button type="button" onClick={() => setShowIntakeForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
