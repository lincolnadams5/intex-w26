# Reports & Analytics Page — Implementation Guide

> Hand this document to a Claude Code agent. It assumes the agent has already read
> `CLAUDE.md` at the repo root before starting. All conventions there apply:
> CSS custom properties only (no raw hex or Tailwind color classes), `authFetch`
> for all API calls, shared `components/admin/*` primitives, snake_case DB /
> PascalCase EF Core models.

---

## Scope overview

Six changes in total, applied to the **admin portal only**:

1. **New DTO** — `AarSummaryDto.cs` in `backend/…/DTOs/`
2. **New backend endpoint** — `GET /api/admin/reports/aar-summary` in `AdminController.cs`
3. **New frontend API function** — `getAarSummary()` + interfaces added to `frontend/src/lib/adminApi.ts`
4. **New page** — `frontend/src/pages/(admin)/reports/ReportsPage.tsx`
5. **Route registration** — one line added to `frontend/src/App.tsx`
6. **Dashboard action card** — third card added to the Actions grid in `Dashboard.tsx`

---

## Files to create / modify

```
backend/IntexBackendApi/DTOs/AarSummaryDto.cs          ← CREATE
backend/IntexBackendApi/Controllers/AdminController.cs  ← MODIFY (add endpoint)
frontend/src/lib/adminApi.ts                            ← MODIFY (add function + interfaces)
frontend/src/pages/(admin)/reports/ReportsPage.tsx      ← CREATE
frontend/src/App.tsx                                    ← MODIFY (add route)
frontend/src/pages/(admin)/dashboard/Dashboard.tsx      ← MODIFY (add action card)
```

---

## Step 1 — DTO: `AarSummaryDto.cs`

Create `backend/IntexBackendApi/DTOs/AarSummaryDto.cs`:

```csharp
namespace IntexBackendApi.DTOs;

// ── AAR Summary DTO ──────────────────────────────────────────────────────────
// Returned by GET /api/admin/reports/aar-summary
// Mirrors the DSWD Annual Accomplishment Report structure:
//   Caring → residential/protective services
//   Healing → psychosocial/health services
//   Teaching → education/reintegration services

public class AarSummaryDto
{
    public int ReportYear { get; set; }
    public int? FilterSafehouseId { get; set; }

    public CaringSection Caring { get; set; } = new();
    public HealingSection Healing { get; set; } = new();
    public TeachingSection Teaching { get; set; } = new();
    public List<SafehousePerformanceRow> SafehousePerformance { get; set; } = new();
}

// ── Caring ────────────────────────────────────────────────────────────────────

public class CaringSection
{
    public int TotalBeneficiaries { get; set; }          // distinct residents admitted in year
    public int NewAdmissions { get; set; }               // DateOfAdmission in report year
    public int HomeVisitationsConducted { get; set; }
    public int IncidentReportsFiled { get; set; }
    public int IncidentReportsResolved { get; set; }

    // Case category breakdown — counts of residents with each SubCat flag true
    public int Trafficked { get; set; }
    public int PhysicalAbuse { get; set; }
    public int SexualAbuse { get; set; }
    public int Osaec { get; set; }
    public int Cicl { get; set; }
    public int ChildLabor { get; set; }
    public int AtRisk { get; set; }
    public int StreetChild { get; set; }
    public int Orphaned { get; set; }

    public List<SafehouseOccupancyRow> OccupancyByHouse { get; set; } = new();
}

public class SafehouseOccupancyRow
{
    public string SafehouseName { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int ActiveResidents { get; set; }
    public double OccupancyPct { get; set; }
}

// ── Healing ───────────────────────────────────────────────────────────────────

public class HealingSection
{
    public int TotalSessions { get; set; }
    public double? AvgGeneralHealthScore { get; set; }
    public double? AvgNutritionScore { get; set; }
    public int MedicalCheckupsDone { get; set; }
    public int DentalCheckupsDone { get; set; }
    public int PsychologicalCheckupsDone { get; set; }
    public int TotalHealthRecords { get; set; }

    // Monthly session counts for chart — 12 entries, one per month
    public List<MonthlyCount> SessionsByMonth { get; set; } = new();

    // Session type breakdown (individual, group, family, etc.)
    public List<LabelCount> SessionsByType { get; set; } = new();
}

public class MonthlyCount
{
    public string Month { get; set; } = string.Empty;  // e.g. "Jan", "Feb"
    public int Count { get; set; }
}

public class LabelCount
{
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
}

// ── Teaching ──────────────────────────────────────────────────────────────────

public class TeachingSection
{
    public int ResidentsEnrolled { get; set; }
    public double? AvgAttendanceRate { get; set; }      // 0–100 %
    public double? AvgProgressPercent { get; set; }

    // Intervention plans
    public int PlansActive { get; set; }
    public int PlansCompleted { get; set; }
    public List<LabelCount> PlansByCategory { get; set; } = new();

    // Reintegration outcomes
    public int SuccessfullyReintegrated { get; set; }
    public int ReintegrationInProgress { get; set; }
    public List<LabelCount> ReintegrationByType { get; set; } = new();
}

// ── Safehouse performance comparison ─────────────────────────────────────────

public class SafehousePerformanceRow
{
    public int SafehouseId { get; set; }
    public string SafehouseName { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public int ActiveResidents { get; set; }
    public int Capacity { get; set; }
    public double OccupancyPct { get; set; }
    public int SessionsThisYear { get; set; }
    public int VisitsThisYear { get; set; }
    public int IncidentsThisYear { get; set; }
}
```

