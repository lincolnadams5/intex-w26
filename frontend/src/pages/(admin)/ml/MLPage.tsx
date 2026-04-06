import { useState } from 'react'

// ─── Mock data — replace with API calls once backend is ready ─────────────────
// GET /api/ml/donor-churn-risk
const churnRiskData = [
  { id: 1, donor: 'Roberto Reyes', lastDonation: '2025-09-12', totalGiven: '₱48,000', riskScore: 0.91, label: 'Very High Risk' },
  { id: 2, donor: 'Anna Villanueva', lastDonation: '2025-10-30', totalGiven: '₱22,500', riskScore: 0.78, label: 'High Risk' },
  { id: 3, donor: 'Pacific Resources Corp.', lastDonation: '2025-11-14', totalGiven: '₱120,000', riskScore: 0.74, label: 'High Risk' },
  { id: 4, donor: 'Elena Castillo', lastDonation: '2025-12-01', totalGiven: '₱15,200', riskScore: 0.61, label: 'Moderate Risk' },
  { id: 5, donor: 'Marcos Bautista', lastDonation: '2025-12-18', totalGiven: '₱8,400', riskScore: 0.55, label: 'Moderate Risk' },
  { id: 6, donor: 'Sunrise Foundation', lastDonation: '2026-01-07', totalGiven: '₱74,000', riskScore: 0.48, label: 'Moderate Risk' },
  { id: 7, donor: 'Cora Mendoza', lastDonation: '2026-01-22', totalGiven: '₱5,600', riskScore: 0.41, label: 'Low-Moderate Risk' },
  { id: 8, donor: 'BDO Foundation', lastDonation: '2026-02-03', totalGiven: '₱200,000', riskScore: 0.37, label: 'Low-Moderate Risk' },
]

// GET /api/ml/reintegration-readiness
const reintegrationData = [
  { id: 1, code: 'RES-2024-007', safehouse: 'Manila', score: 0.92, label: 'Ready for Reintegration', type: 'Family Reunification' },
  { id: 2, code: 'RES-2024-022', safehouse: 'Cebu', score: 0.87, label: 'Ready for Reintegration', type: 'Independent Living' },
  { id: 3, code: 'RES-2023-058', safehouse: 'Davao', score: 0.79, label: 'Likely Ready (3–6 Months)', type: 'Foster Care' },
  { id: 4, code: 'RES-2024-034', safehouse: 'Manila', score: 0.71, label: 'Likely Ready (3–6 Months)', type: 'Family Reunification' },
  { id: 5, code: 'RES-2025-003', safehouse: 'Iloilo', score: 0.62, label: 'Progressing — Not Yet Ready', type: 'TBD' },
  { id: 6, code: 'RES-2024-049', safehouse: 'Cebu', score: 0.44, label: 'Needs More Support', type: 'TBD' },
]

type RoiResult = { engagementRate: string; estimatedDonations: string; confidence: string } | null

const MOCK_ROI: Record<string, Record<string, RoiResult>> = {
  Instagram: {
    Testimonial: { engagementRate: '7.8%', estimatedDonations: '₱38,200', confidence: 'High' },
    'Impact Story': { engagementRate: '7.1%', estimatedDonations: '₱32,500', confidence: 'High' },
    Fundraising: { engagementRate: '5.4%', estimatedDonations: '₱24,100', confidence: 'Medium' },
    Educational: { engagementRate: '4.2%', estimatedDonations: '₱14,800', confidence: 'Medium' },
    Event: { engagementRate: '3.9%', estimatedDonations: '₱11,400', confidence: 'Low' },
  },
  Facebook: {
    Testimonial: { engagementRate: '5.9%', estimatedDonations: '₱28,700', confidence: 'High' },
    'Impact Story': { engagementRate: '5.3%', estimatedDonations: '₱23,900', confidence: 'High' },
    Fundraising: { engagementRate: '4.1%', estimatedDonations: '₱19,200', confidence: 'Medium' },
    Educational: { engagementRate: '3.6%', estimatedDonations: '₱12,300', confidence: 'Low' },
    Event: { engagementRate: '3.2%', estimatedDonations: '₱9,800', confidence: 'Low' },
  },
  'Twitter/X': {
    Testimonial: { engagementRate: '2.8%', estimatedDonations: '₱9,100', confidence: 'Low' },
    'Impact Story': { engagementRate: '2.4%', estimatedDonations: '₱7,600', confidence: 'Low' },
    Fundraising: { engagementRate: '2.1%', estimatedDonations: '₱6,800', confidence: 'Low' },
    Educational: { engagementRate: '1.9%', estimatedDonations: '₱4,200', confidence: 'Very Low' },
    Event: { engagementRate: '3.1%', estimatedDonations: '₱8,200', confidence: 'Low' },
  },
  YouTube: {
    Testimonial: { engagementRate: '4.2%', estimatedDonations: '₱18,600', confidence: 'Medium' },
    'Impact Story': { engagementRate: '3.9%', estimatedDonations: '₱16,100', confidence: 'Medium' },
    Fundraising: { engagementRate: '3.1%', estimatedDonations: '₱12,400', confidence: 'Low' },
    Educational: { engagementRate: '2.8%', estimatedDonations: '₱9,700', confidence: 'Low' },
    Event: { engagementRate: '2.2%', estimatedDonations: '₱6,300', confidence: 'Very Low' },
  },
}

