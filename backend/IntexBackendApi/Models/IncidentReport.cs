using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("incident_reports")]
public class IncidentReport
{
    [Key]
    public int IncidentId { get; set; }
    public int ResidentId { get; set; }
    public int SafehouseId { get; set; }
    // Stored as timestamptz in PostgreSQL — use DateTime? not DateOnly?
    public DateTime? IncidentDate { get; set; }
    public string? IncidentType { get; set; }
    public string? Severity { get; set; }
    public string? Description { get; set; }
    public string? ResponseTaken { get; set; }
    public bool? Resolved { get; set; }
    // Stored as timestamptz in PostgreSQL — use DateTime? not DateOnly?
    public DateTime? ResolutionDate { get; set; }
    public string? ReportedBy { get; set; }
    public bool? FollowUpRequired { get; set; }
}