---

## Step 2 — Backend endpoint in `AdminController.cs`

Add the following method to the existing `AdminController` class. Place it after the existing dashboard endpoints. It accepts optional `year` (defaults to current calendar year) and `safehouseId` (defaults to all safehouses) query parameters.

```csharp
// ═══════════════════════════════════════════════════════════════════════════
//  REPORTS & ANALYTICS — AAR SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/reports/aar-summary?year=2025&safehouseId=1
[HttpGet("reports/aar-summary")]
public async Task<IActionResult> GetAarSummary(
    [FromQuery] int? year,
    [FromQuery] int? safehouseId)
{
    int reportYear = year ?? DateTime.UtcNow.Year;

    // ── Resident base query ──────────────────────────────────────────────
    var residentsQ = _db.Residents.AsQueryable();
    if (safehouseId.HasValue)
        residentsQ = residentsQ.Where(r => r.SafehouseId == safehouseId.Value);

    var residents = await residentsQ.ToListAsync();

    // Residents active during the report year (admitted on or before 31 Dec
    // of the year and not closed before 1 Jan of the year)
    var activeInYear = residents.Where(r =>
        r.DateOfAdmission.HasValue &&
        r.DateOfAdmission.Value.Year <= reportYear &&
        (!r.DateClosed.HasValue || r.DateClosed.Value.Year >= reportYear)
    ).ToList();

    var residentIds = activeInYear.Select(r => r.ResidentId).ToList();

    // New admissions strictly in the report year
    var newAdmissions = activeInYear
        .Count(r => r.DateOfAdmission!.Value.Year == reportYear);

    // ── Caring section ───────────────────────────────────────────────────
    var visitsInYear = await _db.HomeVisitations
        .Where(v => residentIds.Contains(v.ResidentId) &&
                    v.VisitDate.HasValue &&
                    v.VisitDate.Value.Year == reportYear)
        .ToListAsync();

    var incidentsQ = _db.IncidentReports
        .Where(i => i.IncidentDate.HasValue &&
                    i.IncidentDate.Value.Year == reportYear);
    if (safehouseId.HasValue)
        incidentsQ = incidentsQ.Where(i => i.SafehouseId == safehouseId.Value);
    var incidents = await incidentsQ.ToListAsync();

    // Safehouse occupancy rows
    var safehouses = await _db.Safehouses.ToListAsync();
    var safehouseFilter = safehouseId.HasValue
        ? safehouses.Where(s => s.SafehouseId == safehouseId.Value).ToList()
        : safehouses;

    var occupancyRows = safehouseFilter.Select(s =>
    {
        var active = activeInYear.Count(r =>
            r.SafehouseId == s.SafehouseId &&
            r.CaseStatus != "Closed");
        var cap = (s.CapacityGirls ?? 0);
        return new SafehouseOccupancyRow
        {
            SafehouseName  = s.Name ?? s.SafehouseCode ?? $"Safehouse {s.SafehouseId}",
            Capacity       = cap,
            ActiveResidents = active,
            OccupancyPct   = cap > 0 ? Math.Round((double)active / cap * 100, 1) : 0,
        };
    }).ToList();

    var caring = new CaringSection
    {
        TotalBeneficiaries        = activeInYear.Count,
        NewAdmissions             = newAdmissions,
        HomeVisitationsConducted  = visitsInYear.Count,
        IncidentReportsFiled      = incidents.Count,
        IncidentReportsResolved   = incidents.Count(i => i.Resolved == true),
        Trafficked    = activeInYear.Count(r => r.SubCatTrafficked == true),
        PhysicalAbuse = activeInYear.Count(r => r.SubCatPhysicalAbuse == true),
        SexualAbuse   = activeInYear.Count(r => r.SubCatSexualAbuse == true),
        Osaec         = activeInYear.Count(r => r.SubCatOsaec == true),
        Cicl          = activeInYear.Count(r => r.SubCatCicl == true),
        ChildLabor    = activeInYear.Count(r => r.SubCatChildLabor == true),
        AtRisk        = activeInYear.Count(r => r.SubCatAtRisk == true),
        StreetChild   = activeInYear.Count(r => r.SubCatStreetChild == true),
        Orphaned      = activeInYear.Count(r => r.SubCatOrphaned == true),
        OccupancyByHouse = occupancyRows,
    };

    // ── Healing section ──────────────────────────────────────────────────
    var recordings = await _db.ProcessRecordings
        .Where(p => residentIds.Contains(p.ResidentId) &&
                    p.SessionDate.HasValue &&
                    p.SessionDate.Value.Year == reportYear)
        .ToListAsync();

    var healthRecords = await _db.HealthWellbeingRecords
        .Where(h => residentIds.Contains(h.ResidentId))
        .ToListAsync();

    // Latest health record per resident for checkup flags
    var latestHealth = healthRecords
        .GroupBy(h => h.ResidentId)
        .Select(g => g.OrderByDescending(h => h.RecordDate).First())
        .ToList();

    var monthlySessionCounts = Enumerable.Range(1, 12).Select(m => new MonthlyCount
    {
        Month = new DateOnly(reportYear, m, 1).ToString("MMM"),
        Count = recordings.Count(r => r.SessionDate!.Value.Month == m),
    }).ToList();

    var sessionsByType = recordings
        .Where(r => !string.IsNullOrWhiteSpace(r.SessionType))
        .GroupBy(r => r.SessionType!)
        .Select(g => new LabelCount { Label = g.Key, Count = g.Count() })
        .OrderByDescending(x => x.Count)
        .ToList();

    var healing = new HealingSection
    {
        TotalSessions             = recordings.Count,
        AvgGeneralHealthScore     = healthRecords.Any()
            ? Math.Round(healthRecords.Where(h => h.GeneralHealthScore.HasValue)
                .Average(h => h.GeneralHealthScore!.Value), 1)
            : null,
        AvgNutritionScore         = healthRecords.Any()
            ? Math.Round(healthRecords.Where(h => h.NutritionScore.HasValue)
                .Average(h => h.NutritionScore!.Value), 1)
            : null,
        MedicalCheckupsDone       = latestHealth.Count(h => h.MedicalCheckupDone == true),
        DentalCheckupsDone        = latestHealth.Count(h => h.DentalCheckupDone == true),
        PsychologicalCheckupsDone = latestHealth.Count(h => h.PsychologicalCheckupDone == true),
        TotalHealthRecords        = latestHealth.Count,
        SessionsByMonth           = monthlySessionCounts,
        SessionsByType            = sessionsByType,
    };

    // ── Teaching section ─────────────────────────────────────────────────
    var eduRecords = await _db.EducationRecords
        .Where(e => residentIds.Contains(e.ResidentId))
        .ToListAsync();

    // Latest education record per resident
    var latestEdu = eduRecords
        .GroupBy(e => e.ResidentId)
        .Select(g => g.OrderByDescending(e => e.RecordDate).First())
        .ToList();

    var enrolled = latestEdu.Count(e =>
        e.EnrollmentStatus != null &&
        e.EnrollmentStatus.Equals("Enrolled", StringComparison.OrdinalIgnoreCase));

    var plans = await _db.InterventionPlans
        .Where(p => residentIds.Contains(p.ResidentId))
        .ToListAsync();

    var plansByCategory = plans
        .Where(p => !string.IsNullOrWhiteSpace(p.PlanCategory))
        .GroupBy(p => p.PlanCategory!)
        .Select(g => new LabelCount { Label = g.Key, Count = g.Count() })
        .OrderByDescending(x => x.Count)
        .ToList();

    var reintegrationByType = activeInYear
        .Where(r => !string.IsNullOrWhiteSpace(r.ReintegrationType))
        .GroupBy(r => r.ReintegrationType!)
        .Select(g => new LabelCount { Label = g.Key, Count = g.Count() })
        .OrderByDescending(x => x.Count)
        .ToList();

    var teaching = new TeachingSection
    {
        ResidentsEnrolled        = enrolled,
        AvgAttendanceRate        = latestEdu.Any(e => e.AttendanceRate.HasValue)
            ? Math.Round(latestEdu.Where(e => e.AttendanceRate.HasValue)
                .Average(e => e.AttendanceRate!.Value), 1)
            : null,
        AvgProgressPercent       = latestEdu.Any(e => e.ProgressPercent.HasValue)
            ? Math.Round(latestEdu.Where(e => e.ProgressPercent.HasValue)
                .Average(e => e.ProgressPercent!.Value), 1)
            : null,
        PlansActive              = plans.Count(p =>
            p.Status != null && p.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)),
        PlansCompleted           = plans.Count(p =>
            p.Status != null && p.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase)),
        PlansByCategory          = plansByCategory,
        SuccessfullyReintegrated = activeInYear.Count(r =>
            r.ReintegrationStatus != null &&
            r.ReintegrationStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase)),
        ReintegrationInProgress  = activeInYear.Count(r =>
            r.ReintegrationStatus != null &&
            r.ReintegrationStatus.Equals("In Progress", StringComparison.OrdinalIgnoreCase)),
        ReintegrationByType      = reintegrationByType,
    };

    // ── Safehouse performance comparison ─────────────────────────────────
    var allRecordings = await _db.ProcessRecordings
        .Where(p => p.SessionDate.HasValue && p.SessionDate.Value.Year == reportYear)
        .ToListAsync();
    var allVisits = await _db.HomeVisitations
        .Where(v => v.VisitDate.HasValue && v.VisitDate.Value.Year == reportYear)
        .ToListAsync();
    var allIncidents = await _db.IncidentReports
        .Where(i => i.IncidentDate.HasValue && i.IncidentDate.Value.Year == reportYear)
        .ToListAsync();

    var perfRows = safehouseFilter.Select(s =>
    {
        var shResidents = residents.Where(r => r.SafehouseId == s.SafehouseId).ToList();
        var shActive    = shResidents.Count(r => r.CaseStatus != "Closed");
        var shIds       = shResidents.Select(r => r.ResidentId).ToList();
        var cap         = s.CapacityGirls ?? 0;

        return new SafehousePerformanceRow
        {
            SafehouseId      = s.SafehouseId,
            SafehouseName    = s.Name ?? s.SafehouseCode ?? $"Safehouse {s.SafehouseId}",
            Region           = s.Region ?? "—",
            ActiveResidents  = shActive,
            Capacity         = cap,
            OccupancyPct     = cap > 0 ? Math.Round((double)shActive / cap * 100, 1) : 0,
            SessionsThisYear = allRecordings.Count(p => shIds.Contains(p.ResidentId)),
            VisitsThisYear   = allVisits.Count(v => shIds.Contains(v.ResidentId)),
            IncidentsThisYear = allIncidents.Count(i => i.SafehouseId == s.SafehouseId),
        };
    }).ToList();

    var summary = new AarSummaryDto
    {
        ReportYear         = reportYear,
        FilterSafehouseId  = safehouseId,
        Caring             = caring,
        Healing            = healing,
        Teaching           = teaching,
        SafehousePerformance = perfRows,
    };

    return Ok(summary);
}
```

