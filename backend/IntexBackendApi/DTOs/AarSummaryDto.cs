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
