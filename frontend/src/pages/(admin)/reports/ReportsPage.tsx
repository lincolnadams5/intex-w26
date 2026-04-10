import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { StatCard }    from '../../../components/admin/StatCard'
import { LoadingState } from '../../../components/admin/LoadingState'
import {
  getAarSummary,
  type AarSummaryDto,
  type SafehousePerformanceRow,
} from '../../../lib/adminApi'

// ── Year range: current year back to 2020 ─────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i)

// ── AAR pillar icon SVGs ──────────────────────────────────────────────────────

const HeartIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 .5C21 14.5 12 21 12 21z"/>
  </svg>
)

const PulseIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const BookIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)

// ── Main page component ───────────────────────────────────────────────────────

export function ReportsPage() {
  const [year, setYear]               = useState(CURRENT_YEAR)
  const [safehouseId, setSafehouseId] = useState<number | undefined>(undefined)
  const [data, setData]               = useState<AarSummaryDto | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  // Build safehouse options from performance rows after first successful load
  const [safehouseOptions, setSafehouseOptions] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAarSummary(year, safehouseId)
      .then(d => {
        setData(d)
        // Populate safehouse filter from the performance rows (only on first load)
        if (safehouseOptions.length === 0 && d.safehousePerformance.length > 0) {
          setSafehouseOptions(
            d.safehousePerformance.map(r => ({ id: r.safehouseId, name: r.safehouseName }))
          )
        }
      })
      .catch(() => setError('Failed to load report data.'))
      .finally(() => setLoading(false))
  }, [year, safehouseId])

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Annual Accomplishment Report — aggregated program outcomes and service delivery metrics."
      />

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">
            Report Year
          </label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-sm border border-[var(--color-outline-variant)] rounded-md px-3 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {safehouseOptions.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">
              Safehouse
            </label>
            <select
              value={safehouseId ?? ''}
              onChange={e => setSafehouseId(e.target.value ? Number(e.target.value) : undefined)}
              className="text-sm border border-[var(--color-outline-variant)] rounded-md px-3 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
            >
              <option value="">All Safehouses</option>
              {safehouseOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && <LoadingState />}
      {error   && <p className="text-sm text-[var(--color-error)] p-4">{error}</p>}

      {!loading && !error && data && (
        <>
          {/* ══════════════════════════════════════════════════════════════
              CARING — Residential & Protective Services
          ══════════════════════════════════════════════════════════════ */}
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
            Caring — Residential &amp; Protective Services
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Total Beneficiaries"
              value={data.caring.totalBeneficiaries}
              color="#0d9488"
              icon={HeartIcon}
            />
            <StatCard
              label="New Admissions"
              value={data.caring.newAdmissions}
              color="#0d9488"
              icon={HeartIcon}
            />
            <StatCard
              label="Home Visitations"
              value={data.caring.homeVisitationsConducted}
              color="#0d9488"
              icon={HeartIcon}
            />
            <StatCard
              label="Incidents Filed / Resolved"
              value={`${data.caring.incidentReportsFiled} / ${data.caring.incidentReportsResolved}`}
              color="#f97316"
              icon={HeartIcon}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Case category breakdown */}
            <SectionCard title="Beneficiaries by Case Category" accentBorder>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Trafficked',     count: data.caring.trafficked },
                      { label: 'Physical Abuse', count: data.caring.physicalAbuse },
                      { label: 'Sexual Abuse',   count: data.caring.sexualAbuse },
                      { label: 'OSAEC',          count: data.caring.osaec },
                      { label: 'CICL',           count: data.caring.cicl },
                      { label: 'Child Labor',    count: data.caring.childLabor },
                      { label: 'At Risk',        count: data.caring.atRisk },
                      { label: 'Street Child',   count: data.caring.streetChild },
                      { label: 'Orphaned',       count: data.caring.orphaned },
                    ]
                      .filter(row => row.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map(row => (
                        <tr key={row.label}>
                          <td className="text-[var(--color-on-surface)]">{row.label}</td>
                          <td className="text-right font-semibold text-[var(--color-on-surface)]">
                            {row.count}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Safehouse occupancy */}
            <SectionCard title="Safehouse Occupancy" accentBorder>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Safehouse</th>
                      <th className="text-right">Active</th>
                      <th className="text-right">Capacity</th>
                      <th className="text-right">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.caring.occupancyByHouse.map(row => (
                      <tr key={row.safehouseName}>
                        <td className="font-medium text-[var(--color-on-surface)]">{row.safehouseName}</td>
                        <td className="text-right text-[var(--color-on-surface-variant)]">{row.activeResidents}</td>
                        <td className="text-right text-[var(--color-on-surface-variant)]">{row.capacity}</td>
                        <td className="text-right">
                          <span className={`badge ${
                            row.occupancyPct >= 90 ? 'badge-error' :
                            row.occupancyPct >= 70 ? 'badge-warning' : 'badge-success'
                          }`}>
                            {row.occupancyPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              HEALING — Psychosocial & Health Services
          ══════════════════════════════════════════════════════════════ */}
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-2">
            Healing — Psychosocial &amp; Health Services
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Process Recording Sessions"
              value={data.healing.totalSessions}
              color="#f97316"
              icon={PulseIcon}
            />
            <StatCard
              label="Avg. General Health Score"
              value={data.healing.avgGeneralHealthScore != null
                ? data.healing.avgGeneralHealthScore.toFixed(1)
                : '—'}
              color="#f97316"
              icon={PulseIcon}
            />
            <StatCard
              label="Avg. Nutrition Score"
              value={data.healing.avgNutritionScore != null
                ? data.healing.avgNutritionScore.toFixed(1)
                : '—'}
              color="#f97316"
              icon={PulseIcon}
            />
            <StatCard
              label="Health Records on File"
              value={data.healing.totalHealthRecords}
              color="#f97316"
              icon={PulseIcon}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly session bar chart */}
            <SectionCard title="Sessions by Month" accentBorder>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.healing.sessionsByMonth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface-container-lowest)',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" name="Sessions" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* Checkup completion + session types */}
            <div className="flex flex-col gap-4">
              <SectionCard title="Health Checkup Completion" accentBorder>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Checkup Type</th>
                        <th className="text-right">Completed</th>
                        <th className="text-right">Total Records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Medical',       done: data.healing.medicalCheckupsDone },
                        { label: 'Dental',        done: data.healing.dentalCheckupsDone },
                        { label: 'Psychological', done: data.healing.psychologicalCheckupsDone },
                      ].map(row => (
                        <tr key={row.label}>
                          <td className="text-[var(--color-on-surface)]">{row.label}</td>
                          <td className="text-right font-semibold text-[var(--color-on-surface)]">{row.done}</td>
                          <td className="text-right text-[var(--color-on-surface-variant)]">
                            {data.healing.totalHealthRecords}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              {data.healing.sessionsByType.length > 0 && (
                <SectionCard title="Sessions by Type" accentBorder>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Session Type</th>
                          <th className="text-right">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.healing.sessionsByType.map(row => (
                          <tr key={row.label}>
                            <td className="text-[var(--color-on-surface)]">{row.label}</td>
                            <td className="text-right font-semibold text-[var(--color-on-surface)]">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TEACHING — Education & Reintegration Services
          ══════════════════════════════════════════════════════════════ */}
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-2">
            Teaching — Education &amp; Reintegration Services
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Residents Enrolled"
              value={data.teaching.residentsEnrolled}
              color="#3b82f6"
              icon={BookIcon}
            />
            <StatCard
              label="Avg. Attendance Rate"
              value={data.teaching.avgAttendanceRate != null
                ? `${data.teaching.avgAttendanceRate.toFixed(1)}%`
                : '—'}
              color="#3b82f6"
              icon={BookIcon}
            />
            <StatCard
              label="Successfully Reintegrated"
              value={data.teaching.successfullyReintegrated}
              color="#22c55e"
              icon={BookIcon}
            />
            <StatCard
              label="Reintegration In Progress"
              value={data.teaching.reintegrationInProgress}
              color="#3b82f6"
              icon={BookIcon}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Intervention plan status */}
            <SectionCard title="Intervention Plans" accentBorder>
              <div className="flex gap-6 mb-4">
                <div>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Active</p>
                  <p className="text-2xl font-bold text-[var(--color-on-surface)]">
                    {data.teaching.plansActive}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Completed</p>
                  <p className="text-2xl font-bold text-[var(--color-on-surface)]">
                    {data.teaching.plansCompleted}
                  </p>
                </div>
              </div>
              {data.teaching.plansByCategory.length > 0 && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Plan Category</th>
                        <th className="text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.teaching.plansByCategory.map(row => (
                        <tr key={row.label}>
                          <td className="text-[var(--color-on-surface)]">{row.label}</td>
                          <td className="text-right font-semibold text-[var(--color-on-surface)]">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {/* Reintegration outcomes */}
            <SectionCard title="Reintegration Outcomes" accentBorder>
              {data.teaching.reintegrationByType.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Reintegration Type</th>
                        <th className="text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.teaching.reintegrationByType.map(row => (
                        <tr key={row.label}>
                          <td className="text-[var(--color-on-surface)]">{row.label}</td>
                          <td className="text-right font-semibold text-[var(--color-on-surface)]">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  No reintegration data for this period.
                </p>
              )}
            </SectionCard>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SAFEHOUSE PERFORMANCE COMPARISON
          ══════════════════════════════════════════════════════════════ */}
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-2">
            Safehouse Performance Comparison
          </h2>

          <SectionCard
            title="All Safehouses"
            subtitle={`Key indicators for ${data.reportYear}`}
            accentBorder
          >
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Safehouse</th>
                    <th>Region</th>
                    <th className="text-right">Active</th>
                    <th className="text-right">Capacity</th>
                    <th className="text-right">Occupancy</th>
                    <th className="text-right">Sessions</th>
                    <th className="text-right">Visits</th>
                    <th className="text-right">Incidents</th>
                  </tr>
                </thead>
                <tbody>
                  {data.safehousePerformance.map((row: SafehousePerformanceRow) => (
                    <tr key={row.safehouseId}>
                      <td className="font-medium text-[var(--color-on-surface)]">{row.safehouseName}</td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">{row.region}</td>
                      <td className="text-right text-[var(--color-on-surface-variant)]">{row.activeResidents}</td>
                      <td className="text-right text-[var(--color-on-surface-variant)]">{row.capacity}</td>
                      <td className="text-right">
                        <span className={`badge ${
                          row.occupancyPct >= 90 ? 'badge-error' :
                          row.occupancyPct >= 70 ? 'badge-warning' : 'badge-success'
                        }`}>
                          {row.occupancyPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right text-[var(--color-on-surface-variant)]">{row.sessionsThisYear}</td>
                      <td className="text-right text-[var(--color-on-surface-variant)]">{row.visitsThisYear}</td>
                      <td className="text-right">
                        {row.incidentsThisYear > 0
                          ? <span className="badge badge-warning">{row.incidentsThisYear}</span>
                          : <span className="text-[var(--color-on-surface-variant)]">0</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
