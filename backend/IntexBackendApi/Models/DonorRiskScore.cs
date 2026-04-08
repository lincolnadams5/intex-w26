using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("donor_risk_scores")]
public class DonorRiskScore
{
    [Key]
    public int SupporterId { get; set; }
    public double RiskScore { get; set; }
    public int AtRiskPred { get; set; }
    public DateTime? ScoredAt { get; set; }
    public DateTime? ContactedAt { get; set; }
}
