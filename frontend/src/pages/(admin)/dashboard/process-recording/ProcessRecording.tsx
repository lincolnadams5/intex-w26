import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth }      from '../../../../hooks/useAuth'
import { PageHeader }   from '../../../../components/admin/PageHeader'
import { SectionCard }  from '../../../../components/admin/SectionCard'
import { LoadingState } from '../../../../components/admin/LoadingState'
import { Pagination }   from '../../../../components/admin/Pagination'
import {
  getStaffResidents,
  getMyProcessRecordings,
  createProcessRecording,
  type CaseloadItem,
  type MyRecordingItem,
} from '../../../../lib/staffApi'

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

export default function ProcessRecording() {
  const { user }       = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedId  = searchParams.get('residentId')

  const [residents, setResidents] = useState<CaseloadItem[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  const defaultForm = (): FormState => ({
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

  const [form, setForm]                       = useState<FormState>(defaultForm)
  const [submitting, setSubmitting]           = useState(false)
  const [submitError, setSubmitError]         = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess]     = useState(false)

  const [recordings, setRecordings]           = useState<MyRecordingItem[]>([])
  const [historyTotal, setHistoryTotal]       = useState(0)
  const [historyPage, setHistoryPage]         = useState(1)
  const [historyLoading, setHistoryLoading]   = useState(false)
  const [historyResident, setHistoryResident] = useState<number | undefined>(
    preselectedId ? Number(preselectedId) : undefined
  )

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

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function isFormValid() {
    return form.residentId && form.sessionDate && form.sessionType &&
      form.emotionalStateObserved && form.narrativeSummary.length >= 50
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid()) return
    setSubmitError(null)
    setSubmitting(true)
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
      setSubmitSuccess(true)
      setForm({ residentId: '', sessionDate: today(), socialWorker: user?.socialWorkerCode ?? '',
        sessionType: 'Individual', emotionalStateObserved: '', narrativeSummary: '',
        interventionsApplied: '', followUpActions: '', concernsFlagged: false })
      setHistoryPage(1)
      getMyProcessRecordings({ page: 1, pageSize: PAGE_SIZE, residentId: historyResident })
        .then(({ total, items }) => { setHistoryTotal(total); setRecordings(items) })
      setTimeout(() => setSubmitSuccess(false), 4000)
    } catch {
      setSubmitError('Failed to save recording. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (pageLoading) return <LoadingState />

  const totalPages   = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE))
  const narrativeLen = form.narrativeSummary.length

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        title="Process Recording"
        subtitle="Document a counseling session for a resident."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <SectionCard title="New Recording">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-[var(--color-on-surface)] pb-2 border-b border-[var(--color-outline-variant)]">Session Details</p>

              <div>
                <label htmlFor="pr-resident" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                  Resident <span className="text-[var(--color-error)]">*</span>
                </label>
                <select id="pr-resident" className="form-input w-full" value={form.residentId} onChange={e => setField('residentId', e.target.value)} required>
                  <option value="">Select resident…</option>
                  {residents.map(r => <option key={r.residentId} value={r.residentId}>{r.internalCode}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pr-date" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                    Session Date <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <input id="pr-date" type="date" className="form-input w-full" value={form.sessionDate} onChange={e => setField('sessionDate', e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="pr-type" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                    Session Type <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <select id="pr-type" className="form-input w-full" value={form.sessionType} onChange={e => setField('sessionType', e.target.value)}>
                    {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="pr-sw" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">Social Worker</label>
                <input id="pr-sw" className="form-input w-full bg-[var(--color-surface-container-low)] cursor-not-allowed" value={form.socialWorker || '—'} readOnly title="Assigned from your account" />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-[var(--color-on-surface)] pb-2 border-b border-[var(--color-outline-variant)]">Session Content</p>

              <div>
                <label htmlFor="pr-emotion" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                  Emotional State Observed <span className="text-[var(--color-error)]">*</span>
                </label>
                <select id="pr-emotion" className="form-input w-full" value={form.emotionalStateObserved} onChange={e => setField('emotionalStateObserved', e.target.value)} required>
                  <option value="">Select…</option>
                  {EMOTIONAL_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="pr-narrative" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">
                  Narrative Summary <span className="text-[var(--color-error)]">*</span>
                  <span className={`ml-2 font-normal ${narrativeLen < 50 ? 'text-[var(--color-error)]' : 'text-[var(--color-primary)]'}`}>
                    ({narrativeLen}/50 min)
                  </span>
                </label>
                <textarea id="pr-narrative" className="form-input w-full" rows={5} value={form.narrativeSummary} onChange={e => setField('narrativeSummary', e.target.value)} placeholder="Full account of the session…" required />
              </div>

              <div>
                <label htmlFor="pr-interventions" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">Interventions Applied</label>
                <textarea id="pr-interventions" className="form-input w-full" rows={3} value={form.interventionsApplied} onChange={e => setField('interventionsApplied', e.target.value)} placeholder="Techniques or interventions used…" />
              </div>

              <div>
                <label htmlFor="pr-followup" className="text-sm text-[var(--color-on-surface-variant)] mb-1 block">Follow-up Actions</label>
                <textarea id="pr-followup" className="form-input w-full" rows={3} value={form.followUpActions} onChange={e => setField('followUpActions', e.target.value)} placeholder="Planned next steps…" />
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer">
                <input id="pr-concerns" type="checkbox" checked={form.concernsFlagged} onChange={e => setField('concernsFlagged', e.target.checked)} />
                <span>Flag concerns — marks this record for follow-up attention</span>
                {form.concernsFlagged && <span className="badge badge-warning text-xs">⚑ Flagged</span>}
              </label>
            </div>

            {submitError   && <p className="text-sm text-[var(--color-error)]">{submitError}</p>}
            {submitSuccess && <p className="text-sm text-[var(--color-primary)]">Recording saved successfully.</p>}

            <button type="submit" disabled={submitting || !isFormValid()} className="btn btn-primary w-full">
              {submitting ? 'Saving…' : 'Save Recording'}
            </button>
          </form>
        </SectionCard>

        {/* ── History ──────────────────────────────────────────────────────── */}
        <SectionCard title="My Recordings">
          <div className="mb-4">
            <label htmlFor="pr-filter-resident" className="sr-only">Filter by resident</label>
            <select id="pr-filter-resident" className="form-input w-full" value={historyResident ?? ''} onChange={e => { setHistoryResident(e.target.value ? Number(e.target.value) : undefined); setHistoryPage(1) }}>
              <option value="">All residents</option>
              {residents.map(r => <option key={r.residentId} value={r.residentId}>{r.internalCode}</option>)}
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
                    {rec.sessionNarrative && <div><p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Narrative</p><p className="text-sm text-[var(--color-on-surface)] whitespace-pre-wrap">{rec.sessionNarrative}</p></div>}
                    {rec.interventionsApplied && <div><p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Interventions Applied</p><p className="text-sm text-[var(--color-on-surface)]">{rec.interventionsApplied}</p></div>}
                    {rec.followUpActions && <div><p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Follow-up Actions</p><p className="text-sm text-[var(--color-on-surface)]">{rec.followUpActions}</p></div>}
                  </div>
                </details>
              ))}
            </div>
          )}

          {historyTotal > PAGE_SIZE && (
            <Pagination page={historyPage} totalPages={totalPages} totalItems={historyTotal} pageSize={PAGE_SIZE} onPageChange={p => setHistoryPage(p)} />
          )}
        </SectionCard>
      </div>
    </div>
  )
}
