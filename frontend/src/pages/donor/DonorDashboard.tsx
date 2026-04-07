import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './DonorDashboard.css'

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
    <div className="donor-dashboard">
      <header className="donor-header">
        <div className="donor-header-content">
          <div>
            <h1>Welcome back, {user?.fullName?.split(' ')[0] || 'Donor'}</h1>
            <p>Thank you for your continued support of Pag-asa Sanctuary</p>
          </div>
          <Link to="/" className="back-link">Back to Home</Link>
        </div>
      </header>

      <main className="donor-main">
        {/* Summary Cards */}
        <section className="metrics-section">
          <div className="metrics-grid">
            <div className="metric-card primary">
              <span className="metric-value">{formatCurrency(mockMetrics.totalMonetary)}</span>
              <span className="metric-label">Total Monetary Donations</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{mockMetrics.totalDonations}</span>
              <span className="metric-label">Total Donations</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{mockMetrics.inKindItems}</span>
              <span className="metric-label">In-Kind Items Donated</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{mockMetrics.yearsSupporting}</span>
              <span className="metric-label">Years Supporting</span>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="impact-section">
          <div className="section-header">
            <h2>Your Impact</h2>
            <p>See how your generosity has made a difference</p>
          </div>
          <div className="impact-grid">
            {mockImpact.map((item, idx) => (
              <div key={idx} className="impact-card">
                <span className="impact-metric">{item.metric}</span>
                <span className="impact-description">{item.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Donation History */}
        <section className="history-section">
          <div className="section-header">
            <h2>Donation History</h2>
            <Link to="/donate" className="donate-button">Make a Donation</Link>
          </div>
          <div className="table-container">
            <table className="donations-table">
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
                      <span className={`type-badge ${donation.type.toLowerCase().replace('-', '')}`}>
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
                      <span className={`status-badge ${donation.status.toLowerCase()}`}>
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
        <section className="cta-section">
          <div className="cta-content">
            <h2>Continue Making a Difference</h2>
            <p>Your support helps provide safety, healing, and hope to survivors. Every contribution matters.</p>
            <div className="cta-buttons">
              <Link to="/donate" className="donate-button large">Donate Now</Link>
              <Link to="/impact" className="secondary-button">View Organization Impact</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="donor-footer">
        <p>Questions about your donations? Contact us at donations@pagasasanctuary.org</p>
      </footer>
    </div>
  )
}
