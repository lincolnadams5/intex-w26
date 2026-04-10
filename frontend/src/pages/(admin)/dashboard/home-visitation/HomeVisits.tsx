import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth }      from '../../../../hooks/useAuth'
import { PageHeader }   from '../../../../components/admin/PageHeader'
import { SectionCard }  from '../../../../components/admin/SectionCard'
import { LoadingState } from '../../../../components/admin/LoadingState'
import { Pagination }   from '../../../../components/admin/Pagination'
import {
  getStaffResidents,
  getMyHomeVisits,
  getCaseConferences,
  createHomeVisit,
  type CaseloadItem,
  type MyVisitItem,
  type CaseConference,
} from '../../../../lib/staffApi'

const PAGE_SIZE = 10

const VISIT_TYPES = [
  'Initial Assessment', 'Routine Follow-up', 'Reintegration Assessment',
  'Post-Placement Monitoring', 'Emergency',
]
const COOPERATION_LEVELS = ['Cooperative', 'Partially Cooperative', 'Uncooperative']

function today() {
  return new Date().toISOString().split('T')[0]
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const [year, month, day] = iso.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
}

interface VisitForm {
  residentId:             string
  visitDate:              string
  socialWorker:           string
  visitType:              string
  locationVisited:        string
  familyMembersPresent:   string
  purpose:                string
  observations:           string
  familyCooperationLevel: string
  safetyConcernsNoted:    boolean
  followUpNeeded:         boolean
  followUpNotes:          string
  visitOutcome:           string
}

type Section = 'form' | 'history' | 'conferences'

