# Admin Dashboard Metrics Plan

> Detailed metrics specification for each admin page, mapped to CSV source columns and aligned with the five project goals: **Donor Retention & Growth**, **Girls Not Falling Through the Cracks**, **Social Media Strategy**, **Easy Administration**, and **Privacy & Safety**.

---

## 1. Dashboard (Command Center)

The Dashboard is the daily overview for staff. It should surface the most urgent and actionable items from every domain at a glance.

### Stat Cards (top row)

| Metric | Calculation | Source Table(s) | Source Columns | Goal Alignment |
|--------|-------------|-----------------|----------------|----------------|
| Active Residents | `COUNT(*)` WHERE `case_status = 'Active'` | `residents` | `case_status` | Girls not falling through cracks |
| High/Critical Risk | `COUNT(*)` WHERE `current_risk_level IN ('High','Critical')` AND `case_status = 'Active'` | `residents` | `current_risk_level`, `case_status` | Girls not falling through cracks |
| Active Donors | `COUNT(*)` WHERE `status = 'Active'` | `supporters` | `status` | Donor retention |
| Monthly Donations (current month) | `SUM(amount)` WHERE `donation_date` is in current month AND `donation_type = 'Monetary'` | `donations` | `amount`, `donation_date`, `donation_type` | Donor retention & growth |

### Quick-Action Buttons

| Button | Description | Notes |
|--------|-------------|-------|
| Record a Visitation | Opens home visitation form | Placeholder — links to teammate's page |
| Record a Process | Opens process recording form | Placeholder — links to teammate's page |

### Recent Activity Feed

A chronological feed pulling the most recent entries from multiple tables. Show the 8–10 most recent events.

| Event Type | Source Table | Date Column | Display Fields |
|------------|-------------|-------------|----------------|
| New Donation | `donations` | `donation_date` | `supporter_id` (join to `supporters.display_name`), `donation_type`, `amount` |
| Incident Filed | `incident_reports` | `incident_date` | `resident_id` (join to `residents.internal_code`), `incident_type`, `severity` |
| Process Recording | `process_recordings` | `session_date` | `resident_id` → `internal_code`, `session_type`, `emotional_state_observed` |
| Home Visitation | `home_visitations` | `visit_date` | `resident_id` → `internal_code`, `visit_type`, `visit_outcome` |

### Upcoming Case Conferences

| Column | Source | Notes |
|--------|--------|-------|
| Resident | `intervention_plans.resident_id` → `residents.internal_code` | |
| Date | `intervention_plans.case_conference_date` | WHERE `case_conference_date >= TODAY` |
| Plan Category | `intervention_plans.plan_category` | |
| Status | `intervention_plans.status` | |

---

## 2. Donors & Contributions Page

This page directly serves the **Donor Retention & Growth** goal. Staff need to understand who is giving, how much, through what channels, and which campaigns work.

### Stat Cards

| Metric | Calculation | Source Table(s) | Source Columns |
|--------|-------------|-----------------|----------------|
| Total Donations (all time) | `SUM(amount)` WHERE `donation_type = 'Monetary'` | `donations` | `amount`, `donation_type` |
| Total Supporters | `COUNT(*)` | `supporters` | — |
| Active / Inactive Ratio | `COUNT(*) WHERE status='Active'` / `COUNT(*) WHERE status='Inactive'` | `supporters` | `status` |
| Recurring Donors | `COUNT(DISTINCT supporter_id)` WHERE `is_recurring = TRUE` | `donations` | `is_recurring`, `supporter_id` |

### Charts

#### Donation Trend (Line Chart — 12 months)
- **X-axis**: Month (derived from `donations.donation_date`)
- **Y-axis**: `SUM(donations.amount)` per month
- **Series**: Optionally split by `donation_type`
- **Goal**: Show growth or decline over time; identify seasonal patterns

#### Donations by Type (Pie/Donut Chart)
- **Segments**: `donations.donation_type` — Monetary, InKind, Time, Skills, SocialMedia
- **Values**: `COUNT(*)` per type OR `SUM(amount)` for monetary, `SUM(estimated_value)` for others
- **Goal**: Understand the contribution mix

#### Acquisition Channel Performance (Bar Chart)
- **X-axis**: `donations.channel_source` — Campaign, Event, Direct, SocialMedia, PartnerReferral
- **Y-axis**: `SUM(amount)` per channel
- **Goal**: Identify which channels bring in the most revenue

#### Campaign Performance (Bar Chart)
- **X-axis**: `donations.campaign_name` — Year-End Hope, Summer of Safety, Back to School, GivingTuesday, etc.
- **Y-axis**: `SUM(amount)` per campaign
- **Secondary metric**: `COUNT(DISTINCT supporter_id)` per campaign (donor reach)
- **Goal**: Know which campaigns actually move the needle vs. generate noise