**Required `DbSet` additions** — verify that `AppDbContext.cs` already has all of the following. Add any that are missing:

```csharp
public DbSet<Resident> Residents { get; set; }
public DbSet<ProcessRecording> ProcessRecordings { get; set; }
public DbSet<HomeVisitation> HomeVisitations { get; set; }
public DbSet<IncidentReport> IncidentReports { get; set; }
public DbSet<EducationRecord> EducationRecords { get; set; }
public DbSet<HealthWellbeingRecord> HealthWellbeingRecords { get; set; }
public DbSet<InterventionPlan> InterventionPlans { get; set; }
public DbSet<Safehouse> Safehouses { get; set; }
```

---

## Step 3 — Frontend API: additions to `adminApi.ts`

Append the following to `frontend/src/lib/adminApi.ts`:

```ts
// ── Reports & Analytics — AAR Summary ────────────────────────────────────────

export interface MonthlyCount { month: string; count: number }
export interface LabelCount   { label: string; count: number }

export interface SafehouseOccupancyRow {
  safehouseName: string
  capacity: number
  activeResidents: number
  occupancyPct: number
}

export interface CaringSection {
  totalBeneficiaries: number
  newAdmissions: number
  homeVisitationsConducted: number
  incidentReportsFiled: number
  incidentReportsResolved: number
  trafficked: number
  physicalAbuse: number
  sexualAbuse: number
  osaec: number
  cicl: number
  childLabor: number
  atRisk: number
  streetChild: number
  orphaned: number
  occupancyByHouse: SafehouseOccupancyRow[]
}

export interface HealingSection {
  totalSessions: number
  avgGeneralHealthScore: number | null
  avgNutritionScore: number | null
  medicalCheckupsDone: number
  dentalCheckupsDone: number
  psychologicalCheckupsDone: number
  totalHealthRecords: number
  sessionsByMonth: MonthlyCount[]
  sessionsByType: LabelCount[]
}

export interface TeachingSection {
  residentsEnrolled: number
  avgAttendanceRate: number | null
  avgProgressPercent: number | null
  plansActive: number
  plansCompleted: number
  plansByCategory: LabelCount[]
  successfullyReintegrated: number
  reintegrationInProgress: number
  reintegrationByType: LabelCount[]
}

export interface SafehousePerformanceRow {
  safehouseId: number
  safehouseName: string
  region: string
  activeResidents: number
  capacity: number
  occupancyPct: number
  sessionsThisYear: number
  visitsThisYear: number
  incidentsThisYear: number
}

export interface AarSummaryDto {
  reportYear: number
  filterSafehouseId: number | null
  caring: CaringSection
  healing: HealingSection
  teaching: TeachingSection
  safehousePerformance: SafehousePerformanceRow[]
}

export const getAarSummary = (year?: number, safehouseId?: number) => {
  const params = new URLSearchParams()
  if (year)         params.set('year', String(year))
  if (safehouseId)  params.set('safehouseId', String(safehouseId))
  const qs = params.toString()
  return get<AarSummaryDto>(`/api/admin/reports/aar-summary${qs ? `?${qs}` : ''}`)
}
```

