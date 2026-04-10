import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth }       from '../../../../hooks/useAuth'
import { PageHeader }    from '../../../../components/admin/PageHeader'
import { SectionCard }   from '../../../../components/admin/SectionCard'
import { LoadingState }  from '../../../../components/admin/LoadingState'
import { Pagination }    from '../../../../components/admin/Pagination'
import { FormWizard, type WizardStep } from '../../../../components/admin/FormWizard'
import { useToast }      from '../../../../components/admin/Toast'
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

// ── Step sub-components ───────────────────────────────────────────────────────

function StepResidentAndVisit({
  form, setForm, residents,
}: {
  form: VisitForm
  setForm: React.Dispatch<React.SetStateAction<VisitForm>>
  residents: CaseloadItem[]
}) {
  function set<K extends keyof VisitForm>(k: K, v: VisitForm[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="ahv-resident" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Resident <span className="text-[var(--color-error)]">*</span>
        </label>
        <select id="ahv-resident" className="form-input w-full" value={form.residentId} onChange={e => set('residentId', e.target.value)}>
          <option value="">Select resident…</option>
          {residents.map(r => <option key={r.residentId} value={r.residentId}>{r.internalCode}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ahv-date" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
            Visit Date <span className="text-[var(--color-error)]">*</span>
          </label>
          <input id="ahv-date" type="date" className="form-input w-full" value={form.visitDate} onChange={e => set('visitDate', e.target.value)} />
        </div>
        <div>
          <label htmlFor="ahv-sw" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">Social Worker</label>
          <input id="ahv-sw" className="form-input w-full bg-[var(--color-surface-container-low)] cursor-not-allowed" value={form.socialWorker || '—'} readOnly title="Assigned from your account" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ahv-type" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
            Visit Type <span className="text-[var(--color-error)]">*</span>
          </label>
          <select id="ahv-type" className="form-input w-full" value={form.visitType} onChange={e => set('visitType', e.target.value)}>
            <option value="">Select…</option>
            {VISIT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ahv-location" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
            Location Visited <span className="text-[var(--color-error)]">*</span>
          </label>
          <input id="ahv-location" className="form-input w-full" placeholder="Address or description" value={form.locationVisited} onChange={e => set('locationVisited', e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="ahv-family" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">Family Members Present</label>
        <input id="ahv-family" className="form-input w-full" placeholder="Names or relationship roles" value={form.familyMembersPresent} onChange={e => set('familyMembersPresent', e.target.value)} />
      </div>
    </div>
  )
}

function StepFamilyAndSafety({
  form, setForm,
}: {
  form: VisitForm
  setForm: React.Dispatch<React.SetStateAction<VisitForm>>
}) {
  function set<K extends keyof VisitForm>(k: K, v: VisitForm[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="ahv-purpose" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Purpose of Visit <span className="text-[var(--color-error)]">*</span>
        </label>
        <textarea id="ahv-purpose" className="form-input w-full" rows={3} placeholder="Why the visit was conducted…" value={form.purpose} onChange={e => set('purpose', e.target.value)} />
      </div>

      <div>
        <label htmlFor="ahv-observations" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Observations <span className="text-[var(--color-error)]">*</span>
        </label>
        <textarea id="ahv-observations" className="form-input w-full" rows={4} placeholder="What was observed during the visit…" value={form.observations} onChange={e => set('observations', e.target.value)} />
      </div>

      <div>
        <label htmlFor="ahv-cooperation" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Family Cooperation Level <span className="text-[var(--color-error)]">*</span>
        </label>
        <select id="ahv-cooperation" className="form-input w-full" value={form.familyCooperationLevel} onChange={e => set('familyCooperationLevel', e.target.value)}>
          <option value="">Select…</option>
          {COOPERATION_LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
        <input id="ahv-safety" type="checkbox" checked={form.safetyConcernsNoted} onChange={e => set('safetyConcernsNoted', e.target.checked)} />
        <span>Safety Concern Flagged</span>
        {form.safetyConcernsNoted && <span className="badge badge-error text-xs">⚑ Safety Concern</span>}
      </label>
    </div>
  )
}

function StepFollowUp({
  form, setForm,
}: {
  form: VisitForm
  setForm: React.Dispatch<React.SetStateAction<VisitForm>>
}) {
  function set<K extends keyof VisitForm>(k: K, v: VisitForm[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="ahv-outcome" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Visit Outcome <span className="text-[var(--color-error)]">*</span>
        </label>
        <textarea id="ahv-outcome" className="form-input w-full" rows={3} placeholder="Summary of what was accomplished…" value={form.visitOutcome} onChange={e => set('visitOutcome', e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
        <input id="ahv-followup-needed" type="checkbox" checked={form.followUpNeeded} onChange={e => set('followUpNeeded', e.target.checked)} />
        Follow-up Needed
      </label>

      {form.followUpNeeded && (
        <div>
          <label htmlFor="ahv-followup-notes" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
            Follow-up Notes <span className="text-[var(--color-error)]">*</span>
          </label>
          <textarea id="ahv-followup-notes" className="form-input w-full" rows={3} placeholder="Describe the required follow-up…" value={form.followUpNotes} onChange={e => set('followUpNotes', e.target.value)} />
        </div>
      )}
    </div>
  )
}

function StepReview({
  form, residents,
}: {
  form: VisitForm
  residents: CaseloadItem[]
}) {
  const residentLabel = residents.find(r => String(r.residentId) === form.residentId)?.internalCode ?? '—'
  const rows: [string, string][] = [
    ['Resident',               residentLabel],
    ['Visit Date',             fmtDate(form.visitDate)],
    ['Visit Type',             form.visitType || '—'],
    ['Location Visited',       form.locationVisited || '—'],
    ['Social Worker',          form.socialWorker || '—'],
    ['Family Members Present', form.familyMembersPresent || '—'],
    ['Family Cooperation',     form.familyCooperationLevel || '—'],
    ['Safety Concerns',        form.safetyConcernsNoted ? 'Yes ⚑' : 'No'],
    ['Follow-up Needed',       form.followUpNeeded ? 'Yes' : 'No'],
  ]
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">{label}</dt>
            <dd className="text-sm font-medium text-[var(--color-on-surface)]">{value}</dd>
          </div>
        ))}
      </dl>
      {form.purpose && (
        <div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Purpose of Visit</p>
          <p className="text-sm text-[var(--color-on-surface)] whitespace-pre-wrap bg-[var(--color-surface-container-low)] rounded-lg p-3">{form.purpose}</p>
        </div>
      )}
      {form.observations && (
        <div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Observations</p>
          <p className="text-sm text-[var(--color-on-surface)] whitespace-pre-wrap bg-[var(--color-surface-container-low)] rounded-lg p-3">{form.observations}</p>
        </div>
      )}
      {form.visitOutcome && (
        <div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Visit Outcome</p>
          <p className="text-sm text-[var(--color-on-surface)] whitespace-pre-wrap bg-[var(--color-surface-container-low)] rounded-lg p-3">{form.visitOutcome}</p>
        </div>
      )}
      {form.followUpNeeded && form.followUpNotes && (
        <div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Follow-up Notes</p>
          <p className="text-sm text-[var(--color-on-surface)] whitespace-pre-wrap bg-[var(--color-surface-container-low)] rounded-lg p-3">{form.followUpNotes}</p>
        </div>
      )}
    </div>
  )
}

// ── Tab icons ─────────────────────────────────────────────────────────────────

const sw = { strokeWidth: 1.5, stroke: 'currentColor', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
function TabIcon({ children }: { children: React.ReactNode }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" {...sw}>{children}</svg>
}

// ═════════════════════════════════════════════════════════════════════════════

export default function HomeVisits() {
  const { user }       = useAuth()
  const toast          = useToast()
  const [searchParams] = useSearchParams()
  const preselectedId  = searchParams.get('residentId')

  const [residents, setResidents]     = useState<CaseloadItem[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<Section>('form')

  const makeInitialForm = (): VisitForm => ({
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

  const [form, setForm]               = useState<VisitForm>(makeInitialForm)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [visits, setVisits]               = useState<MyVisitItem[]>([])
  const [historyTotal, setHistoryTotal]   = useState(0)
  const [historyPage, setHistoryPage]     = useState(1)
  const [historyLoading, setHistoryLoading] = useState(false)

  const [upcoming, setUpcoming] = useState<CaseConference[]>([])
  const [history, setHistory]   = useState<CaseConference[]>([])

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

  function refetchHistory() {
    setHistoryPage(1)
    getMyHomeVisits({ page: 1, pageSize: PAGE_SIZE })
      .then(({ total, items }) => { setHistoryTotal(total); setVisits(items) })
  }

  async function handleSubmit() {
    setIsSubmitting(true)
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
      toast.success('Home visit logged.')
      setForm({ ...makeInitialForm(), socialWorker: user?.socialWorkerCode ?? '' })
      setCurrentStep(1)
      refetchHistory()
    } catch {
      toast.error('Failed to save home visit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (pageLoading) return <LoadingState />

  const totalPages = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE))

  const steps: WizardStep[] = [
    {
      label:   'Resident & Visit',
      isValid: () => !!form.residentId && !!form.visitDate && !!form.visitType && !!form.locationVisited,
      content: <StepResidentAndVisit form={form} setForm={setForm} residents={residents} />,
    },
    {
      label:   'Family & Safety',
      isValid: () => !!form.purpose && !!form.observations && !!form.familyCooperationLevel,
      content: <StepFamilyAndSafety form={form} setForm={setForm} />,
    },
    {
      label:   'Follow-up',
      isValid: () => !!form.visitOutcome && (!form.followUpNeeded || !!form.followUpNotes),
      content: <StepFollowUp form={form} setForm={setForm} />,
    },
    {
      label:   'Review & Submit',
      isValid: () => true,
      content: <StepReview form={form} residents={residents} />,
    },
  ]

  const TABS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'form',        label: 'Log a Visit',      icon: <TabIcon><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" /><path d="M9 12h6M9 16h4" /></TabIcon> },
    { id: 'history',     label: 'My Visit History', icon: <TabIcon><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" /></TabIcon> },
    { id: 'conferences', label: 'Case Conferences', icon: <TabIcon><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></TabIcon> },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      <PageHeader
        title="Home Visitation"
        subtitle="Log visits, review your submission history, and view case conferences."
      />

      {/* ── Section tabs ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap border-b border-[var(--color-outline-variant)]">
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

      {/* ── Log a Visit (wizard) ──────────────────────────────────────────────── */}
      {activeSection === 'form' && (
        <SectionCard title="Log a Visit">
          <FormWizard
            steps={steps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Save Visit Record"
          />
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
