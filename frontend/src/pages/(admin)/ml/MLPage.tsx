import { useEffect, useState } from 'react'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import {
  getDonorRiskScores,
  markDonorContacted,
  type DonorRiskScore,
} from '../../../lib/adminApi'

function riskLabel(score: number) {
  if (score >= 0.75) return 'Very High Risk'
  if (score >= 0.60) return 'High Risk'
  if (score >= 0.40) return 'Moderate Risk'
  return 'Low Risk'
}

// Section 2 — Resident Reintegration Readiness
// Endpoint: GET /api/ml/reintegration-readiness
// Features: education progress %, general health score, process recording frequency,
//           emotional trajectory, length_of_stay, current_risk_level
const MOCK_REINTEGRATION = [
  { code: 'RES-2024-007', safehouse: 'Manila', score: 0.92, label: 'Ready for Reintegration',    type: 'Family Reunification' },
  { code: 'RES-2024-022', safehouse: 'Cebu',   score: 0.87, label: 'Ready for Reintegration',    type: 'Independent Living' },
  { code: 'RES-2023-058', safehouse: 'Davao',  score: 0.79, label: 'Likely Ready (3–6 Months)',  type: 'Foster Care' },
  { code: 'RES-2024-034', safehouse: 'Manila', score: 0.71, label: 'Likely Ready (3–6 Months)',  type: 'Family Reunification' },
  { code: 'RES-2025-003', safehouse: 'Iloilo', score: 0.62, label: 'Progressing — Not Yet Ready', type: 'TBD' },
  { code: 'RES-2024-049', safehouse: 'Cebu',   score: 0.44, label: 'Needs More Support',          type: 'TBD' },
]

// Section 3 — Social Media ROI Predictor
// Endpoint: POST /api/ml/social-roi-predict
// Features: platform, post_type, media_type, content_topic, day_of_week, post_hour, has_call_to_action
type RoiResult = { engagementRate: string; estimatedDonations: string; confidence: string } | null

const MOCK_ROI: Record<string, Record<string, RoiResult>> = {
  Instagram: {
    Testimonial:  { engagementRate: '7.8%', estimatedDonations: '₱38,200', confidence: 'High' },
    'Impact Story': { engagementRate: '7.1%', estimatedDonations: '₱32,500', confidence: 'High' },
    Fundraising:  { engagementRate: '5.4%', estimatedDonations: '₱24,100', confidence: 'Medium' },
    Educational:  { engagementRate: '4.2%', estimatedDonations: '₱14,800', confidence: 'Medium' },
    Event:        { engagementRate: '3.9%', estimatedDonations: '₱11,400', confidence: 'Low' },
  },
  Facebook: {
    Testimonial:  { engagementRate: '5.9%', estimatedDonations: '₱28,700', confidence: 'High' },
    'Impact Story': { engagementRate: '5.3%', estimatedDonations: '₱23,900', confidence: 'High' },
    Fundraising:  { engagementRate: '4.1%', estimatedDonations: '₱19,200', confidence: 'Medium' },
    Educational:  { engagementRate: '3.6%', estimatedDonations: '₱12,300', confidence: 'Low' },
    Event:        { engagementRate: '3.2%', estimatedDonations: '₱9,800',  confidence: 'Low' },
  },
  'Twitter/X': {
    Testimonial:  { engagementRate: '2.8%', estimatedDonations: '₱9,100', confidence: 'Low' },
    'Impact Story': { engagementRate: '2.4%', estimatedDonations: '₱7,600', confidence: 'Low' },
    Fundraising:  { engagementRate: '2.1%', estimatedDonations: '₱6,800', confidence: 'Low' },
    Educational:  { engagementRate: '1.9%', estimatedDonations: '₱4,200', confidence: 'Very Low' },
    Event:        { engagementRate: '3.1%', estimatedDonations: '₱8,200', confidence: 'Low' },
  },
  YouTube: {
    Testimonial:  { engagementRate: '4.2%', estimatedDonations: '₱18,600', confidence: 'Medium' },
    'Impact Story': { engagementRate: '3.9%', estimatedDonations: '₱16,100', confidence: 'Medium' },
    Fundraising:  { engagementRate: '3.1%', estimatedDonations: '₱12,400', confidence: 'Low' },
    Educational:  { engagementRate: '2.8%', estimatedDonations: '₱9,700',  confidence: 'Low' },
    Event:        { engagementRate: '2.2%', estimatedDonations: '₱6,300',  confidence: 'Very Low' },
  },
}

