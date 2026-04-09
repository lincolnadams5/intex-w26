using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("intervention_plans")]
public class InterventionPlan
{
    [Key]
    public int PlanId { get; set; }
    public int ResidentId { get; set; }
    public string? PlanCategory { get; set; }
    public string? PlanDescription { get; set; }
    public string? ServicesProvided { get; set; }
    public decimal? TargetValue { get; set; }
    public DateTime? TargetDate { get; set; }
    public string? Status { get; set; }
    public DateTime? CaseConferenceDate { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
