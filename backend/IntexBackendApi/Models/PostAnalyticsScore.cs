using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("post_analytics_scores")]
public class PostAnalyticsScore
{
    [Key]
    public int PostId { get; set; }
    public double? PredictedValuePhp { get; set; }
    public double? PHasDonation { get; set; }
    public string? ValueTier { get; set; }
    public DateTime? ScoredAt { get; set; }
}
