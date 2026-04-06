import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { AdminStatCard } from '../../../components/admin/AdminStatCard'

// ─── Mock data — replace with API calls once backend is ready ─────────────────
// GET /api/donors/summary
const donorSummary = {
  totalThisMonth: '₱485,200',
  lastMonth: '₱433,400',
  activeDonors: 142,
  inactiveDonors: 38,
  recurringDonors: 67,
}

// GET /api/donations/trends
const trendData = [
  { month: 'May', amount: 320000 },
  { month: 'Jun', amount: 285000 },
  { month: 'Jul', amount: 410000 },
  { month: 'Aug', amount: 375000 },
  { month: 'Sep', amount: 298000 },
  { month: 'Oct', amount: 450000 },
  { month: 'Nov', amount: 520000 },
  { month: 'Dec', amount: 680000 },
  { month: 'Jan', amount: 390000 },
  { month: 'Feb', amount: 425000 },
  { month: 'Mar', amount: 510000 },
  { month: 'Apr', amount: 485000 },
]

// GET /api/donations/by-type
const typeData = [
  { name: 'Monetary', value: 45 },
  { name: 'In-Kind', value: 20 },
  { name: 'Time', value: 15 },
  { name: 'Skills', value: 12 },
  { name: 'Social Media', value: 8 },
]
const PIE_COLORS = ['#0d9488', '#14b8a6', '#5eead4', '#99f6e4', '#ccfbf1']

// GET /api/donations/by-channel
const channelData = [
  { channel: 'Social Media', count: 61 },
  { channel: 'Website', count: 42 },
  { channel: 'Word of Mouth', count: 38 },
  { channel: 'Event', count: 23 },
  { channel: 'Email', count: 18 },
]

// GET /api/donations/by-campaign
const campaignData = [
  { campaign: 'Hope Fund 2026', total: 192000 },
  { campaign: 'Basic Needs Drive', total: 134000 },
  { campaign: 'Education First', total: 98000 },
  { campaign: 'Holiday Appeal', total: 87000 },
  { campaign: 'Emergency Fund', total: 43000 },
]

// GET /api/donations/recent
const recentDonations = [
  { id: 1, donor: 'Maria Santos', type: 'Monetary', amount: '₱15,000', date: '2026-04-05', campaign: 'Hope Fund 2026' },
  { id: 2, donor: 'Juan dela Cruz', type: 'In-Kind', amount: '₱8,200', date: '2026-04-04', campaign: 'Basic Needs Drive' },
  { id: 3, donor: 'Anonymous', type: 'Monetary', amount: '₱5,000', date: '2026-04-04', campaign: 'Hope Fund 2026' },
  { id: 4, donor: 'Lighthouse Partners', type: 'Skills', amount: '₱12,500', date: '2026-04-03', campaign: 'Education First' },
  { id: 5, donor: 'Rosa Aquino', type: 'Time', amount: '₱3,600', date: '2026-04-02', campaign: '—' },
  { id: 6, donor: 'BDO Foundation', type: 'Monetary', amount: '₱50,000', date: '2026-04-01', campaign: 'Emergency Fund' },
  { id: 7, donor: 'Carlos Reyes', type: 'Monetary', amount: '₱2,000', date: '2026-03-31', campaign: 'Hope Fund 2026' },
  { id: 8, donor: 'Ateneo Outreach', type: 'In-Kind', amount: '₱6,400', date: '2026-03-30', campaign: 'Basic Needs Drive' },
]

// GET /api/donations/allocations
const allocationData = [
  { area: 'Manila', Education: 45000, Health: 38000, Housing: 62000, Emergency: 22000 },
  { area: 'Cebu', Education: 32000, Health: 27000, Housing: 48000, Emergency: 15000 },
  { area: 'Davao', Education: 51000, Health: 44000, Housing: 71000, Emergency: 28000 },
  { area: 'Iloilo', Education: 28000, Health: 22000, Housing: 35000, Emergency: 11000 },
]

const PAGE_SIZE = 5

export function DonorsPage() {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(recentDonations.length / PAGE_SIZE)
  const pagedDonations = recentDonations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <div>
        <h2 className="text-[var(--text-h)]">Donor Activity</h2>
        <p className="text-sm text-[var(--text)] mt-1">
          Donation trends, type breakdowns, and recent contributions.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Total Donations This Month"
          value={donorSummary.totalThisMonth}
          icon="💰"
          trend={{ direction: 'up', text: '+12% vs last month' }}
          accent
        />
        <AdminStatCard
          label="Active / Inactive Donors"
          value={`${donorSummary.activeDonors} / ${donorSummary.inactiveDonors}`}
          icon="👤"
        />
        <AdminStatCard
          label="Recurring Donors"
          value={donorSummary.recurringDonors}
          icon="🔁"
          trend={{ direction: 'up', text: '+4 this month' }}
        />
      </div>

      {/* Donation trend + type breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h3 className="text-[var(--text-h)] mb-1">Donation Trend</h3>
          <p className="text-xs text-[var(--text)] mb-4">Monthly total (₱) over the past 12 months</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={52} />
                <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'Total']} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ fill: '#0d9488', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-[var(--text-h)] mb-1">Donation by Type</h3>
          <p className="text-xs text-[var(--text)] mb-4">% share of estimated value</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {typeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            {typeData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-[var(--text)]">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                <span className="flex-1">{d.name}</span>
                <span className="font-medium text-[var(--text-h)]">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel breakdown + Campaign performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-[var(--text-h)] mb-1">Acquisition Channel</h3>
          <p className="text-xs text-[var(--text)] mb-4">Number of donors by how they first found us</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="channel" type="category" tick={{ fontSize: 12 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} name="Donors" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-[var(--text-h)] mb-1">Campaign Performance</h3>
          <p className="text-xs text-[var(--text)] mb-4">Total donations raised per campaign (₱)</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="campaign" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'Total']} />
                <Bar dataKey="total" fill="#14b8a6" radius={[0, 4, 4, 0]} name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Allocation chart */}
      <div className="card">
        <h3 className="text-[var(--text-h)] mb-1">Donation Allocations by Safehouse</h3>
        <p className="text-xs text-[var(--text)] mb-4">Estimated allocation (₱) across program areas</p>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={allocationData} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="area" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={52} />
              <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`]} />
              <Legend />
              <Bar dataKey="Housing" stackId="a" fill="#0d9488" />
              <Bar dataKey="Education" stackId="a" fill="#14b8a6" />
              <Bar dataKey="Health" stackId="a" fill="#5eead4" />
              <Bar dataKey="Emergency" stackId="a" fill="#99f6e4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent donations table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[var(--text-h)]">Recent Donations</h3>
            <p className="text-xs text-[var(--text)] mt-0.5">Latest contributions across all types</p>
          </div>
          <span className="badge">Page {page} of {totalPages}</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Donor Name</th>
                <th>Type</th>
                <th>Amount (PHP)</th>
                <th>Date</th>
                <th>Campaign</th>
              </tr>
            </thead>
            <tbody>
              {pagedDonations.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium text-[var(--text-h)]">{d.donor}</td>
                  <td>
                    <span className="badge text-xs">{d.type}</span>
                  </td>
                  <td className="font-medium">{d.amount}</td>
                  <td className="text-[var(--text)]">{d.date}</td>
                  <td className="text-[var(--text)]">{d.campaign}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary btn-small"
          >
            ← Previous
          </button>
          <span className="text-sm text-[var(--text)]">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, recentDonations.length)} of {recentDonations.length}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary btn-small"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