// ── Helper components ─────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct   = Math.round(score * 100)
  const color = score >= 0.75 ? '#ef4444' : score >= 0.5 ? '#f97316' : '#eab308'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 rounded-full bg-[var(--color-outline-variant)] overflow-hidden flex-shrink-0">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{pct}%</span>
    </div>
  )
}

function churnBadgeClass(score: number) {
  if (score >= 0.75) return 'bg-[#DB7981]/10 text-[#DB7981]'
  if (score >= 0.5)  return 'bg-orange-100 text-orange-700'
  return 'bg-amber-100 text-amber-700'
}

function readinessBadgeClass(score: number) {
  if (score >= 0.85) return 'bg-green-100 text-green-700'
  if (score >= 0.70) return 'bg-[#2D9F8C]/10 text-[#2D9F8C]'
  if (score >= 0.55) return 'bg-amber-100 text-amber-700'
  return 'bg-[#DB7981]/10 text-[#DB7981]'
}

function confidenceBadgeClass(c: string) {
  if (c === 'High')   return 'badge-success'
  if (c === 'Medium') return 'badge-warning'
  return 'badge-error'
}

export function MLPage() {
  const [riskScores, setRiskScores]   = useState<DonorRiskScore[]>([])
  const [riskLoading, setRiskLoading] = useState(true)
  const [riskError, setRiskError]     = useState<string | null>(null)
  const [contacting, setContacting]   = useState<number | null>(null)

  useEffect(() => {
    getDonorRiskScores()
      .then(setRiskScores)
      .catch(() => setRiskError('Failed to load risk scores.'))
      .finally(() => setRiskLoading(false))
  }, [])

  async function handleMarkContacted(supporterId: number) {
    setContacting(supporterId)
    await markDonorContacted(supporterId)
    setRiskScores(prev =>
      prev.map(d =>
        d.supporterId === supporterId
          ? { ...d, contactedAt: new Date().toISOString() }
          : d
      )
    )
    setContacting(null)
  }

  const [platform, setPlatform]   = useState('Instagram')
  const [postType, setPostType]   = useState('Testimonial')
  const [roiResult, setRoiResult] = useState<RoiResult>(null)
  const [predicting, setPredicting] = useState(false)

  // Simulate API call: POST /api/ml/social-roi-predict
  function handlePredict() {
    setPredicting(true)
    setRoiResult(null)
    setTimeout(() => {
      setRoiResult(MOCK_ROI[platform]?.[postType] ?? null)
      setPredicting(false)
    }, 800)
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="ML Insights"
        subtitle="Predictive models for donor retention, reintegration readiness, and social media ROI. Results shown with placeholder data — live endpoints will be connected once ML pipelines are finalized."
      />

      {/* ── Section 1: Donor Churn Risk ──────────────────────────────────────── */}
      <SectionCard
        title="Donor Churn Risk Prediction"
        subtitle="Donors predicted to lapse within 90 days, sorted by urgency. A score of 100% means the model is highly confident this donor will stop giving without outreach."
        titleIcon="📉"
      >
        {riskScores.length > 0 && (() => {
          const latest = riskScores.reduce((max, d) => d.scoredAt && (!max || d.scoredAt > max) ? d.scoredAt : max, null as string | null)
          return latest
            ? <p className="text-xs text-[var(--text-muted)] mb-3">Last updated {new Date(latest).toLocaleDateString()}</p>
            : null
        })()}

        {/* Action guidance */}
        <div className="p-3 bg-[var(--color-surface-container-low)] rounded-lg border border-[var(--color-outline-variant)] text-xs text-[var(--color-on-surface-variant)] mb-4">
          <strong className="text-[var(--color-on-surface)]">How to act on this: </strong>
          Prioritize personal outreach (call or handwritten note) for donors above 75%.
          Send automated email sequences to donors in the 40–75% range.
        </div>

        {riskLoading && (
          <p className="text-sm text-[var(--text)] py-4">Loading risk scores…</p>
        )}
        {riskError && (
          <p className="text-sm text-[var(--alert)] py-4">{riskError}</p>
        )}
        {!riskLoading && !riskError && riskScores.length === 0 && (
          <p className="text-sm text-[var(--text)] py-4">
            No scores available. Run <code>python -m jobs.run_inference</code> to populate donor risk scores.
          </p>
        )}
        {!riskLoading && !riskError && riskScores.length > 0 && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Total Given</th>
                  <th>Churn Risk</th>
                  <th>Assessment</th>
                  <th>Outreach</th>
                </tr>
              </thead>
              <tbody>
                {riskScores.map(d => (
                  <tr key={d.supporterId} className={d.contactedAt ? 'opacity-50' : ''}>
                    <td className="font-medium text-[var(--text-h)]">{d.donorName}</td>
                    <td className="font-medium">₱{d.totalGiven.toLocaleString()}</td>
                    <td><ScoreBar score={d.riskScore} /></td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${churnBadgeClass(d.riskScore)}`}>
                        {riskLabel(d.riskScore)}
                      </span>
                    </td>
                    <td>
                      {d.contactedAt ? (
                        <span className="text-xs text-[var(--text)]">
                          Contacted {d.contactedAt.split('T')[0]}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkContacted(d.supporterId)}
                          disabled={contacting === d.supporterId}
                          className="btn btn-sm text-xs px-2 py-1"
                        >
                          {contacting === d.supporterId ? 'Saving…' : 'Mark Contacted'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Section 2: Resident Reintegration Readiness ──────────────────────── */}
      <SectionCard
        title="Resident Reintegration Readiness"
        subtitle="Predicted readiness for leaving the safehouse, based on education progress, health scores, counseling history, and risk trajectory."
        titleIcon="🌱"
      >
        {/* Action guidance */}
        <div className="p-3 bg-[var(--color-surface-container-low)] rounded-lg border border-[var(--color-outline-variant)] text-xs text-[var(--color-on-surface-variant)] mb-4">
          <strong className="text-[var(--color-on-surface)]">How to act on this: </strong>
          Residents above 85% should be discussed at the next case conference for a transition plan.
          Scores between 60–85% indicate focused intervention could accelerate readiness.
        </div>

        <div className="flex flex-col gap-3">
          {MOCK_REINTEGRATION.map(r => {
            const pct = Math.round(r.score * 100)
            return (
              <div
                key={r.code}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]"
              >
                <div className="flex-1 min-w-0">
                  {/* Resident header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[var(--color-on-surface)] text-sm">{r.code}</span>
                    <span className="text-xs text-[var(--color-on-surface-variant)]">{r.safehouse}</span>
                    <span className="text-xs text-[var(--color-on-surface-variant)]">· Target: {r.type}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2.5 rounded-full bg-[var(--color-outline-variant)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: r.score >= 0.85 ? '#22c55e'
                            : r.score >= 0.70 ? '#0d9488'
                            : r.score >= 0.55 ? '#eab308'
                            : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[var(--color-on-surface)] w-10 text-right">{pct}%</span>
                  </div>
                </div>
                {/* Readiness badge */}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${readinessBadgeClass(r.score)}`}>
                  {r.label}
                </span>
              </div>
            )
          })}
        </div>
      </SectionCard>

      {/* ── Section 3: Social Media ROI Predictor ────────────────────────────── */}
      <SectionCard
        title="Social Media ROI Predictor"
        subtitle="Select a platform and content type to predict estimated engagement and donation referral value."
        titleIcon="📡"
      >
        {/* Input selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="form-group !mb-0">
            <label htmlFor="ml-platform">Platform</label>
            <select
              id="ml-platform"
              value={platform}
              onChange={e => { setPlatform(e.target.value); setRoiResult(null) }}
            >
              <option>Instagram</option>
              <option>Facebook</option>
              <option>Twitter/X</option>
              <option>YouTube</option>
            </select>
          </div>
          <div className="form-group !mb-0">
            <label htmlFor="ml-post-type">Post Type</label>
            <select
              id="ml-post-type"
              value={postType}
              onChange={e => { setPostType(e.target.value); setRoiResult(null) }}
            >
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
          ) : 'Predict ROI'}
        </button>

        {/* Prediction result */}
        {roiResult && (
          <div className="mt-5 p-4 rounded-xl border-2 border-[var(--color-outline-variant)] bg-[rgba(0, 76, 90, 0.08)]">
            <p className="text-sm font-semibold text-[var(--color-primary)] mb-3">
              Prediction: {platform} · {postType}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Est. Engagement Rate</p>
                <p className="text-2xl font-bold text-[var(--color-on-surface)]">{roiResult.engagementRate}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Est. Donation Value</p>
                <p className="text-2xl font-bold text-[var(--color-primary)]">{roiResult.estimatedDonations}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Model Confidence</p>
                <span className={`badge ${confidenceBadgeClass(roiResult.confidence)} text-sm font-semibold`}>
                  {roiResult.confidence}
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-3">
              Placeholder predictions — wire <code>POST /api/ml/social-roi-predict</code> once the pipeline is ready.
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