function riskScoreBar(score: number) {
  const pct = Math.round(score * 100)
  const color = score >= 0.75 ? '#ef4444' : score >= 0.5 ? '#f97316' : '#eab308'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 rounded-full bg-[var(--border)] overflow-hidden flex-shrink-0">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{pct}%</span>
    </div>
  )
}

function readinessBadge(score: number) {
  if (score >= 0.85) return 'bg-green-100 text-green-700'
  if (score >= 0.70) return 'bg-[#2D9F8C]/10 text-[#2D9F8C]'
  if (score >= 0.55) return 'bg-amber-100 text-amber-700'
  return 'bg-[#DB7981]/10 text-[#DB7981]'
}

function confidenceBadge(c: string) {
  if (c === 'High') return 'badge-success'
  if (c === 'Medium') return 'badge-warning'
  return 'badge-error'
}

export function MLPage() {
  const [platform, setPlatform] = useState('Instagram')
  const [postType, setPostType] = useState('Testimonial')
  const [roiResult, setRoiResult] = useState<RoiResult>(null)
  const [predicting, setPredicting] = useState(false)

  function handlePredict() {
    setPredicting(true)
    setRoiResult(null)
    // Simulate API latency: POST /api/ml/social-roi-predict
    setTimeout(() => {
      const result = MOCK_ROI[platform]?.[postType] ?? null
      setRoiResult(result)
      setPredicting(false)
    }, 900)
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <div>
        <h2 className="text-[var(--text-h)]">ML Insights</h2>
        <p className="text-sm text-[var(--text)] mt-1">
          Predictive models help identify donors at risk of lapsing, residents ready for reintegration,
          and social media posts most likely to drive donations. Results shown with mock data — live endpoints
          will be connected once pipelines are finalized.
        </p>
      </div>

      {/* Donor Churn Risk */}
      <div className="card">
        <div className="flex items-start gap-3 mb-1">
          <span className="text-2xl">📉</span>
          <div>
            <h3 className="text-[var(--text-h)]">Donor Churn Risk</h3>
            <p className="text-xs text-[var(--text)] mt-0.5">
              Donors predicted to lapse within 90 days, sorted by urgency. A score of 100% means
              the model is highly confident this donor will stop giving without outreach.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[var(--bg-alt)] rounded-lg border border-[var(--border)] text-xs text-[var(--text)] mb-4">
          <strong className="text-[var(--text-h)]">How to act on this:</strong> Prioritize personal outreach
          (call or handwritten note) for donors above 75%. Send automated email sequences to donors in the
          40–75% range. Review last interaction date for patterns.
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Last Donation</th>
                <th>Total Given</th>
                <th>Churn Risk</th>
                <th>Assessment</th>
              </tr>
            </thead>
            <tbody>
              {churnRiskData.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium text-[var(--text-h)]">{d.donor}</td>
                  <td className="text-[var(--text)] text-xs">{d.lastDonation}</td>
                  <td className="font-medium">{d.totalGiven}</td>
                  <td>{riskScoreBar(d.riskScore)}</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      d.riskScore >= 0.75 ? 'bg-[#DB7981]/10 text-[#DB7981]' :
                      d.riskScore >= 0.5 ? 'bg-orange-100 text-orange-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {d.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reintegration Readiness */}
      <div className="card">
        <div className="flex items-start gap-3 mb-1">
          <span className="text-2xl">🌱</span>
          <div>
            <h3 className="text-[var(--text-h)]">Resident Reintegration Readiness</h3>
            <p className="text-xs text-[var(--text)] mt-0.5">
              Predicted readiness for leaving the safehouse, based on education progress, health scores,
              counseling session history, and risk trajectory. Higher scores indicate greater readiness.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[var(--bg-alt)] rounded-lg border border-[var(--border)] text-xs text-[var(--text)] mb-4">
          <strong className="text-[var(--text-h)]">How to act on this:</strong> Residents with scores
          above 85% should be discussed at the next case conference for a transition plan. Scores between
          60–85% indicate focused intervention could accelerate readiness. Below 60% — continue current support.
        </div>

        <div className="flex flex-col gap-3">
          {reintegrationData.map((r) => {
            const pct = Math.round(r.score * 100)
            return (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-alt)]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[var(--text-h)] text-sm">{r.code}</span>
                    <span className="text-xs text-[var(--text)]">{r.safehouse}</span>
                    <span className="text-xs text-[var(--text)]">·</span>
                    <span className="text-xs text-[var(--text)]">Target: {r.type}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: r.score >= 0.85 ? '#22c55e' : r.score >= 0.70 ? '#0d9488' : r.score >= 0.55 ? '#eab308' : '#ef4444' }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[var(--text-h)] w-10 text-right">{pct}%</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${readinessBadge(r.score)}`}>
                  {r.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Social Media ROI Predictor */}
      <div className="card">
        <div className="flex items-start gap-3 mb-1">
          <span className="text-2xl">📡</span>
          <div>
            <h3 className="text-[var(--text-h)]">Social Media ROI Predictor</h3>
            <p className="text-xs text-[var(--text)] mt-0.5">
              Given a platform and content type, this model predicts estimated engagement rate and
              donation referral value. Use it to plan your next post for maximum impact.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group !mb-0">
            <label htmlFor="platform">Platform</label>
            <select id="platform" value={platform} onChange={(e) => { setPlatform(e.target.value); setRoiResult(null) }}>
              <option>Instagram</option>
              <option>Facebook</option>
              <option>Twitter/X</option>
              <option>YouTube</option>
            </select>
          </div>
          <div className="form-group !mb-0">
            <label htmlFor="postType">Post Type</label>
            <select id="postType" value={postType} onChange={(e) => { setPostType(e.target.value); setRoiResult(null) }}>
              <option>Testimonial</option>
              <option>Impact Story</option>
              <option>Fundraising</option>
              <option>Educational</option>
              <option>Event</option>
            </select>
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={predicting}
          className="btn btn-primary mt-4"
        >
          {predicting ? (
            <span className="flex items-center gap-2">
              <span className="loading-spinner w-4 h-4 border-2" />
              Predicting…
            </span>
          ) : (
            'Predict ROI'
          )}
        </button>

        {roiResult && (
          <div className="mt-5 p-4 rounded-xl border-2 border-[var(--accent-border)] bg-[var(--accent-bg)]">
            <p className="text-sm font-semibold text-[var(--accent)] mb-3">
              Prediction: {platform} · {postType}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[var(--text)] mb-1">Est. Engagement Rate</p>
                <p className="text-2xl font-bold text-[var(--text-h)]">{roiResult.engagementRate}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text)] mb-1">Est. Donation Value</p>
                <p className="text-2xl font-bold text-[var(--accent)]">{roiResult.estimatedDonations}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text)] mb-1">Model Confidence</p>
                <span className={`badge ${confidenceBadge(roiResult.confidence)} text-sm font-semibold`}>
                  {roiResult.confidence}
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--text)] mt-3">
              Results are mock predictions — wire <code>POST /api/ml/social-roi-predict</code> once the pipeline is ready.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