#### Donation Allocations by Safehouse (Stacked Bar)
- **X-axis**: `safehouses.name` (join `donation_allocations.safehouse_id` → `safehouses`)
- **Y-axis**: `SUM(donation_allocations.amount_allocated)`
- **Stacks**: `donation_allocations.program_area` — Care, Healing, Teaching, Operations, Staff, Outreach
- **Goal**: Show donors where money goes; internal resource balance check

### Table: Recent Donations (paginated, sortable)

| Column | Source |
|--------|--------|
| Donor Name | `donations.supporter_id` → `supporters.display_name` |
| Type | `donations.donation_type` |
| Amount | `donations.amount` (or `donations.estimated_value` for non-monetary) |
| Date | `donations.donation_date` |
| Campaign | `donations.campaign_name` |
| Channel | `donations.channel_source` |
| Recurring? | `donations.is_recurring` |

---

## 3. Residents & Case Management Page

This page directly serves the **Girls Not Falling Through the Cracks** goal. Staff need to see who is struggling, who is progressing, and where to focus limited resources.

### Stat Cards

| Metric | Calculation | Source Table(s) | Source Columns |
|--------|-------------|-----------------|----------------|
| Active Residents | `COUNT(*)` WHERE `case_status = 'Active'` | `residents` | `case_status` |
| High/Critical Risk | `COUNT(*)` WHERE `current_risk_level IN ('High','Critical')` AND `case_status = 'Active'` | `residents` | `current_risk_level`, `case_status` |
| Reintegration In Progress | `COUNT(*)` WHERE `reintegration_status = 'In Progress'` | `residents` | `reintegration_status` |
| Upcoming Conferences | `COUNT(*)` WHERE `case_conference_date >= TODAY` | `intervention_plans` | `case_conference_date` |

### Charts

#### Safehouse Overview Table

| Column | Source | Calculation |
|--------|--------|-------------|
| Safehouse Name | `safehouses.name` | — |
| Capacity | `safehouses.capacity_girls` | — |
| Current Occupancy | `safehouses.current_occupancy` | — |
| Occupancy % | `current_occupancy / capacity_girls * 100` | Derived |
| Avg Education Progress | `safehouse_monthly_metrics.avg_education_progress` | Latest month for each safehouse |
| Avg Health Score | `safehouse_monthly_metrics.avg_health_score` | Latest month for each safehouse |
| Process Recordings (month) | `safehouse_monthly_metrics.process_recording_count` | Latest month |
| Incidents (month) | `safehouse_monthly_metrics.incident_count` | Latest month |

#### Risk Level Breakdown (Stacked Bar by Safehouse)
- **X-axis**: `safehouses.name` (join `residents.safehouse_id`)
- **Stacks**: `residents.current_risk_level` — Low, Medium, High, Critical
- **Values**: `COUNT(*)` per risk level per safehouse (WHERE `case_status = 'Active'`)
- **Goal**: Quickly see which safehouses have concentrations of high-risk residents

#### Risk Improvement Tracker (Table)
Shows residents whose risk changed since intake.

| Column | Source |
|--------|--------|
| Resident Code | `residents.internal_code` |
| Safehouse | `residents.safehouse_id` → `safehouses.name` |
| Initial Risk | `residents.initial_risk_level` |
| Current Risk | `residents.current_risk_level` |
| Direction | Derived: compare ordinal values (Critical > High > Medium > Low) |
| Length of Stay | `residents.length_of_stay` |

Filter to show: residents whose risk **increased** (escalations), sorted first.

#### Recent Process Recordings (Table — last 7 days)

| Column | Source |
|--------|--------|
| Date | `process_recordings.session_date` |
| Resident | `process_recordings.resident_id` → `residents.internal_code` |
| Social Worker | `process_recordings.social_worker` |
| Type | `process_recordings.session_type` |
| Emotional State (Start) | `process_recordings.emotional_state_observed` |
| Emotional State (End) | `process_recordings.emotional_state_end` |
| Concerns Flagged | `process_recordings.concerns_flagged` |

#### Recent Incidents (Table — last 14 days)

| Column | Source |
|--------|--------|
| Date | `incident_reports.incident_date` |
| Resident | `incident_reports.resident_id` → `residents.internal_code` |
| Safehouse | `incident_reports.safehouse_id` → `safehouses.name` |
| Type | `incident_reports.incident_type` |
| Severity | `incident_reports.severity` |
| Resolved? | `incident_reports.resolved` |
| Follow-up Required | `incident_reports.follow_up_required` |

---

## 4. Social Media Analytics Page

This page directly serves the **Social Media Strategy** goal. The founders need data-driven answers to: what to post, where, when, and what actually drives donations.

### Stat Cards

| Metric | Calculation | Source Table(s) | Source Columns |
|--------|-------------|-----------------|----------------|
| Total Posts | `COUNT(*)` | `social_media_posts` | — |
| Avg Engagement Rate | `AVG(engagement_rate)` | `social_media_posts` | `engagement_rate` |
| Total Donation Referrals | `SUM(donation_referrals)` | `social_media_posts` | `donation_referrals` |
| Total Referral Value | `SUM(estimated_donation_value_php)` | `social_media_posts` | `estimated_donation_value_php` |

