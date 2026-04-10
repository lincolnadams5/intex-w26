import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth }       from '../../../hooks/useAuth'
import { PageHeader }    from '../../../components/admin/PageHeader'
import { SectionCard }   from '../../../components/admin/SectionCard'
import { LoadingState }  from '../../../components/admin/LoadingState'
import { Pagination }    from '../../../components/admin/Pagination'
import { FormWizard, type WizardStep } from '../../../components/admin/FormWizard'
import { useToast }      from '../../../components/admin/Toast'
import {
  getStaffResidents,
  getMyProcessRecordings,
  createProcessRecording,
  type CaseloadItem,
  type MyRecordingItem,
} from '../../../lib/staffApi'

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

const EMOTIONAL_STATES = ['Calm', 'Anxious', 'Withdrawn', 'Agitated', 'Distressed', 'Stable']
const SESSION_TYPES    = ['Individual', 'Group']

function today() {
  return new Date().toISOString().split('T')[0]
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const [year, month, day] = iso.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface FormState {
  residentId:             string
  sessionDate:            string
  socialWorker:           string
  sessionType:            string
  emotionalStateObserved: string
  narrativeSummary:       string
  interventionsApplied:   string
  followUpActions:        string
  concernsFlagged:        boolean
}

// ── Step sub-components ───────────────────────────────────────────────────────

function StepResidentAndSession({
  form, setForm, residents,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  residents: CaseloadItem[]
}) {
  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="spr-resident" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Resident <span className="text-[var(--color-error)]">*</span>
        </label>
        <select
          id="spr-resident"
          className="form-input w-full"
          value={form.residentId}
          onChange={e => set('residentId', e.target.value)}
        >
          <option value="">Select resident…</option>
          {residents.map(r => (
            <option key={r.residentId} value={r.residentId}>{r.internalCode}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="spr-date" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
            Session Date <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            id="spr-date"
            type="date"
            className="form-input w-full"
            value={form.sessionDate}
            onChange={e => set('sessionDate', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="spr-type" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
            Session Type <span className="text-[var(--color-error)]">*</span>
          </label>
          <select
            id="spr-type"
            className="form-input w-full"
            value={form.sessionType}
            onChange={e => set('sessionType', e.target.value)}
          >
            {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="spr-sw" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Social Worker
        </label>
        <input
          id="spr-sw"
          className="form-input w-full bg-[var(--color-surface-container-low)] cursor-not-allowed"
          value={form.socialWorker || '—'}
          readOnly
          title="Assigned from your account"
        />
      </div>
    </div>
  )
}

function StepObservations({
  form, setForm,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
}) {
  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }
  const narrativeLen = form.narrativeSummary.length
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="spr-emotion" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Emotional State Observed <span className="text-[var(--color-error)]">*</span>
        </label>
        <select
          id="spr-emotion"
          className="form-input w-full"
          value={form.emotionalStateObserved}
          onChange={e => set('emotionalStateObserved', e.target.value)}
        >
          <option value="">Select…</option>
          {EMOTIONAL_STATES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="spr-narrative" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Narrative Summary <span className="text-[var(--color-error)]">*</span>
          <span className={`ml-2 font-normal ${narrativeLen < 50 ? 'text-[var(--color-error)]' : 'text-[var(--color-primary)]'}`}>
            ({narrativeLen}/50 min)
          </span>
        </label>
        <textarea
          id="spr-narrative"
          className="form-input w-full"
          rows={6}
          value={form.narrativeSummary}
          onChange={e => set('narrativeSummary', e.target.value)}
          placeholder="Full account of the session…"
        />
      </div>
    </div>
  )
}

function StepActions({
  form, setForm,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
}) {
  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="spr-interventions" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Interventions Applied <span className="text-[var(--color-error)]">*</span>
        </label>
        <textarea
          id="spr-interventions"
          className="form-input w-full"
          rows={4}
          value={form.interventionsApplied}
          onChange={e => set('interventionsApplied', e.target.value)}
          placeholder="Techniques or interventions used…"
        />
      </div>

      <div>
        <label htmlFor="spr-followup" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
          Follow-up Actions
        </label>
        <textarea
          id="spr-followup"
          className="form-input w-full"
          rows={3}
          value={form.followUpActions}
          onChange={e => set('followUpActions', e.target.value)}
          placeholder="Planned next steps…"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
        <input
          id="spr-concerns"
          type="checkbox"
          checked={form.concernsFlagged}
          onChange={e => set('concernsFlagged', e.target.checked)}
        />
        <span>Flag concerns — marks this record for follow-up attention</span>
        {form.concernsFlagged && <span className="badge badge-warning text-xs">⚑ Flagged</span>}
      </label>
    </div>
  )
}

function StepReview({
  form, residents,
}: {
  form: FormState
  residents: CaseloadItem[]
}) {
  const residentLabel = residents.find(r => String(r.residentId) === form.residentId)?.internalCode ?? '—'
  const rows: [string, string][] = [
    ['Resident',          residentLabel],
    ['Session Date',      fmtDate(form.sessionDate)],
    ['Session Type',      form.sessionType],
    ['Social Worker',     form.socialWorker || '—'],
    ['Emotional State',   form.emotionalStateObserved || '—'],
    ['Concerns Flagged',  form.concernsFlagged ? 'Yes ⚑' : 'No'],
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

      {form.narrativeSummary && (
        <div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Narrative Summary</p>
          <p className="text-sm text-[var(--color-on-surface)] whitespace-pre-wrap bg-[var(--color-surface-container-low)] rounded-lg p-3">
            {form.narrativeSummary}
          </p>
        </div>
      )}

      {form.interventionsApplied && (
        <div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Interventions Applied</p>
          <p className="text-sm text-[var(--color-on-surface)] whitespace-pre-wrap bg-[var(--color-surface-container-low)] rounded-lg p-3">
            {form.interventionsApplied}
          </p>
        </div>
      )}

      {form.followUpActions && (
        <div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">Follow-up Actions</p>
          <p className="text-sm text-[var(--color-on-surface)] whitespace-pre-wrap bg-[var(--color-surface-container-low)] rounded-lg p-3">
            {form.followUpActions}
          </p>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════

export default function StaffProcessRecording() {
  const { user }       = useAuth()
  const toast          = useToast()
  const [searchParams] = useSearchParams()
  const preselectedId  = searchParams.get('residentId')

  // ── Residents for dropdown ────────────────────────────────────────────────
  const [residents, setResidents] = useState<CaseloadItem[]>([])

  // ── Form state ────────────────────────────────────────────────────────────
  const makeInitialForm = (): FormState => ({
    residentId:             preselectedId ?? '',
    sessionDate:            today(),
    socialWorker:           user?.socialWorkerCode ?? '',
    sessionType:            'Individual',
    emotionalStateObserved: '',
    narrativeSummary:       '',
    interventionsApplied:   '',
    followUpActions:        '',
    concernsFlagged:        false,
  })

  const [form, setForm]             = useState<FormState>(makeInitialForm)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── History state ─────────────────────────────────────────────────────────
  const [recordings, setRecordings]         = useState<MyRecordingItem[]>([])
  const [historyTotal, setHistoryTotal]     = useState(0)
  const [historyPage, setHistoryPage]       = useState(1)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyResident, setHistoryResident] = useState<number | undefined>(
    preselectedId ? Number(preselectedId) : undefined
  )

  // ── Page loading ──────────────────────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true)

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    getStaffResidents({ pageSize: 200 })
      .then(({ items }) => setResidents(items))
      .finally(() => setPageLoading(false))
  }, [])

  useEffect(() => {
    if (user?.socialWorkerCode && !form.socialWorker) {
      setForm(f => ({ ...f, socialWorker: user.socialWorkerCode! }))
    }
  }, [user?.socialWorkerCode])

  useEffect(() => {
    setHistoryLoading(true)
    getMyProcessRecordings({ page: historyPage, pageSize: PAGE_SIZE, residentId: historyResident })
      .then(({ total, items }) => { setHistoryTotal(total); setRecordings(items) })
      .finally(() => setHistoryLoading(false))
  }, [historyPage, historyResident])

  // ── Handlers ─────────────────────────────────────────────────────────────

  function refetchHistory() {
    setHistoryPage(1)
    getMyProcessRecordings({ page: 1, pageSize: PAGE_SIZE, residentId: historyResident })
      .then(({ total, items }) => { setHistoryTotal(total); setRecordings(items) })
  }

  function handleHistoryResidentChange(val: string) {
    setHistoryResident(val ? Number(val) : undefined)
    setHistoryPage(1)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      await createProcessRecording({
        residentId:             Number(form.residentId),
        sessionDate:            new Date(form.sessionDate).toISOString(),
        socialWorker:           form.socialWorker,
        sessionType:            form.sessionType,
        emotionalStateObserved: form.emotionalStateObserved,
        narrativeSummary:       form.narrativeSummary,
        interventionsApplied:   form.interventionsApplied || undefined,
        followUpActions:        form.followUpActions || undefined,
        concernsFlagged:        form.concernsFlagged,
      })
      toast.success('Process recording saved.')
      setForm({ ...makeInitialForm(), socialWorker: user?.socialWorkerCode ?? '' })
      setCurrentStep(1)
      refetchHistory()
    } catch {
      toast.error('Failed to save recording. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (pageLoading) return <LoadingState />

  const totalPages = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE))

  const steps: WizardStep[] = [
    {
      label:   'Resident & Session',
      isValid: () => !!form.residentId && !!form.sessionDate && !!form.sessionType,
      content: <StepResidentAndSession form={form} setForm={setForm} residents={residents} />,
    },
    {
      label:   'Observations',
      isValid: () => !!form.emotionalStateObserved && form.narrativeSummary.trim().length >= 50,
      content: <StepObservations form={form} setForm={setForm} />,
    },
    {
      label:   'Actions',
      isValid: () => form.interventionsApplied.trim().length > 0,
      content: <StepActions form={form} setForm={setForm} />,
    },
    {
      label:   'Review & Submit',
      isValid: () => true,
      content: <StepReview form={form} residents={residents} />,
    },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      <PageHeader
        title="Process Recording"
        subtitle="Document a counseling session for a resident at your safehouse."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

        {/* ── Wizard ───────────────────────────────────────────────────────── */}
        <SectionCard title="New Recording">
          <FormWizard
            steps={steps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Save Recording"
          />
        </SectionCard>

        {/* ── My Recordings history ─────────────────────────────────────────── */}
        <SectionCard title="My Recordings">
          <div className="mb-4">
            <label htmlFor="spr-filter-resident" className="sr-only">Filter history by resident</label>
            <select
              id="spr-filter-resident"
              className="form-input w-full"
              value={historyResident ?? ''}
              onChange={e => handleHistoryResidentChange(e.target.value)}
            >
              <option value="">All residents</option>
              {residents.map(r => (
                <option key={r.residentId} value={r.residentId}>{r.internalCode}</option>
              ))}
            </select>
          </div>

          {historyLoading ? (
            <p className="text-sm text-[var(--color-on-surface-variant)] text-center py-4">Loading…</p>
          ) : recordings.length === 0 ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">No recordings submitted yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recordings.map(rec => (
                <details key={rec.recordingId} className="border border-[var(--color-outline-variant)] rounded-lg">
                  <summary className="flex flex-col gap-1 px-3 py-2.5 cursor-pointer list-none hover:bg-[var(--color-surface-container-low)] transition-colors rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--color-on-surface)]">{fmtDate(rec.sessionDate)}</span>
                      {rec.concernsFlagged && <span className="badge badge-warning text-xs">⚑ Concerns</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[var(--color-on-surface-variant)]">{rec.residentCode}</span>
                      <span className="badge text-xs">{rec.sessionType}</span>
                      <span className="text-xs text-[var(--color-on-surface-variant)]">{rec.emotionalStateObserved}</span>
                    </div>
                  </summary>
                  <div className="px-3 pb-3 pt-2 border-t border-[var(--color-outline-variant)] flex flex-col gap-2.5">
                    {rec.sessionNarrative && (
                      <div>
                        <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Narrative</p>
                        <p className="text-sm text-[var(--color-on-surface)] whitespace-pre-wrap">{rec.sessionNarrative}</p>
                      </div>
                    )}
                    {rec.interventionsApplied && (
                      <div>
                        <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Interventions Applied</p>
                        <p className="text-sm text-[var(--color-on-surface)]">{rec.interventionsApplied}</p>
                      </div>
                    )}
                    {rec.followUpActions && (
                      <div>
                        <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Follow-up Actions</p>
                        <p className="text-sm text-[var(--color-on-surface)]">{rec.followUpActions}</p>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}

          {historyTotal > PAGE_SIZE && (
            <Pagination
              page={historyPage}
              totalPages={totalPages}
              totalItems={historyTotal}
              pageSize={PAGE_SIZE}
              onPageChange={p => setHistoryPage(p)}
            />
          )}
        </SectionCard>
      </div>
    </div>
  )
}
