using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("resident_reintegration_scores")]
public class ResidentReintegrationScore
{
    [Key]
    public int ResidentId { get; set; }
    public double ReadinessScore { get; set; }
    public string? ReadinessBand { get; set; }
    public DateTime? ScoredAt { get; set; }
}