---

## Step 4 — New page: `ReportsPage.tsx`

Create `frontend/src/pages/(admin)/reports/ReportsPage.tsx`. Full implementation below.

**Design notes:**
- Four `<SectionCard>` blocks: Caring, Healing, Teaching, Safehouse Performance.
- AAR pillar headers use the color accent convention: Caring = teal `var(--color-primary)`, Healing = orange, Teaching = blue — passed via `accentBorder` on `SectionCard`.
- Recharts `BarChart` for the monthly session trend (Healing section); all other data rendered as stat grids and tables.
- Year `<select>` and Safehouse `<select>` at the top re-fetch on change.
- Safehouses for the filter dropdown come from `getSafehouses()` (already exists in `adminApi.ts` — verify; if it doesn't exist, add `GET /api/admin/safehouses` or reuse the safehouse performance rows from the AAR payload itself to populate the filter after first load).

```tsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { PageHeader }  from '../../../components/admin/PageHeader'
import { SectionCard } from '../../../components/admin/SectionCard'
import { StatCard }    from '../../../components/admin/StatCard'
import { LoadingState } from '../../../components/admin/LoadingState'
import {
  getAarSummary,
  type AarSummaryDto,
  type SafehousePerformanceRow,
} from '../../../lib/adminApi'

// ── Year range: current year back to 2020 ─────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i)

// ── Small reusable helpers ────────────────────────────────────────────────────

function Num({ n, decimals = 0 }: { n: number | null | undefined; decimals?: number }) {
  if (n == null) return <span className="text-[var(--color-on-surface-variant)]">—</span>
  return <>{decimals > 0 ? n.toFixed(decimals) : n.toLocaleString()}</>
}

function Pct({ n }: { n: number | null | undefined }) {
  if (n == null) return <span className="text-[var(--color-on-surface-variant)]">—</span>
  return <>{n.toFixed(1)}%</>
}

// ── AAR pillar icon SVGs ──────────────────────────────────────────────────────

const HeartIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 .5C21 14.5 12 21 12 21z"/>
  </svg>
)

const PulseIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const BookIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)

const ChartIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
)

// ── Main page component ───────────────────────────────────────────────────────

export function ReportsPage() {
  const [year, setYear]             = useState(CURRENT_YEAR)
  const [safehouseId, setSafehouseId] = useState<number | undefined>(undefined)
  const [data, setData]             = useState<AarSummaryDto | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  // Build safehouse options from performance rows after first successful load
  const [safehouseOptions, setSafehouseOptions] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAarSummary(year, safehouseId)
      .then(d => {
        setData(d)
        // Populate safehouse filter from the performance rows (only on first load)
        if (safehouseOptions.length === 0 && d.safehousePerformance.length > 0) {
          setSafehouseOptions(
            d.safehousePerformance.map(r => ({ id: r.safehouseId, name: r.safehouseName }))
          )
        }
      })
      .catch(() => setError('Failed to load report data.'))
      .finally(() => setLoading(false))
  }, [year, safehouseId])

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Annual Accomplishment Report — aggregated program outcomes and service delivery metrics."
      />

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">
            Report Year
          </label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-sm border border-[var(--color-outline-variant)] rounded-md px-3 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {safehouseOptions.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">
              Safehouse
            </label>
            <select
              value={safehouseId ?? ''}
              onChange={e => setSafehouseId(e.target.value ? Number(e.target.value) : undefined)}
              className="text-sm border border-[var(--color-outline-variant)] rounded-md px-3 py-1.5 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
            >
              <option value="">All Safehouses</option>
              {safehouseOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && <LoadingState />}
      {error   && <p className="text-sm text-[var(--color-error)] p-4">{error}</p>}

      {!loading && !error && data && (
        <>
          {/* ══════════════════════════════════════════════════════════════
              CARING — Residential & Protective Services
          ══════════════════════════════════════════════════════════════ */}
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
            Caring — Residential &amp; Protective Services
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Total Beneficiaries"
              value={data.caring.totalBeneficiaries}
              color="#0d9488"
              icon={HeartIcon}
            />
            <StatCard
              label="New Admissions"
              value={data.caring.newAdmissions}
              color="#0d9488"
              icon={HeartIcon}
            />
            <StatCard
              label="Home Visitations"
              value={data.caring.homeVisitationsConducted}
              color="#0d9488"
              icon={HeartIcon}
            />
            <StatCard
              label="Incidents Filed / Resolved"
              value={`${data.caring.incidentReportsFiled} / ${data.caring.incidentReportsResolved}`}
              color="#f97316"
              icon={HeartIcon}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Case category breakdown */}
            <SectionCard title="Beneficiaries by Case Category" accentBorder>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Trafficked',     count: data.caring.trafficked },
                      { label: 'Physical Abuse', count: data.caring.physicalAbuse },
                      { label: 'Sexual Abuse',   count: data.caring.sexualAbuse },
                      { label: 'OSAEC',          count: data.caring.osaec },
                      { label: 'CICL',           count: data.caring.cicl },
                      { label: 'Child Labor',    count: data.caring.childLabor },
                      { label: 'At Risk',        count: data.caring.atRisk },
                      { label: 'Street Child',   count: data.caring.streetChild },
                      { label: 'Orphaned',       count: data.caring.orphaned },
                    ]
                      .filter(row => row.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .map(row => (
                        <tr key={row.label}>
                          <td className="text-[var(--color-on-surface)]">{row.label}</td>
                          <td className="text-right font-semibold text-[var(--color-on-surface)]">
                            {row.count}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Safehouse occupancy */}
            <SectionCard title="Safehouse Occupancy" accentBorder>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Safehouse</th>
                      <th className="text-right">Active</th>
                      <th className="text-right">Capacity</th>
                      <th className="text-right">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.caring.occupancyByHouse.map(row => (
                      <tr key={row.safehouseName}>
                        <td className="font-medium text-[var(--color-on-surface)]">{row.safehouseName}</td>
                        <td className="text-right text-[var(--color-on-surface-variant)]">{row.activeResidents}</td>
                        <td className="text-right text-[var(--color-on-surface-variant)]">{row.capacity}</td>
                        <td className="text-right">
                          <span className={`badge ${
                            row.occupancyPct >= 90 ? 'badge-error' :
                            row.occupancyPct >= 70 ? 'badge-warning' : 'badge-success'
                          }`}>
                            {row.occupancyPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              HEALING — Psychosocial & Health Services
          ══════════════════════════════════════════════════════════════ */}
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-2">
            Healing — Psychosocial &amp; Health Services
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Process Recording Sessions"
              value={data.healing.totalSessions}
              color="#f97316"
              icon={PulseIcon}
            />
            <StatCard
              label="Avg. General Health Score"
              value={data.healing.avgGeneralHealthScore != null
                ? data.healing.avgGeneralHealthScore.toFixed(1)
                : '—'}
              color="#f97316"
              icon={PulseIcon}
            />
            <StatCard
              label="Avg. Nutrition Score"
              value={data.healing.avgNutritionScore != null
                ? data.healing.avgNutritionScore.toFixed(1)
                : '—'}
              color="#f97316"
              icon={PulseIcon}
            />
            <StatCard
              label="Health Records on File"
              value={data.healing.totalHealthRecords}
              color="#f97316"
              icon={PulseIcon}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly session bar chart */}
            <SectionCard title="Sessions by Month" accentBorder>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.healing.sessionsByMonth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface-container-lowest)',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" name="Sessions" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* Checkup completion + session types */}
            <div className="flex flex-col gap-4">
              <SectionCard title="Health Checkup Completion" accentBorder>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Checkup Type</th>
                        <th className="text-right">Completed</th>
                        <th className="text-right">Total Records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Medical',       done: data.healing.medicalCheckupsDone },
                        { label: 'Dental',        done: data.healing.dentalCheckupsDone },
                        { label: 'Psychological', done: data.healing.psychologicalCheckupsDone },
                      ].map(row => (
                        <tr key={row.label}>
                          <td className="text-[var(--color-on-surface)]">{row.label}</td>
                          <td className="text-right font-semibold text-[var(--color-on-surface)]">{row.done}</td>
                          <td className="text-right text-[var(--color-on-surface-variant)]">
                            {data.healing.totalHealthRecords}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              {data.healing.sessionsByType.length > 0 && (
                <SectionCard title="Sessions by Type" accentBorder>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Session Type</th>
                          <th className="text-right">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.healing.sessionsByType.map(row => (
                          <tr key={row.label}>
                            <td className="text-[var(--color-on-surface)]">{row.label}</td>
                            <td className="text-right font-semibold text-[var(--color-on-surface)]">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TEACHING — Education & Reintegration Services
          ══════════════════════════════════════════════════════════════ */}
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-2">
            Teaching — Education &amp; Reintegration Services
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Residents Enrolled"
              value={data.teaching.residentsEnrolled}
              color="#3b82f6"
              icon={BookIcon}
            />
            <StatCard
              label="Avg. Attendance Rate"
              value={data.teaching.avgAttendanceRate != null
                ? `${data.teaching.avgAttendanceRate.toFixed(1)}%`
                : '—'}
              color="#3b82f6"
              icon={BookIcon}
            />
            <StatCard
              label="Successfully Reintegrated"
              value={data.teaching.successfullyReintegrated}
              color="#22c55e"
              icon={BookIcon}
            />
            <StatCard
              label="Reintegration In Progress"
              value={data.teaching.reintegrationInProgress}
              color="#3b82f6"
              icon={BookIcon}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Intervention plan status */}
            <SectionCard title="Intervention Plans" accentBorder>
              <div className="flex gap-6 mb-4">
                <div>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Active</p>
                  <p className="text-2xl font-bold text-[var(--color-on-surface)]">
                    {data.teaching.plansActive}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Completed</p>
                  <p className="text-2xl font-bold text-[var(--color-on-surface)]">
                    {data.teaching.plansCompleted}
                  </p>
                </div>
              </div>
              {data.teaching.plansByCategory.length > 0 && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Plan Category</th>
                        <th className="text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.teaching.plansByCategory.map(row => (
                        <tr key={row.label}>
                          <td className="text-[var(--color-on-surface)]">{row.label}</td>
                          <td className="text-right font-semibold text-[var(--color-on-surface)]">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {/* Reintegration outcomes */}
            <SectionCard title="Reintegration Outcomes" accentBorder>
              {data.teaching.reintegrationByType.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Reintegration Type</th>
                        <th className="text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.teaching.reintegrationByType.map(row => (
                        <tr key={row.label}>
                          <td className="text-[var(--color-on-surface)]">{row.label}</td>
                          <td className="text-right font-semibold text-[var(--color-on-surface)]">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  No reintegration data for this period.
                </p>
              )}
            </SectionCard>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SAFEHOUSE PERFORMANCE COMPARISON
          ══════════════════════════════════════════════════════════════ */}
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-2">
            Safehouse Performance Comparison
          </h2>

          <SectionCard
            title="All Safehouses"
            subtitle={`Key indicators for ${data.reportYear}`}
            accentBorder
          >
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Safehouse</th>
                    <th>Region</th>
                    <th className="text-right">Active</th>
                    <th className="text-right">Capacity</th>
                    <th className="text-right">Occupancy</th>
                    <th className="text-right">Sessions</th>
                    <th className="text-right">Visits</th>
                    <th className="text-right">Incidents</th>
                  </tr>
                </thead>
                <tbody>
                  {data.safehousePerformance.map((row: SafehousePerformanceRow) => (
                    <tr key={row.safehouseId}>
                      <td className="font-medium text-[var(--color-on-surface)]">{row.safehouseName}</td>
                      <td className="text-[var(--color-on-surface-variant)] text-xs">{row.region}</td>
                      <td className="text-right text-[var(--color-on-surface-variant)]">{row.activeResidents}</td>
                      <td className="text-right text-[var(--color-on-surface-variant)]">{row.capacity}</td>
                      <td className="text-right">
                        <span className={`badge ${
                          row.occupancyPct >= 90 ? 'badge-error' :
                          row.occupancyPct >= 70 ? 'badge-warning' : 'badge-success'
                        }`}>
                          {row.occupancyPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right text-[var(--color-on-surface-variant)]">{row.sessionsThisYear}</td>
                      <td className="text-right text-[var(--color-on-surface-variant)]">{row.visitsThisYear}</td>
                      <td className="text-right">
                        {row.incidentsThisYear > 0
                          ? <span className="badge badge-warning">{row.incidentsThisYear}</span>
                          : <span className="text-[var(--color-on-surface-variant)]">0</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
```

---

## Step 5 — Route registration in `App.tsx`

1. Add the import at the top of `App.tsx` alongside the other admin page imports:

```ts
import { ReportsPage } from './pages/(admin)/reports/ReportsPage'
```

2. Add the route inside the `/admin` nested routes block (after the `ml` route, before the closing `</Route>`):

```tsx
<Route path="reports" element={<ReportsPage />} />
```

The full admin block after the change should look like:

```tsx
<Route path="dashboard" element={<Dashboard />} />
  <Route path="dashboard/process-recording" element={<ProcessRecording />} />
  <Route path="dashboard/home-visits" element={<HomeVisits />} />
<Route path="donors"    element={<DonorsPage />} />
<Route path="residents" element={<Residents />} />
<Route path="safehouses" element={<SafehousePage />} />
<Route path="social"    element={<SocialPage />} />
<Route path="ml"        element={<MLPage />} />
<Route path="users"     element={<UsersPage />} />
<Route path="reports"   element={<ReportsPage />} />   {/* ← add this */}
```

---

## Step 6 — Dashboard action card in `Dashboard.tsx`

Two changes in the Actions section of `Dashboard.tsx`:

### 6a — Change the grid from 2 to 3 columns (admin only)

Find the Actions grid wrapper (currently `grid-cols-1 sm:grid-cols-2`) and update it so
admin gets a third column on wider screens:

**Before:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

**After:**
```tsx
<div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2'}`}>
```

### 6b — Add the third card inside that grid, wrapped in `{isAdmin && (…)}`

Insert the following **after** the "Record a Process" `<Link>` card and **before** the closing `</div>` of the Actions grid:

```tsx
{isAdmin && (
  <Link
    to="/admin/reports"
    className="card card-interactive flex items-center gap-4 no-underline group"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 flex-shrink-0 text-[var(--color-primary)] opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <line strokeLinecap="round" strokeLinejoin="round" x1="18" y1="20" x2="18" y2="10"/>
      <line strokeLinecap="round" strokeLinejoin="round" x1="12" y1="20" x2="12" y2="4"/>
      <line strokeLinecap="round" strokeLinejoin="round" x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
    <div>
      <p className="font-semibold text-[var(--color-on-surface)]">View Reports &amp; Analytics</p>
    </div>
  </Link>
)}
```

---

## Checklist for the implementing agent

Work through these in order:

- [ ] Verify all required `DbSet<>` properties exist in `AppDbContext.cs`; add any missing ones
- [ ] Create `DTOs/AarSummaryDto.cs` with the full DTO hierarchy from Step 1
- [ ] Add the `GetAarSummary` endpoint to `AdminController.cs` (Step 2)
- [ ] Build and confirm the backend compiles cleanly (`dotnet build`)
- [ ] Append AAR interfaces and `getAarSummary` to `adminApi.ts` (Step 3)
- [ ] Create `pages/(admin)/reports/ReportsPage.tsx` (Step 4)
- [ ] Add the import and route in `App.tsx` (Step 5)
- [ ] Update the Actions grid width and add the third card in `Dashboard.tsx` (Step 6)
- [ ] Run the frontend dev server and navigate to `/admin/reports` to confirm the page loads with all four sections
- [ ] Confirm the year and safehouse filter selects re-fetch data correctly
- [ ] Confirm the third action card appears on the admin dashboard and navigates to `/admin/reports`
