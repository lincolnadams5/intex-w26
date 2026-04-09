using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("education_records")]
public class EducationRecord
{
    [Key]
    public int EducationRecordId { get; set; }
    public int ResidentId { get; set; }
    // Stored as timestamptz in PostgreSQL — use DateTime? not DateOnly?
    public DateTime? RecordDate { get; set; }
    public string? EducationLevel { get; set; }
    public string? SchoolName { get; set; }
    public string? EnrollmentStatus { get; set; }
    public double? AttendanceRate { get; set; }
    public double? ProgressPercent { get; set; }
    public string? CompletionStatus { get; set; }
    public string? Notes { get; set; }
}