export default function HomeVisits() {
  const { user }       = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedId  = searchParams.get('residentId')

  const [residents, setResidents]             = useState<CaseloadItem[]>([])
  const [pageLoading, setPageLoading]         = useState(true)
  const [activeSection, setActiveSection]     = useState<Section>('form')

  const defaultForm = (): VisitForm => ({
    residentId:             preselectedId ?? '',
    visitDate:              today(),
    socialWorker:           user?.socialWorkerCode ?? '',
    visitType:              '',
    locationVisited:        '',
    familyMembersPresent:   '',
    purpose:                '',
    observations:           '',
    familyCooperationLevel: '',
    safetyConcernsNoted:    false,
    followUpNeeded:         false,
    followUpNotes:          '',
    visitOutcome:           '',
  })

  const [form, setForm]                       = useState<VisitForm>(defaultForm)
  const [submitting, setSubmitting]           = useState(false)
  const [submitError, setSubmitError]         = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess]     = useState(false)

  const [visits, setVisits]                   = useState<MyVisitItem[]>([])
  const [historyTotal, setHistoryTotal]       = useState(0)
  const [historyPage, setHistoryPage]         = useState(1)
  const [historyLoading, setHistoryLoading]   = useState(false)

  const [upcoming, setUpcoming]               = useState<CaseConference[]>([])
  const [history, setHistory]                 = useState<CaseConference[]>([])

  useEffect(() => {
    Promise.all([
      getStaffResidents({ pageSize: 200 }),
      getCaseConferences(),
    ]).then(([resResult, confResult]) => {
      setResidents(resResult.items)
      setUpcoming(confResult.upcoming)
      setHistory(confResult.history)
    }).finally(() => setPageLoading(false))
  }, [])

  useEffect(() => {
    if (user?.socialWorkerCode && !form.socialWorker) {
      setForm(f => ({ ...f, socialWorker: user.socialWorkerCode! }))
    }
  }, [user?.socialWorkerCode])

  useEffect(() => {
    setHistoryLoading(true)
    getMyHomeVisits({ page: historyPage, pageSize: PAGE_SIZE })
      .then(({ total, items }) => { setHistoryTotal(total); setVisits(items) })
      .finally(() => setHistoryLoading(false))
  }, [historyPage])

  function setField<K extends keyof VisitForm>(key: K, val: VisitForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function isFormValid() {
    return form.residentId && form.visitDate && form.visitType && form.locationVisited &&
      form.purpose && form.observations && form.familyCooperationLevel && form.visitOutcome &&
      (!form.followUpNeeded || form.followUpNotes)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid()) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      await createHomeVisit({
        residentId:             Number(form.residentId),
        visitDate:              new Date(form.visitDate).toISOString(),
        socialWorker:           form.socialWorker,
        visitType:              form.visitType,
        locationVisited:        form.locationVisited,
        familyMembersPresent:   form.familyMembersPresent || undefined,
        purpose:                form.purpose,
        observations:           form.observations,
        familyCooperationLevel: form.familyCooperationLevel,
        safetyConcernsNoted:    form.safetyConcernsNoted,
        followUpNeeded:         form.followUpNeeded,
        followUpNotes:          form.followUpNeeded ? form.followUpNotes : undefined,
        visitOutcome:           form.visitOutcome,
      })
      setSubmitSuccess(true)
      setForm({ residentId: '', visitDate: today(), socialWorker: user?.socialWorkerCode ?? '',
        visitType: '', locationVisited: '', familyMembersPresent: '', purpose: '',
        observations: '', familyCooperationLevel: '', safetyConcernsNoted: false,
        followUpNeeded: false, followUpNotes: '', visitOutcome: '' })
      setHistoryPage(1)
      getMyHomeVisits({ page: 1, pageSize: PAGE_SIZE })
        .then(({ total, items }) => { setHistoryTotal(total); setVisits(items) })
      setTimeout(() => setSubmitSuccess(false), 4000)
    } catch {
      setSubmitError('Failed to save visit record. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (pageLoading) return <LoadingState />

  const totalPages = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE))

  const sw = { strokeWidth: 1.5, stroke: 'currentColor', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const TabIcon = ({ children }: { children: React.ReactNode }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" {...sw}>{children}</svg>
  )

  const TABS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'form',        label: 'Log a Visit',      icon: <TabIcon><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" /><path d="M9 12h6M9 16h4" /></TabIcon> },
    { id: 'history',     label: 'My Visit History', icon: <TabIcon><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" /></TabIcon> },
    { id: 'conferences', label: 'Case Conferences', icon: <TabIcon><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></TabIcon> },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Home Visitation"
        subtitle="Log visits, review your submission history, and view case conferences."
      />

      <div className="flex border-b border-[var(--color-outline-variant)]">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeSection === id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ── Log a Visit ──────────────────────────────────────────────────────── */}
      {activeSection === 'form' && (
        <SectionCard title="Log a Visit">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-[var(--color-on-surface)] pb-2 border-b border-[var(--color-outline-variant)]">Visit Details</p>

              <div>
                <label htmlFor="ahv-resident" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                  Resident <span className="text-[var(--color-error)]">*</span>
                </label>
                <select id="ahv-resident" className="form-input w-full" value={form.residentId} onChange={e => setField('residentId', e.target.value)} required>
                  <option value="">Select resident…</option>
                  {residents.map(r => <option key={r.residentId} value={r.residentId}>{r.internalCode}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ahv-date" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                    Visit Date <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <input id="ahv-date" type="date" className="form-input w-full" value={form.visitDate} onChange={e => setField('visitDate', e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="ahv-sw" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">Social Worker</label>
                  <input id="ahv-sw" className="form-input w-full bg-[var(--color-surface-container-low)] cursor-not-allowed" value={form.socialWorker || '—'} readOnly title="Assigned from your account" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ahv-type" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                    Visit Type <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <select id="ahv-type" className="form-input w-full" value={form.visitType} onChange={e => setField('visitType', e.target.value)} required>
                    <option value="">Select…</option>
                    {VISIT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="ahv-location" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                    Location Visited <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <input id="ahv-location" className="form-input w-full" placeholder="Address or description" value={form.locationVisited} onChange={e => setField('locationVisited', e.target.value)} required />
                </div>
              </div>

              <div>
                <label htmlFor="ahv-family" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">Family Members Present</label>
                <input id="ahv-family" className="form-input w-full" placeholder="Names or relationship roles" value={form.familyMembersPresent} onChange={e => setField('familyMembersPresent', e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-[var(--color-on-surface)] pb-2 border-b border-[var(--color-outline-variant)]">Observations</p>

              <div>
                <label htmlFor="ahv-purpose" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                  Purpose of Visit <span className="text-[var(--color-error)]">*</span>
                </label>
                <textarea id="ahv-purpose" className="form-input w-full" rows={3} placeholder="Why the visit was conducted…" value={form.purpose} onChange={e => setField('purpose', e.target.value)} required />
              </div>

              <div>
                <label htmlFor="ahv-observations" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                  Observations <span className="text-[var(--color-error)]">*</span>
                </label>
                <textarea id="ahv-observations" className="form-input w-full" rows={4} placeholder="What was observed during the visit…" value={form.observations} onChange={e => setField('observations', e.target.value)} required />
              </div>

              <div>
                <label htmlFor="ahv-cooperation" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                  Family Cooperation Level <span className="text-[var(--color-error)]">*</span>
                </label>
                <select id="ahv-cooperation" className="form-input w-full" value={form.familyCooperationLevel} onChange={e => setField('familyCooperationLevel', e.target.value)} required>
                  <option value="">Select…</option>
                  {COOPERATION_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
                <input id="ahv-safety" type="checkbox" checked={form.safetyConcernsNoted} onChange={e => setField('safetyConcernsNoted', e.target.checked)} />
                <span>Safety Concern Flagged</span>
                {form.safetyConcernsNoted && <span className="badge badge-error text-xs">⚑ Safety Concern</span>}
              </label>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-[var(--color-on-surface)] pb-2 border-b border-[var(--color-outline-variant)]">Outcomes</p>

              <div>
                <label htmlFor="ahv-outcome" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                  Visit Outcome <span className="text-[var(--color-error)]">*</span>
                </label>
                <textarea id="ahv-outcome" className="form-input w-full" rows={3} placeholder="Summary of what was accomplished…" value={form.visitOutcome} onChange={e => setField('visitOutcome', e.target.value)} required />
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
                <input id="ahv-followup-needed" type="checkbox" checked={form.followUpNeeded} onChange={e => setField('followUpNeeded', e.target.checked)} />
                Follow-up Needed
              </label>

              {form.followUpNeeded && (
                <div>
                  <label htmlFor="ahv-followup-notes" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                    Follow-up Notes <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <textarea id="ahv-followup-notes" className="form-input w-full" rows={3} placeholder="Describe the required follow-up…" value={form.followUpNotes} onChange={e => setField('followUpNotes', e.target.value)} required={form.followUpNeeded} />
                </div>
              )}
            </div>

            {submitError   && <p className="text-sm text-[var(--color-error)]">{submitError}</p>}
            {submitSuccess && <p className="text-sm text-[var(--color-primary)]">Visit record saved successfully.</p>}

            <button type="submit" disabled={submitting || !isFormValid()} className="btn btn-primary">
              {submitting ? 'Saving…' : 'Save Visit Record'}
            </button>
          </form>
        </SectionCard>
      )}

      {/* ── Visit History ─────────────────────────────────────────────────────── */}
      {activeSection === 'history' && (
        <SectionCard title="My Visit History">
          {historyLoading ? (
            <p className="text-sm text-[var(--color-on-surface-variant)] text-center py-4">Loading…</p>
          ) : visits.length === 0 ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">No visits submitted yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {visits.map(v => (
                <details key={v.visitationId} className="border border-[var(--color-outline-variant)] rounded-lg">
                  <summary className="flex flex-col gap-1 px-3 py-2.5 cursor-pointer list-none hover:bg-[var(--color-surface-container-low)] transition-colors rounded-lg">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[var(--color-on-surface)]">{fmtDate(v.visitDate)}</span>
                      <div className="flex gap-1.5">
                        {v.safetyConcernsNoted && <span className="badge badge-error text-xs">⚑ Safety</span>}
                        {v.followUpNeeded && <span className="badge badge-warning text-xs">Follow-up</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[var(--color-on-surface-variant)]">{v.residentCode}</span>
                      <span className="badge text-xs">{v.visitType}</span>
                    </div>
                  </summary>
                  <div className="px-3 pb-3 pt-2 border-t border-[var(--color-outline-variant)] flex flex-col gap-2.5">
                    {v.observations && <div><p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Observations</p><p className="text-sm text-[var(--color-on-surface)] whitespace-pre-wrap">{v.observations}</p></div>}
                    <div><p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Family Cooperation</p><p className="text-sm text-[var(--color-on-surface)]">{v.familyCooperationLevel}</p></div>
                    {v.visitOutcome && <div><p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Outcome</p><p className="text-sm text-[var(--color-on-surface)]">{v.visitOutcome}</p></div>}
                    {v.followUpNeeded && v.followUpNotes && <div><p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Follow-up Notes</p><p className="text-sm text-[var(--color-on-surface)]">{v.followUpNotes}</p></div>}
                  </div>
                </details>
              ))}
            </div>
          )}
          {historyTotal > PAGE_SIZE && (
            <div className="mt-4">
              <Pagination page={historyPage} totalPages={totalPages} totalItems={historyTotal} pageSize={PAGE_SIZE} onPageChange={p => setHistoryPage(p)} />
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Case Conferences ─────────────────────────────────────────────────── */}
      {activeSection === 'conferences' && (
        <div className="flex flex-col gap-4">
          <SectionCard title="Upcoming Conferences">
            {upcoming.length === 0 ? (
              <p className="text-sm text-[var(--color-on-surface-variant)]">No upcoming conferences scheduled.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Date</th><th>Resident</th><th>Category</th><th>Description</th><th>Status</th></tr></thead>
                  <tbody>
                    {upcoming.map((c, i) => (
                      <tr key={i}>
                        <td className="text-sm font-medium text-[var(--color-on-surface)] whitespace-nowrap">{fmtDate(c.conferenceDate)}</td>
                        <td className="text-xs text-[var(--color-on-surface-variant)]">{c.residentCode}</td>
                        <td><span className="badge text-xs">{c.planCategory}</span></td>
                        <td className="text-xs text-[var(--color-on-surface-variant)] max-w-[280px]">{c.planDescription}</td>
                        <td><span className="badge badge-success text-xs">Upcoming</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Conference History">
            {history.length === 0 ? (
              <p className="text-sm text-[var(--color-on-surface-variant)]">No past conferences on record.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Date</th><th>Resident</th><th>Category</th><th>Description</th><th>Status</th></tr></thead>
                  <tbody>
                    {history.map((c, i) => (
                      <tr key={i}>
                        <td className="text-sm font-medium text-[var(--color-on-surface)] whitespace-nowrap">{fmtDate(c.conferenceDate)}</td>
                        <td className="text-xs text-[var(--color-on-surface-variant)]">{c.residentCode}</td>
                        <td><span className="badge text-xs">{c.planCategory}</span></td>
                        <td className="text-xs text-[var(--color-on-surface-variant)] max-w-[280px]">{c.planDescription}</td>
                        <td><span className="badge text-xs">Completed</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  )
}
