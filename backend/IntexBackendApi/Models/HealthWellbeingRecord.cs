using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("health_wellbeing_records")]
public class HealthWellbeingRecord
{
    [Key]
    public int HealthRecordId { get; set; }
    public int ResidentId { get; set; }
    // Stored as timestamptz in PostgreSQL — use DateTime? not DateOnly?
    public DateTime? RecordDate { get; set; }
    public double? WeightKg { get; set; }
    public double? HeightCm { get; set; }
    public double? Bmi { get; set; }
    public double? NutritionScore { get; set; }
    [Column("sleep_quality_score")]
    public double? SleepScore { get; set; }
    [Column("energy_level_score")]
    public double? EnergyScore { get; set; }
    public double? GeneralHealthScore { get; set; }
    public bool? MedicalCheckupDone { get; set; }
    public bool? DentalCheckupDone { get; set; }
    public bool? PsychologicalCheckupDone { get; set; }
    [Column("notes")]
    public string? MedicalNotesRestricted { get; set; }
}
