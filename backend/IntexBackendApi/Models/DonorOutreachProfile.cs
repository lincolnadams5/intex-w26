using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntexBackendApi.Models;

[Table("donor_outreach_profiles")]
public class DonorOutreachProfile
{
    [Key]
    public int SupporterId { get; set; }
    public string? PreferredChannel { get; set; }
    public string? Cadence { get; set; }
    public string? MessageTemplate { get; set; }
    public string? BestDay { get; set; }
    public string? AskType { get; set; }
    public DateTime? ScoredAt { get; set; }
}
