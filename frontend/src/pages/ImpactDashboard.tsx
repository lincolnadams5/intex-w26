import { useEffect, useState } from 'react'
import './ImpactDashboard.css'
import { Header } from '../components/Header'

interface ImpactSummary {
  totalMonetaryDonations: number
  totalDonationCount: number
  totalSupporters: number
  activeSupporters: number
  activeSafehouses: number
  totalCapacity: number
  currentOccupancy: number
  activePartners: number
  regionsServed: number
}

interface DonationsByType {
  donationType: string
  count: number
  totalValue: number
}

interface DonationsByMonth {
  year: number
  month: number
  count: number
  totalAmount: number
}

interface AllocationsByProgram {
  programArea: string
  totalAllocated: number
  allocationCount: number
}

interface SupportersByType {
  supporterType: string
  count: number
  activeCount: number
}

interface InKindByCategory {
  category: string
  totalItems: number
  estimatedValue: number
}

interface CampaignPerformance {
  campaignName: string
  donationCount: number
  totalRaised: number
  uniqueDonors: number
}

const API_BASE = '/api/publicimpact'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1] || ''
}

function formatSupporterType(type: string): string {
  const labels: Record<string, string> = {
    MonetaryDonor: 'Monetary Donors',
    InKindDonor: 'In-Kind Donors',
    Volunteer: 'Volunteers',
    SkillsContributor: 'Skills Contributors',
    SocialMediaAdvocate: 'Social Media Advocates',
    PartnerOrganization: 'Partner Organizations',
  }
  return labels[type] || type
}

function formatDonationType(type: string): string {
  const labels: Record<string, string> = {
    Monetary: 'Monetary',
    InKind: 'In-Kind',
    Time: 'Time',
    Skills: 'Skills',
    SocialMedia: 'Social Media',
  }
  return labels[type] || type
}

