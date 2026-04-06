import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { AdminStatCard } from '../../../components/admin/AdminStatCard'

// ─── Mock data — replace with API calls once backend is ready ─────────────────
// GET /api/residents/summary
const residentSummary = {
  activeResidents: 84,
  highCriticalRisk: 12,
  reintegrationInProgress: 23,
  upcomingConferences: 7,
}

// GET /api/safehouses/overview
const safehouseRows = [
  { id: 1, name: 'Pag-asa Manila', region: 'NCR', occupancy: 18, capacity: 20, avgEdProgress: 87, avgHealthScore: 8.2, incidents: 1 },
  { id: 2, name: 'Pag-asa Cebu', region: 'Central Visayas', occupancy: 14, capacity: 18, avgEdProgress: 79, avgHealthScore: 7.8, incidents: 0 },
  { id: 3, name: 'Pag-asa Davao', region: 'Davao', occupancy: 22, capacity: 25, avgEdProgress: 82, avgHealthScore: 8.5, incidents: 2 },
  { id: 4, name: 'Pag-asa Iloilo', region: 'Western Visayas', occupancy: 12, capacity: 15, avgEdProgress: 91, avgHealthScore: 9.0, incidents: 0 },
]

// GET /api/residents/risk-summary
const riskByHouse = [
  { safehouse: 'Manila', Low: 8, Medium: 5, High: 4, Critical: 1 },
  { safehouse: 'Cebu', Low: 9, Medium: 3, High: 2, Critical: 0 },
  { safehouse: 'Davao', Low: 10, Medium: 7, High: 4, Critical: 1 },
  { safehouse: 'Iloilo', Low: 8, Medium: 3, High: 1, Critical: 0 },
]

// GET /api/residents/risk-changes — residents whose risk has worsened since intake
const worsenedRisk = [
  { code: 'RES-2024-031', safehouse: 'Davao', initialRisk: 'Medium', currentRisk: 'High', socialWorker: 'SW Reyes' },
  { code: 'RES-2024-019', safehouse: 'Manila', initialRisk: 'Low', currentRisk: 'Medium', socialWorker: 'SW Dela Cruz' },
  { code: 'RES-2025-007', safehouse: 'Davao', initialRisk: 'High', currentRisk: 'Critical', socialWorker: 'SW Reyes' },
  { code: 'RES-2024-044', safehouse: 'Cebu', initialRisk: 'Low', currentRisk: 'High', socialWorker: 'SW Macaraeg' },
]

// GET /api/process-recordings/recent
const recentRecordings = [
  { id: 1, code: 'RES-2024-031', worker: 'SW Reyes', date: '2026-04-05', concerns: 'Sleep disturbances, withdrawal' },
  { id: 2, code: 'RES-2024-008', worker: 'SW Dela Cruz', date: '2026-04-04', concerns: 'None flagged' },
  { id: 3, code: 'RES-2025-012', worker: 'SW Santos', date: '2026-04-03', concerns: 'Anxiety around family contact' },
  { id: 4, code: 'RES-2024-019', worker: 'SW Dela Cruz', date: '2026-04-02', concerns: 'Behavioral regression noted' },
  { id: 5, code: 'RES-2024-055', worker: 'SW Macaraeg', date: '2026-04-01', concerns: 'None flagged' },
]

// GET /api/incidents/recent
const recentIncidents = [
  { id: 1, code: 'RES-2024-031', type: 'Behavioral', severity: 'Moderate', resolved: false, date: '2026-04-05' },
  { id: 2, code: 'RES-2025-007', type: 'Safety', severity: 'High', resolved: false, date: '2026-04-03' },
  { id: 3, code: 'RES-2024-017', type: 'Medical', severity: 'Low', resolved: true, date: '2026-04-01' },
  { id: 4, code: 'RES-2024-044', type: 'Behavioral', severity: 'Moderate', resolved: true, date: '2026-03-29' },
]

const RISK_COLORS = {
  Low: '#22c55e',
  Medium: '#d97706',
  High: '#f97316',
  Critical: '#DB7981',   // Soft Lavender — warm alert per design system
}

const riskBadge = (level: string) => {
  const colors: Record<string, string> = {
    Low: 'bg-green-100 text-green-700',
    Medium: 'bg-amber-100 text-amber-700',
    High: 'bg-orange-100 text-orange-700',
    Critical: 'bg-[#DB7981]/10 text-[#DB7981]',  // Soft Lavender per design system
  }
  return colors[level] ?? 'badge'
}

const severityBadge = (s: string) => {
  if (s === 'High') return 'badge-error'
  if (s === 'Moderate') return 'badge-warning'
  return 'badge'
}

