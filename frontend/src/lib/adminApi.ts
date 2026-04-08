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


// ── Residents & Case Management ───────────────────────────────────────────────

export interface ResidentsSummary {
  activeResidents: number
  highCriticalRisk: number
  reintegrationInProgress: number
  upcomingConferences: number
}

export interface SafehouseOverviewRow {
  safehouseId: number
  name: string
  region: string
  capacity: number
  occupancy: number
  avgEducationProgress: number | null
  avgHealthScore: number | null
  processRecordingCount: number | null
  incidentCount: number | null
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

export const getRiskBySafehouse = () =>
  get<RiskBySafehouse[]>('/api/admin/residents/risk-by-safehouse')

export const getRiskEscalations = () =>
  get<RiskEscalation[]>('/api/admin/residents/risk-escalations')

export const getRecentRecordings = () =>
  get<RecentRecording[]>('/api/admin/process-recordings/recent')

export const getRecentIncidents = () =>
  get<RecentIncident[]>('/api/admin/incidents/recent')


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
