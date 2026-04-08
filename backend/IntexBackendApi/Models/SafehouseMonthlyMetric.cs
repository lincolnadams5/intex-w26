using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("safehouse_monthly_metrics")]
public class SafehouseMonthlyMetric
{
    [Key]
    public int MetricId { get; set; }
    public int SafehouseId { get; set; }
    // Stored as timestamptz in PostgreSQL — use DateTime? not DateOnly?
    public DateTime? MonthStart { get; set; }
    public DateTime? MonthEnd { get; set; }
    public int? ActiveResidents { get; set; }
    // Stored as double precision in PostgreSQL — use double? not decimal?
    public double? AvgEducationProgress { get; set; }
    public double? AvgHealthScore { get; set; }
    public int? ProcessRecordingCount { get; set; }
    public int? HomeVisitationCount { get; set; }
    public int? IncidentCount { get; set; }
    public string? Notes { get; set; }
}
