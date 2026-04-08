import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-[var(--on-surface-variant)]">Loading impact data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4">Unable to load data</h2>
          <p className="text-[var(--on-surface-variant)] mb-6">{error}</p>
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
    <div className="min-h-screen bg-[var(--surface)]">
      <Header />

      {/* Hero Header */}
      <header className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Link to="/" className="inline-block text-white/70 hover:text-white text-sm mb-6 transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-white mb-4">Our Impact</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
            Transparency matters. See how your support is making a difference in the lives 
            of survivors across the regions we serve.
          </p>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Summary Cards */}
        {summary && (
          <section className="mb-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="col-span-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-white rounded-xl p-6">
                <span className="block text-3xl font-bold font-[family-name:var(--font-display)]">{formatCurrency(summary.totalMonetaryDonations)}</span>
                <span className="text-white/80 text-sm">Total Donations Raised</span>
              </div>
              <div className="bg-[var(--surface-container-lowest)] rounded-xl p-5 shadow-[var(--shadow-ambient)]">
                <span className="block text-2xl font-bold text-[var(--primary)] font-[family-name:var(--font-display)]">{formatNumber(summary.totalSupporters)}</span>
                <span className="text-[var(--on-surface-variant)] text-sm">Total Supporters</span>
              </div>
              <div className="bg-[var(--surface-container-lowest)] rounded-xl p-5 shadow-[var(--shadow-ambient)]">
                <span className="block text-2xl font-bold text-[var(--primary)] font-[family-name:var(--font-display)]">{summary.activeSafehouses}</span>
                <span className="text-[var(--on-surface-variant)] text-sm">Active Safe Homes</span>
              </div>
              <div className="bg-[var(--surface-container-lowest)] rounded-xl p-5 shadow-[var(--shadow-ambient)]">
                <span className="block text-2xl font-bold text-[var(--primary)] font-[family-name:var(--font-display)]">{summary.currentOccupancy}</span>
                <span className="text-[var(--on-surface-variant)] text-sm">Residents Served</span>
              </div>
              <div className="bg-[var(--surface-container-lowest)] rounded-xl p-5 shadow-[var(--shadow-ambient)]">
                <span className="block text-2xl font-bold text-[var(--primary)] font-[family-name:var(--font-display)]">{summary.regionsServed}</span>
                <span className="text-[var(--on-surface-variant)] text-sm">Regions Served</span>
              </div>
            </div>
          </section>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Donations by Type */}
          <section className="bg-[var(--surface-container-lowest)] rounded-xl p-6 shadow-[var(--shadow-ambient)]">
            <div className="horizon-line"></div>
            <h3 className="mb-1">Donations by Type</h3>
            <p className="text-[var(--on-surface-variant)] text-sm mb-6">How supporters contribute to our mission</p>
            <div className="flex flex-col gap-4">
              {donationsByType.map((item) => {
                const maxCount = Math.max(...donationsByType.map(d => d.count), 1)
                const percentage = (item.count / maxCount) * 100
                return (
                  <div key={item.donationType} className="flex items-center gap-4">
                    <span className="w-24 text-sm text-[var(--on-surface-variant)] shrink-0">{formatDonationType(item.donationType)}</span>
                    <div className="flex-1 h-6 bg-[var(--surface-container-high)] rounded overflow-hidden">
                      <div className="h-full bg-[var(--primary)] rounded transition-all" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-12 text-sm font-semibold text-right">{formatNumber(item.count)}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Resource Allocation */}
          <section className="bg-[var(--surface-container-lowest)] rounded-xl p-6 shadow-[var(--shadow-ambient)]">
            <div className="horizon-line"></div>
            <h3 className="mb-1">Resource Allocation</h3>
            <p className="text-[var(--on-surface-variant)] text-sm mb-6">How donations are distributed across programs</p>
            <div className="flex flex-col gap-4">
              {allocationsByProgram.map((item) => {
                const percentage = totalAllocated > 0 ? (item.totalAllocated / totalAllocated) * 100 : 0
                return (
                  <div key={item.programArea}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-[var(--on-surface)]">{item.programArea}</span>
                      <span className="text-sm font-semibold">{formatCurrency(item.totalAllocated)}</span>
                    </div>
                    <div className="h-3 bg-[var(--surface-container-high)] rounded overflow-hidden">
                      <div className="h-full bg-[var(--secondary)] rounded transition-all" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="text-xs text-[var(--on-surface-variant)]">{percentage.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Supporter Community */}
          <section className="bg-[var(--surface-container-lowest)] rounded-xl p-6 shadow-[var(--shadow-ambient)]">
            <div className="horizon-line"></div>
            <h3 className="mb-1">Our Supporter Community</h3>
            <p className="text-[var(--on-surface-variant)] text-sm mb-6">The diverse ways people support our work</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {supportersByType.map((item) => (
                <div key={item.supporterType} className="bg-[var(--surface-container-low)] rounded-lg p-4 text-center">
                  <span className="block text-2xl font-bold text-[var(--primary)]">{formatNumber(item.count)}</span>
                  <span className="block text-xs text-[var(--on-surface)] mt-1">{formatSupporterType(item.supporterType)}</span>
                  <span className="block text-xs text-[var(--on-surface-variant)] mt-1">{item.activeCount} active</span>
                </div>
              ))}
            </div>
          </section>

          {/* In-Kind Donations */}
          <section className="bg-[var(--surface-container-lowest)] rounded-xl p-6 shadow-[var(--shadow-ambient)]">
            <div className="horizon-line"></div>
            <h3 className="mb-1">In-Kind Donations</h3>
            <p className="text-[var(--on-surface-variant)] text-sm mb-6">Physical goods donated to support our residents</p>
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
        </div>

        {/* Monthly Trends - Full Width */}
        <section className="bg-[var(--surface-container-lowest)] rounded-xl p-6 shadow-[var(--shadow-ambient)] mb-8">
          <div className="horizon-line"></div>
          <h3 className="mb-1">Monthly Donation Trends</h3>
          <p className="text-[var(--on-surface-variant)] text-sm mb-6">Tracking our fundraising progress over time</p>
          <div className="flex items-end justify-between gap-2 h-48">
            {donationsByMonth.slice(-12).map((item) => {
              const heightPercent = (item.totalAmount / maxMonthlyAmount) * 100
              return (
                <div key={`${item.year}-${item.month}`} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full h-40 flex items-end">
                    <div 
                      className="w-full bg-gradient-to-t from-[var(--primary)] to-[var(--primary-container)] rounded-t transition-all hover:opacity-80"
                      style={{ height: `${heightPercent}%` }}
                      title={`${formatCurrency(item.totalAmount)} (${item.count} donations)`}
                    ></div>
                  </div>
                  <span className="text-xs text-[var(--on-surface-variant)]">{getMonthName(item.month)}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Campaigns */}
        {campaigns.length > 0 && (
          <section className="bg-[var(--surface-container-lowest)] rounded-xl p-6 shadow-[var(--shadow-ambient)] mb-12">
            <div className="horizon-line"></div>
            <h3 className="mb-1">Campaign Performance</h3>
            <p className="text-[var(--on-surface-variant)] text-sm mb-6">Results from our fundraising campaigns</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {campaigns.map((campaign) => (
                <div key={campaign.campaignName} className="bg-[var(--surface-container-low)] rounded-lg p-5">
                  <h4 className="text-base mb-4">{campaign.campaignName}</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="block text-lg font-bold text-[var(--primary)]">{formatCurrency(campaign.totalRaised)}</span>
                      <span className="text-xs text-[var(--on-surface-variant)]">Raised</span>
                    </div>
                    <div>
                      <span className="block text-lg font-bold text-[var(--on-surface)]">{campaign.uniqueDonors}</span>
                      <span className="text-xs text-[var(--on-surface-variant)]">Donors</span>
                    </div>
                    <div>
                      <span className="block text-lg font-bold text-[var(--on-surface)]">{campaign.donationCount}</span>
                      <span className="text-xs text-[var(--on-surface-variant)]">Gifts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-white rounded-xl p-10 text-center">
          <h2 className="text-white mb-3">Join Our Mission</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Every contribution, big or small, helps us provide safety, healing, and hope 
            to survivors of abuse and trafficking.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/donate" className="btn btn-large bg-white text-[var(--primary)] hover:bg-white/90">Donate Now</Link>
            <Link to="/" className="btn btn-outline-light btn-large">Learn More</Link>
          </div>
        </section>
      </main>

      <footer className="text-center py-8 text-[var(--on-surface-variant)] text-sm">
        <p className="mb-1">Data updated in real-time. All figures represent aggregated, anonymized information.</p>
        <p>© 2026 Pag-asa Sanctuary. A 501(c)(3) nonprofit organization.</p>
      </footer>
    </div>
  )
}

export default ImpactDashboard