### Charts

#### Engagement Rate by Platform (Bar Chart)
- **X-axis**: `social_media_posts.platform` — Facebook, Instagram, Twitter, WhatsApp, TikTok, LinkedIn, YouTube
- **Y-axis**: `AVG(engagement_rate)` per platform
- **Goal**: Show which platforms have the best engagement

#### Post Type vs Engagement (Bar Chart)
- **X-axis**: `social_media_posts.post_type` — ImpactStory, Campaign, EventPromotion, ThankYou, EducationalContent, FundraisingAppeal
- **Y-axis**: `AVG(engagement_rate)` per post type
- **Goal**: Identify what kind of content resonates most

#### Content Topic Performance (Bar Chart)
- **X-axis**: `social_media_posts.content_topic` — Education, SafehouseLife, DonorImpact, Health, Gratitude, AwarenessRaising, Reintegration, CampaignLaunch, EventRecap
- **Y-axis**: `AVG(engagement_rate)` and/or `SUM(donation_referrals)`
- **Goal**: Which stories/topics drive action

#### Donation Referrals Over Time (Line Chart)
- **X-axis**: Month (derived from `social_media_posts.created_at`)
- **Y-axis primary**: `SUM(donation_referrals)` per month
- **Y-axis secondary**: `COUNT(*)` posts per month
- **Goal**: Correlate posting frequency with actual donation referrals

#### Best Posting Times (Heatmap or Grouped Bar)
- **X-axis**: `social_media_posts.day_of_week`
- **Y-axis / Groups**: `social_media_posts.post_hour`
- **Cell value**: `AVG(engagement_rate)` for each day × hour combination
- **Goal**: Tell founders exactly when to post for maximum engagement

### Table: Top Performing Posts (paginated, sortable)

| Column | Source |
|--------|--------|
| Platform | `social_media_posts.platform` |
| Post Type | `social_media_posts.post_type` |
| Content Topic | `social_media_posts.content_topic` |
| Date | `social_media_posts.created_at` |
| Engagement Rate | `social_media_posts.engagement_rate` |
| Impressions | `social_media_posts.impressions` |
| Reach | `social_media_posts.reach` |
| Likes | `social_media_posts.likes` |
| Shares | `social_media_posts.shares` |
| Donation Referrals | `social_media_posts.donation_referrals` |
| Referral Value | `social_media_posts.estimated_donation_value_php` |

Sortable by engagement_rate, impressions, donation_referrals, likes, shares.

---

## 5. ML Insights Page (Placeholders)

Leave as placeholder sections with mock/sample data. Structure for three future ML features:

### Section 1: Donor Churn Risk Prediction
- **Purpose**: Predict which active donors are likely to stop giving
- **Input features** (when ML is ready): `supporters.first_donation_date`, donation frequency (derived from `donations`), time since last donation, `donations.is_recurring`, total lifetime giving, `supporters.acquisition_channel`
- **Display**: Table of at-risk donors with risk score, last donation date, total given, recommended action
- **Placeholder data**: 5–8 mock entries with risk scores

### Section 2: Resident Reintegration Readiness
- **Purpose**: Predict when a resident may be ready for reintegration
- **Input features** (when ML is ready): `education_records.progress_percent`, `health_wellbeing_records.general_health_score`, process recording frequency & emotional trajectory, `residents.length_of_stay`, `residents.current_risk_level`
- **Display**: Cards per resident with readiness score, contributing factors, progress bars
- **Placeholder data**: 4–5 sample resident cards

### Section 3: Social Media ROI Predictor
- **Purpose**: Predict engagement and donation referrals for a planned post
- **Input features** (when ML is ready): `platform`, `post_type`, `media_type`, `content_topic`, `day_of_week`, `post_hour`, `has_call_to_action`
- **Display**: Form to select post parameters → predicted engagement rate, estimated donation referrals, confidence level
- **Placeholder data**: Pre-filled predictions for sample combinations

---

## Data Relationship Summary

```
supporters ─── donations ─── donation_allocations ─── safehouses
                  │                                        │
                  └── in_kind_donation_items     ┌─────────┤
                                                 │         │
                  social_media_posts ◄───────────┘         │
                    (referral_post_id)                     │
                                                          │
residents ─────────────────────────────────────── safehouses
    │
    ├── process_recordings
    ├── home_visitations
    ├── education_records
    ├── health_wellbeing_records
    ├── incident_reports
    └── intervention_plans

safehouses ─── safehouse_monthly_metrics
           ─── partner_assignments ─── partners

public_impact_snapshots (standalone — for public-facing page)
```

---

## Notes

- All date filtering should use the relevant date column (e.g., `donation_date`, `session_date`, `visit_date`) with configurable time ranges where possible
- "Current month" metrics should default to the calendar month but could offer 30-day rolling
- Resident identifiers should display `internal_code` (never real names) to protect privacy
- All monetary values are in `currency_code` from donations or PHP from social media posts
- The `safehouse_monthly_metrics` table provides pre-aggregated data that can simplify several queries for the Residents page
