import { useEffect, useRef, useState, type ReactNode } from 'react'
import { RiskBadge } from './RiskBadge'
import {
  getResidentDetail, type ResidentDetail,
  postHomeVisitation, type HomeVisitationForm,
  postProcessRecording, type ProcessRecordingForm,
} from '../../lib/adminApi'

interface Props {
  residentId: number
  onClose: () => void
}

function fmt(val: string | null | undefined) {
  return val ?? '—'
}

function fmtDate(val: string | null | undefined) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString()
}

function fmtScore(val: number | null | undefined) {
  if (val == null) return '—'
  return val.toFixed(1)
}

function fmtPct(val: number | null | undefined) {
  if (val == null) return '—'
  return `${Math.round(val)}%`
}

function HealthTrendBadge({ note }: { note: string | null | undefined }) {
  if (!note) return <span className="text-xs text-[var(--text)]">—</span>
  if (note.toLowerCase().includes('improving')) return <span className="badge badge-success text-xs">Improving</span>
  if (note.toLowerCase().includes('declining')) return <span className="badge badge-error text-xs">Declining</span>
  if (note.toLowerCase().includes('stable'))   return <span className="badge badge-ghost text-xs">Stable</span>
  return <span className="text-xs text-[var(--text)]">{note}</span>
}

function SeverityBadge({ level }: { level: string | null | undefined }) {
  if (!level) return <span className="text-xs text-[var(--text)]">—</span>
  if (level === 'Critical') return <span className="badge badge-error text-xs">Critical</span>
  if (level === 'High')     return <span className="badge badge-error text-xs opacity-80">High</span>
  if (level === 'Medium')   return <span className="badge badge-warning text-xs">Medium</span>
  return <span className="badge badge-ghost text-xs">{level}</span>
}

function SubCatTags({ resident }: { resident: ResidentDetail['resident'] }) {
  const tags: string[] = []
  if (resident.subCatOrphaned)     tags.push('Orphaned')
  if (resident.subCatTrafficked)   tags.push('Trafficked')
  if (resident.subCatChildLabor)   tags.push('Child Labor')
  if (resident.subCatPhysicalAbuse) tags.push('Physical Abuse')
  if (resident.subCatSexualAbuse)  tags.push('Sexual Abuse')
  if (resident.subCatOsaec)        tags.push('OSAEC')
  if (resident.subCatCicl)         tags.push('CICL')
  if (resident.subCatAtRisk)       tags.push('At Risk')
  if (resident.subCatStreetChild)  tags.push('Street Child')
  if (resident.subCatChildWithHiv) tags.push('Child w/ HIV')
  if (tags.length === 0) return <span className="text-xs text-[var(--text)]">None</span>
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(t => <span key={t} className="badge badge-ghost text-xs">{t}</span>)}
    </div>
  )
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h4 className="text-sm font-semibold text-[var(--text-h)] border-b border-[var(--border)] pb-1 mb-3">{title}</h4>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2 text-xs py-0.5">
      <span className="w-36 shrink-0 text-[var(--text)] font-medium">{label}</span>
      <span className="text-[var(--text-h)]">{children}</span>
    </div>
  )
}

type ActiveForm = 'visitation' | 'recording' | null

const TODAY = new Date().toISOString().slice(0, 10)

const EMPTY_VISITATION: HomeVisitationForm = {
  visitDate: TODAY, socialWorker: '', visitType: 'Routine Follow-Up',
  locationVisited: '', familyMembersPresent: '', purpose: '', observations: '',
  familyCooperationLevel: 'Cooperative', safetyConcernsNoted: false,
  followUpNeeded: false, followUpNotes: '', visitOutcome: 'Favorable',
}

const EMPTY_RECORDING: ProcessRecordingForm = {
  sessionDate: TODAY, socialWorker: '', sessionType: 'Individual',
  sessionDurationMinutes: '', emotionalStateObserved: 'Calm', emotionalStateEnd: 'Calm',
  sessionNarrative: '', interventionsApplied: '', followUpActions: '',
  progressNoted: false, concernsFlagged: false, referralMade: false, notesRestricted: '',
}

