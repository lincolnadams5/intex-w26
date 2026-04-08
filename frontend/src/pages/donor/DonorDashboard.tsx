import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const mockDonations = [
  { id: 1, date: '2026-03-15', type: 'Monetary', amount: 5000, currency: 'PHP', campaign: 'Year-End Hope', status: 'Completed' },
  { id: 2, date: '2026-02-20', type: 'Monetary', amount: 2500, currency: 'PHP', campaign: 'Back to School', status: 'Completed' },
  { id: 3, date: '2026-01-10', type: 'In-Kind', amount: null, currency: null, campaign: 'Winter Drive', status: 'Received', items: '10 blankets, 5 hygiene kits' },
  { id: 4, date: '2025-12-01', type: 'Monetary', amount: 10000, currency: 'PHP', campaign: 'GivingTuesday', status: 'Completed' },
  { id: 5, date: '2025-11-15', type: 'In-Kind', amount: null, currency: null, campaign: 'School Supplies', status: 'Received', items: '20 notebooks, 30 pens, 10 backpacks' },
  { id: 6, date: '2025-10-05', type: 'Monetary', amount: 3000, currency: 'PHP', campaign: 'Summer of Safety', status: 'Completed' },
]

const mockMetrics = {
  totalMonetary: 20500,
  totalDonations: 6,
  inKindItems: 75,
  yearsSupporting: 2,
}

const mockImpact = [
  { metric: '3 months', description: 'of educational supplies funded for a survivor' },
  { metric: '45 meals', description: 'provided to residents at safe homes' },
  { metric: '2 children', description: 'received school supplies from your in-kind donations' },
  { metric: '15 hours', description: 'of counseling sessions supported' },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function DonorDashboard() {
  const { user } = useAuth()

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
        {/* Summary Cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white rounded-xl p-6 flex flex-col gap-1">
              <span className="text-3xl font-bold font-[family-name:var(--font-display)]">{formatCurrency(mockMetrics.totalMonetary)}</span>
              <span className="text-white/80 text-sm">Total Monetary Donations</span>
            </div>
            <div className="bg-[var(--color-surface-container-low)] rounded-xl p-6 flex flex-col gap-1">
              <span className="text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-display)]">{mockMetrics.totalDonations}</span>
              <span className="text-[var(--color-on-surface-variant)] text-sm">Total Donations</span>
            </div>
            <div className="bg-[var(--color-surface-container-low)] rounded-xl p-6 flex flex-col gap-1">
              <span className="text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-display)]">{mockMetrics.inKindItems}</span>
              <span className="text-[var(--color-on-surface-variant)] text-sm">In-Kind Items Donated</span>
            </div>
            <div className="bg-[var(--color-surface-container-low)] rounded-xl p-6 flex flex-col gap-1">
              <span className="text-3xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-display)]">{mockMetrics.yearsSupporting}</span>
              <span className="text-[var(--color-on-surface-variant)] text-sm">Years Supporting</span>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section>
          <div className="mb-6">
            <div className="horizon-line"></div>
            <h3 className="mb-1">Your Impact</h3>
            <p className="text-[var(--color-on-surface-variant)]">See how your generosity has made a difference</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {mockImpact.map((item, idx) => (
              <div key={idx} className="bg-[var(--surface-container-lowest)] rounded-xl p-5 border-l-[3px] border-[var(--color-secondary)] shadow-[var(--shadow-ambient)]">
                <span className="block text-xl font-bold text-[var(--color-secondary)] mb-1">{item.metric}</span>
                <span className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">{item.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Donation History */}
        <section className="bg-[var(--surface-container-lowest)] rounded-xl p-6 shadow-[var(--shadow-ambient)]">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
            <h3>Donation History</h3>
            <Link to="/donate" className="btn btn-primary">Make a Donation</Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Campaign</th>
                  <th>Amount / Items</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockDonations.map(donation => (
                  <tr key={donation.id}>
                    <td>{formatDate(donation.date)}</td>
                    <td>
                      <span className={`badge ${donation.type === 'Monetary' ? 'badge-primary' : 'badge-secondary'}`}>
                        {donation.type}
                      </span>
                    </td>
                    <td>{donation.campaign}</td>
                    <td>
                      {donation.type === 'Monetary' 
                        ? formatCurrency(donation.amount!) 
                        : donation.items}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      </main>

      <footer className="text-center py-6 text-[var(--color-on-surface-variant)] text-sm">
        <p>Questions about your donations? Contact us at donations@pagasasanctuary.org</p>
      </footer>
    </div>
  )
}
