import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { authFetch } from '../../../lib/api'

interface DonationDto {
  donationId: number
  donationDate: string
  donationType: string
  campaignName: string | null
  amount: number | null
  currencyCode: string | null
  items: string | null
  isRecurring: boolean
}

interface DonorMetrics {
  totalMonetary: number
  totalDonations: number
  inKindItems: number
  yearsSupporting: number
}

interface DonorDashboardData {
  metrics: DonorMetrics
  donations: DonationDto[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function DonorDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DonorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    authFetch('/api/donations/my')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load donations')
        return res.json()
      })
      .then(setData)
      .catch(() => setError('Could not load your donation history.'))
      .finally(() => setLoading(false))
  }, [])

  const metrics = data?.metrics
  const donations = data?.donations ?? []

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <header className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white py-10 px-6">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-white mb-1">Welcome back, {user?.fullName?.split(' ')[0] || 'Donor'}</h1>
            <p className="text-white/80 text-lg">Thank you for your continued support of Pag-asa Sanctuary</p>
          </div>
          <Link to="/" className="btn btn-outline-light">Back to Home</Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col gap-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <p className="text-[var(--color-error)] text-center py-10">{error}</p>
        ) : (
          <>
            {/* Summary Cards */}
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white rounded-xl p-6 flex flex-col gap-1">
                  <span className="text-3xl font-bold font-[family-name:var(--font-display)]">
                    {formatCurrency(metrics?.totalMonetary ?? 0)}
                  </span>
                  <span className="text-white/80 text-sm">Total Monetary Donations</span>
                </div>
                <div className="bg-[var(--color-surface-container-low)] rounded-xl p-6 flex flex-col gap-1">
                  <span className="text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-display)]">
                    {metrics?.totalDonations ?? 0}
                  </span>
                  <span className="text-[var(--color-on-surface-variant)] text-sm">Total Donations</span>
                </div>
                <div className="bg-[var(--color-surface-container-low)] rounded-xl p-6 flex flex-col gap-1">
                  <span className="text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-display)]">
                    {metrics?.inKindItems ?? 0}
                  </span>
                  <span className="text-[var(--color-on-surface-variant)] text-sm">In-Kind Items Donated</span>
                </div>
                <div className="bg-[var(--color-surface-container-low)] rounded-xl p-6 flex flex-col gap-1">
                  <span className="text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-display)]">
                    {metrics?.yearsSupporting ?? 0}
                  </span>
                  <span className="text-[var(--color-on-surface-variant)] text-sm">Years Supporting</span>
                </div>
              </div>
            </section>

            {/* Donation History */}
            <section className="bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-[var(--shadow-ambient)]">
              <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                <h3>Donation History</h3>
                <Link to="/donate" className="btn btn-primary">Make a Donation</Link>
              </div>
              {donations.length === 0 ? (
                <p className="text-[var(--color-on-surface-variant)] text-center py-8">
                  No donations yet.{' '}
                  <Link to="/donate" className="text-[var(--color-primary)] font-semibold">Make your first donation</Link>
                </p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Campaign</th>
                        <th>Amount / Items</th>
                        <th>Recurring</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map(d => (
                        <tr key={d.donationId}>
                          <td>{formatDate(d.donationDate)}</td>
                          <td>
                            <span className={`badge ${d.donationType === 'Monetary' ? 'badge-primary' : 'badge-secondary'}`}>
                              {d.donationType}
                            </span>
                          </td>
                          <td>{d.campaignName ?? '—'}</td>
                          <td>
                            {d.donationType === 'Monetary' && d.amount != null
                              ? formatCurrency(d.amount)
                              : d.items ?? '—'}
                          </td>
                          <td>
                            {d.isRecurring
                              ? <span className="badge badge-success">Monthly</span>
                              : <span className="text-[var(--color-on-surface-variant)] text-sm">One-time</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* CTA Section */}
            <section className="bg-[var(--color-surface-container-low)] rounded-xl p-10 text-center">
              <h2 className="mb-3">Continue Making a Difference</h2>
              <p className="text-[var(--color-on-surface-variant)] max-w-lg mx-auto mb-8">
                Your support helps provide safety, healing, and hope to survivors. Every contribution matters.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/donate" className="btn btn-primary btn-large">Donate Now</Link>
                <Link to="/impact" className="btn btn-outline">View Organization Impact</Link>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="text-center py-6 text-[var(--color-on-surface-variant)] text-sm">
        <p>Questions about your donations? Contact us at donations@pagasasanctuary.org</p>
      </footer>
    </div>
  )
}