export function ResidentDetailModal({ residentId, onClose }: Props) {
  const [detail, setDetail] = useState<ResidentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const bodyRef    = useRef<HTMLDivElement>(null)

  const [activeForm, setActiveForm] = useState<ActiveForm>(null)
  const [visitForm, setVisitForm]   = useState<HomeVisitationForm>(EMPTY_VISITATION)
  const [recForm, setRecForm]       = useState<ProcessRecordingForm>(EMPTY_RECORDING)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg]   = useState<string | null>(null)

  function openForm(form: ActiveForm) {
    setActiveForm(f => f === form ? null : form)
    setSubmitMsg(null)
    setTimeout(() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }

  async function submitVisitation(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await postHomeVisitation(residentId, visitForm)
      setSubmitMsg('Home visitation saved.')
      setVisitForm(EMPTY_VISITATION)
      setActiveForm(null)
    } catch {
      setSubmitMsg('Error saving — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitRecording(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await postProcessRecording(residentId, recForm)
      setSubmitMsg('Process recording saved.')
      setRecForm(EMPTY_RECORDING)
      setActiveForm(null)
    } catch {
      setSubmitMsg('Error saving — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    setDetail(null)
    getResidentDetail(residentId)
      .then(setDetail)
      .catch(() => setError('Failed to load resident details.'))
      .finally(() => setLoading(false))
  }, [residentId])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-[var(--text-h)] font-semibold">
            Resident Detail{detail ? ` — ${detail.resident.internalCode}` : ''}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text)] hover:text-[var(--text-h)] text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">
          {loading && <p className="text-sm text-[var(--text)]">Loading…</p>}
          {error   && <p className="text-sm text-[var(--alert)]">{error}</p>}

          {detail && (
            <>
              {/* ── Section 1: Resident Profile ──────────────────────────────── */}
              <section>
                <SectionHeading title="Resident Profile" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5">
                  <DetailRow label="Internal Code">{fmt(detail.resident.internalCode)}</DetailRow>
                  <DetailRow label="Case Status">{fmt(detail.resident.caseStatus)}</DetailRow>
                  <DetailRow label="Case Category">{fmt(detail.resident.caseCategory)}</DetailRow>
                  <DetailRow label="Social Worker">{fmt(detail.resident.assignedSocialWorker)}</DetailRow>
                  <DetailRow label="Risk Level">
                    <span className="flex items-center gap-2">
                      {detail.resident.initialRiskLevel && <RiskBadge level={detail.resident.initialRiskLevel} />}
                      {detail.resident.initialRiskLevel && detail.resident.currentRiskLevel && <span className="text-[var(--text)]">→</span>}
                      {detail.resident.currentRiskLevel && <RiskBadge level={detail.resident.currentRiskLevel} />}
                      {!detail.resident.currentRiskLevel && '—'}
                    </span>
                  </DetailRow>
                  <DetailRow label="Date of Admission">{fmtDate(detail.resident.dateOfAdmission)}</DetailRow>
                  <DetailRow label="Length of Stay">{fmt(detail.resident.lengthOfStay)}</DetailRow>
                  <DetailRow label="Date Enrolled">{fmtDate(detail.resident.dateEnrolled)}</DetailRow>
                  <DetailRow label="Reintegration Type">{fmt(detail.resident.reintegrationType)}</DetailRow>
                  <DetailRow label="Reintegration Status">{fmt(detail.resident.reintegrationStatus)}</DetailRow>
                  {detail.resident.isPwd && (
                    <DetailRow label="PWD Type">{fmt(detail.resident.pwdType)}</DetailRow>
                  )}
                  {detail.resident.hasSpecialNeeds && (
                    <DetailRow label="Special Needs">{fmt(detail.resident.specialNeedsDiagnosis)}</DetailRow>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-medium text-[var(--text)] mr-2">Sub-categories:</span>
                  <SubCatTags resident={detail.resident} />
                </div>
              </section>

              {/* ── Section 2: Health & Wellbeing ────────────────────────────── */}
              <section>
                <SectionHeading title="Health & Wellbeing" />
                {detail.healthRecords.length === 0 ? (
                  <p className="text-xs text-[var(--text)]">No health records.</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className="text-[var(--text)] font-medium">Latest trend:</span>
                      <HealthTrendBadge note={detail.healthRecords[0]?.medicalNotesRestricted} />
                    </div>
                    <div className="table-container overflow-x-auto">
                      <table className="text-xs">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>General</th>
                            <th>Nutrition</th>
                            <th>Sleep</th>
                            <th>Energy</th>
                            <th>Medical</th>
                            <th>Dental</th>
                            <th>Psych.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.healthRecords.map(h => (
                            <tr key={h.healthRecordId}>
                              <td>{fmtDate(h.recordDate)}</td>
                              <td>{fmtScore(h.generalHealthScore)}</td>
                              <td>{fmtScore(h.nutritionScore)}</td>
                              <td>{fmtScore(h.sleepScore)}</td>
                              <td>{fmtScore(h.energyScore)}</td>
                              <td>{h.medicalCheckupDone ? 'Yes' : 'No'}</td>
                              <td>{h.dentalCheckupDone ? 'Yes' : 'No'}</td>
                              <td>{h.psychologicalCheckupDone ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>

              {/* ── Section 3: Education ─────────────────────────────────────── */}
              <section>
                <SectionHeading title="Education (Most Recent)" />
                {!detail.educationRecord ? (
                  <p className="text-xs text-[var(--text)]">No education records.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5">
                    <DetailRow label="Record Date">{fmtDate(detail.educationRecord.recordDate)}</DetailRow>
                    <DetailRow label="Education Level">{fmt(detail.educationRecord.educationLevel)}</DetailRow>
                    <DetailRow label="School">{fmt(detail.educationRecord.schoolName)}</DetailRow>
                    <DetailRow label="Enrollment Status">{fmt(detail.educationRecord.enrollmentStatus)}</DetailRow>
                    <DetailRow label="Attendance Rate">{fmtPct(detail.educationRecord.attendanceRate)}</DetailRow>
                    <DetailRow label="Progress">{fmtPct(detail.educationRecord.progressPercent)}</DetailRow>
                    <DetailRow label="Completion">{fmt(detail.educationRecord.completionStatus)}</DetailRow>
                    {detail.educationRecord.notes && (
                      <div className="col-span-2 mt-1">
                        <DetailRow label="Notes">{detail.educationRecord.notes}</DetailRow>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* ── Section 4: Incidents ─────────────────────────────────────── */}
              <section>
                <SectionHeading title="Incidents" />
                {detail.incidents.length === 0 ? (
                  <p className="text-xs text-[var(--text)]">No incidents recorded.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {detail.incidents.map(inc => (
                      <div key={inc.incidentId} className="border border-[var(--border)] rounded-lg p-3 text-xs">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-semibold text-[var(--text-h)]">{fmt(inc.incidentType)}</span>
                          <SeverityBadge level={inc.severity} />
                          {inc.resolved
                            ? <span className="badge badge-success text-xs">Resolved</span>
                            : <span className="badge badge-error text-xs">Unresolved</span>
                          }
                          {inc.followUpRequired && <span className="badge badge-warning text-xs">Follow-up Required</span>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                          <DetailRow label="Date">{fmtDate(inc.incidentDate)}</DetailRow>
                          {inc.resolved && <DetailRow label="Resolved On">{fmtDate(inc.resolutionDate)}</DetailRow>}
                          <DetailRow label="Reported By">{fmt(inc.reportedBy)}</DetailRow>
                        </div>
                        {inc.description && <DetailRow label="Description">{inc.description}</DetailRow>}
                        {inc.responseTaken && <DetailRow label="Response Taken">{inc.responseTaken}</DetailRow>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Section 5: Intervention Plans ────────────────────────────── */}
              <section>
                <SectionHeading title="Intervention Plans" />
                {detail.interventions.length === 0 ? (
                  <p className="text-xs text-[var(--text)]">No intervention plans.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {detail.interventions.map(plan => (
                      <div key={plan.planId} className="border border-[var(--border)] rounded-lg p-3 text-xs">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-semibold text-[var(--text-h)]">{fmt(plan.planCategory)}</span>
                          <span className="badge badge-ghost text-xs">{fmt(plan.status)}</span>
                        </div>
                        {plan.planDescription && <DetailRow label="Description">{plan.planDescription}</DetailRow>}
                        {plan.servicesProvided && <DetailRow label="Services">{plan.servicesProvided}</DetailRow>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mt-0.5">
                          <DetailRow label="Target Date">{fmtDate(plan.targetDate)}</DetailRow>
                          <DetailRow label="Conference Date">{fmtDate(plan.caseConferenceDate)}</DetailRow>
                          <DetailRow label="Created">{fmtDate(plan.createdAt)}</DetailRow>
                          <DetailRow label="Updated">{fmtDate(plan.updatedAt)}</DetailRow>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Section 6: Last Home Visitation ──────────────────────────── */}
              <section>
                <SectionHeading title="Last Home Visitation" />
                {!detail.lastVisitation ? (
                  <p className="text-xs text-[var(--text)]">No home visitations recorded.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5">
                    <DetailRow label="Visit Date">{fmtDate(detail.lastVisitation.visitDate)}</DetailRow>
                    <DetailRow label="Social Worker">{fmt(detail.lastVisitation.socialWorker)}</DetailRow>
                    <DetailRow label="Visit Type">{fmt(detail.lastVisitation.visitType)}</DetailRow>
                    <DetailRow label="Location">{fmt(detail.lastVisitation.locationVisited)}</DetailRow>
                    <DetailRow label="Family Present">{fmt(detail.lastVisitation.familyMembersPresent)}</DetailRow>
                    <DetailRow label="Cooperation">{fmt(detail.lastVisitation.familyCooperationLevel)}</DetailRow>
                    <DetailRow label="Safety Concerns">{detail.lastVisitation.safetyConcernsNoted ? 'Yes' : 'No'}</DetailRow>
                    <DetailRow label="Follow-up Needed">{detail.lastVisitation.followUpNeeded ? 'Yes' : 'No'}</DetailRow>
                    <DetailRow label="Outcome">{fmt(detail.lastVisitation.visitOutcome)}</DetailRow>
                    {detail.lastVisitation.purpose && (
                      <div className="col-span-2">
                        <DetailRow label="Purpose">{detail.lastVisitation.purpose}</DetailRow>
                      </div>
                    )}
                    {detail.lastVisitation.observations && (
                      <div className="col-span-2">
                        <DetailRow label="Observations">{detail.lastVisitation.observations}</DetailRow>
                      </div>
                    )}
                    {detail.lastVisitation.followUpNotes && (
                      <div className="col-span-2">
                        <DetailRow label="Follow-up Notes">{detail.lastVisitation.followUpNotes}</DetailRow>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ── Inline form: Home Visitation ────────────────────────────── */}
          {activeForm === 'visitation' && (
            <form onSubmit={submitVisitation} className="border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3 text-xs">
              <h4 className="text-sm font-semibold text-[var(--text-h)]">New Home Visitation</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Visit Date *</span>
                  <input type="date" required className="input input-sm" value={visitForm.visitDate}
                    onChange={e => setVisitForm(f => ({ ...f, visitDate: e.target.value }))} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Social Worker *</span>
                  <input type="text" required className="input input-sm" placeholder="Name" value={visitForm.socialWorker}
                    onChange={e => setVisitForm(f => ({ ...f, socialWorker: e.target.value }))} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Visit Type</span>
                  <select className="select select-sm" value={visitForm.visitType}
                    onChange={e => setVisitForm(f => ({ ...f, visitType: e.target.value }))}>
                    {['Routine Follow-Up','Initial Visit','Follow-Up','Emergency Visit','Closure Visit'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Location Visited</span>
                  <input type="text" className="input input-sm" value={visitForm.locationVisited}
                    onChange={e => setVisitForm(f => ({ ...f, locationVisited: e.target.value }))} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Family Members Present</span>
                  <input type="text" className="input input-sm" value={visitForm.familyMembersPresent}
                    onChange={e => setVisitForm(f => ({ ...f, familyMembersPresent: e.target.value }))} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Family Cooperation</span>
                  <select className="select select-sm" value={visitForm.familyCooperationLevel}
                    onChange={e => setVisitForm(f => ({ ...f, familyCooperationLevel: e.target.value }))}>
                    {['Cooperative','Partially Cooperative','Uncooperative'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Visit Outcome</span>
                  <select className="select select-sm" value={visitForm.visitOutcome}
                    onChange={e => setVisitForm(f => ({ ...f, visitOutcome: e.target.value }))}>
                    {['Favorable','Neutral','Unfavorable'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </label>
                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-xs" checked={visitForm.safetyConcernsNoted}
                      onChange={e => setVisitForm(f => ({ ...f, safetyConcernsNoted: e.target.checked }))} />
                    <span className="text-[var(--text)]">Safety Concerns</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-xs" checked={visitForm.followUpNeeded}
                      onChange={e => setVisitForm(f => ({ ...f, followUpNeeded: e.target.checked }))} />
                    <span className="text-[var(--text)]">Follow-up Needed</span>
                  </label>
                </div>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[var(--text)] font-medium">Purpose</span>
                <textarea rows={2} className="textarea textarea-sm resize-none" value={visitForm.purpose}
                  onChange={e => setVisitForm(f => ({ ...f, purpose: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[var(--text)] font-medium">Observations</span>
                <textarea rows={2} className="textarea textarea-sm resize-none" value={visitForm.observations}
                  onChange={e => setVisitForm(f => ({ ...f, observations: e.target.value }))} />
              </label>
              {visitForm.followUpNeeded && (
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Follow-up Notes</span>
                  <textarea rows={2} className="textarea textarea-sm resize-none" value={visitForm.followUpNotes}
                    onChange={e => setVisitForm(f => ({ ...f, followUpNotes: e.target.value }))} />
                </label>
              )}
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setActiveForm(null)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Visitation'}
                </button>
              </div>
            </form>
          )}

          {/* ── Inline form: Process Recording ──────────────────────────── */}
          {activeForm === 'recording' && (
            <form onSubmit={submitRecording} className="border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3 text-xs">
              <h4 className="text-sm font-semibold text-[var(--text-h)]">New Process Recording</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Session Date *</span>
                  <input type="date" required className="input input-sm" value={recForm.sessionDate}
                    onChange={e => setRecForm(f => ({ ...f, sessionDate: e.target.value }))} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Social Worker *</span>
                  <input type="text" required className="input input-sm" placeholder="Name" value={recForm.socialWorker}
                    onChange={e => setRecForm(f => ({ ...f, socialWorker: e.target.value }))} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Session Type</span>
                  <select className="select select-sm" value={recForm.sessionType}
                    onChange={e => setRecForm(f => ({ ...f, sessionType: e.target.value }))}>
                    {['Individual','Group','Family'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Duration (min)</span>
                  <input type="number" min={1} className="input input-sm" value={recForm.sessionDurationMinutes}
                    onChange={e => setRecForm(f => ({ ...f, sessionDurationMinutes: e.target.value === '' ? '' : Number(e.target.value) }))} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Emotional State (Start)</span>
                  <select className="select select-sm" value={recForm.emotionalStateObserved}
                    onChange={e => setRecForm(f => ({ ...f, emotionalStateObserved: e.target.value }))}>
                    {['Calm','Anxious','Depressed','Agitated','Happy'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--text)] font-medium">Emotional State (End)</span>
                  <select className="select select-sm" value={recForm.emotionalStateEnd}
                    onChange={e => setRecForm(f => ({ ...f, emotionalStateEnd: e.target.value }))}>
                    {['Calm','Anxious','Depressed','Agitated','Happy'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </label>
                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-xs" checked={recForm.progressNoted}
                      onChange={e => setRecForm(f => ({ ...f, progressNoted: e.target.checked }))} />
                    <span className="text-[var(--text)]">Progress Noted</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-xs" checked={recForm.concernsFlagged}
                      onChange={e => setRecForm(f => ({ ...f, concernsFlagged: e.target.checked }))} />
                    <span className="text-[var(--text)]">Concerns Flagged</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-xs" checked={recForm.referralMade}
                      onChange={e => setRecForm(f => ({ ...f, referralMade: e.target.checked }))} />
                    <span className="text-[var(--text)]">Referral Made</span>
                  </label>
                </div>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[var(--text)] font-medium">Session Narrative</span>
                <textarea rows={3} className="textarea textarea-sm resize-none" value={recForm.sessionNarrative}
                  onChange={e => setRecForm(f => ({ ...f, sessionNarrative: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[var(--text)] font-medium">Interventions Applied</span>
                <textarea rows={2} className="textarea textarea-sm resize-none" value={recForm.interventionsApplied}
                  onChange={e => setRecForm(f => ({ ...f, interventionsApplied: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[var(--text)] font-medium">Follow-up Actions</span>
                <textarea rows={2} className="textarea textarea-sm resize-none" value={recForm.followUpActions}
                  onChange={e => setRecForm(f => ({ ...f, followUpActions: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[var(--text)] font-medium">Restricted Notes</span>
                <textarea rows={2} className="textarea textarea-sm resize-none" value={recForm.notesRestricted}
                  onChange={e => setRecForm(f => ({ ...f, notesRestricted: e.target.value }))} />
              </label>
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setActiveForm(null)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Recording'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sticky footer — always visible, outside scrollable body */}
        <div className="flex items-center gap-3 px-6 py-3 border-t border-[var(--border)] bg-[var(--card)] flex-shrink-0">
          <button
            className={`btn btn-sm ${activeForm === 'visitation' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => openForm('visitation')}
          >
            {activeForm === 'visitation' ? '✕ Home Visitation' : '+ Home Visitation'}
          </button>
          <button
            className={`btn btn-sm ${activeForm === 'recording' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => openForm('recording')}
          >
            {activeForm === 'recording' ? '✕ Record Process' : '+ Record Process'}
          </button>
          {submitMsg && (
            <span className={`text-xs ml-auto ${submitMsg.startsWith('Error') ? 'text-[var(--alert)]' : 'text-success'}`}>
              {submitMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