export function ImpactDashboard() {
  const [summary, setSummary] = useState<ImpactSummary | null>(null)
  const [donationsByType, setDonationsByType] = useState<DonationsByType[]>([])
  const [donationsByMonth, setDonationsByMonth] = useState<DonationsByMonth[]>([])
  const [allocationsByProgram, setAllocationsByProgram] = useState<AllocationsByProgram[]>([])
  const [supportersByType, setSupportersByType] = useState<SupportersByType[]>([])
  const [inKindByCategory, setInKindByCategory] = useState<InKindByCategory[]>([])
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [
          summaryRes,
          byTypeRes,
          byMonthRes,
          allocationsRes,
          supportersRes,
          inKindRes,
          campaignsRes,
        ] = await Promise.all([
          fetch(`${API_BASE}/summary`),
          fetch(`${API_BASE}/donations-by-type`),
          fetch(`${API_BASE}/donations-by-month`),
          fetch(`${API_BASE}/allocations-by-program`),
          fetch(`${API_BASE}/supporters-by-type`),
          fetch(`${API_BASE}/in-kind-by-category`),
          fetch(`${API_BASE}/campaign-performance`),
        ])

        if (!summaryRes.ok) throw new Error('Failed to fetch impact data')

        setSummary(await summaryRes.json())
        setDonationsByType(await byTypeRes.json())
        setDonationsByMonth(await byMonthRes.json())
        setAllocationsByProgram(await allocationsRes.json())
        setSupportersByType(await supportersRes.json())
        setInKindByCategory(await inKindRes.json())
        setCampaigns(await campaignsRes.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="impact-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading impact data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="impact-dashboard">
        <div className="error-container">
          <h2>Unable to load data</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const totalAllocated = allocationsByProgram.reduce((sum, a) => sum + a.totalAllocated, 0)
  const maxMonthlyAmount = Math.max(...donationsByMonth.map(d => d.totalAmount), 1)

  return (
    <div className="impact-dashboard">

      <Header />

      <header className="impact-header">
        <div className="impact-header-content">
          <a href="/" className="back-link">← Back to Home</a>
          <h1>Our Impact</h1>
          <p>
            Transparency matters. See how your support is making a difference in the lives 
            of survivors across the regions we serve.
          </p>
        </div>
      </header>

      <main className="impact-main">
        {summary && (
          <section className="summary-section">
            <div className="summary-grid">
              <div className="summary-card highlight">
                <span className="summary-value">{formatCurrency(summary.totalMonetaryDonations)}</span>
                <span className="summary-label">Total Donations Raised</span>
              </div>
              <div className="summary-card">
                <span className="summary-value">{formatNumber(summary.totalSupporters)}</span>
                <span className="summary-label">Total Supporters</span>
              </div>
              <div className="summary-card">
                <span className="summary-value">{summary.activeSafehouses}</span>
                <span className="summary-label">Active Safe Homes</span>
              </div>
              <div className="summary-card">
                <span className="summary-value">{summary.currentOccupancy}</span>
                <span className="summary-label">Residents Served</span>
              </div>
              <div className="summary-card">
                <span className="summary-value">{summary.activePartners}</span>
                <span className="summary-label">Active Partners</span>
              </div>
              <div className="summary-card">
                <span className="summary-value">{summary.regionsServed}</span>
                <span className="summary-label">Regions Served</span>
              </div>
            </div>
          </section>
        )}

        <div className="charts-grid">
          <section className="chart-section">
            <h2>Donations by Type</h2>
            <p className="chart-description">How supporters contribute to our mission</p>
            <div className="bar-chart">
              {donationsByType.map((item) => {
                const maxCount = Math.max(...donationsByType.map(d => d.count), 1)
                const percentage = (item.count / maxCount) * 100
                return (
                  <div key={item.donationType} className="bar-row">
                    <span className="bar-label">{formatDonationType(item.donationType)}</span>
                    <div className="bar-container">
                      <div className="bar" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="bar-value">{formatNumber(item.count)}</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="chart-section">
            <h2>Resource Allocation</h2>
            <p className="chart-description">How donations are distributed across programs</p>
            <div className="allocation-chart">
              {allocationsByProgram.map((item) => {
                const percentage = totalAllocated > 0 ? (item.totalAllocated / totalAllocated) * 100 : 0
                return (
                  <div key={item.programArea} className="allocation-row">
                    <div className="allocation-info">
                      <span className="allocation-label">{item.programArea}</span>
                      <span className="allocation-value">{formatCurrency(item.totalAllocated)}</span>
                    </div>
                    <div className="allocation-bar-container">
                      <div 
                        className="allocation-bar" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="allocation-percent">{percentage.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="chart-section">
            <h2>Our Supporter Community</h2>
            <p className="chart-description">The diverse ways people support our work</p>
            <div className="supporters-grid">
              {supportersByType.map((item) => (
                <div key={item.supporterType} className="supporter-card">
                  <span className="supporter-count">{formatNumber(item.count)}</span>
                  <span className="supporter-type">{formatSupporterType(item.supporterType)}</span>
                  <span className="supporter-active">{item.activeCount} active</span>
                </div>
              ))}
            </div>
          </section>

          <section className="chart-section">
            <h2>In-Kind Donations</h2>
            <p className="chart-description">Physical goods donated to support our residents</p>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Items</th>
                    <th>Est. Value</th>
                  </tr>
                </thead>
                <tbody>
                  {inKindByCategory.map((item) => (
                    <tr key={item.category}>
                      <td>{item.category}</td>
                      <td>{formatNumber(item.totalItems)}</td>
                      <td>{formatCurrency(item.estimatedValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="chart-section wide">
            <h2>Monthly Donation Trends</h2>
            <p className="chart-description">Tracking our fundraising progress over time</p>
            <div className="timeline-chart">
              {donationsByMonth.slice(-12).map((item) => {
                const heightPercent = (item.totalAmount / maxMonthlyAmount) * 100
                return (
                  <div key={`${item.year}-${item.month}`} className="timeline-bar-wrapper">
                    <div className="timeline-bar-container">
                      <div 
                        className="timeline-bar" 
                        style={{ height: `${heightPercent}%` }}
                        title={`${formatCurrency(item.totalAmount)} (${item.count} donations)`}
                      ></div>
                    </div>
                    <span className="timeline-label">{getMonthName(item.month)}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {campaigns.length > 0 && (
            <section className="chart-section wide">
              <h2>Campaign Performance</h2>
              <p className="chart-description">Results from our fundraising campaigns</p>
              <div className="campaigns-grid">
                {campaigns.map((campaign) => (
                  <div key={campaign.campaignName} className="campaign-card">
                    <h3>{campaign.campaignName}</h3>
                    <div className="campaign-stats">
                      <div className="campaign-stat">
                        <span className="campaign-stat-value">{formatCurrency(campaign.totalRaised)}</span>
                        <span className="campaign-stat-label">Raised</span>
                      </div>
                      <div className="campaign-stat">
                        <span className="campaign-stat-value">{campaign.uniqueDonors}</span>
                        <span className="campaign-stat-label">Donors</span>
                      </div>
                      <div className="campaign-stat">
                        <span className="campaign-stat-value">{campaign.donationCount}</span>
                        <span className="campaign-stat-label">Donations</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <section className="cta-section">
          <div className="cta-content">
            <h2>Join Our Mission</h2>
            <p>
              Every contribution, big or small, helps us provide safety, healing, and hope 
              to survivors of abuse and trafficking.
            </p>
            <div className="cta-actions">
              <a href="/" className="btn btn-primary btn-large">Donate Now</a>
              <a href="/" className="btn btn-outline-light btn-large">Learn More</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="impact-footer">
        <p>Data updated in real-time. All figures represent aggregated, anonymized information.</p>
        <p>© 2026 Pag-asa Sanctuary. A 501(c)(3) nonprofit organization.</p>
      </footer>
    </div>
  )
}

export default ImpactDashboard
