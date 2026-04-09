// ── Staff API: typed fetch wrappers for all staff endpoints ───────────────────
// Every function uses authFetch so the JWT is attached automatically.
// All routes require the Staff or Admin role (enforced server-side).

import { authFetch } from './api'


// ── Shared helpers ────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await authFetch(path)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await authFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export interface PagedResult<T> {
  total: number
  items: T[]
}


// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface StaffDashboardSummary {
  activeResidents: number
  highCriticalRisk: number
  myRecordingsThisMonth: number
  upcomingConferences: number
}

export interface ActivityItem {
  type: 'incident' | 'recording' | 'visitation'
  label: string
  detail: string
  date: string
}

export interface ConferenceItem {
  residentCode: string
  planCategory: string | null
  status: string | null
  conferenceDate: string
}

export const getStaffDashboardSummary = () =>
  get<StaffDashboardSummary>('/api/staff/dashboard/summary')

export const getStaffDashboardActivity = () =>
  get<ActivityItem[]>('/api/staff/dashboard/activity')

export const getStaffDashboardConferences = () =>
  get<ConferenceItem[]>('/api/staff/dashboard/conferences')


// ── Residents & Case Management ───────────────────────────────────────────────

export interface StaffResidentStats {
  activeResidents: number
  highCriticalRisk: number
  reintegrationInProgress: number
  upcomingConferences: number
}

export interface MySafehouseCard {
  name: string
  region: string
  capacity: number
  occupancy: number
  avgEducationProgress: number | null
  avgHealthScore: number | null
  processRecordingsThisMonth: number
  incidentsThisMonth: number
}

export interface StaffResidentsSummary {
  stats: StaffResidentStats
  safehouse: MySafehouseCard | null
}

export interface CaseloadItem {
  residentId: number
  internalCode: string
  caseCategory: string
  currentRiskLevel: string
  dateOfAdmission: string | null
  assignedSocialWorker: string
  caseStatus: string
}

export interface ResidentSubCategories {
  orphaned: boolean
  trafficked: boolean
  childLabor: boolean
  physicalAbuse: boolean
  sexualAbuse: boolean
  osaec: boolean
  cicl: boolean
  atRisk: boolean
  streetChild: boolean
  childWithHiv: boolean
}

export interface ResidentDetail {
  residentId: number
  internalCode: string
  caseCategory: string
  sex: string
  dateOfBirth: string | null
  ageUponAdmission: string
  presentAge: string
  dateOfAdmission: string | null
  referralSource: string
  assignedSocialWorker: string
  currentRiskLevel: string
  initialRiskLevel: string
  caseStatus: string
  reintegrationStatus: string | null
  isPwd: boolean
  pwdType: string | null
  familyIs4ps: boolean
  familySoloParent: boolean
  familyIndigenous: boolean
  familyInformalSettler: boolean
  subCategories: ResidentSubCategories
}

export interface ResidentRecordingItem {
  recordingId: number
  sessionDate: string | null
  socialWorker: string
  sessionType: string
  emotionalStateObserved: string
  sessionNarrative: string
  interventionsApplied: string
  followUpActions: string
  concernsFlagged: boolean
}

export interface ResidentVisitItem {
  visitationId: number
  visitDate: string | null
  socialWorker: string
  visitType: string
  locationVisited: string
  familyMembersPresent: string
  purpose: string
  observations: string
  familyCooperationLevel: string
  safetyConcernsNoted: boolean
  followUpNeeded: boolean
  followUpNotes: string
  visitOutcome: string
}

