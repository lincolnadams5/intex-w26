# Admin Dashboard — Build Objectives Checklist

> **Stack:** React + TypeScript (Vite) | .NET 10 / C# backend | Deployed DB with real data  
> **Route:** `/admin/dashboard` (authenticated users only)  
> Work through sections in the suggested build order at the bottom.

---

## 1. Overall Layout & Navigation

- [ ] Set up a persistent sidebar or top nav with links to each dashboard section
  - Donors, Residents, Social Media, ML Insights
- [ ] Create the dashboard home route at `/admin/dashboard` with summary cards for each domain
- [ ] Add an auth guard to all admin routes — redirect to `/login` if unauthenticated
- [ ] Make the layout responsive for desktop and mobile
- [ ] Add a header with the org name/logo, logged-in user display, and logout button

---

## 2. Donor Activity Section

### Summary Cards
- [ ] Total donations this month (PHP) vs. last month
- [ ] Number of active donors vs. inactive donors
- [ ] Number of recurring donors

### Charts & Tables
- [ ] Donation trend line chart over time (filterable by month/year)
- [ ] Donation type breakdown — donut or bar chart
  - Types: Monetary, In-Kind, Time, Skills, Social Media
- [ ] Acquisition channel breakdown (Website, SocialMedia, Event, WordOfMouth, etc.)
- [ ] Recent donations table — paginated
  - Columns: Donor Name, Type, Amount (PHP), Date, Campaign
- [ ] Campaign performance comparison chart
  - Which campaigns generated the most donations?

### Allocation View
- [ ] Stacked bar chart showing donation allocations across safehouses and program areas

---

## 3. Resident / Safehouse Status Section

### Summary Cards
- [ ] Total active residents across all safehouses
- [ ] Number of residents at High or Critical risk level
- [ ] Number of residents with reintegration status "In Progress"
- [ ] Count of upcoming case conferences (from `intervention_plans.case_conference_date`)

### Per-Safehouse Table
- [ ] One row per safehouse with columns:
  - Name, Region, Occupancy / Capacity, Avg Education Progress, Avg Health Score, Incident Count (this month)
- [ ] Clicking a row navigates to that safehouse's detail view (or expands inline)

### Resident Risk Overview
- [ ] Visual breakdown (stacked bar or card grid) of residents by risk level per safehouse
  - Risk levels: Low, Medium, High, Critical
- [ ] Flag residents whose risk has worsened since intake
  - Compare `initial_risk_level` vs. `current_risk_level`

### Recent Activity Feed
- [ ] Recent process recordings (last 7–14 days)
  - Columns: Resident Code, Social Worker, Session Date, Concerns Flagged
- [ ] Recent incidents
  - Columns: Resident Code, Incident Type, Severity, Resolved Status

---

## 4. Social Media Engagement Section

### Summary Cards
- [ ] Total posts this month
- [ ] Aggregate engagement rate across platforms
- [ ] Total donation referrals attributed to social posts
- [ ] Estimated donation value (PHP) from social referrals this month

### Charts
- [ ] Engagement rate by platform (bar chart)
- [ ] Post type vs. avg engagement rate (which content types perform best)
- [ ] Best posting times — heatmap or bar chart of hour × day vs. engagement rate
- [ ] Donations referred over time, overlaid with posting frequency (dual-axis line chart)

### Top Posts Table
- [ ] Paginated, sortable table
  - Columns: Platform, Post Type, Date, Likes, Shares, Comments, Donation Referrals, Engagement Rate

---

## 5. ML Predictions / Insights Section

> Coordinate with your teammate early on API response shape so you can build UI shells
> with mock data while pipelines are being finalized.

- [ ] **Donor Churn Risk** component
  - Table of at-risk donors with a risk score, sortable by urgency
  - Plain-English label per donor (e.g., "High Risk of Lapsing")
- [ ] **Resident Reintegration Readiness** component
  - List of residents with a predicted readiness score or classification
  - Plain-English interpretation of what the score means
- [ ] **Social Media ROI Predictor** component
  - Input: post type, platform, time of day
  - Output: estimated donation value or engagement prediction
- [ ] Add a brief plain-English explanation beneath each ML component
  - Non-technical staff should be able to understand and act on results
- [ ] Wire up real ML API endpoints once your teammate exposes them
  - Build with placeholder/mock data in the meantime

---

## Suggested Build Order

| Priority | Section | Reason |
|---|---|---|
| 1 | Layout + Nav + Auth Guard | Everything else depends on this |
| 2 | Resident / Safehouse Status | Core "command center" per rubric |
| 3 | Donor Activity | Self-contained charts and tables |
| 4 | Social Media Engagement | Independent once layout is solid |
| 5 | ML Predictions | Build UI shells now, wire endpoints later |

---

## General Reminders

- [ ] Validate all data before display — handle nulls and empty states gracefully
- [ ] Add loading spinners / skeleton states for async data fetches
- [ ] Add error states for failed API calls
- [ ] Ensure every page achieves a Lighthouse accessibility score ≥ 90
- [ ] Test every page in both desktop and mobile views before final submission
- [ ] Confirm all admin API endpoints require authentication (401 if unauthenticated)