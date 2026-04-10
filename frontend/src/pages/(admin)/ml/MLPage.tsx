import { useEffect, useState } from 'react'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import {
  getDonorRiskScores,
  markDonorContacted,
  getDonorOutreachProfiles,
  getDonorUpgradeScores,
  type DonorRiskScore,
  type DonorOutreachProfile,
  type DonorUpgradeScore,
} from '../../../lib/adminApi'

function riskLabel(score: number) {
  if (score >= 0.75) return 'Very High Risk'
  if (score >= 0.60) return 'High Risk'
  if (score >= 0.40) return 'Moderate Risk'
  return 'Low Risk'
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


// ── Template display helpers ──────────────────────────────────────────────────
const TEMPLATE_LABELS: Record<string, string> = {
  impact_story:           'Impact Story',
  resident_update:        'Resident Update',
  campaign_appeal:        'Campaign Appeal',
  thank_you_stewardship:  'Thank-You / Stewardship',
}

const ASK_LABELS: Record<string, string> = {
  upgrade:           'Ask for larger gift',
  recurring_upgrade: 'Upgrade recurring amount',
  setup_recurring:   'Convert to recurring',
  reactivate:        'Re-engagement appeal',
  thank_you:         'Thank and steward',
}

export function MLPage() {
  const [riskScores, setRiskScores]       = useState<DonorRiskScore[]>([])
  const [riskLoading, setRiskLoading]     = useState(true)
  const [riskError, setRiskError]         = useState<string | null>(null)
  const [contacting, setContacting]       = useState<number | null>(null)

  const [outreachProfiles, setOutreachProfiles] = useState<DonorOutreachProfile[]>([])
  const [outreachLoading, setOutreachLoading]   = useState(true)

  const [upgradeScores, setUpgradeScores]   = useState<DonorUpgradeScore[]>([])
  const [upgradeLoading, setUpgradeLoading] = useState(true)

  useEffect(() => {
    getDonorRiskScores()
      .then(setRiskScores)
      .catch(() => setRiskError('Failed to load risk scores.'))
      .finally(() => setRiskLoading(false))

    getDonorOutreachProfiles()
      .then(setOutreachProfiles)
      .catch(() => {/* table may not exist yet — silently skip */})
      .finally(() => setOutreachLoading(false))

    getDonorUpgradeScores()
      .then(setUpgradeScores)
      .catch(() => {/* table may not exist yet — silently skip */})
      .finally(() => setUpgradeLoading(false))
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

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      <PageHeader
        title="ML Insights"
        subtitle="Predictive models for donor retention, upgrade potential, and personalized outreach."
      />

      {/* ── Section 1: Donor Churn Risk ──────────────────────────────────────── */}
      <SectionCard
        title="Donor Churn Risk Prediction"
        subtitle="Donors predicted to lapse within 90 days, sorted by urgency. A score of 100% means the model is highly confident this donor will stop giving without outreach."
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
          <div className="max-h-[520px] overflow-y-auto rounded-lg border border-[var(--color-outline-variant)]">
          <div className="table-container !border-0 !rounded-none">
            <table>
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Total Given</th>
                  <th>Churn Risk</th>
                  <th>Assessment</th>
                  <th>Why at Risk</th>
                  <th>Outreach</th>
                </tr>
              </thead>
              <tbody>
                {riskScores.map(d => {
                  const reasons: string[] = d.riskReasons ? JSON.parse(d.riskReasons) : []
                  return (
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
                        {reasons.length > 0 ? (
                          <ul className="flex flex-col gap-0.5">
                            {reasons.map((r, i) => (
                              <li key={i} className="text-xs text-[var(--color-on-surface-variant)] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-outline)] flex-shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-[var(--color-on-surface-variant)]">—</span>
                        )}
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
                  )
                })}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </SectionCard>

      {/* ── Section: Upgrade Candidates ─────────────────────────────────────── */}
      <SectionCard
        title="Upgrade Potential — Donors Who Could Give More"
        subtitle="Frequent, recent donors whose average gift is below the group median. These are your best candidates for a higher-ask conversation."
      >
        <div className="p-3 bg-[var(--color-surface-container-low)] rounded-lg border border-[var(--color-outline-variant)] text-xs text-[var(--color-on-surface-variant)] mb-4">
          <strong className="text-[var(--color-on-surface)]">How to act on this: </strong>
          Suggested ask = 1.5× their current average gift. Lead with impact — show what a larger gift unlocks.
        </div>

        {upgradeLoading && <p className="text-sm text-[var(--text)] py-4">Loading upgrade scores…</p>}
        {!upgradeLoading && upgradeScores.length === 0 && (
          <p className="text-sm text-[var(--text)] py-4">
            No upgrade candidates yet. Run <code>python -m jobs.score_upgrade_potential</code> to populate.
          </p>
        )}
        {!upgradeLoading && upgradeScores.length > 0 && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Segment</th>
                  <th>Current Avg Gift</th>
                  <th>Group Median</th>
                  <th>Suggested Ask</th>
                  <th>Upgrade Score</th>
                </tr>
              </thead>
              <tbody>
                {upgradeScores.map(d => (
                  <tr key={d.supporterId}>
                    <td className="font-medium text-[var(--text-h)]">{d.donorName}</td>
                    <td>
                      <span className="badge text-xs">{d.rfmSegment ?? '—'}</span>
                    </td>
                    <td>₱{d.currentAvgGift.toLocaleString()}</td>
                    <td className="text-[var(--color-on-surface-variant)]">₱{d.segmentAvgGift.toLocaleString()}</td>
                    <td className="font-semibold text-[var(--color-primary)]">₱{d.suggestedAsk.toLocaleString()}</td>
                    <td><ScoreBar score={d.upgradeScore} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Section: Personalized Outreach Profiles ──────────────────────────── */}
      <SectionCard
        title="Personalized Outreach Profiles"
        subtitle="Recommended channel, message template, and ask type for each donor based on their giving history."
      >
        {outreachLoading && <p className="text-sm text-[var(--text)] py-4">Loading outreach profiles…</p>}
        {!outreachLoading && outreachProfiles.length === 0 && (
          <p className="text-sm text-[var(--text)] py-4">
            No outreach profiles yet. Run <code>python -m jobs.score_outreach_profiles</code> to populate.
          </p>
        )}
        {!outreachLoading && outreachProfiles.length > 0 && (
          <div className="max-h-[520px] overflow-y-auto rounded-lg border border-[var(--color-outline-variant)]">
          <div className="table-container !border-0 !rounded-none">
            <table>
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Preferred Channel</th>
                  <th>Cadence</th>
                  <th>Message Template</th>
                  <th>Best Day</th>
                  <th>Ask Type</th>
                </tr>
              </thead>
              <tbody>
                {outreachProfiles.map(d => (
                  <tr key={d.supporterId}>
                    <td className="font-medium text-[var(--text-h)]">{d.donorName}</td>
                    <td>{d.preferredChannel ?? '—'}</td>
                    <td><span className="badge text-xs">{d.cadence ?? '—'}</span></td>
                    <td className="text-[var(--color-on-surface-variant)] text-xs">
                      {d.messageTemplate ? (TEMPLATE_LABELS[d.messageTemplate] ?? d.messageTemplate) : '—'}
                    </td>
                    <td className="text-[var(--color-on-surface-variant)] text-xs">{d.bestDay ?? '—'}</td>
                    <td className="text-xs">
                      {d.askType ? (ASK_LABELS[d.askType] ?? d.askType) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </SectionCard>

      <br /><br />

    </div>
  )
}