export interface InterventionPlanItem {
  planId: number
  planCategory: string
  planDescription: string
  servicesProvided: string
  targetValue: number | null
  targetDate: string | null
  status: string
  caseConferenceDate: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateResidentBody {
  internalCode?: string
  dateOfAdmission?: string        // ISO date string (YYYY-MM-DD)
  referralSource?: string
  assignedSocialWorker?: string
  caseCategory?: string
  subCatOrphaned?: boolean
  subCatTrafficked?: boolean
  subCatChildLabor?: boolean
  subCatPhysicalAbuse?: boolean
  subCatSexualAbuse?: boolean
  subCatOsaec?: boolean
  subCatCicl?: boolean
  subCatAtRisk?: boolean
  subCatStreetChild?: boolean
  subCatChildWithHiv?: boolean
  sex?: string
  ageUponAdmission?: string
  isPwd?: boolean
  pwdType?: string
  familyIs4ps?: boolean
  familySoloParent?: boolean
  familyIndigenous?: boolean
  familyInformalSettler?: boolean
  initialRiskLevel?: string
  notesRestricted?: string
}

export interface CreateResidentResult {
  residentId: number
  internalCode: string | null
  caseStatus: string
}

export const getStaffResidentsSummary = () =>
  get<StaffResidentsSummary>('/api/staff/residents/summary')

export const getStaffResidents = (params: {
  page?: number
  pageSize?: number
  search?: string
  riskLevel?: string
  status?: string
} = {}) => {
  const q = new URLSearchParams()
  if (params.page)      q.set('page',      String(params.page))
  if (params.pageSize)  q.set('pageSize',  String(params.pageSize))
  if (params.search)    q.set('search',    params.search)
  if (params.riskLevel) q.set('riskLevel', params.riskLevel)
  if (params.status)    q.set('status',    params.status)
  return get<PagedResult<CaseloadItem>>(`/api/staff/residents?${q}`)
}

export const getStaffResident = (id: number) =>
  get<ResidentDetail>(`/api/staff/residents/${id}`)

export const getResidentRecordings = (id: number) =>
  get<ResidentRecordingItem[]>(`/api/staff/residents/${id}/recordings`)

export const getResidentVisits = (id: number) =>
  get<ResidentVisitItem[]>(`/api/staff/residents/${id}/visits`)

export const getResidentInterventionPlan = (id: number) =>
  get<InterventionPlanItem[]>(`/api/staff/residents/${id}/intervention-plan`)

export const createResident = (body: CreateResidentBody) =>
  post<CreateResidentResult>('/api/staff/residents', body)


// ── Process Recordings ────────────────────────────────────────────────────────

export interface MyRecordingItem {
  recordingId: number
  residentCode: string
  sessionDate: string | null
  sessionType: string
  emotionalStateObserved: string
  sessionNarrative: string
  interventionsApplied: string
  followUpActions: string
  concernsFlagged: boolean
}

export interface CreateProcessRecordingBody {
  residentId: number
  sessionDate: string             // ISO datetime string
  socialWorker: string
  sessionType: string
  emotionalStateObserved: string
  narrativeSummary: string
  interventionsApplied?: string
  followUpActions?: string
  concernsFlagged: boolean
}

export const getMyProcessRecordings = (params: {
  page?: number
  pageSize?: number
  residentId?: number
} = {}) => {
  const q = new URLSearchParams()
  if (params.page)       q.set('page',       String(params.page))
  if (params.pageSize)   q.set('pageSize',   String(params.pageSize))
  if (params.residentId) q.set('residentId', String(params.residentId))
  return get<PagedResult<MyRecordingItem>>(`/api/staff/process-recordings/mine?${q}`)
}

export const createProcessRecording = (body: CreateProcessRecordingBody) =>
  post<{ recordingId: number; message: string }>('/api/staff/process-recordings', body)


// ── Home Visits ───────────────────────────────────────────────────────────────

export interface MyVisitItem {
  visitationId: number
  residentCode: string
  visitDate: string | null
  visitType: string
  safetyConcernsNoted: boolean
  followUpNeeded: boolean
  observations: string
  familyCooperationLevel: string
  visitOutcome: string
  followUpNotes: string
}

export interface CreateHomeVisitBody {
  residentId: number
  visitDate: string               // ISO datetime string
  socialWorker: string
  visitType: string
  locationVisited: string
  familyMembersPresent?: string
  purpose: string
  observations: string
  familyCooperationLevel: string
  safetyConcernsNoted: boolean
  followUpNeeded: boolean
  followUpNotes?: string
  visitOutcome: string
}

export const getMyHomeVisits = (params: {
  page?: number
  pageSize?: number
} = {}) => {
  const q = new URLSearchParams()
  if (params.page)     q.set('page',     String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  return get<PagedResult<MyVisitItem>>(`/api/staff/home-visits/mine?${q}`)
}

export const createHomeVisit = (body: CreateHomeVisitBody) =>
  post<{ visitationId: number; message: string }>('/api/staff/home-visits', body)


// ── Case Conferences ──────────────────────────────────────────────────────────

export interface CaseConference {
  residentCode: string
  planDescription: string
  planCategory: string
  conferenceDate: string
}

export interface CaseConferencesResult {
  upcoming: CaseConference[]
  history: CaseConference[]
}

export const getCaseConferences = () =>
  get<CaseConferencesResult>('/api/staff/case-conferences')
