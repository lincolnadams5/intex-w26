// ── Admin API: typed fetch wrappers for all admin endpoints ──────────────────
// Every function uses authFetch so the JWT is attached automatically.
// All routes require the Admin role (enforced server-side).

import { authFetch } from './api'


// ── Shared helpers ────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await authFetch(path)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}


// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  activeResidents: number
  highCriticalRisk: number
  activeDonors: number
  monthlyDonationsTotal: number
}

export interface ActivityItem {
  type: 'donation' | 'incident' | 'recording' | 'visitation'
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

export const getDashboardSummary = () =>
  get<DashboardSummary>('/api/admin/dashboard/summary')

export const getDashboardActivity = () =>
  get<ActivityItem[]>('/api/admin/dashboard/activity')

export const getDashboardConferences = () =>
  get<ConferenceItem[]>('/api/admin/dashboard/conferences')


// ── Donors & Contributions ────────────────────────────────────────────────────

export interface DonorsSummary {
  totalAllTime: number
  totalSupporters: number
  activeSupporters: number
  inactiveSupporters: number
  recurringDonors: number
}

export interface MonthlyTotal {
  label: string
  total: number
}

export interface DonationByType {
  donationType: string
  count: number
  total: number
}

export interface DonationByChannel {
  channel: string
  total: number
}

export interface DonationByCampaign {
  campaignName: string
  total: number
  donorCount: number
}

export interface AllocationRow {
  safehouseName: string
  programArea: string
  total: number
}

export interface RecentDonation {
  donationId: number
  donorName: string
  donationType: string
  amount: number
  donationDate: string | null
  campaignName: string
  channelSource: string
  isRecurring: boolean
}

export interface PagedResult<T> {
  total: number
  items: T[]
}

export const getDonorsSummary = () =>
  get<DonorsSummary>('/api/admin/donors/summary')

export const getDonorTrends = () =>
  get<MonthlyTotal[]>('/api/admin/donors/trends')

export const getDonationsByType = () =>
  get<DonationByType[]>('/api/admin/donors/by-type')

export const getDonationsByChannel = () =>
  get<DonationByChannel[]>('/api/admin/donors/by-channel')

export const getDonationsByCampaign = () =>
  get<DonationByCampaign[]>('/api/admin/donors/by-campaign')

export const getDonationAllocations = () =>
  get<AllocationRow[]>('/api/admin/donors/allocations')

export const getRecentDonations = (page: number, pageSize = 5) =>
  get<PagedResult<RecentDonation>>(
    `/api/admin/donors/recent?page=${page}&pageSize=${pageSize}`
  )

export interface ImpactSummaryItem {
  safehouseName: string
  totalFunded: number
  residentsReady: number
  residentsDeveloping: number
  residentsLow: number
}

export const getDonorImpactSummary = () =>
  get<ImpactSummaryItem[]>('/api/admin/donors/impact-summary')


// ── Residents & Case Management ───────────────────────────────────────────────

export interface ResidentsSummary {
  activeResidents: number
  highCriticalRisk: number
  reintegrationInProgress: number
  unresolvedHighIncidents: number
}

export interface ResidentRow {
  residentId: number
  internalCode: string
  safehouseName: string
  caseStatus: string
  currentRiskLevel: string | null
  reintegrationType: string | null
  reintegrationStatus: string | null
  hasUnresolvedIncident: boolean
  healthTrend: 'Improving' | 'Stable' | 'Declining' | null
  noRecentProgress: boolean
  lengthOfStay: string | null
  readinessBand: string | null
  readinessFlag: boolean
}

export interface ResidentDetailRecord {
  residentId: number
  internalCode: string | null
  caseStatus: string | null
  caseCategory: string | null
  subCatOrphaned: boolean | null
  subCatTrafficked: boolean | null
  subCatChildLabor: boolean | null
  subCatPhysicalAbuse: boolean | null
  subCatSexualAbuse: boolean | null
  subCatOsaec: boolean | null
  subCatCicl: boolean | null
  subCatAtRisk: boolean | null
  subCatStreetChild: boolean | null
  subCatChildWithHiv: boolean | null
  isPwd: boolean | null
  pwdType: string | null
  hasSpecialNeeds: boolean | null
  specialNeedsDiagnosis: string | null
  initialRiskLevel: string | null
  currentRiskLevel: string | null
  dateOfAdmission: string | null
  lengthOfStay: string | null
  reintegrationType: string | null
  reintegrationStatus: string | null
  dateEnrolled: string | null
  dateClosed: string | null
  assignedSocialWorker: string | null
}

export interface ResidentDetailHealth {
  healthRecordId: number
  recordDate: string | null
  generalHealthScore: number | null
  nutritionScore: number | null
  sleepScore: number | null
  energyScore: number | null
  medicalCheckupDone: boolean | null
  dentalCheckupDone: boolean | null
  psychologicalCheckupDone: boolean | null
  medicalNotesRestricted: string | null
}

export interface ResidentDetailEducation {
  educationRecordId: number
  recordDate: string | null
  educationLevel: string | null
  schoolName: string | null
  enrollmentStatus: string | null
  attendanceRate: number | null
  progressPercent: number | null
  completionStatus: string | null
  notes: string | null
}

export interface ResidentDetailIncident {
  incidentId: number
  incidentDate: string | null
  incidentType: string | null
  severity: string | null
  description: string | null
  responseTaken: string | null
  resolved: boolean | null
  resolutionDate: string | null
  followUpRequired: boolean | null
  reportedBy: string | null
}

export interface ResidentDetailIntervention {
  planId: number
  planCategory: string | null
  planDescription: string | null
  servicesProvided: string | null
  targetValue: number | null
  targetDate: string | null
  status: string | null
  caseConferenceDate: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface ResidentDetailVisitation {
  visitationId: number
  visitDate: string | null
  socialWorker: string | null
  visitType: string | null
  locationVisited: string | null
  familyMembersPresent: string | null
  purpose: string | null
  observations: string | null
  familyCooperationLevel: string | null
  safetyConcernsNoted: boolean | null
  followUpNeeded: boolean | null
  followUpNotes: string | null
  visitOutcome: string | null
}

export interface ResidentDetail {
  resident: ResidentDetailRecord
  healthRecords: ResidentDetailHealth[]
  educationRecord: ResidentDetailEducation | null
  incidents: ResidentDetailIncident[]
  interventions: ResidentDetailIntervention[]
  lastVisitation: ResidentDetailVisitation | null
}

export interface ResidentAlertsEscalation {
  internalCode: string
  safehouseName: string
  initialRiskLevel: string
  currentRiskLevel: string
  lengthOfStay: string
}

export interface ResidentAlertsIncident {
  incidentId: number
  residentCode: string
  safehouseName: string
  incidentDate: string | null
  incidentType: string
}

export interface ResidentAlertsNoRecording {
  residentId: number
  internalCode: string
  safehouseName: string
}

export interface ResidentAlerts {
  riskEscalations: ResidentAlertsEscalation[]
  unresolvedHighIncidents: ResidentAlertsIncident[]
  noRecentRecording: ResidentAlertsNoRecording[]
}

export interface SafehouseOverviewRow {
  safehouseId: number
  name: string
  region: string
  status: string
  capacity: number
  occupancy: number
  avgEducationProgress: number | null
  avgHealthScore: number | null
  processRecordingCount: number | null
  incidentCount: number | null
}

export interface SafehouseMonthlyPoint {
  month: string
  safehouseName: string
  incidentCount: number
  avgHealthScore: number | null
  avgEducationProgress: number | null
}

export interface RiskBySafehouse {
  safehouseName: string
  Low: number
  Medium: number
  High: number
  Critical: number
}

export interface RiskEscalation {
  internalCode: string
  safehouseName: string
  initialRiskLevel: string
  currentRiskLevel: string
  lengthOfStay: string
}

export interface RecentRecording {
  recordingId: number
  residentCode: string
  sessionDate: string | null
  socialWorker: string
  sessionType: string
  emotionalStateObserved: string
  emotionalStateEnd: string
  concernsFlagged: boolean
}

export interface RecentIncident {
  incidentId: number
  residentCode: string
  safehouseName: string
  incidentDate: string | null
  incidentType: string
  severity: string
  resolved: boolean
  followUpRequired: boolean
}

export const getResidentsSummary = () =>
  get<ResidentsSummary>('/api/admin/residents/summary')

export const getSafehousesOverview = () =>
  get<SafehouseOverviewRow[]>('/api/admin/safehouses/overview')

export const getSafehouseMonthlyMetrics = () =>
  get<SafehouseMonthlyPoint[]>('/api/admin/safehouses/monthly-metrics')

export const getRiskBySafehouse = () =>
  get<RiskBySafehouse[]>('/api/admin/residents/risk-by-safehouse')

export interface SafehouseOutcomeCoefficient {
  id: number
  runDate: string | null
  feature: string | null
  betaHealth: number | null
  seHealth: number | null
  pHealth: number | null
  sigHealth: string | null
  betaEdu: number | null
  seEdu: number | null
  pEdu: number | null
  sigEdu: string | null
}

export interface SafehouseOutcomeDriver {
  id: number
  runDate: string | null
  safehouseId: number | null
  safehouseName: string | null
  region: string | null
  varHealth: number | null
  varEdu: number | null
  flaggedHealth: boolean | null
  flaggedEdu: boolean | null
  flaggedFor: string | null
  note: string | null
}

export const getOutcomeCoefficients = () =>
  get<SafehouseOutcomeCoefficient[]>('/api/admin/safehouses/outcome-coefficients')

export const getOutcomeDrivers = () =>
  get<SafehouseOutcomeDriver[]>('/api/admin/safehouses/outcome-drivers')

export const getRiskEscalations = () =>
  get<RiskEscalation[]>('/api/admin/residents/risk-escalations')

export const getRecentRecordings = () =>
  get<RecentRecording[]>('/api/admin/process-recordings/recent')

export const getRecentIncidents = () =>
  get<RecentIncident[]>('/api/admin/incidents/recent')

export interface ResidentListParams {
  status?: string
  safehouseId?: number
  riskLevel?: string
  reintegrationType?: string
  hasUnresolvedIncident?: string
  search?: string
}

export const getResidentsList = (params: ResidentListParams = {}) => {
  const qs = new URLSearchParams()
  if (params.status)                 qs.set('status', params.status)
  if (params.safehouseId)            qs.set('safehouseId', String(params.safehouseId))
  if (params.riskLevel)              qs.set('riskLevel', params.riskLevel)
  if (params.reintegrationType)      qs.set('reintegrationType', params.reintegrationType)
  if (params.hasUnresolvedIncident)  qs.set('hasUnresolvedIncident', params.hasUnresolvedIncident)
  if (params.search)                 qs.set('search', params.search)
  return get<ResidentRow[]>(`/api/admin/residents/list?${qs.toString()}`)
}

export const getResidentDetail = (id: number) =>
  get<ResidentDetail>(`/api/admin/residents/${id}/detail`)

export const getResidentAlerts = () =>
  get<ResidentAlerts>('/api/admin/residents/alerts')

export interface HomeVisitationForm {
  visitDate: string
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

export interface ProcessRecordingForm {
  sessionDate: string
  socialWorker: string
  sessionType: string
  sessionDurationMinutes: number | ''
  emotionalStateObserved: string
  emotionalStateEnd: string
  sessionNarrative: string
  interventionsApplied: string
  followUpActions: string
  progressNoted: boolean
  concernsFlagged: boolean
  referralMade: boolean
  notesRestricted: string
}

export const postHomeVisitation = (residentId: number, data: HomeVisitationForm) =>
  authFetch(`/api/admin/residents/${residentId}/home-visitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => { if (!r.ok) throw new Error('Failed to save home visitation') })

export const postProcessRecording = (residentId: number, data: ProcessRecordingForm) =>
  authFetch(`/api/admin/residents/${residentId}/process-recording`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => { if (!r.ok) throw new Error('Failed to save process recording') })


// ── Social Media Analytics ────────────────────────────────────────────────────

export interface SocialSummary {
  totalPosts: number
  avgEngagementRate: number
  totalReferrals: number
  totalReferralValue: number
}

export interface PlatformEngagement {
  platform: string
  avgEngagementRate: number
  postCount: number
}

export interface PostTypeEngagement {
  postType: string
  avgEngagementRate: number
  postCount: number
}

export interface ContentTopicEngagement {
  contentTopic: string
  avgEngagementRate: number
  postCount: number
}

export interface ReferralTrendItem {
  label: string
  totalReferrals: number
  postCount: number
}

export interface HeatmapCell {
  day: string
  hourBucket: number
  avgEngagementRate: number
}

export interface TopPost {
  postId: number
  platform: string
  postUrl: string | null
  postType: string
  contentTopic: string
  createdAt: string | null
  engagementRate: number | null
  impressions: number
  reach: number
  likes: number
  shares: number
  donationReferrals: number
  estimatedDonationValue: number
}

export const getSocialSummary = () =>
  get<SocialSummary>('/api/admin/social/summary')

export const getSocialByPlatform = () =>
  get<PlatformEngagement[]>('/api/admin/social/by-platform')

export const getSocialByPostType = () =>
  get<PostTypeEngagement[]>('/api/admin/social/by-post-type')

export const getSocialByContentTopic = () =>
  get<ContentTopicEngagement[]>('/api/admin/social/by-content-topic')

export const getSocialReferralTrend = () =>
  get<ReferralTrendItem[]>('/api/admin/social/referral-trend')

export const getSocialPostingHeatmap = () =>
  get<HeatmapCell[]>('/api/admin/social/posting-heatmap')

export const getSocialTopPosts = () =>
  get<TopPost[]>('/api/admin/social/top-posts')


// ── Social Media ML Predictions ───────────────────────────────────────────────

export interface SocialMlSummary {
  scoredPostCount: number
  totalExpectedValuePhp: number
  avgPHasDonation: number
  highImpactCount: number
  moderateImpactCount: number
  lowImpactCount: number
  minimalImpactCount: number
}

export interface SocialMlPost {
  postId: number
  platform: string
  postUrl: string | null
  postType: string
  contentTopic: string
  createdAt: string | null
  predictedValuePhp: number
  pHasDonation: number
  valueTier: string
  engagementRate: number | null
  likes: number
  shares: number
}

export interface PostScoreRequest {
  platform: string
  post_type: string
  media_type: string
  sentiment_tone: string
  has_call_to_action: number
  call_to_action_type: string
  post_hour: number
  day_of_week: string
  num_hashtags: number
  caption_length: number
  is_boosted: number
  features_resident_story: number
  content_topic: string
}

export interface PostScoreResponse {
  p_has_donation: number
  expected_value_php: number
  value_tier: string
  feature_values: Record<string, unknown>
}

export const getSocialMlSummary = () =>
  get<SocialMlSummary>('/api/admin/social/ml-summary')

export const getSocialMlTopPosts = () =>
  get<SocialMlPost[]>('/api/admin/social/ml-top-posts')

export const scorePost = async (body: PostScoreRequest): Promise<PostScoreResponse> => {
  const res = await authFetch('/api/admin/social/score-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST /api/admin/social/score-post failed: ${res.status}`)
  return res.json() as Promise<PostScoreResponse>
}


// ── ML Predictions ────────────────────────────────────────────────────────────

export interface DonorRiskScore {
  supporterId: number
  donorName: string
  riskScore: number
  atRiskPred: number
  scoredAt: string | null
  contactedAt: string | null
  riskReasons: string | null   // JSON-encoded string[] from SHAP
  totalGiven: number
}

export const getDonorRiskScores = () =>
  get<DonorRiskScore[]>('/api/admin/ml/donor-risk-scores')

export const markDonorContacted = (supporterId: number) =>
  authFetch(`/api/admin/ml/donor-risk-scores/${supporterId}/contacted`, { method: 'PUT' })

export interface DonorOutreachProfile {
  supporterId: number
  donorName: string
  preferredChannel: string | null
  cadence: string | null
  messageTemplate: string | null
  bestDay: string | null
  askType: string | null
  scoredAt: string | null
}

export const getDonorOutreachProfiles = () =>
  get<DonorOutreachProfile[]>('/api/admin/ml/donor-outreach-profiles')

export interface DonorUpgradeScore {
  supporterId: number
  donorName: string
  rfmSegment: string | null
  upgradeCandidate: boolean
  upgradeScore: number
  currentAvgGift: number
  segmentAvgGift: number
  suggestedAsk: number
  scoredAt: string | null
}

export const getDonorUpgradeScores = () =>
  get<DonorUpgradeScore[]>('/api/admin/ml/donor-upgrade-scores')


// ── User Management ───────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: string
  safehouseId: number | null
  supporterId: number | null
  createdAt: string
  isActive: boolean
}

export const getUsers = () =>
  get<UserProfile[]>('/api/admin/users')

export const changeUserRole = (id: string, role: string) =>
  authFetch(`/api/admin/users/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })

export const deactivateUser = (id: string) =>
  authFetch(`/api/admin/users/${id}/deactivate`, { method: 'PUT' })

export const deleteUser = (id: string) =>
  authFetch(`/api/admin/users/${id}`, { method: 'DELETE' })

export const reactivateUser = (id: string) =>
  authFetch(`/api/admin/users/${id}/reactivate`, { method: 'PUT' })
