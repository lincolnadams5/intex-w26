using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("education_records")]
public class EducationRecord
{
    [Key]
    public int EducationRecordId { get; set; }
    public int ResidentId { get; set; }
    public DateOnly? RecordDate { get; set; }
    public string? ProgramName { get; set; }
    public string? CourseName { get; set; }
    public string? EducationLevel { get; set; }
    public string? AttendanceStatus { get; set; }
    public decimal? AttendanceRate { get; set; }
    public decimal? ProgressPercent { get; set; }
    public string? CompletionStatus { get; set; }
    public decimal? GpaLikeScore { get; set; }
    public string? Notes { get; set; }
}