export function ResidentsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <div>
        <h2 className="text-[var(--text-h)]">Residents & Safehouses</h2>
        <p className="text-sm text-[var(--text)] mt-1">
          Occupancy, risk levels, recent sessions, and incident reports across all safehouses.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard
          label="Active Residents"
          value={residentSummary.activeResidents}
          icon="🏠"
        />
        <AdminStatCard
          label="High / Critical Risk"
          value={residentSummary.highCriticalRisk}
          icon="⚠️"
          trend={{ direction: 'down', text: '−2 since last week' }}
        />
        <AdminStatCard
          label="Reintegration In Progress"
          value={residentSummary.reintegrationInProgress}
          icon="🌱"
          trend={{ direction: 'up', text: '+3 this month' }}
        />
        <AdminStatCard
          label="Upcoming Case Conferences"
          value={residentSummary.upcomingConferences}
          icon="📅"
        />
      </div>

      {/* Per-safehouse table */}
      <div className="card">
        <h3 className="text-[var(--text-h)] mb-1">Safehouse Overview</h3>
        <p className="text-xs text-[var(--text)] mb-4">
          Click a row to view that safehouse's detail (coming soon).
        </p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Safehouse</th>
                <th>Region</th>
                <th>Occupancy</th>
                <th>Avg Ed. Progress</th>
                <th>Avg Health Score</th>
                <th>Incidents (Mo.)</th>
              </tr>
            </thead>
            <tbody>
              {safehouseRows.map((row) => {
                const pct = Math.round((row.occupancy / row.capacity) * 100)
                return (
                  <tr key={row.id} className="cursor-pointer">
                    <td className="font-medium text-[var(--text-h)]">{row.name}</td>
                    <td className="text-[var(--text)]">{row.region}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{row.occupancy}/{row.capacity}</span>
                        <div className="w-20 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 90 ? '#ef4444' : pct >= 75 ? '#f97316' : '#0d9488',
                            }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text)]">{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium">{row.avgEdProgress}%</span>
                    </td>
                    <td>
                      <span className="font-medium">{row.avgHealthScore}/10</span>
                    </td>
                    <td>
                      {row.incidents > 0 ? (
                        <span className="badge badge-error">{row.incidents}</span>
                      ) : (
                        <span className="badge badge-success">0</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk level chart */}
      <div className="card">
        <h3 className="text-[var(--text-h)] mb-1">Risk Level Breakdown by Safehouse</h3>
        <p className="text-xs text-[var(--text)] mb-4">Number of residents at each risk level</p>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskByHouse} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="safehouse" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Low" stackId="a" fill={RISK_COLORS.Low} />
              <Bar dataKey="Medium" stackId="a" fill={RISK_COLORS.Medium} />
              <Bar dataKey="High" stackId="a" fill={RISK_COLORS.High} />
              <Bar dataKey="Critical" stackId="a" fill={RISK_COLORS.Critical} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Worsened risk flag */}
      <div className="card border-l-4 border-l-[#DB7981]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚠️</span>
          <h3 className="text-[var(--text-h)]">Risk Escalations Since Intake</h3>
        </div>
        <p className="text-xs text-[var(--text)] mb-4">
          Residents whose current risk level is higher than their initial assessment.
        </p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Resident Code</th>
                <th>Safehouse</th>
                <th>Initial Risk</th>
                <th>Current Risk</th>
                <th>Social Worker</th>
              </tr>
            </thead>
            <tbody>
              {worsenedRisk.map((r) => (
                <tr key={r.code}>
                  <td className="font-medium text-[var(--text-h)]">{r.code}</td>
                  <td className="text-[var(--text)]">{r.safehouse}</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${riskBadge(r.initialRisk)}`}>
                      {r.initialRisk}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${riskBadge(r.currentRisk)}`}>
                      {r.currentRisk}
                    </span>
                  </td>
                  <td className="text-[var(--text)]">{r.socialWorker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent activity — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent process recordings */}
        <div className="card">
          <h3 className="text-[var(--text-h)] mb-1">Recent Process Recordings</h3>
          <p className="text-xs text-[var(--text)] mb-4">Last 7 days</p>
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
                {recentRecordings.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-[var(--text-h)]">{r.code}</td>
                    <td className="text-[var(--text)] text-xs">{r.worker}</td>
                    <td className="text-[var(--text)] text-xs">{r.date}</td>
                    <td className="text-xs">
                      {r.concerns === 'None flagged' ? (
                        <span className="text-[var(--text)]">None flagged</span>
                      ) : (
                        <span className="text-orange-600">{r.concerns}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent incidents */}
        <div className="card">
          <h3 className="text-[var(--text-h)] mb-1">Recent Incidents</h3>
          <p className="text-xs text-[var(--text)] mb-4">Last 14 days</p>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {recentIncidents.map((inc) => (
                  <tr key={inc.id}>
                    <td className="font-medium text-[var(--text-h)]">{inc.code}</td>
                    <td className="text-[var(--text)] text-xs">{inc.type}</td>
                    <td>
                      <span className={`badge ${severityBadge(inc.severity)} text-xs`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>
                      {inc.resolved ? (
                        <span className="badge badge-success text-xs">Yes</span>
                      ) : (
                        <span className="badge badge-error text-xs">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
